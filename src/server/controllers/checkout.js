const xlsx = require('node-xlsx');
const path = require('path');
const request = require('request');
const ConvergeLib = require('converge-lib');
const shortid = require('shortid');
const config = require('../config');
const AWS = require('aws-sdk');
const moment = require('moment');
const sendGrid = require('sendgrid')(config["sendGrid"]["apiKey"]);
const status = config["status"];

AWS.config.update({
  accessKeyId: config["aws"]["accessKeyId"],
  secretAccessKey: config["aws"]["secretAccessKey"]
})

var s3 = new AWS.S3();

// get file path of products excel file
const getFilePath = (filename) => {
  return path.join(__dirname, '../../resources/', filename);
};

// product list
const productsSheet = xlsx.parse(getFilePath("Products.xlsx"));

// converge payment : true is test mode
const converge = new ConvergeLib(
  config["converge"][status]["merchantID"],
  config["converge"][status]["userID"],
  config["converge"][status]["pin"],
  status == "sandbox"
);

// Agent Cloud Compnay Information
const shippingFrom = () => {
  return config["shippingFrom"];
}

// check 4Over API URL
const check4OverAPIURL = (url, max = false) => {
  let new_url = url;

  if (status == "sandbox")
    new_url = url.replace("api.4over.com", "sandbox-api.4over.com");

  new_url += (max ? "&max=9999" : "");

  return new_url;
};

// color specs are 4/4 or 4/0
const acceptable_colorspec_uuids = ["13abbda7-1d64-4f25-8bb2-c179b224825d" /* , "32d3c223-f82c-492b-b915-ba065a00862f" */ ];

// turn around option uuid
const option_group_uuids = {
  "turnaround_time_uuid": "f80e8179-b264-42ce-9f80-bb258a09a1fe",
  "runsize_uuid": "87e09691-ef33-4cf4-8f17-48af06ce84f4"
};

// get all options (runsizes, turnaround_times)
const getAllOptions = (option_groups_url) => {
  return new Promise(resolve => {
    let reqOptions = {
      url: check4OverAPIURL(option_groups_url + config["4overKey"]["get"], true),
      headers: {
        "Content-Type": "application/json"
      },
      method: "GET",
      json: true
    };

    request(reqOptions, (error, response, body) => {
      let options = {};

      for (let entity of body["entities"]) {
        switch (entity["product_option_group_uuid"]) {
          case option_group_uuids["turnaround_time_uuid"]:
            let all_turnaround_times = entity["options"].filter(option => acceptable_colorspec_uuids.indexOf(option["colorspec_uuid"]) !== -1);
            options["all_turnaround_times"] = [];
            for (let turnaround_time of all_turnaround_times) {
              turnaround_time = {
                "colorspec": turnaround_time["colorspec"],
                "colorspec_uuid": turnaround_time["colorspec_uuid"],
                "option_description": turnaround_time["option_description"],
                "option_name": turnaround_time["option_name"],
                "option_uuid": turnaround_time["option_uuid"],
                "runsize": turnaround_time["runsize"],
                "runsize_uuid": turnaround_time["runsize_uuid"]
              }

              if (JSON.stringify(options["all_turnaround_times"]).indexOf(JSON.stringify(turnaround_time)) === -1 && parseInt(turnaround_time["runsize"]) <= 25000)
                options["all_turnaround_times"].push(turnaround_time);
            }
            break;

          case option_group_uuids["runsize_uuid"]:
            options["runsizes"] = entity["options"].filter(option => parseInt(option["option_description"]) <= 25000);
            break;
        }
      }

      resolve(options);
    })
  });
};

// get all base prices
const getAllBasePrices = (base_prices_url) => {
  return new Promise(resolve => {
    let reqOptions = {
      url: check4OverAPIURL(base_prices_url + config["4overKey"]["get"], true),
      headers: {
        "Content-Type": "application/json"
      },
      method: "GET",
      json: true
    };

    request(reqOptions, (error, response, body) => {
      let base_prices = [];

      for (let entity of body["entities"]) {
        if (acceptable_colorspec_uuids.indexOf(entity["colorspec_uuid"]) !== -1 && parseInt(entity["runsize"]) <= 25000) {
          entity["product_baseprice"] *= 2;
          base_prices.push(entity);
        }
      }

      resolve(base_prices);
    });
  });
};

