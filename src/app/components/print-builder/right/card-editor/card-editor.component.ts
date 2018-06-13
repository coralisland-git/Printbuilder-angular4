import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { CardEditorService, HttpService, UserInfoService, GlobalService } from '../../../../services';
import { fabric } from 'fabric';
import { LoadingIconComponent } from '../../../loading-icon/loading-icon.component';
import { EditBarComponent } from '../edit-bar/edit-bar.component';

var WebFont = require('webfontloader');
declare var $;
declare var rewrite_pHYs_chunk;

@Component({
  selector: 'pb-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.css']
})
export class CardEditorComponent implements OnInit {
  public cardCanvas: any;        // canvas tag
  public cardSKU: string;        // card sku
  public cardType: string;       // card Type
  public cardSizeLabel: string;  // card size label
  public cardLayout: string;     // card layout
  public cardSize: any = {       // card size
    width: null,
    height: null,
    dpi: null
  };
  public isLoaded: any = {
    images: true,
    texts: true
  };     // all elements are loaded?

  public zoomLimit = 10;   // limitation for zoom
  public zoomCount = 0;    // zoom count

  public fontFamily: string; // font family name of selected text element
  public fontSize: any;      // font Size
  public fontColor: any;     // font color of selected text element
  public selectedCameraObj: any;  // selected camera object

  public templateColor: string; // template option ex: Gray, Red

  @ViewChild(LoadingIconComponent) loadingIcon: LoadingIconComponent;
  @ViewChild(EditBarComponent) editBar: EditBarComponent;
  @Output() cardEditorUpdated = new EventEmitter();

  constructor(
    private cardEditorService: CardEditorService,
    private httpService: HttpService,
    private userInfoService: UserInfoService,
    private globalService: GlobalService
  ) {
    this.initialize();
  }

  ngOnInit() {
    this.createCardEditorElement();

    if (this.cardEditorService.getExistingCard()) {
      let canvasData = this.cardEditorService.getStoredCanvasData(this.cardEditorService.getPBRightStep() === "front-builder" ? "front" : "back");

      if (canvasData) {
        this.populateEditorFromJSON(JSON.parse(canvasData));
      }
    }
  }

  // initialize variables
  initialize() {
    this.cardType = this.cardEditorService.getCardType();

    if (this.cardType == "business")
      this.zoomLimit = 5;

    this.cardSizeLabel = this.cardEditorService.getCardSizeLabel();
    this.cardLayout = this.cardEditorService.getCardLayout();

    let [width, height] = this.cardEditorService.getCardSizes(this.cardType, this.cardSizeLabel);  // unit is inches
    this.cardSize = {
      width: (width + (this.cardType == "post" ? 0.25 : 0.125)) * 400,
      height: (height + (this.cardType == "post" ? 0.25 : 0.125)) * 400,
      dpi: 400
    };
  }

  // get scale * width or height
  getScaledInfo(key) {
    let scale = 96 / this.cardSize.dpi;

    if (this.cardType == "business")
      scale *= 2;

    if (key == "scale")
      return scale;

    let width = this.cardSize.width * scale;
    if (key == "width")
      return width;

    let height = this.cardSize.height * scale;
    if (key == "height")
      return height;

    return {
      width: width,
      height: height
    };
  }

  // init card canvas size
  initCardCanvasSize() {
    this.cardCanvas.setZoom(this.getScaledInfo("scale"));
    this.cardCanvas.setWidth(this.getScaledInfo("width"));
    this.cardCanvas.setHeight(this.getScaledInfo("height"));
  }

  // update Card Canvas Size
  updateCardCanvasSize(zoomType) {
    let scale: any = this.getScaledInfo("scale");

    switch (zoomType) {
      case "zoom_in":
        this.zoomCount++;
        scale += (this.cardType == "post" ? 0.015 : 0.1) * this.zoomCount;
        break;

      case "zoom_out":
        this.zoomCount--;
        scale += (this.cardType == "post" ? 0.015 : 0.1) * this.zoomCount;
        break;

      case "reset":
      default:
        this.zoomCount = 0;
        this.initCardCanvasSize();
        return;
    }

    this.cardCanvas.setZoom(scale);
    this.cardCanvas.setWidth(this.cardSize.width * scale);
    this.cardCanvas.setHeight(this.cardSize.height * scale);
  }

