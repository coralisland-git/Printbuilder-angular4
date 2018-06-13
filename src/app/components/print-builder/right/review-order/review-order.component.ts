import { Component, OnInit } from '@angular/core';
import { CardEditorService } from '../../../../services';
import { fabric } from 'fabric';

declare var $;

@Component({
  selector: 'pb-review-order',
  templateUrl: './review-order.component.html',
  styleUrls: ['./review-order.component.css']
})
export class ReviewOrderComponent implements OnInit {
  frontCanvas: any;
  backCanvas: any;
  cardSize: any;  // card size
  flipContainerWidth: string = "480px"; // container width
  lrValue: any = 0; // lr value angle
  tbValue: any = 0;
  layout: string = "horizontal";

  constructor(
    private cardEditorService: CardEditorService
  ) { }

  ngOnInit() {
    this.cardSize = this.cardEditorService.getCardSizes(
      this.cardEditorService.getCardType(),
      this.cardEditorService.getCardSizeLabel()
    );
    this.cardSize = {
      width: this.cardSize[0] + 0.25,
      height: this.cardSize[1] + 0.25
    };

    this.frontCanvas = new fabric.Canvas('front-canvas', {
      hoverCursor: 'pointer',
      selection: false,
      fill: "#ffffff",
      width: 480,
      height: Math.ceil(480 * this.cardSize.height / this.cardSize.width)
    });

    if (this.cardEditorService.getCardType() !== "flyer") {
      this.backCanvas = new fabric.Canvas('back-canvas', {
        hoverCursor: 'pointer',
        selection: false,
        fill: "#ffffff",
        width: 480,
        height: Math.ceil(480 * this.cardSize.height / this.cardSize.width)
      });
    }

    if (this.cardEditorService.getExistingCard()) {
      this.setCanvasImg("front");

      if (this.cardEditorService.getCardType() != "flyer")
        this.setCanvasImg("back");
    }
  }

  swipeCard() {
    let showFront = true;

    if (this.lrValue < 90)
      showFront = this.tbValue < 90 ? true : false;
    else
      showFront = this.tbValue < 90 ? false : true;

    $(".front-container").css({
      'z-index': showFront ? '1000' : '-1',
      'opacity': showFront ? '1' : '0',
      '-webkit-transform': "rotateX(" + (-this.tbValue) + "deg) rotateY(" + (-this.lrValue) + "deg)",
      '-moz-transform': "rotateX(" + (-this.tbValue) + "deg) rotateY(" + (-this.lrValue) + "deg)",
      'position': showFront ? 'relative' : 'absolute'
    });

    $(".back-container").css({
      'z-index': showFront ? '-1' : '1000',
      'opacity': showFront ? '0' : '1',
      '-webkit-transform': "rotateX(" + (-this.tbValue) + "deg) rotateY(" + (180 - this.lrValue) + "deg)",
      '-moz-transform': "rotateX(" + (-this.tbValue) + "deg) rotateY(" + (180 - this.lrValue) + "deg)",
      'position': showFront ? 'absolute' : 'relative'
    });
  }

  // set back canvas image
  getCardImgURL(side) {
    return this.cardEditorService.getCardImageURL(side);
  }

  // set front canvas image
  setCanvasImg(side) {
    this.lrValue = 0;
    this.tbValue = 0;

    let canvas = side == "front" ? this.frontCanvas : this.backCanvas;
    this.layout = this.cardEditorService.getCardLayout();

    let width = this.layout == "horizontal" ? 480 : 300;
    this.flipContainerWidth = width + "px";

    canvas.setWidth(width);
    if (this.layout == "horizontal")
      canvas.setHeight(Math.ceil(width * this.cardSize.height / this.cardSize.width));
    else
      canvas.setHeight(Math.ceil(width * this.cardSize.width / this.cardSize.height));

    canvas.setBackgroundImage(this.getCardImgURL(side), canvas.renderAll.bind(canvas), {
      backgroundImageOpacity: 1,
      backgroundImageStrech: true,
      top: 0,
      left: 0,
      originX: 'left',
      originY: 'top',
      width: canvas.width,
      height: canvas.height
    });

    canvas.renderAll();
  }

  getCardOption(option) {
    let cardOptions = this.cardEditorService.getCardOptions();
    return cardOptions[option];
  }

  // is rounded
  getCornerClass() {
    return ["corner", this.getCardOption("corner")].join("-");
  }

  getSliderVisibleClass() {
    return this.cardEditorService.getCardType() === "flyer" ? "invisible" : "";
  }
}
