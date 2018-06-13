import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ColorPickerService } from 'ngx-color-picker'
import { GlobalService, CardEditorService } from '../../../../services';
import { DialogService } from 'ng2-bootstrap-modal';
import { ImageCropperDialogComponent } from '../../../image-cropper-dialog/image-cropper-dialog.component';

declare var $;

@Component({
  selector: 'pb-edit-bar',
  templateUrl: './edit-bar.component.html',
  styleUrls: ['./edit-bar.component.css']
})
export class EditBarComponent implements OnInit {
  selectedObj: any = null; // selected obj
  openedTooltip: string = ""; // tool tip when button is clicked
  textUppercase: boolean = false; // text uppercase
  fill: string = "";

  fontItemList: any = [];

  @Output() elementUpdated = new EventEmitter();

  constructor(
    private dialogService: DialogService,
    private cpService: ColorPickerService,
    private globalService: GlobalService,
    private cardEditorService: CardEditorService
  ) { }

  ngOnInit() {
    this.fontItemList = this.globalService.getTopPopularFonts();
    $("#google-fonts").attr("href", this.globalService.getGoogleFontFamiliesURL());
  }

  // type of selected Obj. it's text or image
  isType(type = "") {
    if (type == "text")
      return this.selectedObj.type.indexOf("text") !== -1;
    else if (type == "image")
      return this.selectedObj.type.indexOf("text") === -1;

    return true;
  }

  // assign obj to selected Obj
  setSelectedObj(obj) {
    this.selectedObj = null;
    if (!obj)
      return;

    this.selectedObj = obj;

    this.textUppercase = false;
    if (this.selectedObj.type.indexOf("text") !== -1)
      this.fill = this.selectedObj.get("fill") ? this.selectedObj.get("fill") : "#000000";
    else
      this.fill = this.selectedObj.get("backgroundColor") ? this.selectedObj.get("backgroundColor") : "#FFFFFF";
  }

  // call bootstrap 4 methos to set enable to show tooltip
  showTooltip(ele) {
    if (!$(ele).prop("tooltip")) {
      $(ele).tooltip("show");
      $(ele).prop("tooltip", true);
    }
  }
  // set open tool tip value for attribute
  setOpenTooltip(value) {
    this.openedTooltip = this.openedTooltip == value ? "" : value;
  }

  // font is loaded
  isFontLoaded(fontFamily) {
    for (let fontItem of this.fontItemList) {
      if (fontItem.family == fontFamily)
        return true;
    }

    return false;
  }
  // get font family
  getFontFamily() {
    let fontFamily = this.selectedObj.get("fontFamily");

    if (!this.isFontLoaded(fontFamily))
      this.fontItemList.push({ family: fontFamily });

    return fontFamily;
  }
  // set font family
  setFontFamily(fontFamily) {
    this.selectedObj.set("fontFamily", fontFamily);
    this.elementUpdated.emit();
  }

  // get the text content of text element
  getTextContent() {
    return this.selectedObj.get("text");
  }

  setTextContent(value) {
    if (!value) return;

    this.selectedObj.set("text", value);
    this.elementUpdated.emit();
  }

  // get font size of the text element
  getFontSize() {
    return this.selectedObj.get("fontSize");
  }

  // set font size of the text element
  setFontSize(value) {
    if (!value) return;

    this.selectedObj.set("fontSize", value);
    this.elementUpdated.emit();
  }

  // get letter spacing
  getLetterSpacing() {
    return this.selectedObj.get("charSpacing");
  }
  // set letter spacing
  setLetterSpacing(value) {
    this.selectedObj.set("charSpacing", value);
    this.elementUpdated.emit();
  }

  // get line height
  getLineHeight() {
    return this.selectedObj.get("lineHeight");
  }
  // set line height
  setLineHeight(value) {
    this.selectedObj.set("lineHeight", value);
    this.elementUpdated.emit();
  }

  // get text align style
  getTextAlign() {
    return this.selectedObj.get("textAlign");
  }
  // set text align
  setTextAlign(value) {
    this.selectedObj.set("textAlign", value);
    this.elementUpdated.emit();
    this.openedTooltip = "";
  }

