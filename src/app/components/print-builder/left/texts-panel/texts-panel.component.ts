import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { GlobalService, CardEditorService } from '../../../../services';

declare var $;

@Component({
  selector: 'pb-texts-panel',
  templateUrl: './texts-panel.component.html',
  styleUrls: ['./texts-panel.component.css']
})
export class TextsPanelComponent implements OnInit {
  fontItemList: any;

  @Output() addTextElement = new EventEmitter();

  constructor(
    private cardEditorService: CardEditorService,
    private globalService: GlobalService
  ) {
    this.fontItemList = this.globalService.getTopPopularFonts();
  }

  ngOnInit() {
    $("#google-fonts").attr("href", this.globalService.getGoogleFontFamiliesURL());
  }

  // add '"' start and end of fontFamily for style css
  convertToString(fontFamily) {
    return '"' + fontFamily + '"';
  }

  // add text element to card editor
  addTextElementToCardEditor(fontFamily) {
    this.addTextElement.emit(fontFamily);
  }
}
