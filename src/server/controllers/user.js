const request = require('request');
const config = require('../config');
const xml2js = require('xml2js');

let status = config["status"];

module.exports = {
  // verify billing info
  verifyBillingInfo(req, res) {
    let params = req.body;
    params["year"] = params["year"].substr(-2, 2);

    let xmlTransaction = 'xmldata=<txn><ssl_merchant_ID>' + config["converge"][status]["merchantID"] + '</ssl_merchant_ID><ssl_user_id>' + config["converge"][status]["userID"] + '</ssl_user_id><ssl_pin>' + config["converge"][status]["pin"] + '</ssl_pin><ssl_transaction_type>CCVERIFY</ssl_transaction_type><ssl_card_number>' + params["account_number"] + '</ssl_card_number><ssl_exp_date>' + (params["month"] + params["year"]) + '</ssl_exp_date><ssl_first_name>' + params["first_name"] + '</ssl_first_name><ssl_last_name>' + params["last_name"] + '</ssl_last_name><ssl_cvv2cvc2>' + params["ccv"] + '</ssl_cvv2cvc2><ssl_avs_address>' + params["avs_address"] + '</ssl_avs_address><ssl_city>' + params["city"] + '</ssl_city><ssl_state>' + params["state"] + '</ssl_state><ssl_avs_zip>' + params["avs_zip"] + '</ssl_avs_zip><ssl_country>USA</ssl_country></txn>'

    let URL = status == "sandbox" ? 'https://demo.myvirtualmerchant.com/VirtualMerchantDemo/processxml.do' : 'https: //www.myvirtualmerchant.com/VirtualMerchant/processxml.do';
    request.post({
      url: URL,
      form: xmlTransaction
    }, (error, response, body) => {
      if (error)
        res.status(500).send({
          message: "Incorrect Billing Info"
        });
      else
        xml2js.parseString(body, function (err, results) {
          if (results["txn"]["ssl_result"][0] === "1")
            res.status(200).send({
              message: "verified billing info"
            });
          else
            res.status(500).send({
              message: "Incorrect Billing Info"
            });
        });
    });
  },

  // verify shipping info
  verifyShippingInfo(req, res) {
    let params = req.body;

    request({
      url: "https://api.4over.com/addressvalidation",
      headers: {
        "Authorization": config["4overKey"]["post"],
        "Content-Type": "application/json"
      },
      method: "POST",
      json: true,
      body: params
    }, (error, response, body) => {
      if (error)
        res.status(500).send(error);
      else {
        if (body["isValidAddress"])
          res.status(200).send(body);
        else {
          res.status(500).send({
            message: "Invalid Shipping Address"
          });
        }
      }
    });
  }
}
