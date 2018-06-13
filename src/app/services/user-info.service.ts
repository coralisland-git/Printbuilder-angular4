import { Injectable } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import { GlobalService } from './global.service';
import { HttpService } from './http.service';

@Injectable()
export class UserInfoService {
  private token: string = null;     // CRM token
  private userInfo: any = {};     //  user modal
  private acceptTermsOfUse: any = false;  // show terms of use init state: -1
  private waitingResponse: boolean = false; // waiting until user info is come from api after send request.
  private cartProducts: any = [];
  private checkingOutStatus: boolean = false;  // is checking
  private checkOutResult: any = false;
  private isVerifedBillingInfo: boolean = false;
  private isVerifiedShippingInfo: boolean = false;

  constructor(
    private globalService: GlobalService,
    private httpService: HttpService
  ) {
    this.initializeVariables();

    if (this.isValidToken())
      this.populateUserInfo();
    else {
      window.location.href = "https://agentcloud.com/wp-login.php?action=logout&redirect_to=https://agentcloud.com";
    }
  }

  // get init userinfo
  getInitUserInfo() {
    return {
      "first_name": "",
      "last_name": "",
      "company": "",
      "address": "",
      "address2": "",
      "city": "",
      "state": "",
      "zipcode": "",
      "cell_phone": "",
      "home_phone": "",
      "profile_image": "",
      "bre_number": "",
      "website": "",
      "email": "",
      "broker_license": "",
      "shipping_first_name": "",
      "shipping_last_name": "",
      "shipping_company": "",
      "shipping_address": "",
      "shipping_address2": "",
      "shipping_city": "",
      "shipping_state": "",
      "shipping_zipcode": "",
      "shipping_email": "",
      "shipping_phone": "",
      "shipping_country": "",
      "card_number": "",
      "card_exp_year": "",
      "card_exp_month": "",
      "card_cvv": ""
    };
  }

  // initialize variables
  initializeVariables() {
    this.userInfo = this.getInitUserInfo();
  }

  // check if user info is populated
  isEnabledUserInfo() {
    return JSON.stringify(this.userInfo) != JSON.stringify(this.getInitUserInfo());
  }

  isWaitingResponse() {
    return this.waitingResponse;
  }

  // user info population
  populateUserInfo() {
    this.httpService.getUserInfo().subscribe(res => {
      this.userInfo = res.json();
      this.acceptTermsOfUse = this.globalService.getItem("terms_of_use", false) == "accept";

      // this.verifyBillingInfo();
      this.verifyShippingInfo();
    }, err => {
      this.globalService.printLogData(err);
      window.location.href = "https://agentcloud.com/wp-login.php?action=logout&redirect_to=https://agentcloud.com";
    })

    this.waitingResponse = true;
  }

  // check if token is valid
  isValidToken() {
    let params = new URLSearchParams(window.location.search);
    let url_token = params.get('token');

    if (url_token) {
      if (url_token != this.globalService.getItem("crm_token", false))
        this.globalService.removeItem("terms_of_use");

      this.globalService.saveItem("crm_token", url_token);
      this.token = url_token;
    } else
      this.token = this.globalService.getItem("crm_token", false);

    if (!this.token) {
      window.location.href = "https://agentcloud.com/wp-login.php?action=logout&redirect_to=https://agentcloud.com";
    }

    return this.token != null;
  }

  // get state of terms of use
  isAcceptedTermsOfUse() {
    return this.acceptTermsOfUse;
  }

  // accept terms of use
  // decline terms of use
  setTermsOfUse(action) {
    if (action == "accept") {
      this.acceptTermsOfUse = 0;
      this.globalService.saveItem("terms_of_use", "accept");

      return;
    }

    this.logOut();
  }

  // logout
  logOut() {
    this.userInfo = {};
    this.globalService.removeItem("crm_token");
    this.globalService.removeItem("terms_of_use");
    window.location.href = "https://agentcloud.com/wp-login.php?action=logout&redirect_to=https://agentcloud.com";
  }

  // get biling info
  getBillingInfo() {
    return {
      "first_name": this.userInfo["first_name"],
      "last_name": this.userInfo["last_name"],
      "address1": this.userInfo["address"],
      "address2": this.userInfo["address2"],
      "city": this.userInfo["city"],
      "state": this.userInfo["state"],
      "zip": this.userInfo["zipcode"],
      "email": this.userInfo["email"],
      "country": this.userInfo["country"] || "US"
    };
  }