// upload images to 4 over
const uploadCardImages = (jobs) => {
  let form_data = {
    "path": []
  };

  for (let job of jobs) {
    if (job["frontImage"])
      form_data["path"].push(job["frontImage"]);

    if (job["backImage"])
      form_data["path"].push(job["backImage"]);
  }

  return new Promise((resolve) => {
    let reqOptions = {
      url: check4OverAPIURL("https://api.4over.com/files"),
      headers: {
        "Authorization": config["4overKey"]["post"],
        "Content-Type": "application/json"
      },
      method: "POST",
      json: true,
      body: form_data
    };

    request(reqOptions, (error, response, body) => {
      if (body.files) {
        let files = body.files;
        for (let idx = 0; idx < jobs.length; idx++) {
          if (jobs[idx]["frontImage"]) {
            let file = files.shift();

            jobs[idx]["frontImage"] = file["file_uuid"] ? file["file_uuid"] : null;
          }

          if (jobs[idx].backImage) {
            let file = files.shift();
            jobs[idx]["backImage"] = file["file_uuid"] ? file["file_uuid"] : null;
          }
        }
      }

      resolve(jobs);
    });
  });
};

const send4OverOrderReq = (params) => {
  let jobs = [];

  for (let idx = 0; idx < params["jobs"].length; idx++) {
    let job = params["jobs"][idx];

    jobs.push({
      "product_uuid": job["product_uuid"],
      "runsize_uuid": job["runsize_uuid"],
      "option_uuids": [],
      "turnaroundtime_uuid": job["turnaround_time_uuid"],
      "colorspec_uuid": job["colorspec_uuid"],
      "dropship": true,
      "sets": 1,
      "files": {
        "set_001": {
          "job_name": job["job_name"],
          "files": {
            "fr": job["frontImage"],
            "bk": job["backImage"]
          }
        }
      },
      "ship_to": params["shipping"],
      "ship_from": shippingFrom(),
      "shipper": job["shipper"],
      "ship_from_facility": ""
    });
  }

  let order_id = 'agentcloud-' + shortid.generate();
  let form_data = {
    "order_id": order_id, //required
    "is_test_order": status == "sandbox", // options, default is false
    "skip_conformation": true, // optional, default is false
    "jobs": jobs, // populated card information with uuids
    // coupon_code: ''
    "payment": status == "sandbox" ? {
      "payment_provider": {
        "payment_provider_uuid": "6b0e699e-bdaf-4d1e-af4c-bc422ad21761"
      },
      "requested_currency": {
        "currency_code": "USD"
      },
      "credit_card": {
        "account_number": "4111111111111111",
        "month": "09",
        "year": "2018",
        "ccv": "123"
      },
      "billing_info": params["billing"],
      "order_id": order_id
    } : {
      "profile_token": config["4overKey"]["profile_token"]
    }
  };

  return new Promise((resolve) => {
    let reqOptions = {
      url: check4OverAPIURL("https://api.4over.com/orders"),
      headers: {
        "Authorization": config["4overKey"]["post"],
        "Content-Type": "application/json"
      },
      method: "POST",
      json: true,
      body: form_data
    };

    request(reqOptions, function (error, response, body) {
      resolve(body);
    })
  });
};

