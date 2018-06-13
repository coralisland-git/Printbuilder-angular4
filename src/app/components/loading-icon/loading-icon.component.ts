import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'loading-icon',
  templateUrl: './loading-icon.component.html',
  styleUrls: ['./loading-icon.component.css']
})
export class LoadingIconComponent implements OnInit {
  private loadingIconType: string = "spinner";
  private size: string = "normal";

  constructor() { }

  ngOnInit() {
  }

  // set loading icon type
  setLoadingIconType(loadingType = "spinner", size = "normal") {
    this.loadingIconType = loadingType;
    this.size = size;
  }
  // get loading icon type
  getLoadingIconType() {
    return this.loadingIconType;
  }
}
