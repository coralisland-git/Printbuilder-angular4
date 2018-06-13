import { Injectable } from '@angular/core';
import { GlobalService } from './global.service';
import { UserInfoService } from './user-info.service';
import { HttpService } from './http.service';

@Injectable()
export class CardEditorService {
  private cardProperties: any; // cardProperties
  private cameraMaskList: any = []; // camera mask list
  private imagesFromCamera: any = []; // images uploaded via camera
  private orgCropImageData: any = {}; // original image to crop
  private pbLeftStep: string = "templates-panel";
  private pbRightStep: string = "front-builder";
  private isExistingCard: boolean = false;
  private isCardBuilding: boolean = false;

  private canvasData: any = {};

  constructor(
    private globalService: GlobalService,
    private userInfoService: UserInfoService,
    private httpService: HttpService
  ) {
    this.orgCropImageData = { id: "", data: "" };
    this.initCanvasData();

    if (this.globalService.isLocalHost()) {
      this.setCardType("post");
      this.setCardLayout("horizontal");
      this.setCardSizeLabel("regular");
    }
  }

  // init canvas data
  initCanvasData() {
    this.canvasData["front"] = this.canvasData["back"] = [];
  }

  // initialize card properties
  initializeCardProperties(cardType = "") {
    this.cardProperties = {
      "type": cardType,
      "sizeLabel": "jumbo",
      "sku": "",
      "layout": "horizontal",
      "frontImgURL": "",
      "backImgURL": "",
      "states": {
        "front": [],
        "back": []
      },
      "cameraMaskList": [],
      "productLabel": "",
      "options": {
        "paper": "",
        "weight": "",
        "corner": "",
        "finish": "",
        "product_uuid": "",
        "colorspec_uuid": "13abbda7-1d64-4f25-8bb2-c179b224825d",
        "turnaround_time": "",
        "turnaround_time_uuid": "",
        "turnaround_times": [],
        "all_turnaround_times": [],
        "runsize": -1,
        "runsize_uuid": "",
        "runsizes": [],
        "base_price": 0,
        "base_prices": [],
        "loadedShippingInfo": 0, // 0 : normal status, -1 : loading - called api & waiting, 1: loaded
        "shipping_option": {},
        "shipping_options": [],
      },
    };

    switch (this.getCardType()) {
      case 'post':
        Object.assign(this.cardProperties.options, {
          paper: 'original',
          weight: '16pt',
          corner: 'standard',
          finish: 'Gloss',
          turnaround_times: ["First Class", "Standard Class"],
          turnaround_time: "First Class"
        });
        break;

      case 'business':
        Object.assign(this.cardProperties.options, {
          paper: 'original',
          weight: '14pt',
          corner: 'standard',
          finish: 'Uncoated',
        });
        break;

      case 'flyer':
        Object.assign(this.cardProperties.options, {
          paper: 'original',
          weight: '100lb Glass Cover',
          corner: 'standard',
          finish: 'No AQ',
        });
        break;
    }
  }

  // set default 4 over options
  setDefault4OverOptions() {
    this.httpService.get4OverProductInfo({
      "type": this.cardProperties["type"],
      "sizeLabel": this.cardProperties["sizeLabel"],
      "weight": this.cardProperties["options"]["weight"],
      "corner": this.cardProperties["options"]["corner"],
      "finish": this.cardProperties["options"]["finish"]
    }).subscribe(res => {
      // point to populate card product
      let result = res.json();
      let product_uuid = result["product_uuid"];
      let runsizes = result["runsizes"];
      let all_turnaround_times = result["all_turnaround_times"];
      let base_prices = result["base_prices"];

      if (product_uuid)
        this.setCardProductUUID(null, product_uuid);

      if (runsizes)
        this.setCardRunsizes(null, runsizes);

      if (all_turnaround_times)
        this.setCardAllTurnAroundTimes(null, all_turnaround_times);

      if (base_prices)
        this.setBasePrices(null, base_prices);
    }, err => {
      this.globalService.printLogData(err);
    });
  }

  // get card sizes from card type unit is inches
  getCardSizes(cardType, sizeLabel = null) {
    let sizes = [];

    switch (cardType) {
      case "post":
        sizes = [{
          "label": "regular",
          "width": 7,
          "height": 5
        }, {
          "label": "large",
          "width": 9,
          "height": 6
        }, {
          "label": "jumbo",
          "width": 11,
          "height": 6
        }]
        break;

      case "flyer":
        sizes = [{
          "label": "large",
          "width": 8.5,
          "height": 5.5
        }, {
          "label": "jumbo",
          "width": 11,
          "height": 8.5
        }]
        break;

      case "business":
        sizes = [{
          "label": "jumbo",
          "width": 3.5,
          "height": 2
        }]
        break;

      default:
        sizes = [];
        break;
    }

    if (sizeLabel) {
      sizes = sizes.filter(size => size.label == sizeLabel);

      if (sizes.length)
        return [
          sizes[0].width,
          sizes[0].height
        ];
    }

    return sizes;
  }

