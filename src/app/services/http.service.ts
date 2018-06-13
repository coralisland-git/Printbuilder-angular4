import { Injectable } from '@angular/core';
import { Http, Headers, URLSearchParams, RequestOptions } from "@angular/http";
import { GlobalService } from './global.service';

@Injectable()
export class HttpService {
  private headers: Headers;

  constructor(
    private http: Http,
    private globalService: GlobalService
  ) {
    this.headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": "Token " + this.getToken()
    });
  }

  // get token
  getToken() {
    let params = new URLSearchParams(window.location.search);
    let token = params.get('token');

    return token ? token : this.globalService.getItem("crm_token", false);
  }

  // return API Server URL
  getAPIServerURL(server = "printbuilder") {
    let URL = "";
    switch (server) {
      case "agentcloud":
        URL = "https://api.agentcloud.com";
        break;

      case "printbuilder":
      default:
        if (this.globalService.isLocalHost())
          URL = "http://localhost:8080/api";
        else if (this.globalService.isLiveSite())
          URL = "https://printbuilder.agentcloud.com/api";
        else
          URL = "https://devprintbuilder.agentcloud.com/api";

        break;
    }

    return URL;
  }

  // get CardElements
  getCardElements(params) {
    return this.http.post(
      this.getAPIServerURL() + "/card/get-template-elements",
      params,
      { headers: this.headers }
    );
  }

  // get user model
  getUserInfo() {
    return this.http.get(
      this.getAPIServerURL("agentcloud") + "/rest-auth/user/",
      { headers: this.headers }
    );
  }

  // get 4 over product info
  get4OverProductInfo(params) {
    return this.http.post(
      this.getAPIServerURL() + "/checkout/get-4over-product-info",
      params,
      { headers: this.headers }
    );
  }

  // update user info
  updateUserInfo(params) {
    return this.http.patch(
      this.getAPIServerURL("agentcloud") + "/rest-auth/user/",
      params,
      { headers: this.headers }
    )
  }

  // get shipping quote
  getShippingQuote(params) {
    return this.http.post(
      this.getAPIServerURL() + "/checkout/get-shipping-quote",
      params,
      { headers: this.headers }
    );
  }

  // checkout
  checkout(params) {
    return this.http.post(
      this.getAPIServerURL() + "/checkout/create-4over-order",
      params,
      { headers: this.headers }
    );
  }

  // verify billing info
  verifyBillingInfo(params) {
    return this.http.post(
      this.getAPIServerURL() + "/user/verify-billinginfo",
      params,
      { headers: this.headers }
    );
  }

  // verify shipping info
  verifyShippingInfo(params) {
    return this.http.post(
      this.getAPIServerURL() + "/user/verify-shippinginfo",
      params,
      { headers: this.headers }
    );
  }

  // get leads
  getLeads() {
    return this.http.get(
      this.getAPIServerURL("agentcloud") + "/api/lead",
      { headers: this.headers }
    );
  }

  // get post card base prices
  getPCBasePrices(params) {
    return this.http.post(
      this.getAPIServerURL() + "/checkout/get-pc-base-prices",
      params,
      { headers: this.headers }
    );
  }

  // upload leads list to aws s3
  uploadPCOrderToAWS(formData: FormData) {
    return this.http.post(
      this.getAPIServerURL() + "/checkout/upload-to-aws-s3",
      formData
    );
  }
}