  // set shipping info
  setShippingInfo(params) {
    if (!params)
      return;

    let userInfo = {};
    userInfo["shipping_company"] = params["company"] || "";
    userInfo["shipping_first_name"] = params["firstname"] || "";
    userInfo["shipping_last_name"] = params["lastname"] || "";
    userInfo["shipping_email"] = params["email"] || "";
    userInfo["shipping_phone"] = params["phone"] || "";
    userInfo["shipping_address"] = params["address"] || "";
    userInfo["shipping_address2"] = params["address2"] || "";
    userInfo["shipping_city"] = params["city"] || "";
    userInfo["shipping_state"] = params["state"] || "";
    userInfo["shipping_zipcode"] = params["zipcode"] || "";
    userInfo["shipping_country"] = params["country"] || "US";

    this.httpService.updateUserInfo(userInfo).subscribe(res => {
      this.userInfo = res.json();
    }, err => {
      this.globalService.printLogData(err);
    });
  }

  // get shipping info
  getShippingInfo() {
    return {
      "company": this.userInfo["shipping_company"],
      "firstname": this.userInfo["shipping_first_name"],
      "lastname": this.userInfo["shipping_last_name"],
      "email": this.userInfo["email"],
      "phone": this.getPhoneNumber(),
      "address": this.userInfo["shipping_address"],
      "address2": this.userInfo["shipping_address2"],
      "city": this.userInfo["shipping_city"],
      "state": this.userInfo["shipping_state"],
      "zipcode": this.userInfo["shipping_zipcode"],
      "country": this.userInfo["shipping_country"] || "US"
    };
  }

  // get credit card info
  getCCInfo() {
    return {
      "account_number": this.userInfo["card_number"] || "",
      "month": this.userInfo["card_exp_month"] || "",
      "year": this.userInfo["card_exp_year"] || "",
      "ccv": this.userInfo["card_cvv"] || ""
    };
  }

  // set user info
  setUserInfo(userInfo) {
    this.userInfo = userInfo;

    delete userInfo["profile_image"];

    this.verifyShippingInfo();

    this.httpService.updateUserInfo(userInfo).subscribe(res => {
      this.globalService.printLogData(res);
    }, err => {
      this.globalService.printLogData(err);
    });
  }

  // get user info
  getUserInfo() {
    return this.userInfo;
  }

  // get user profile image
  getProfileImage() {
    return this.userInfo["profile_image"] || "";
  }

  // get user company
  getCompanyName() {
    return this.userInfo["company"] || "";
  }

  // get user first name
  getFirstName() {
    return this.userInfo["first_name"] || "";
  }

  // get user last name
  getLastName() {
    return this.userInfo["last_name"] || "";
  }

  // get user full name
  getFullName() {
    return [this.getFirstName(), this.getLastName()].join(" ");
  }

  // get user bre number
  getBreNumber() {
    return this.userInfo["bre_number"] || "";
  }

  // get Address 1
  getAddress1() {
    return this.userInfo["address"] || "";
  }

  // get Address 2
  getAddress2() {
    return this.userInfo["address2"] || "";
  }

  // get address
  getAddress() {
    return [this.getAddress1(), this.getAddress2()].join(" ");
  }

  // get city
  getCity() {
    return this.userInfo["city"] || "";
  }

  // get state
  getState() {
    return this.userInfo["state"] || "";
  }

  // get zipcode
  getZipCode() {
    return this.userInfo["zipcode"] || "";
  }

  // get user address city, state, zipcode 
  getCityStateZipcode() {
    return [this.getCity() + ", ", this.getState(), this.getZipCode()].join(" ");
  }

  // get user address street
  getFullAddress(type = "single") {
    return [this.getAddress(), this.getCityStateZipcode()].join(type == "multi" ? '\n' : ", ");
  }

  // get user phone number
  getPhoneNumber(type = null) {
    let txt = "";
    if (type)
      txt = this.userInfo[type] || txt;
    else
      txt = this.userInfo["cell_phone"] || this.userInfo["home_phone"] || "";

    txt = this.getPhoneFormatted(txt.match(/\d/g).join(""));

    return txt;
  }