  // set card property
  setCardProperties(cardProperties) {
    this.cardProperties = cardProperties;
  }

  // get card property
  getCardProperties() {
    return this.cardProperties;
  }

  // set card type
  setCardType(p_cardType) {
    this.initializeCardProperties(p_cardType);

    this.cardProperties.productLabel = p_cardType.charAt(0).toUpperCase() + p_cardType.slice(1) + " Card";
    this.cardProperties.type = p_cardType.toLowerCase();
  }
  // get card type
  getCardType() {
    return this.cardProperties ? this.cardProperties["type"] : "";
  }

  // set card size label
  setCardSizeLabel(sizeLabel) {
    this.cardProperties.sizeLabel = sizeLabel;
  }
  // get card size label
  getCardSizeLabel() {
    return this.cardProperties ? this.cardProperties.sizeLabel : "";
  }

  // set card layout
  setCardLayout(layout) {
    this.cardProperties.layout = layout;
  }
  // get card layout
  getCardLayout() {
    return this.cardProperties ? this.cardProperties.layout : "";
  }

  // set card sku
  setCardSKU(sku) {
    this.cardProperties.sku = sku;
  }
  // get card sku
  getCardSKU() {
    return this.cardProperties.sku;
  }

  // convert "../skin/../../...png" to aws url
  convertToAWSImgURL(sku, imgURL) {
    return imgURL.replace("../skins", "https://s3-us-west-1.amazonaws.com/agent-cloud/print-builder/templates/" + sku);
  }

  // get Synced Image URL after it"s loaded
  getSyncedImageURL(imgURL) {
    return new Promise((resolve) => {
      let imgObj = new Image();
      imgObj.src = imgURL;
      imgObj.crossOrigin = "anonymous";

      imgObj.onload = () => {
        resolve(imgURL);
      }
    });
  }

  // add Mask to the list
  addMasktoList(mask) {
    let is_found = false;

    for (let mask_item of this.cameraMaskList) {
      if (mask_item.clipFor == mask.clipFor) {
        is_found = true;
        break;
      }

    }
    if (!is_found)
      this.cameraMaskList.push(mask);

    return this.cameraMaskList;
  }
  // get mask list
  getMaskList() {
    return this.cameraMaskList;
  }
  // set Mask List to properties
  setCardPropertiesMaskList(list) {
    this.cardProperties["cameraMaskList"] = list;
  }
  // populate mask list
  populateMaskList() {
    this.cameraMaskList = this.cardProperties["cameraMaskList"];
  }

  // add image uploaded via camera to the list
  addImageUploadedviaCamera(obj) {
    this.imagesFromCamera.push(obj);
    return this.imagesFromCamera;
  }
  // get images uploaded via camera
  getImagesUploadedviaCamera() {
    return this.imagesFromCamera;
  }

  // set original image to crop
  setOrgCropImageData(objID, imgURL) {
    if (objID == this.orgCropImageData.id)
      return;

    this.orgCropImageData = { id: objID, data: imgURL };
  }
  // get original image to crop
  getOrgCropImageURL() {
    return this.orgCropImageData.data;
  }

  // push canvas data
  saveCanvasData(data, side) {
    if (side in this.cardProperties["states"]) {
      if (this.cardProperties["states"][side].indexOf(data) === -1)
        this.cardProperties["states"][side].push(data);
    }

    if (data)
      this.canvasData[side] = data;
  }

  // get latest state
  getStoredCanvasData(side) {
    return this.canvasData[side];
  }

  // get card options
  getCardOptions() {
    return this.cardProperties.options;
  }

  // set card options
  setCardOptions(options) {
    this.cardProperties.options = options;
  }

  // set card product uuid
  setCardProductUUID(product, product_uuid) {
    let cardProperties = product ? product : this.cardProperties;
    cardProperties["options"]["product_uuid"] = product_uuid;
  }

  // set run sizes
  setCardRunsizes(product, runsizes) {
    let cardProperties = product ? product : this.cardProperties;

    if (runsizes.length) {
      cardProperties["options"]["runsizes"] = runsizes;
      this.setCardRunsize(cardProperties);
    }

    return cardProperties["options"];
  }

