import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

declare function unescape(s: string): string;

@Injectable()
export class GlobalService {
  private dlgType: any;   // Print Builder Dialog Type
  private dlgData: any;   // Print Builder Dialog Data
  private accessTokens: any = {};
  private fontList: any;  // google font list
  private searchKeyword: string = "";
  private searchResult: any;

  constructor(
    private router: Router
  ) {
    this.fontList = require('../../resources/webfonts.json').items;
    this.searchResult = {
      "people": [],
      "templates": []
    };
  }

  // is sandbox
  isLocalHost() {
    return window.location.hostname == 'localhost';
  }

  // is Dev site
  isLiveSite() {
    return window.location.hostname == "printbuilder.agentcloud.com";
  }

  // if current link is current page
  isActiveLink(link) {
    if (!link)
      return false;
    return this.router.isActive(link, true);
  }
  // redirect to the page
  redirectTo(link) {
    if (!this.isLiveSite())
      link = link.replace("crm.agentcloud.com", "devcrm.agentcloud.com");

    if (link.indexOf("/") === 0)
      this.router.navigate([link]);
    else
      window.location.href = link;
  }

  // save item with the key to local storage
  saveItem(key, value) {
    localStorage.setItem(key, value);
  }
  // get item with the key from local storage
  getItem(key, json_val = true) {
    if (json_val)
      return JSON.parse(localStorage.getItem(key));

    return localStorage.getItem(key);
  }
  // removeItem
  removeItem(key) {
    localStorage.removeItem(key);
  }

  // set print builder dlg
  setPrintBuilderDlgType(p_dlgType) {
    this.dlgType = p_dlgType;
  }
  // get print builder dlg
  getPrintBuilderDlgType() {
    return this.dlgType;
  }

  // set print builder dialog data
  setPrintBuilderDlgData(p_dlgData) {
    this.dlgData = p_dlgData
  }
  // get print builder dialog data
  getPrintBuilderDlgData() {
    return this.dlgData;
  }

  // get top 20 fonts
  getTopPopularFonts(count = 20) {
    return this.fontList.slice(0, count);
  }

  // create google font URL
  getGoogleFontFamiliesURL() {
    let gfontsURL = "https://fonts.googleapis.com/css?family=";
    let families = [];
    for (let item of this.getTopPopularFonts())
      families.push(item.family);

    gfontsURL += families.join("|");

    return gfontsURL;
  }

  // set token for several feeds
  setAccessToken(feed, token) {
    this.accessTokens[feed] = token;
  }
  // get Access Token
  getAccessToken(feed) {
    return this.accessTokens[feed];
  }

  // print log data
  printLogData(data) {
    if (this.isLocalHost() || !this.isLiveSite())
      console.log(data);
  }

  ConvertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    var row = "";

    for (var index in objArray[0]) {
      //Now convert each value to string and comma-separated
      row += index + ',';
    }
    row = row.slice(0, -1);
    //append Label row with line break
    str += row + '\r\n';

    for (var i = 0; i < array.length; i++) {
      var line = '';
      for (var index in array[i]) {
        if (line != '') line += ','

        line += array[i][index];
      }
      str += line + '\r\n';
    }
    return str;
  }

  dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }
}