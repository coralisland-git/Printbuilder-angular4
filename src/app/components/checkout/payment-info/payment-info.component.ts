import { Component, OnInit } from '@angular/core';
import { UserInfoService, GlobalService, HttpService } from '../../../services';

@Component({ selector: 'payment-info', templateUrl: './payment-info.component.html', styleUrls: ['./payment-info.component.css'] })
export class PaymentInfoComponent implements OnInit {
  yyList: any = [];
  mmList: any = [];

  shippingInfo: any = {}; //shipping information
  editingShippingInfo: boolean = false; // boolean if shipping info is editing or not
  cardInfo: any;  // card information

  private subTotal: any = 0;
  private shippingTotal: any = 0;
  private salesTaxTotal: any = 0;
  private total: any = 0;

  constructor(
    private globalService: GlobalService,
    private userInfoService: UserInfoService,
    private httpService: HttpService
  ) {
    this.shippingInfo = this.userInfoService.getShippingInfo();
    this.cardInfo = this.userInfoService.getCCInfo();
  }

  ngOnInit() {
    let date = new Date();

    for (let yy = date.getFullYear(); yy < date.getFullYear() + 5; yy++)
      this.yyList.push(yy.toString());

    for (let mm = 1; mm <= 12; mm++)
      this.mmList.push((`0${mm}`).slice(-2));
  }

  // update shipping info
  updateShippingInfo() {
    this.editingShippingInfo = !this.editingShippingInfo

    if (!this.editingShippingInfo) {
      this.userInfoService.setShippingInfo(this.shippingInfo);
    }
  }

  getShippingFullName() {
    return this.userInfoService.getShippingFullName();
  }

  getShippingCompanyName() {
    return this.userInfoService.getShippingCompanyName();
  }

  getShippingAddress() {
    return this.userInfoService.getShippingAddress();
  }

  getShippingCityStateZipcode() {
    let csz = this.userInfoService.getShippingCityStateZipcode();
    return this.userInfoService.getShippingCityStateZipcode();
  }

  getSubTotal() {
    let price = 0;
    this.userInfoService.getAllProducts().forEach(product => {
      price += product["options"]["base_price"] || 0;
    });

    this.subTotal = price;
    return price;
  }

  getShippingTotal() {
    let price = 0;
    this.userInfoService.getAllProducts().forEach(product => {
      price += Number(product["options"]["shipping_option"]["service_price"] || 0);
    });

    this.shippingTotal = price;
    return price;
  }

  // sales tax, tax is 9.25 * of order
  getSalesTaxTotal() {
    this.salesTaxTotal = ((this.subTotal + this.shippingTotal) * 9.25 / 100).toFixed(2);
    this.salesTaxTotal = Number(this.salesTaxTotal);
    return this.salesTaxTotal;
  }

  getTotal() {
    this.total = (this.subTotal + this.shippingTotal + this.salesTaxTotal).toFixed(2);
    this.total = Number(this.total);
    return this.total;
  }

  getDiscount() {
    return 0;
  }

  // check out
  checkOut() {
    let jobs = this.userInfoService.convertCartToJobs();
    let billingInfo = this.userInfoService.getBillingInfo();
    let shippingInfo = this.userInfoService.getShippingInfo();

    let params = {
      "ccInfo": this.cardInfo,
      "amount": this.total,
      "billing": billingInfo,
      "shipping": shippingInfo,
      "jobs": jobs
    };

    this.userInfoService.setCheckingOutStatus(true);
    this.userInfoService.setCheckOutResult(false);

    this.httpService.checkout(params).subscribe(res => {
      this.userInfoService.setCheckingOutStatus(false);
      if (res.status == 200) {
        let products = [];

        for (let product of this.userInfoService.getAllProducts()) {
          if(product["type"] === "post"){
            this.httpService.uploadPCOrderToAWS(product["formData"]).subscribe(res => {
              this.globalService.printLogData(res);
            }, err => {
              this.globalService.printLogData(err);
            })            
          }
          products.push({
            "type": product["type"],
            "frontImgURL": product["frontImgURL"],
            "backImgURL": product["backImgURL"],
            "runsize": product["options"]["runsize"],
            "discount": 0,
            "subTotal": Number(product["options"]["base_price"]) + Number(product["options"]["shipping_option"]["service_price"] || 0)
          });
        }

        this.userInfoService.clearCart();

        let result = res.json();
        this.userInfoService.setCheckOutResult({
          "converge": result["converge"],
          "products": products
        });
        this.globalService.redirectTo("/thank-you");
      }
    }, err => {
      this.globalService.printLogData(err);
      this.userInfoService.setCheckingOutStatus(false);
    });
  }
}
