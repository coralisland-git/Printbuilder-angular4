import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CardEditorService } from '../../../../services';

@Component({
  selector: 'pb-layers-panel',
  templateUrl: './layers-panel.component.html',
  styleUrls: ['./layers-panel.component.css']
})
export class LayersPanelComponent implements OnInit {
  templateElements: any = []; // template element list

  @Output() layerUpdated = new EventEmitter();

  constructor(
    private cardEditorService: CardEditorService
  ) { }

  ngOnInit() {
  }

  // populate template elements array
  populateTemplateElements(templateElements) {
    this.templateElements = templateElements;
  }

  // type of layer
  isType(element, type) {
    if (type == "text")
      return element.type.indexOf("text") !== -1;

    return element.type.indexOf("text") === -1;
  }

  // is hidden layer
  isHidden(element) {
    return element.getOpacity() == 0;
  }

  // is locked layer
  isLocked(element) {
    return element.lockMovementX && element.lockMovementY;
  }

  // return the content of element
  getContent(element) {
    if (element.get("cameraIcon"))
      return (element.cameraType == "normal" ? "Camera (" : "User Image (") + element.get("clipName") + ")";

    if (element.type.indexOf("text") === -1)
      return element.get("clipFor") ? element.get("clipFor") : element.name;
    else
      return element.text;
  }

  // do hide action
  setHideAction(element) {
    if (this.isUnusable(element))
      return;

    let that = this;

    setTimeout(() => {
      that.templateElements.forEach((ele, idx) => {
        if (ele == element)
          ele.setOpacity(that.isHidden(ele) ? 1 : 0);

        that.submitUpdatedLayers("update");
      });
    });
  }

  // do lock action
  setLockAction(element) {
    if (this.isUnusable(element))
      return;

    let that = this;

    setTimeout(() => {
      that.templateElements.forEach((ele, idx) => {
        if (ele == element)
          ele.lockMovementX = ele.lockMovementY = !that.isLocked(ele);

        that.submitUpdatedLayers("update");
      });
    });
  }

  // event when layers are updated
  submitUpdatedLayers(type) {
    this.layerUpdated.emit(type);
  }

  // is mask, camera icon
  isUnusable(element) {
    return element.get("cameraIcon") || element.get("clipFor") || element.get("name") == "Safety Line";
  }
}