  // set all turnaround times
  setCardAllTurnAroundTimes(product, all_turnaround_times) {
    let cardProperties = product ? product : this.cardProperties;

    if (all_turnaround_times.length) {
      cardProperties["options"]["all_turnaround_times"] = all_turnaround_times;
      this.setCardTurnAroundTimes(cardProperties);
    }

    return cardProperties["options"];
  }

  // set base prices
  setBasePrices(product, base_prices) {
    let cardProperties = product ? product : this.cardProperties;

    cardProperties["options"]["base_prices"] = base_prices;

    this.setBasePrice(cardProperties);
    return cardProperties["options"];
  }

  // set pc base prices
  setPCBasePrices(product = null, base_prices = null) {
    let cardProperties = product ? product : this.cardProperties;

    if (base_prices === null) {
      return new Promise(resolve => {
        this.httpService.getPCBasePrices({
          "type": this.cardProperties["type"],
          "sizeLabel": this.cardProperties["sizeLabel"],
          "weight": this.cardProperties["options"]["weight"],
          "corner": this.cardProperties["options"]["corner"],
          "finish": this.cardProperties["options"]["finish"]
        }).subscribe(res => {
          let result = res.json().filter(query => query["class"] === cardProperties["options"]["turnaround_time"]);
          if (result) {
            cardProperties["options"]["runsizes"] = Object.keys(result[0]["basePrices"]);
            for (let runsize of cardProperties["options"]["runsizes"])
              cardProperties["options"]["base_prices"].push(result[0]["basePrices"][runsize]);
          }

          resolve(cardProperties["options"]);
        }, err => {
          this.globalService.printLogData(err);
        })
      })
    } else {
      cardProperties["options"]["base_prices"] = base_prices;
      return cardProperties["options"];
    }
  }

  // set card runsize
  setCardRunsize(product, runsize_uuid = "init") {
    let cardProperties = product ? product : this.cardProperties;
    let runsizes = cardProperties["options"]["runsizes"];

    if (runsize_uuid !== "init")
      runsizes = runsizes.filter(runsize => runsize["option_uuid"] == runsize_uuid);

    cardProperties["options"]["runsize"] = runsizes[0]["option_description"];
    cardProperties["options"]["runsize_uuid"] = runsizes[0]["option_uuid"];

    this.setCardTurnAroundTimes(cardProperties);

    return cardProperties["options"];
  }

  // set turn around times
  setCardTurnAroundTimes(product) {
    let cardProperties = product ? product : this.cardProperties;
    let turnaround_times = cardProperties["options"]["all_turnaround_times"].filter(turnaround_time => {
      return turnaround_time["runsize_uuid"] == cardProperties["options"]["runsize_uuid"]
    });

    cardProperties["options"]["turnaround_times"] = this.reOrderedTurnAroundTimes(turnaround_times);
    this.setTurnAroundTime(cardProperties);

    return cardProperties["options"];
  }

  // reordered turnaround times
  reOrderedTurnAroundTimes(turnaround_times) {
    let reOrdered_turnaround_times = [];

    for (let turnaround_time of turnaround_times) {
      if (turnaround_time["option_uuid"] === "9f85d0c4-d344-4088-a719-86f8f84d504d")
        reOrdered_turnaround_times.unshift(turnaround_time);
      else
        reOrdered_turnaround_times.push(turnaround_time);
    }

    return reOrdered_turnaround_times;
  }

  // set turn around time
  setTurnAroundTime(product, turnaround_time_uuid = "init") {
    let cardProperties = product ? product : this.cardProperties;
    let turnaround_times = cardProperties["options"]["turnaround_times"];

    if (!turnaround_times.length)
      return;

    if (turnaround_time_uuid !== "init")
      turnaround_times = turnaround_times.filter(turnaround_time => turnaround_time["option_uuid"] == turnaround_time_uuid);

    cardProperties["options"]["turnaround_time"] = turnaround_times[0]["option_description"];
    cardProperties["options"]["turnaround_time_uuid"] = turnaround_times[0]["option_uuid"];

    this.setBasePrice(cardProperties);

    return cardProperties["options"];
  }

  // set regulat price
  setBasePrice(product, price = "init") {
    let cardProperties = product ? product : this.cardProperties;
    let base_prices = cardProperties["options"]["base_prices"]

    if (!base_prices.length)
      return;

    if (price === "init")
      price = base_prices.filter(base_price => base_price["runsize_uuid"] === cardProperties["options"]["runsize_uuid"])[0]["product_baseprice"];

    cardProperties["options"]["base_price"] = Number(price);
    cardProperties["options"]["shipping_option"] = {};
    cardProperties["options"]["shipping_options"] = [];
    cardProperties["options"]["loadedShippingInfo"] = 0;

    this.setShippingService(cardProperties);

    return cardProperties["options"];
  }