  // create card editor element
  createCardEditorElement() {
    this.cardCanvas = new fabric.Canvas("canvas", {
      hoverCursor: "pointer",
      selection: true,
      selectionBorderColor: "blue"
    });

    this.initCardCanvasSize();

    let that = this;
    that.cardCanvas.on("object:selected", (e) => {
      if (!('getObjects' in e.target))
        that.editBar.setSelectedObj(e.target);

      that.changeImagewithCamera(e.target);
    }).on("selection:cleared", (e) => {
      that.editBar.setSelectedObj(e.target);
    }).on("object:added", () => {
      that.submitUpdatedCardEditor();
    }).on("object:removed", () => {
      that.submitUpdatedCardEditor();
    }).on("object:modified", (e) => {
      that.submitUpdatedCardEditor();
    });

    this.cardCanvas.renderAll();
  }

  changeCardLayout() {
    this.cardSize = {
      width: this.cardSize.height,
      height: this.cardSize.width,
      dpi: this.cardSize.dpi
    }

    this.initCardCanvasSize();
  }

  // if all elements are loaded
  isElementsLoaded() {
    return this.isLoaded.images && this.isLoaded.texts;
  }

  // populate canvas with template
  populateEditor(tplInfo) {
    this.isLoaded = {
      images: false,
      texts: false
    }
    this.loadingIcon.setLoadingIconType("cloud");

    this.templateColor = (tplInfo["color"] ? "/" + tplInfo["color"] : "");

    if (this.cardLayout != tplInfo.layout) {
      this.cardLayout = this.cardEditorService.getCardLayout();
      this.changeCardLayout();
    }

    this.httpService.getCardElements({
      sku: tplInfo.sku + this.templateColor,
      file_name: [this.cardSizeLabel, this.cardLayout, tplInfo.side].join("-")
    }).subscribe(res => {
      let data = res.json();
      let tplElements = data.elements ? data.elements : [];

      let bgElement = tplElements.filter(ele => ele.name == "background")[0];
      if (bgElement) {
        this.setCardCanvasBgImage(bgElement).then(completed => {
          let imgElements = tplElements.filter(ele => ele.type == "image" && ele.name != "background");
          let txtElements = tplElements.filter(ele => ele.type == "text");

          if (imgElements.length) {
            this.addImageElementListToCanvas(imgElements).then(completed => {
              this.isLoaded.images = true;
              this.addTextElementListToCanvas(txtElements);
            });
          } else {
            this.isLoaded.images = true;
            this.addTextElementListToCanvas(txtElements);
          }
        });
      } else {
        this.globalService.printLogData("No Background Element");
      }
    });
  }

  // populate canvas editor from json file. // populate for masks
  populateEditorFromJSON(canvasData) {
    this.cardCanvas.loadFromJSON(canvasData, this.cardCanvas.renderAll.bind(this.cardCanvas), (jsonObj, fabricObj) => {
      if (fabricObj.type == 'image' && fabricObj.clipName) {
        for (let mask of this.cardEditorService.getMaskList()) {
          if (mask.clipFor == fabricObj.clipName) {
            fabricObj.clipTo = ctx => this.addMaskToImageElement(fabricObj, ctx);
            this.cardCanvas.add(mask);
          }
        }
      }
    });
  }

  // set card canvas background image
  setCardCanvasBgImage(ele) {
    this.cardCanvas.clear();
    return new Promise(resolve => {
      let bgImgURL = this.cardEditorService.convertToAWSImgURL(this.cardEditorService.getCardSKU() + this.templateColor, ele.src);

      this.cardEditorService.getSyncedImageURL(bgImgURL).then(imgURL => {
        let options = {
          backgroundImageOpacity: 1,
          backgroundImageStrech: false,
          left: 0 * 400 / 300,
          top: 0 * 400 / 300,
          originX: "left",
          originY: "top",
          width: ele.width * 400 / 300,
          height: ele.height * 400 / 300,
          crossOrigin: "anonymous"
        };

        this.cardCanvas.setBackgroundImage(
          imgURL,
          this.cardCanvas.renderAll.bind(this.cardCanvas),
          options
        );

        resolve(true);
      });
    });
  }

