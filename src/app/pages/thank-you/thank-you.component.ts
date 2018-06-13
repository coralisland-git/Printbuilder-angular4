import { Component, OnInit } from '@angular/core';
import { GlobalService, UserInfoService } from '../../services';

@Component({
  selector: 'thank-you',
  templateUrl: './thank-you.component.html',
  styleUrls: ['./thank-you.component.css']
})
export class ThankYouComponent implements OnInit {
  private checkOutResult: any;

  constructor(
    private globalService: GlobalService,
    private userInfoService: UserInfoService
  ) {
    this.checkOutResult = this.userInfoService.getCheckOutResult();
  }

  ngOnInit() {
  }

  // get all products
  getProducts() {
    return this.checkOutResult["products"];
  }

  // get card product images
  getCardImages(cardProduct) {
    return [cardProduct["frontImgURL"], cardProduct["backImgURL"]];
  }

  // get runsize
  getRunsize(cardProduct) {
    return cardProduct["runsize"];
  }

  // get Line Total
  getLineTotal(cardProduct) {
    return cardProduct["subTotal"];
  }

  // get card type
  getCardType(cardProduct) {
    return cardProduct["type"];
  }

  // get shipping user name
  getShippingUserName() {
    return this.userInfoService.getShippingFullName();
  }

  // get shipping company name
  getShippingCompanyName() {
    return this.userInfoService.getShippingCompanyName();
  }

  // get shipping address
  getShippingAddress() {
    return this.userInfoService.getShippingAddress();
  }

  // get shipping address
  getShippingCityStateZipcode() {
    return this.userInfoService.getShippingCityStateZipcode();
  }

  // get billing card name
  getBillingCardName() {
    return this.userInfoService.getFullName();
  }

  // get credit card type
  getCreditCardType() {
    return this.checkOutResult["converge"]["card_type"];
  }

  // get Credit Card Number
  getCreditCardNumber() {
    return this.checkOutResult["converge"]["card_number"];
  }

  // get sub total
  getSubTotal() {
    let price = 0;

    this.checkOutResult["products"].forEach(product => {
      price += Number(product["subTotal"]);
    });

    return price;
  }

  getSalesTaxTotal() {
    return this.getSubTotal() * 9.25 / 100;
  }

  // get total
  getTotal() {
    return this.getSubTotal() + this.getSalesTaxTotal() + this.getDiscount();
  }

  // get discount
  getDiscount() {
    let price = 0;

    this.checkOutResult["products"].forEach(product => {
      price += Number(product["discount"]);
    });

    return price;
  }
}
