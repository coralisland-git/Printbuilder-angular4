import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';

import {
  CardEditorService,
  GlobalService,
  HttpService,
  UserInfoService
} from '../../services';
import {
  CardEditorComponent,
  LayersPanelComponent,
  ReviewOrderComponent,
  ACDialogComponent
} from '../../components';

@Component({
  selector: 'single-product',
  templateUrl: './single-product.component.html',
  styleUrls: ['./single-product.component.css']
})
export class SingleProductComponent implements OnInit, OnDestroy {
  @ViewChild(LayersPanelComponent) layerPanel: LayersPanelComponent;
  @ViewChild(CardEditorComponent) cardEditor: CardEditorComponent;
  @ViewChild(ReviewOrderComponent) reviewOrder: ReviewOrderComponent;

  constructor(
    private dialogService: DialogService,
    private globalService: GlobalService,
    private cardEditorService: CardEditorService,
    private httpService: HttpService,
    private userInfoService: UserInfoService,
  ) {
    if (this.cardEditorService.getCardType() === "")
      this.globalService.redirectTo("/products");

    if (/* !this.userInfoService.isVerifiedInfo("billing") ||  */!this.userInfoService.isVerifiedInfo("shipping")) {
      if (this.globalService.isLiveSite()) {
        alert("Please fill in your billing, shipping and credit card information in order to access the print builder.");
        this.globalService.redirectTo("https://crm.agentcloud.com/#/settings/profile_billing?sso=true&token=" + this.globalService.getItem("crm_token", false));
      }
    }

    this.cardEditorService.setCardBuildingStatus(true);

    if (!this.cardEditorService.getExistingCard()) {
      this.cardEditorService.initCanvasData();
    }

    this.cardEditorService.setPBLeftStep("templates-panel");
  }

  ngOnInit() {
    this.checkInstafeedAccessToken();
  }

  ngOnDestroy() {
    this.cardEditorService.setCardBuildingStatus(false);
  }

  // check instafeed access_token
  checkInstafeedAccessToken() {
    let href = window.location.href;

    if (href.indexOf("access_token=") !== -1) {
      let accessToken = href.split("access_token=").pop();
      this.globalService.saveItem("access_token", accessToken);

      window.close();
    }
  }

  // call method when template is selected from designs panel in left
  templateSelect(tplInfo) {
    this.cardEditorService.setCardSKU(tplInfo.sku);
    this.cardEditorService.setCardLayout(tplInfo.layout);
    this.cardEditor.populateEditor(tplInfo);
  }

  getCardType() {
    return this.cardEditorService.getCardType();
  }

  // event when element is added or remove in card editor
  cardEditorUpdated(tplElements) {
    this.layerPanel.populateTemplateElements(tplElements);
  }

  // event when layer is updated
  updateCardCanvasObjects(type) {
    switch (type) {
      case "bringForward":
        this.cardEditor.updateCardCanvasObjects("bringForward");
        break;

      case "sendBackwards":
        this.cardEditor.updateCardCanvasObjects("sendBackwards");
        break;

      case "undo":
        break;

      case "redo":
        break;

      case "update":
      default:
        this.cardEditor.updateCardCanvasObjects();
        break;
    }
  }

  // set pb left step
  setPBLeftStep(step) {
    this.cardEditorService.setPBLeftStep(step);
  }
  // get pb left step
  getPBLeftStep() {
    return this.cardEditorService.getPBLeftStep();
  }

  // set pb right step
  setPBRightStep(step) {
    this.cardEditorService.setPBRightStep(step);
  }
  // get pb right step
  getPBRightStep() {
    return this.cardEditorService.getPBRightStep();
  }

  // progress percentage for progress bar
  getProgressValue() {
    let value = 0;
    switch (this.getPBRightStep()) {
      case "front-builder":
        value = this.getCardType() != 'flyer' ? 100 / 3 : 50;
        break;
      case "back-builder":
        value = this.getCardType() != 'flyer' ? 100 * 2 / 3 : 50;
        break;

      case "review-order":
        value = 100;
        break;

      default:
        value = 0;
        break;
    }

    return value;
  }

  // change step in nav pills - print builder.
  changeStep(type) {
    let newStatus = "";
    let toCheckout = false;

    switch (this.getPBRightStep()) {
      case "front-builder":
        newStatus = type == "next" ? (this.cardEditorService.getCardType() != "flyer" ? "back-builder" : "review-order") : "front-builder";
        if (type == "next")
          this.cardEditorService.setCardImageURL("front", this.cardEditor.exportCanvasToImgURL("original"));
        else {

          this.dialogService.addDialog(ACDialogComponent, {
            dlgType: "leave-design",
            dlgData: {}
          }).subscribe(result => {
            if (result) {
              this.globalService.redirectTo("/products");
            }
          });
        }

        this.setPBLeftStep("templates-panel");
        break;

      case "back-builder":
        newStatus = type == "next" ? "review-order" : "front-builder";
        if (type == "next")
          this.cardEditorService.setCardImageURL("back", this.cardEditor.exportCanvasToImgURL("original"));
        this.setPBLeftStep("templates-panel");
        break;

      case "review-order":
        newStatus = type == "next" ? "review-order" : (this.cardEditorService.getCardType() !== "flyer" ? "back-builder" : "front-builder");
        if (type == "next") {
          toCheckout = true;
          this.dialogService.addDialog(ACDialogComponent, {
            dlgType: "review-order",
            dlgData: {}
          }).subscribe(result => {
            if (result) {
              this.cardEditorService.setCardPropertiesMaskList(this.cardEditorService.getMaskList());
              this.userInfoService.addProduct(this.cardEditorService.getCardProperties());
              this.globalService.redirectTo('/checkout');
            }
          });
        }
        break;

      default:
        break;
    }

    if (this.getPBRightStep() != "review-order" && this.getPBRightStep() != newStatus || this.cardEditorService.getCardType() === "flyer")
      this.cardEditor.saveCardCanvasData(newStatus == "front-builder" ? "front" : "back");

    if (newStatus == "review-order" && !toCheckout) {
      if (this.cardEditorService.getCardType() !== "post")
        this.cardEditorService.setDefault4OverOptions();
      else
        this.cardEditorService.setPCBasePrices();

      this.reviewOrder.setCanvasImg("front");

      if (this.cardEditorService.getCardType() != "flyer")
        this.reviewOrder.setCanvasImg("back");
    }
    this.setPBRightStep(newStatus);
  }

  // add text element to card editor
  addTextElement(fontFamily) {
    this.cardEditor.addTextElementToCardEditor(fontFamily);
  }

  // add image element form resources to card editor
  addImageElement(imgURL) {
    this.cardEditor.addImageElementToCardEditor(imgURL);
  }
}