  // add Images Element list to Canvas
  addImageElementListToCanvas(imgElements) {
    return new Promise(resolve => {
      let count = 0;

      imgElements.forEach((element, index) => {
        new Promise(resolve => {
          let imgURL = this.cardEditorService.convertToAWSImgURL(this.cardEditorService.getCardSKU() + this.templateColor, element.src);

          this.cardEditorService.getSyncedImageURL(imgURL).then(url => {
            fabric.Image.fromURL(url, (obj) => {
              let options = {
                left: element.x * 400 / 300,
                top: element.y * 400 / 300,
                width: element.width * 400 / 300,
                height: element.height * 400 / 300,
                quality: 1,
                id: (new Date().getTime()).toString(36),
                name: element.name
              };

              if (this.isCameraElement(element)) {
                this.addMaskToList(element);

                options['cameraIcon'] = true;
                options['clipName'] = options['maskID'] = this.generateMaskID(element);
                options['cameraType'] = element.name == "userimg_camera" ? "userImage" : "normal";
                options['clipTo'] = ctx => this.addMaskToImageElement(obj, ctx);
                options['lockMovementX'] = true;
                options['lockMovementY'] = true;
              }

              obj.set(options);
              if (element.name == "userimg_camera") {
                // set current obj as placholder : opacity - 0, selectable - false
                let newID = (new Date().getTime()).toString(36);

                fabric.Image.fromURL(this.userInfoService.getProfileImage(), userObj => {
                  let ratio = userObj.getWidth() / userObj.getHeight();

                  userObj.set({
                    left: obj.getLeft(),
                    top: obj.getTop(),
                    angle: 0,
                    width: obj.getWidth(),
                    height: obj.getWidth() / ratio,
                    id: newID,
                    clipName: obj.maskID,
                    name: "User Image"
                  });

                  userObj.clipTo = ctx => this.addMaskToImageElement(userObj, ctx);

                  obj.set('opacity', 0);
                  obj.set('selectable', false);

                  this.cardEditorService.addImageUploadedviaCamera({
                    cameraIconID: obj.id,
                    imageID: newID
                  });

                  this.cardCanvas.add(userObj);
                }, { crossOrigin: 'anonymous' });
              }

              this.cardCanvas.add(obj);

              resolve(true);
            }, { crossOrigin: 'anonymous' });
          });
        }).then(completed => {
          count++;

          if (count == imgElements.length)
            resolve(true);
        });
      });
    });
  }

  // check element is camere icon or not
  isCameraElement(element) {
    return element.name.indexOf("camera") !== -1;
  }

  // add Mask to the Mask List
  addMaskToList(element) {
    let mask = new fabric.Rect({
      originX: 'left',
      originY: 'top',
      left: element.x * 400 / 300,
      top: element.y * 400 / 300,
      width: element.width * 400 / 300,
      height: element.height * 400 / 300,
      fill: '#333333', /* use transparent for no fill */
      strokeWidth: 0,
      selectable: false,
      clipFor: this.generateMaskID(element)
    });

    this.cardCanvas.add(mask);
    this.cardEditorService.addMasktoList(mask);
  }

  // generate mask id
  generateMaskID(element) {
    return [
      "mask",
      element.x,
      element.y,
      element.width * 400 / 300,
      element.height * 400 / 300
    ].join('_');
  }

  // add Mask to Image Element
  addMaskToImageElement(img, ctx) {
    img.setCoords();
    var scaleXTo1 = (1 / img.scaleX) / this.cardCanvas.getZoom();
    var scaleYTo1 = (1 / img.scaleY) / this.cardCanvas.getZoom();
    ctx.save();

    var ctxLeft = -(img.width / 2);
    var ctxTop = -(img.height / 2);

    let mask;
    for (let curMask of this.cardEditorService.getMaskList()) {
      if (curMask.clipFor == img.clipName) {
        mask = curMask;
        break;
      }
    }

    ctx.translate(ctxLeft, ctxTop);
    ctx.scale(scaleXTo1, scaleYTo1);
    ctx.rotate((img.angle * -1) * (Math.PI / 180));
    ctx.beginPath();
    ctx.rect(
      (mask.left - img.oCoords.tl.x) + mask.left * (this.cardCanvas.getZoom() - 1),
      (mask.top - img.oCoords.tl.y) + mask.top * (this.cardCanvas.getZoom() - 1),
      mask.getWidth() * this.cardCanvas.getZoom(),
      mask.getHeight() * this.cardCanvas.getZoom()
    );
    ctx.closePath();
    ctx.restore();
  }