const sendThankYouEmail = (params) => {
  let sgRequest = sendGrid.emptyRequest();

  let billingstreetaddress = params["billing"]["address1"];
  let shippingstreetaddress = params["shipping"]["address"];

  if (params["billing"]["address2"] !== "")
    billingstreetaddress = [params["billing"]["address1"], params["billing"]["address2"]].join(", ")

  if (params["shipping"]["address2"] !== "")
    shippingstreetaddress = [params["shipping"]["address"], params["shipping"]["address2"]].join(", ");

  let subtotal = shipping = discount = 0;
  let jobs = ``;

  for (let job of params["jobs"]) {
    jobs += `
      <tr>
        <td>` + job["job_name"] + `</td>
        <td>` + (job["runsize"].toString()) + `</td>
        <td> $ ` + (job["base_price"].toString()) + `</td>
      </tr>      
    `;
    /* 
    <tr>
      <td>
        <table style="width: 100%;">
          <tr>
            <td style="padding-right: 5px;"><img style="max-width: 100%;" src="` + job["frontImage"] + `" alt="front-image" /></td>
            <td style="padding-left: 5px;"><img style="max-width: 100%;" src="` + job["backImage"] + `" alt="back-image" /></td>
          </tr>
        </table>
      </td>
    </tr>
     */

    delete job["runsize"];

    subtotal += Number(job["base_price"]);
    delete job["base_price"];

    shipping += Number(job["shipping_price"]);
    delete job["shipping_price"];

    discount += Number(job["discount"]);
    delete job["discount"];
  }

  sgRequest = {
    "method": "post",
    "path": "/v3/mail/send",
    "body": {
      "from": {
        "email": "sales@agentcloud.com",
        "name": "Sales of Agent Cloud"
      },
      "subject": "Thank you for your Order",
      "template_id": config["sendGrid"]["templateID"]["thankyou"],
      "personalizations": [{
        "to": [{
          "email": params["billing"]["email"],
          "name": [params["billing"]["first_name"] || "", params["billing"]["last_name"]].join(" ")
        }],
        "cc": [{
          "email": "amirul@square1grp.com",
          "name": "Team Lead of Square 1 Group"
        }, {
          "email": "elao@square1grp.com",
          "name": "CEO of Square 1 Group"
        }],
        "substitutions": {
          "ordersummary": "If you have any questions about this order, contact Agent Cloud support.",
          "billingstreetaddress": billingstreetaddress,
          "billingcity": params["billing"]["city"],
          "billingstate": params["billing"]["state"],
          "billingzipcode": params["billing"]["zip"],
          "shippingstreetaddress": shippingstreetaddress,
          "shippingcity": params["shipping"]["city"],
          "shippingstate": params["shipping"]["state"],
          "shippingzipcode": params["shipping"]["zipcode"],
          "jobs": jobs,
          "subtotal": (subtotal.toFixed(2)).toString(),
          "shipping": (shipping.toFixed(2)).toString(),
          "discount": (discount.toFixed(2)).toString(),
          "total": params["amount"].toString()
        }
      }]
    }
  };

  sendGrid.API(sgRequest, (err, res) => {
    console.log(res);
  })
};