  // get text as phone formmated
  getPhoneFormatted(number) {
    let txt = ["0000000000", number].join("").slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, '($1)-$2-$3');
    return txt;
  }

  // get user website url
  getWebsiteURL() {
    return this.userInfo["website"] || "";
  }

  // get user email
  getEmail() {
    return this.userInfo["email"] || "";
  }

  // get user broker license
  getBrokerLicense() {
    return this.userInfo["broker_license"] || "";
  }

  // get shipping company
  getShippingCompanyName() {
    return this.userInfo["shipping_company"] || "";
  }

  // get shipping first name
  getShippingFirstName() {
    return this.userInfo["shipping_first_name"] || "";
  }

  // get shipping last name
  getShippingLastName() {
    return this.userInfo["shipping_last_name"] || "";
  }

  // get shipping full name
  getShippingFullName() {
    return [this.getShippingFirstName(), this.getShippingLastName()].join(" ");
  }

  // get shipping address 1
  getShippingAddress1() {
    return this.userInfo["shipping_address"] || "";
  }

  // get shipping address 2
  getShippingAddress2() {
    return this.userInfo["shipping_address2"] || "";
  }

  // get shipping address
  getShippingAddress() {
    return [this.getShippingAddress1(), this.getShippingAddress2()].join(" ");
  }

  // get shipping city
  getShippingCity() {
    return this.userInfo["shipping_city"] || "";
  }
  // get shipping state
  getShippingState() {
    return this.userInfo["shipping_state"] || "";
  }
  // get shipping zipcode
  getShippingZipCode() {
    return this.userInfo["shipping_zipcode"] || "";
  }

  // get city state zipcode
  getShippingCityStateZipcode() {
    return [this.getShippingCity() + ", ", this.getShippingState(), this.getShippingZipCode()].join(" ");
  }

  // get shipping address
  getShippingFullAddress() {
    return [this.getShippingAddress(), this.getShippingCityStateZipcode()].join('\n');
  }

  // get shipping email
  getShippingEmail() {
    return this.userInfo["shipping_email"] || "";
  }

  // get shipping phone
  getShippingPhone() {
    return this.userInfo["shipping_phone"] || "";
  }

  // get all products in cart
  getAllProducts() {
    if (this.globalService.isLocalHost()) {
      if (!this.cartProducts || this.cartProducts.length == 0)
        this.cartProducts = require("../../resources/mockup/cart-products.json");
    }

    return this.cartProducts;
  }

  // add product to cart
  addProduct(product) {
    let isFound = false;

    if (product["id"]) {
      for (let cartProduct of this.cartProducts) {
        if (cartProduct["id"] == product["id"]) {
          isFound = true;
          cartProduct = product;
        }
      }
    }

    if (!isFound) {
      Object.assign(product, {
        "id": (new Date().getTime()).toString(36),
        "editingProduct": false,
        "tempProductLabel": product["productLabel"]
      });

      this.cartProducts.push(product);
    }
  }

  // update product in the cart
  updateProduct(product) {
    return this.cartProducts.filter(org_product => {
      if (org_product["id"] == product["id"]) {
        org_product = product;
      }
    });
  }

  // get product in the cart
  getProduct(product_id) {
    let products = this.cartProducts.filter(product => product["id"] == product_id);

    if (products.length)
      return products[0];

    return {};
  }

  // delete product
  deleteProduct(product_id) {
    this.cartProducts = this.cartProducts.filter(product => product["id"] != product_id);
  }

  // clear cart products
  clearCart() {
    this.cartProducts = [];
  }

  // convert projects to jobs
  convertCartToJobs() {
    let jobs: any = [];

    for (let product of this.cartProducts) {
      if (product["type"] != "post") {
        jobs.push({
          "id": product["id"],
          "type": product["type"],
          "layout": product["layout"],
          "frontImage": product["frontImgURL"],
          "backImage": product["backImgURL"],
          "job_name": product["productLabel"],
          "product_uuid": product["options"]["product_uuid"],
          "runsize_uuid": product["options"]["runsize_uuid"],
          "turnaround_time_uuid": product["options"]["turnaround_time_uuid"],
          "colorspec_uuid": product["options"]["colorspec_uuid"],
          "shipper": {
            "shipping_method": product["options"]["shipping_option"]["service_name"],
            "shipping_code": product["options"]["shipping_option"]["service_code"]
          },
          "runsize": Number(product["options"]["runsize"]),
          "base_price": Number(product["options"]["base_price"]),
          "shipping_price": Number(product["options"]["shipping_option"]["service_price"]),
          "discount": Number(0)
        });
      } else {
        // upload product, csv files to aws s3
        let crmData = [];
        for (let contact of product["crm_contacts"]) {
          crmData.push({
            "First Name": contact["first_name"],
            "Last Name": contact["last_name"],
            "Email": contact["email"],
            "Phone": contact["phone_mobile"],
            "Address 1": contact["address"],
            "Address 2": contact["address2"],
            "City": contact["city"],
            "State": contact["state"],
            "Zip": contact["zipcode"]
          })
        }

        let uploadFormData = new FormData();
        if (product["csv_file"])
          uploadFormData.append("files", product["csv_file"]);

        if (crmData.length) {
          let crmCSVData = new Blob([this.globalService.ConvertToCSV(crmData)], { type: 'text/csv' });

          uploadFormData.append("files", crmCSVData, "crm_contacts.csv");
        }

        if (product["frontImgURL"])
          uploadFormData.append("files", this.globalService.dataURItoBlob(product["frontImgURL"].toString()), "front.png");

        if (product["backImgURL"])
          uploadFormData.append("files", this.globalService.dataURItoBlob(product["backImgURL"].toString()), "back.png");

        uploadFormData.append('user_id', this.userInfo["id"]);

        product["formData"] = uploadFormData;
      }
    }

    return jobs;
  }


  // set checkout status
  setCheckingOutStatus(value) {
    this.checkingOutStatus = value;
  }

  // get check out flag
  getCheckingOutStatus() {
    return this.checkingOutStatus;
  }

  // set checkout result
  setCheckOutResult(data) {
    this.checkOutResult = data;
  }

  // get checkout result
  getCheckOutResult() {
    let checkOutResult = this.checkOutResult;
    this.setCheckOutResult(false);
    return checkOutResult;
  }

  // verify billing info
  verifyBillingInfo() {
    this.isVerifedBillingInfo = false;
    let ccInfo = this.getCCInfo();

    let params = {
      "account_number": ccInfo["account_number"],
      "month": ccInfo["month"],
      "year": ccInfo["year"],
      "ccv": ccInfo["ccv"],
      "first_name": this.userInfo["first_name"],
      "last_name": this.userInfo["last_name"],
      "avs_address": this.userInfo["address"],
      "city": this.userInfo["city"],
      "state": this.userInfo["state"],
      "avs_zip": this.userInfo["zipcode"]
    };

    this.httpService.verifyBillingInfo(params).subscribe(res => {
      if (res["status"] === 200) {
        this.globalService.printLogData(res);
        this.isVerifedBillingInfo = true;
      }
    }, err => {
      this.globalService.printLogData(err);
    });
  }

  // verify shipping info
  verifyShippingInfo() {
    this.isVerifiedShippingInfo = false;
    let params = {
      "shipping_address": {
        "address": this.getShippingAddress(),
        "city": this.getShippingCity(),
        "state": this.getShippingState(),
        "zipcode": this.getShippingZipCode(),
        "country": "US"
      }
    };

    this.httpService.verifyShippingInfo(params).subscribe(res => {
      if (res["status"] === 200) {
        this.isVerifiedShippingInfo = true;
      } else {
        this.globalService.printLogData(res);
      }
    }, err => {
      this.globalService.printLogData(err);
    });
  }

  isVerifiedInfo(type) {
    if (type == "billing")
      return this.isVerifedBillingInfo;

    return this.isVerifiedShippingInfo;
  }

  // is empty field
  isValid(value) {
    if (!value || value === "null")
      return false;

    return true;
  }

  // is Shipping and Billing are populated
  isShippingBillingOK() {
    if (!this.isValid(this.userInfo["first_name"]))
      return false;

    if (!this.isValid(this.userInfo["last_name"]))
      return false;

    if (!this.isValid(this.userInfo["address"]))
      return false;

    if (!this.isValid(this.userInfo["city"]))
      return false;

    if (!this.isValid(this.userInfo["state"]))
      return false;

    if (!this.isValid(this.userInfo["zipcode"]))
      return false;

    if (!this.isValid(this.userInfo["email"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_company"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_first_name"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_last_name"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_address"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_city"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_state"]))
      return false;

    if (!this.isValid(this.userInfo["shipping_zipcode"]))
      return false;

    return true;
  }
}