  // add text elements list
  addTextElementListToCanvas(txtElements) {
    if (txtElements.length == 0) {
      this.isLoaded.texts = true;
      this.drawSafetyLine();
      return;
    }

    let isResolved = false;

    new Promise(resolve => {
      let fontList = [];

      for (let element of txtElements) {
        if (fontList.indexOf(element.font) === -1)
          fontList.push(element.font);
      }

      let intervalCount = 0;
      let interval = setInterval(() => {
        if (fontList.length == 0) {
          clearInterval(interval);
          if (!isResolved) {
            isResolved = true;
            resolve(true);
          }
        }

        WebFont.load({
          custom: { families: fontList },
          loading: () => { },
          active: () => {
            if (fontList.length == 0) {
              clearInterval(interval);
              if (!isResolved) {
                isResolved = true;
                resolve(true);
              }
            }
          },
          inactive: () => { },
          fontloading: (familyName, fvd) => { },
          fontactive: (familyName, fvd) => {
            if (fontList.indexOf(familyName) !== -1) {
              fontList.forEach((item, idx, objArr) => {
                if (item == familyName)
                  objArr.splice(idx, 1);
              });
            }
          },
          fontinactive: (familyName, fvd) => { },
          timeout: 500
        });

        intervalCount++;
      })
    }).then(completed => {
      let count = 0;

      for (let element of txtElements) {
        let options = {
          left: element.x * 400 / 300,
          top: element.y * 400 / 300,
          width: element.width * 400 / 300,
          height: element.height * 400 / 300,
          fontSize: (element.size ? element.size : 40) * 400 / 300,
          fontFamily: element.font,
          angle: 0,
          fill: element.color.replace('0x', '#'),
          textAlign: element.justification ? element.justification : "left",
          hasRotatingPoint: true,
          quality: 1,
          id: (new Date().getTime()).toString(36),
          name: element.name
        };

        if ("rotation" in element) {
          [options["width"], options["height"]] = [options["height"], options["width"]];
          options["angle"] = element["rotation"];
        }

        let txtContent = this.getFilteredTextContent(element);
        let obj = new fabric.IText(txtContent, options);

        if (obj.getHeight() < element.height)
          obj = new fabric.Textbox(txtContent, options);

        this.cardCanvas.add(obj);

        count++;

        if (count == txtElements.length) {
          this.isLoaded.texts = true;
          this.drawSafetyLine();
        }
      }
    });
  }

  // get user information like full name, address, ...
  getFilteredTextContent(element) {
    let txtContent = element.text;

    switch (element.name) {
      case "name":
        txtContent = this.userInfoService.getFullName();
        break;

      case "brenumber":
        txtContent = this.userInfoService.getBreNumber();
        break;

      case "address":
        txtContent = this.userInfoService.getFullAddress();
        break;

      case "addr_multiline":
        txtContent = this.userInfoService.getFullAddress("multi");
        break;

      case "phone":
        txtContent = this.userInfoService.getPhoneNumber();
        break;

      case "h_phone":
        txtContent = this.userInfoService.getPhoneNumber("home_phone");
        break;

      case "c_phone":
        txtContent = this.userInfoService.getPhoneNumber("cell_phone");
        break;

      case "website":
        txtContent = this.userInfoService.getWebsiteURL();
        break;

      case "email":
        txtContent = this.userInfoService.getEmail();
        break;

      case "brokerlicense":
      case "brokerlicense_1":
        txtContent = ["BRE# ", this.userInfoService.getBrokerLicense()].join(" ")
        break;

      case "company_name":
      case "company_name_1":
        txtContent = [this.userInfoService.getCompanyName(), " | "].join(" ");
        break;
    }

    return txtContent;
  }