module.exports = {
  // get 4 over product info
  get4OverProductInfo(req, res) {
    let crm_token = req.headers["authorization"];
    let params = req.body;

    let data = productsSheet[0].data.filter(card => {
      if (
        card[0].toLowerCase() === params["type"].toLowerCase() &&
        card[1].toLowerCase() === params["sizeLabel"].toLowerCase() &&
        card[2].toLowerCase() === params["weight"].toLowerCase() &&
        card[4].toLowerCase() === params["corner"].toLowerCase() &&
        card[5].toLowerCase() === params["finish"].toLowerCase()
      )
        return true;
    });

    if (data && data.length) {
      let reqOptions = {
        url: "https://api.agentcloud.com/api/productoption/get_info/",
        headers: {
          "Authorization": crm_token,
          "Content-Type": "application/json"
        },
        method: "POST",
        json: true,
        body: {
          "code": data[0][6]
        }
      };

      request(reqOptions, (error, response, body) => {
        // response from crm
        if (error)
          res.status(500).send({
            data: data,
            error: error
          });
        else {
          if (body["option_groups"] && body["base_prices"]) {
            let result = {};
            getAllOptions(body["option_groups"]).then(options => {
              getAllBasePrices(body["base_prices"]).then(prices => {
                result["product_uuid"] = body["uuid"];
                result["runsizes"] = options["runsizes"];
                result["all_turnaround_times"] = options["all_turnaround_times"];
                result["base_prices"] = prices;
                res.status(200).send(result);
              });
            });
          }
        }
      })
    } else {
      res.status(404).send({
        message: "Not Found"
      });
    }
  },

  getShippingQuote(req, res) {
    let params = req.body;

    let reqOptions = {
      url: "https://api.4over.com/shippingquote",
      headers: {
        "Authorization": config["4overKey"]["post"],
        "Content-Type": "application/json"
      },
      method: "POST",
      json: true,
      body: params
    };

    request(reqOptions, (err, response, body) => {
      if ([400, 409].indexOf(body.status_code) !== -1) {
        res.status(body.status_code).send({
          "message": body.message
        });
      } else {
        try {
          res.status(200).send({
            "shipping_options": body.job.facilities[0]["shipping_options"],
            "tax": body.job.facilities[0]["total_tax"]
          });
        } catch (e) {
          res.status(500).send(e);
        }
      }
    });
  },

  createOrder(req, res, next) {
    let params = req.body;
    let convergeParams = [
      params["billing"]["first_name"],
      params["billing"]["last_name"],
      params["billing"]["email"],
      params["ccInfo"]["account_number"],
      params["ccInfo"]["month"],
      params["ccInfo"]["year"].substr(-2, 2),
      params["ccInfo"]["ccv"],
      params["amount"],
      shortid.generate(),
      "New Order by " + params["billing"]["email"]
    ];

    converge.collectPayment(
      convergeParams[0],
      convergeParams[1],
      convergeParams[2],
      convergeParams[3],
      convergeParams[4],
      convergeParams[5],
      convergeParams[6],
      convergeParams[7],
      convergeParams[8],
      convergeParams[9]
    ).then(result => {
      let convergeResult = result.txn;

      if (convergeResult["ssl_result"] === 0) {
        sendThankYouEmail(params);

        if (params["jobs"] && params["jobs"].length) {
          uploadCardImages(params["jobs"]).then(jobs => {
            send4OverOrderReq({
              billing: params["billing"],
              shipping: params["shipping"],
              jobs: jobs
            }).then(result => {
              if (result["order_status"] == 'Success') {
                result["converge"] = {
                  card_type: convergeResult.ssl_card_short_description,
                  card_number: convergeResult.ssl_card_number
                };

                res.status(200).send(result);
              } else
                res.status(500).send({
                  "message": "error in creating order",
                  "content": result
                });
            });
          });
        } else {
          res.status(200).send({
            "message": "Jobs is empty",
            "jobs": params["jobs"]
          });
        }
      } else {
        res.status(500).send({
          "message": "Error in Converge",
          "content": convergeResult
        });
      }
    }, error => {
      console.log(error);
      res.status(500).send(error);
    });
  },

  getPCBasePrices(req, res, next) {
    let params = req.body;

    let queries = productsSheet[1].data.filter(card => {
      return (
        card[0].toLowerCase() === params["type"].toLowerCase() &&
        card[1].toLowerCase() === params["sizeLabel"].toLowerCase() &&
        card[2].toLowerCase() === params["weight"].toLowerCase() &&
        card[4].toLowerCase() === params["corner"].toLowerCase() &&
        card[5].toLowerCase() === params["finish"].toLowerCase()
      )
    });

    let runsizeList = [25, 50, 75, 100, 250, 500, 1000, 2500, 5000, 10000, 15000, 20000, 25000];
    let result = [];

    for (let query of queries) {
      let temp = {};

      for (let runsize of runsizeList)
        if (query[7 + runsizeList.indexOf(runsize)] !== "n/a")
          temp[runsize] = query[7 + runsizeList.indexOf(runsize)];

      result.push({
        class: query[6],
        basePrices: temp
      });
    }

    res.status(200).send(result);
  },

  uploadToAWSS3(req, res, next) {
    let bucketName = "agent-cloud";
    let files = req.files;
    let date = moment().format('YYYY-MM-DD');

    if (!files)
      res.status(500).send("files not found");
    else {
      // if bucket exists
      s3.headBucket({
        Bucket: bucketName
      }, (err, data) => {
        if (err) {
          s3.createBucket({
            Bucket: bucketName
          }, (err, data) => {
            if (err) {
              console.log("Create Bucket Error:", err);
              res.status(400).send(err.code);
            } else {
              console.log("New Bucket:", data);

              for (var i = 0; i < files.length; i++) {
                let params = {
                  Bucket: bucketName,
                  Key: 'addressers/' + date + '/' + req.body.user_id + '/' + files[i].originalname,
                  Body: files[i].buffer,
                  ACL: 'public-read'
                }

                if (i == files.length - 1) {
                  s3.putObject(params, (perr, pres) => {
                    if (perr) {
                      console.log("Error uploading data: ", perr);
                      return res.status(400).send(perr);
                    } else {
                      return res.status(200).send(pres);
                    }
                  });
                } else {
                  s3.putObject(params, (perr, pres) => {
                    if (perr) {
                      console.log("Error uploading data: ", perr);
                    } else {
                      console.log(pres);
                    }
                  });
                }
              }
            }
          });
        } else {
          for (var i = 0; i < files.length; i++) {
            let params = {
              Bucket: bucketName,
              Key: 'addressers/' + date + '/' + req.body.user_id + '/' + files[i].originalname,
              Body: files[i].buffer,
              ACL: 'public-read'
            }

            if (i == files.length - 1) {
              s3.putObject(params, (perr, pres) => {
                if (perr) {
                  console.log("Error uploading data: ", perr);
                  return res.status(400).send(perr);
                } else {
                  return res.status(200).send(pres);
                }
              });
            } else {
              s3.putObject(params, (perr, pres) => {
                if (perr) {
                  console.log("Error uploading data: ", perr);
                } else {
                  console.log(pres);
                }
              });
            }
          }
        }
      });
    }
  }
}