  // set shipping price
  setShippingService(product, shipping_service = "init") {
    let cardProperties = product ? product : this.cardProperties;

    if (shipping_service !== "init") {
      cardProperties["options"]["shipping_option"] = shipping_service;
      return cardProperties["options"];
    }

    let shipping_address = this.userInfoService.getShippingInfo();

    if (
      cardProperties["options"]["product_uuid"] === "" ||
      cardProperties["options"]["runsize_uuid"] === "" ||
      cardProperties["options"]["turnaround_time_uuid"] === "" ||
      cardProperties["options"]["colorspec_uuid"] === ""
    )
      return;

    cardProperties["options"]["loadedShippingInfo"] = -1;

    if (
      cardProperties["options"]["product_uuid"] === "" ||
      cardProperties["options"]["runsize_uuid"] === "" ||
      cardProperties["options"]["turnaround_time_uuid"] === "" ||
      cardProperties["options"]["colorspec_uuid"] === ""
    )
      return cardProperties["options"];

    let product_info = {
      "product_uuid": cardProperties["options"]["product_uuid"],
      "runsize_uuid": cardProperties["options"]["runsize_uuid"],
      "turnaround_uuid": cardProperties["options"]["turnaround_time_uuid"],
      "colorspec_uuid": cardProperties["options"]["colorspec_uuid"],
      "option_uuids": []
    }

    return new Promise(resolve => {
      this.httpService.getShippingQuote({
        "product_info": product_info,
        "shipping_address": shipping_address
      }).subscribe(res => {
        let result = res.json();
        if (result["shipping_options"]) {
          cardProperties["options"]["shipping_options"] = result["shipping_options"];
          cardProperties["options"]["shipping_option"] = cardProperties["options"]["shipping_options"][0];
          cardProperties["options"]["loadedShippingInfo"] = 1;

          this.userInfoService.updateProduct(cardProperties);
          resolve(cardProperties["options"]);
        }
      }, err => {
        this.globalService.printLogData(err);

        let err_msg = err.json();
        if (err.status == 409 && err_msg["message"] != "Unable to validate address.") {
          setTimeout(() => {
            this.setShippingService(cardProperties).then(options => {
              resolve(options);
            });
          });
        } else
          resolve(cardProperties["options"]);
      });
    });
  }

  // get price
  getBasePrice(product) {
    let cardProperties = product ? product : this.cardProperties;
    return Number(cardProperties["options"]["base_price"]);
  }

  // get shipping price
  getShippingPrice(product) {
    let cardProperties = product ? product : this.cardProperties;
    let price = cardProperties["options"]["shipping_option"]["service_price"];
    return Number(price ? price : 0);
  }

  // get product price price
  getProductPrice(product) {
    let cardProperties = product ? product : this.cardProperties;
    let base_price = this.getBasePrice(cardProperties);
    let shipping_price = this.getShippingPrice(cardProperties);
    return base_price + shipping_price;
  }

  // set back ground image url
  setCardImageURL(side, imgURL) {
    this.cardProperties[side == "front" ? "frontImgURL" : "backImgURL"] = imgURL;
  }

  // get back ground image url
  getCardImageURL(side) {
    return side == "front" ? this.cardProperties.frontImgURL : this.cardProperties.backImgURL;
  }

  // get product label
  getProductLabel() {
    return this.cardProperties["productLabel"];
  }
  // set product label
  setProductLabel(label) {
    this.cardProperties["productLabel"] = label;
  }

  // set canvas step
  setPBRightStep(step) {
    this.pbRightStep = step;
  }
  // get canvas step
  getPBRightStep() {
    return this.pbRightStep;
  }

  // set PB Left Step
  setPBLeftStep(step) {
    this.pbLeftStep = step;
  }
  // get pb left step
  getPBLeftStep() {
    return this.pbLeftStep;
  }

  // set existing card flag
  setExistingCard(value = true) {
    this.isExistingCard = value;
  }
  // get existing card flag
  getExistingCard() {
    return this.isExistingCard;
  }

  // get last state
  getLastState(side) {
    return this.cardProperties["states"][side].slice(-1).pop();
  }

  // set card building status
  setCardBuildingStatus(value) {
    this.isCardBuilding = value;
  }
  // get card building status
  getCardBuildingStatus() {
    return this.isCardBuilding;
  }

  // is 4 over product
  is4OverProduct(product = null) {
    let cardProduct = product ? product : this.cardProperties;
    return cardProduct["type"] !== "post";
  }
}