  // draw safety line
  drawSafetyLine() {
    let option = {
      fill: 'transparent',
      stroke: '#888888',
      strokeDashArray: [30, 20],
      selectable: false
    }

    let divideBy = this.cardEditorService.getCardType() == "post" ? 1 : 0.5;

    option['left'] = 0.125 * divideBy * 400; // 0.125 inch
    option['top'] = 0.125 * divideBy * 400; // 0.125 inch
    option['width'] = this.cardCanvas.getWidth() / this.cardCanvas.getZoom() - 0.25 * divideBy * 400;
    option['height'] = this.cardCanvas.getHeight() / this.cardCanvas.getZoom() - 0.25 * divideBy * 400;
    option['name'] = "Safety Line";

    let rect = new fabric.Rect(option);
    this.cardCanvas.add(rect);

  }

  // change image with camera icon when camera icon is clicked
  changeImagewithCamera(camObj) {
    if ('getObjects' in camObj) {
      let deselectObjArr = [];

      for (let obj of camObj.getObjects()) {
        if (obj && obj.get('cameraIcon') == true)
          deselectObjArr.push(obj);
      }

      deselectObjArr.forEach(obj => {
        camObj.removeWithUpdate(obj);
      })
    } else {
      if (camObj && camObj.type == 'i-text') {
        this.fontFamily = camObj.getFontFamily();
        this.fontSize = camObj.getFontSize();
        this.fontColor = camObj.getFill();
      } else if ('getElement' in camObj) {
        if (camObj.get('cameraIcon') == true) {
          this.selectedCameraObj = camObj;

          if (camObj.get('cameraType') == 'normal')
            this.cardCanvas.deactivateAll();

          $("#imageUploader").click();
        }
      }
    }
  }

  // event when file uploader is opened
  uploadImageViaCamera(e) {
    var file = e.target.files[0];
    var reader = new FileReader();

    reader.onload = (f) => {
      var target: any = f.target;
      var data: string = target.result;

      let newID = (new Date().getTime()).toString(36);

      fabric.Image.fromURL(data, img => {
        let ratio = img.getWidth() / img.getHeight();

        img.set({
          left: this.selectedCameraObj.getLeft() * 400 / 300,
          top: this.selectedCameraObj.getTop() * 400 / 300,
          width: this.selectedCameraObj.getWidth() * 400 / 300,
          height: this.selectedCameraObj.getWidth() / ratio * 400 / 300,
          angle: 0,
          id: newID,
          clipName: this.selectedCameraObj.maskID,
          name: file.name
        }, { crossOrigin: 'anonymous' });

        img.clipTo = ctx => this.addMaskToImageElement(img, ctx);

        this.selectedCameraObj.set('opacity', 0);
        this.selectedCameraObj.set('selectable', false);

        this.cardEditorService.addImageUploadedviaCamera({
          cameraIconID: this.selectedCameraObj.id,
          imageID: newID
        });

        this.cardCanvas.add(img);
      });
    };

    this.cardCanvas.deactivateAll();
    reader.readAsDataURL(file);

    e.target.value = "";
  }

  // submit updated card editor
  submitUpdatedCardEditor() {
    this.cardEditorUpdated.emit(this.cardCanvas.getObjects());
  }

  // update cad Canvas with objects
  updateCardCanvasObjects(type = "") {
    switch (type) {
      case "bringForward":
        this.cardCanvas.bringForward(this.cardCanvas.getActiveObject());
        break;

      case "sendBackwards":
        this.cardCanvas.sendBackwards(this.cardCanvas.getActiveObject());
        break;

      case "undo":
      case "redo":
        break;

      case "removeObject":
        let activeObject = this.cardCanvas.getActiveObject();
        this.setVisibleCameraIcon(activeObject);
        this.cardCanvas.remove(activeObject);
        this.cardCanvas.trigger("selection:cleared");
        break;
    }

    this.cardCanvas.renderAll();
  }

