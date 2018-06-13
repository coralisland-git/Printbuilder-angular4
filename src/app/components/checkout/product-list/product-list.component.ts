import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  GlobalService,
  CardEditorService,
  UserInfoService
} from '../../../services';
import { DialogService } from 'ng2-bootstrap-modal';
import { ACDialogComponent } from '../../../components/ac-dialog/ac-dialog.component';
import { HttpService } from '../../../services';

@Component({
  selector: 'product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  constructor(
    private dialogService: DialogService,
    private router: Router,
    private cardEditorService: CardEditorService,
    private globalService: GlobalService,
    private userInfoService: UserInfoService,
    private httpService: HttpService
  ) { }

  ngOnInit() { }

  // get all products
  getProducts() {
    return this.userInfoService.getAllProducts();
  }

  // get card product images
  getCardImages(cardProduct) {
    return this.getCardType(cardProduct) !== "flyer" ? [cardProduct["frontImgURL"], cardProduct["backImgURL"]] : [cardProduct["frontImgURL"]];
  }

  getCornerClass(cardProduct) {
    return ["corner", cardProduct["options"]["corner"]].join("-");
  }

  getCardLabel(cardProduct) {
    return cardProduct["productLabel"];
  }

  // get runsize
  getRunsize(cardProduct) {
    return cardProduct["options"]["runsize"];
  }

  // get Turn around time
  getTurnAroundTime(cardProduct) {
    return cardProduct["options"]["turnaround_time"];
  }

  // get shipping service code
  getShippingServiceCode(cardProduct) {
    if (cardProduct)
      return cardProduct["options"]["shipping_option"]["service_code"];
  }

  // update shipping service 
  changeShippingService(cardProduct, service_code) {
    let shipping_services = cardProduct["options"]["shipping_options"].filter(shipping_service => shipping_service["service_code"] == service_code);

    if (shipping_services.length)
      cardProduct["options"] = this.cardEditorService.setShippingService(cardProduct, shipping_services[0]);
  }

  // get base price
  getBasePrice(cardProduct) {
    return this.cardEditorService.getBasePrice(cardProduct);
  }

  // get shipping price
  getShippingPrice(cardProduct) {
    return this.cardEditorService.getShippingPrice(cardProduct);
  }

  // get product price
  getPrice(cardProduct) {
    let price = this.cardEditorService.getProductPrice(cardProduct);
    return this.cardEditorService.getProductPrice(cardProduct);
  }

  // get card type
  getCardType(cardProduct) {
    return cardProduct["type"].toLowerCase();
  }

  // remove product
  removeProduct(cardProduct) {
    this.userInfoService.deleteProduct(cardProduct["id"]);
  }

  // redirect to other pages
  redirectTo(type, product) {
    switch (type) {
      case "review-order":
      case "front-builder":
        this.cardEditorService.setExistingCard();
        this.cardEditorService.setPBRightStep(type);
        this.cardEditorService.setCardProperties(product);
        this.cardEditorService.saveCanvasData(this.cardEditorService.getLastState("front"), "front");

        if (this.getCardType(product) != "flyer")
          this.cardEditorService.saveCanvasData(this.cardEditorService.getLastState("back"), "back");


        if (type == "front-builder")
          this.cardEditorService.populateMaskList();

        this.globalService.redirectTo("/products/single-product");
        break;

      case "shopping":
      default:
        this.globalService.redirectTo('/products');
        break;
    }
  }

  is4OverProduct(cardProduct) {
    return this.cardEditorService.is4OverProduct(cardProduct);
  }

  // refresh post card product runsize
  reFreshRunsize(cardProduct) {
    cardProduct["options"]["runsize"] = (cardProduct["csv_contacts"] ? cardProduct["csv_contacts"].length : 0) + (cardProduct["crm_contacts"] ? cardProduct["crm_contacts"].length : 0);

    cardProduct["options"]["runsize"] = cardProduct["options"]["runsize"] < cardProduct["options"]["runsizes"][0] ? cardProduct["options"]["runsizes"][0] : cardProduct["options"]["runsize"];

    // calculate base price
    let pricePPC = cardProduct["options"]["base_prices"].length ? cardProduct["options"]["base_prices"][0] : 0; // price per pc card
    for (let count of cardProduct["options"]["runsizes"]) {
      if (count < cardProduct["options"]["runsize"]) {
        pricePPC = cardProduct["options"]["base_prices"][cardProduct["options"]["runsizes"].indexOf(count)];
      }
    }

    cardProduct["options"]["base_price"] = Number((pricePPC * cardProduct["options"]["runsize"]).toFixed(2));
  }

  // upload csv file
  uploadCSV(cardProduct) {
    this.dialogService.addDialog(ACDialogComponent, {
      dlgType: "import-contacts",
      dlgData: {}
    }).subscribe(result => {
      if (result) {
        cardProduct["csv_contacts"] = result["contacts"];
        cardProduct["csv_file"] = result["csvFile"];
      }

      this.reFreshRunsize(cardProduct);
    });
  }

  // get contacts list
  getContactsList(cardProduct) {
    this.httpService.getLeads().subscribe(res => {
      let result = res.json();

      if (result.length) {
        result = result.filter(lead => !lead["is_lead"]);
        cardProduct["crm_contacts"] = result;
        this.reFreshRunsize(cardProduct);
      }
    }, err => { })
  }
}