  // conert texts
  convertCase() {
    if (this.textUppercase)
      this.selectedObj.set("text", this.selectedObj.get("text").toUpperCase());
    else
      this.selectedObj.set("text", this.selectedObj.get("text").toLowerCase());

    this.elementUpdated.emit();
  }

  // get Font Weight()
  isBold() {
    return this.selectedObj.get("fontWeight") == "bold";
  }
  // set font weight
  setBold() {
    this.selectedObj.set("fontWeight", this.isBold() ? "normal" : "bold");
    this.elementUpdated.emit();
  }

  // get italic style
  isItalicStyle() {
    return this.selectedObj.get("fontStyle") == "italic";
  }
  // set italic style
  setItalicStyle() {
    this.selectedObj.set("fontStyle", this.isItalicStyle() ? "normal" : "italic");
    this.elementUpdated.emit()
  }

  // get underline
  isUnderline() {
    return this.selectedObj.get("textDecoration") == "underline";
  }
  // set underline
  setUnderline() {
    this.selectedObj.set("textDecoration", this.isUnderline() ? "" : "underline");
    this.elementUpdated.emit();
  }

  // bring forward
  bringForward() {
    this.elementUpdated.emit("bringForward");
  }
  // send backwards
  sendBackwards() {
    this.elementUpdated.emit("sendBackwards");
  }

  // set fill color of the element
  setFill() {
    if (this.selectedObj.type.indexOf("text") !== -1)
      this.selectedObj.set("fill", this.fill);
    else
      this.selectedObj.set("backgroundColor", this.fill);
    this.elementUpdated.emit();
  }
  // fill color is hex color
  isHexColor() {
    return this.fill.indexOf("#") === 0;
  }
  // is rgb color
  isRGBColor() {
    return this.fill.indexOf("rgb(") === 0;
  }
  // get invert color
  getInvertColor() {
    let invertColor: any;
    if (this.isHexColor()) {
      invertColor = "#";

      for (let val of this.fill.replace("#", "").match(/.{1,2}/g))
        invertColor += parseInt(eval("0xFF - 0x" + val)).toString(16).toUpperCase();
    } else if (this.isRGBColor()) {
      invertColor = ["rgb("];
      for (let val of this.fill.replace("rgb(", "").replace(")", "").split(","))
        invertColor.push(255 - parseInt(val));

      invertColor.push(")");
      invertColor = invertColor.join(",");
    }

    return invertColor;
  }

  // get Angle
  getAngle() {
    return parseInt(this.selectedObj.get("angle"));
  }
  // set angle
  setAngle(angle) {
    this.selectedObj.setAngle(angle).setCoords();
    this.elementUpdated.emit();
  }

  // get skew
  getSkew(axes) {
    return axes == "x" ? this.selectedObj.get("skewX") : this.selectedObj.get("skewY");
  }
  // set skew
  setSkew(axes, value) {
    this.selectedObj.set(axes == "x" ? "skewX" : "skewY", value);
    this.elementUpdated.emit();
  }

  // get flip
  getFlip(axes) {
    return axes == "x" ? this.selectedObj.get("flipX") : this.selectedObj.get("flipY");
  }
  // set flip
  setFlip(axes) {
    this.selectedObj.set(axes == "x" ? "flipX" : "flipY", !this.getFlip(axes));
    this.elementUpdated.emit();
  }

  // open image cropper
  openImageCropper() {
    this.openedTooltip = "img-cropper";

    this.cardEditorService.setOrgCropImageData(this.selectedObj.get("id"), this.selectedObj.getSrc());

    this.dialogService.addDialog(ImageCropperDialogComponent, {
      title: "Image Cropper",
      imgURL: this.cardEditorService.getOrgCropImageURL()
    }).subscribe(result => {
      this.openedTooltip = "";
      if (result) {
        this.selectedObj.setSrc(result);
        this.cardEditorService.getSyncedImageURL(result).then(() => {
          this.elementUpdated.emit();
        });
      }
    });
  }

  // remove Item
  removeItem(ele) {
    $(ele).trigger('mouseout');
    this.elementUpdated.emit("removeObject");
  }
}