  // save current card canvas data.
  saveCardCanvasData(newSide = null) {
    let currentCardSide = "";
    if (this.cardEditorService.getPBRightStep() == "front-builder")
      currentCardSide = "front";
    else if (this.cardEditorService.getPBRightStep() == "back-builder")
      currentCardSide = "back";

    this.cardCanvas.forEachObject((obj, idx, obj_arr) => {
      if (obj && obj.type == 'rect') {
        if (!obj.clipFor || obj.clipFor == "mask____")
          obj_arr.splice(idx, 1);
      }
    });

    let data = JSON.stringify(this.cardCanvas.toJSON(["id", "selectable", "name", "cameraIcon", "cameraType", "clipName", "maskID", "clipTo", "clipFor", "lockMovementX", "lockMovementY"]));
    this.cardEditorService.saveCanvasData(data, currentCardSide);

    if (!newSide)
      return;

    currentCardSide = newSide;

    this.cardCanvas.clear();

    let canvasData = this.cardEditorService.getStoredCanvasData(currentCardSide);
    if (canvasData)
      this.populateEditorFromJSON(canvasData);
  }

  // add text element to card editor
  addTextElementToCardEditor(fontFamily) {
    let options = {
      left: fabric.util.getRandomInt(0, this.cardCanvas.width),
      top: fabric.util.getRandomInt(0, this.cardCanvas.height),
      fontSize: 100,
      fontFamily: fontFamily,
      angle: 0,
      fill: "#000000",
      textAlign: "left",
      hasRotatingPoint: true,
      quality: 1,
      id: (new Date().getTime()).toString(36),
      name: fontFamily
    };
    let obj = new fabric.IText(fontFamily, options);
    this.cardCanvas.add(obj);
  }

  // add Iamge Element To Card from Resources
  addImageElementToCardEditor(imgURL) {
    this.loadingIcon.setLoadingIconType("cloud");
    this.isLoaded.images = false;

    this.cardEditorService.getSyncedImageURL(imgURL).then(url => {
      fabric.Image.fromURL(url, (obj) => {
        let ratio = obj.getWidth() / obj.getHeight();

        let options = {
          left: fabric.util.getRandomInt(0, this.cardCanvas.width),
          top: fabric.util.getRandomInt(0, this.cardCanvas.height),
          width: 1000,
          height: 1000 / ratio,
          quality: 1,
          id: (new Date().getTime()).toString(36),
          name: "Image"
        };

        obj.set(options);

        this.cardCanvas.add(obj);
        this.isLoaded.images = true;
      }, { crossOrigin: 'anonymous' });
    });
  }

  // camera Icon can't be removed.
  setVisibleCameraIcon(img_obj) {
    if (img_obj.get('cameraIcon')) {
      alert('Can\'t remove this object');
      return false;
    }

    this.cardEditorService.getImagesUploadedviaCamera().forEach((obj, idx, objs) => {
      if (img_obj.get('id') == obj.imageID) {
        this.cardCanvas.forEachObject(camObj => {
          if (camObj.get('cameraIcon') == true && camObj.get('id') == obj.cameraIconID) {
            camObj.set('opacity', 1);
            camObj.set('selectable', true);
          }
        });

        objs.splice(idx, 1);
      }
    });
  }

  handleCodePoints(array) {
    let CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
    let index = 0;
    let length = array.length;
    let result = '';
    let slice;
    while (index < length) {
      slice = array.slice(index, Math.min(index + CHUNK_SIZE, length));
      result += String.fromCharCode.apply(null, slice);
      index += CHUNK_SIZE;
    }
    return result;
  }

  // get canvas as image url
  exportCanvasToImgURL(size = "") {
    let options = {
      format: "png",
      multiplier: 400 / 96 * (this.cardType == "business" ? 0.5 : 1)
    };

    let imgURL = this.cardCanvas.toDataURL(options);

    let pngHeader = 'data:image/png;base64,';
    let data = imgURL.replace(pngHeader, '');

    let binary_string = window.atob(data);
    let len = binary_string.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    // dots per inch
    let dpi = 400;
    // pixels per metre
    let ppm = Math.round(dpi / 2.54 * 100);
    bytes = rewrite_pHYs_chunk(bytes, ppm, ppm);

    // re-encode PNG (btoa method)
    imgURL = pngHeader + btoa(this.handleCodePoints(bytes));

    return imgURL;
  }
}