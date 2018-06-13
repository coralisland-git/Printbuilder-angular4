import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GlobalService, CardEditorService } from '../../../../services';
let PDFJS = require('pdfjs-dist');

@Component({
  selector: 'pb-templates-panel',
  templateUrl: './templates-panel.component.html',
  styleUrls: ['./templates-panel.component.css']
})
export class TemplatesPanelComponent implements OnInit {
  allCardTemplates: any;   // all cardTemplates
  category: string = "All"; // category of card templates

  cardType: string; //  post, business, ...
  cardSizeLabel: string;  // size label "jumbo", "large", "regular"
  cardLayout: string;  // horizontal, veritcal
  selectedTplNo: number = -1;  // tpl num to open all preview images

  @Output() templateSelect = new EventEmitter();
  @Output() addImageElement = new EventEmitter();

  constructor(
    private globalService: GlobalService,
    private cardEditorService: CardEditorService,
  ) {
    this.cardType = this.cardEditorService.getCardType();
    this.cardSizeLabel = this.cardEditorService.getCardSizeLabel();
    this.cardLayout = this.cardEditorService.getCardLayout();

    this.allCardTemplates = this.globalService.isLiveSite() ? require("../../../../../resources/data.json") : require("../../../../../resources/data_test.json");

    this.allCardTemplates = this.allCardTemplates.filter(template => {
      if (template.type.toLowerCase() == this.cardType) {
        if (template["options"]["layouts"].length == 1) {
          this.cardLayout = template["options"]["layouts"][0];
        }

        template["previewLoaded"] = false;
        template["previewImgURL"] = [
          "https://s3-us-west-1.amazonaws.com/agent-cloud/print-builder/templates",
          template["sku"],
          (this.cardType == "business" ? "" : [this.cardSizeLabel, this.cardLayout, "front/"].join("-")) + "preview.png"
        ].join("/");

        if (template["options"]["colors"].length)
          template["selectedColor"] = template["options"]["colors"][0]

        return true;
      }
    });
  }

  ngOnInit() { }

  // get Image Preview URLs
  getImagePreviewURL(sku, side = 'front', layout = 'horizontal', option = false) {
    let folderName = [this.cardSizeLabel, layout, side].join("-");
    let previewURL = "https://s3-us-west-1.amazonaws.com/agent-cloud/print-builder/templates/" + [sku, folderName, "preview.png"].join("/");

    if (option)
      previewURL = "https://s3-us-west-1.amazonaws.com/agent-cloud/print-builder/templates/" + [sku, option, folderName, "preview.png"].join("/");

    return previewURL;
  }

  // all Categories
  getAllCategories() {
    return ['All', 'New', 'Modern', 'Traditional', 'Contemporary', 'Horizontal', 'Vertical'];
  }

  // filtered templates with category
  getFilteredTemplates() {
    if (this.category == 'All')
      return this.allCardTemplates;

    return this.allCardTemplates.filter(template => template.categories.indexOf(this.category) !== -1);
  }

  // get Math Floor
  getMathFloor(number) {
    return Math.floor(number);
  }

  // open all preview images of all sides
  openAllPreviewImages(template, index) {
    this.selectedTplNo = this.selectedTplNo == index ? -1 : index;
  }

  // call method when template is selected
  tplSelect(tplInfo, color) {
    this.templateSelect.emit({
      sku: tplInfo.sku,
      side: tplInfo.side,
      layout: tplInfo.layout,
      color: color
    });
  }

  getTemplateSummaries(template) {
    if (template["tplSummaries"] && template["tplSummaries"].length)
      return template["tplSummaries"];

    let tplSummaries = [];
    let sides = template.type.toLowerCase() !== "flyer" ? ["front", "back"] : ["front"];

    for (let layout of template["options"]["layouts"]) {
      for (let side of sides) {
        let selectedColor = false;
        if (template["selectedColor"])
          selectedColor = template["selectedColor"];

        tplSummaries.push({
          "previewLoaded": false,
          "sku": template.sku,
          "side": side,
          "layout": layout,
          "previewImgURL": this.getImagePreviewURL(template.sku, side, layout, selectedColor)
        });
      }
    }

    template["tplSummaries"] = tplSummaries;
    return tplSummaries;
  }

  // add iamge to canvas
  uploadCustomDesign(e) {
    let reader = new FileReader();
    let isPDF = e.target.files[0].type === "application/pdf";
    reader.readAsDataURL(e.target.files[0]);

    reader.onload = isPDF ? (f) => {
      let target: any = f.target;
      PDFJS.getDocument(target.result).then((pdfDoc) => {
        pdfDoc.getPage(1).then((page) => {
          let scale = 3.0;

          if (this.cardEditorService.getCardType() === "business")
            scale = 5.0;

          let viewport = page.getViewport(scale);
          let canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height
          let context = canvas.getContext("2d");
          page.render({
            canvasContext: context,
            viewport: viewport
          }).then(() => {
            let image = context.canvas.toDataURL("jpeg");
            this.addImageElement.emit(image);
          })
        });
      });
    } : (f) => {
      let target: any = f.target;
      this.addImageElement.emit(target.result);
    }

    e.target.value = "";
  }
}
