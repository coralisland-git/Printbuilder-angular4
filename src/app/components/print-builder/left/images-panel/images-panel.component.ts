import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { FacebookService, LoginResponse, LoginOptions, InitParams } from 'ngx-facebook';
import { CardEditorService, GlobalService } from '../../../../services';

@Component({
  selector: 'pb-images-panel',
  templateUrl: './images-panel.component.html',
  styleUrls: ['./images-panel.component.css']
})
export class ImagesPanelComponent implements OnInit {
  imgTab: string = "img-upload";  // tab status
  uploadedImgList: any = [];      // uploaded images list

  @Output() addImageElement = new EventEmitter();

  resourceImgList: any = {
    pixabay: [],
    unsplash: [],
    facebook: [],
    instagram: []
  };        // resource image list
  selectedFeed: string = "pixabay"; // resource source
  resourceKeyword: string = "Real Estate";     // search keyword
  resourcePageNum: number = 1;      // page number of search resourcefeed

  constructor(
    private http: Http,
    private fb: FacebookService,
    private cardEditorService: CardEditorService,
    private globalService: GlobalService
  ) {
    let appId = this.globalService.isLocalHost() ? "394846980985713" : "2106372739614305";
    this.fb.init({
      appId: appId,
      xfbml: true,
      version: 'v2.11'
    });
  }

  ngOnInit() {
  }

  // upload image
  uploadImage(e) {
    let reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);

    reader.onload = (f) => {
      let target: any = f.target;
      this.uploadedImgList.push({
        imgURL: target.result,
        isLoaded: false
      });
    }

    e.target.value = "";
  }

  // search images
  searchImages() {
    let feedURL: string = "";
    let resultKey: string = "";

    switch (this.selectedFeed) {
      case "unsplash":
        feedURL = ["https://api.unsplash.com/search/photos?client_id=fe6b89c6d9180df6df6489c85c3232125db1fd75239e01cfaa71ba5435d2d531&response_type=json&page=", this.resourcePageNum, "&per_page=30&query=", this.resourceKeyword ? this.resourceKeyword : "agent"].join("");
        resultKey = "results";
        break;

      case "pixabay":
        feedURL = ["https://pixabay.com/api/?key=5218090-e2da30afc236a7f590f6b4f93&page=", this.resourcePageNum, "&per_page=100&q=", this.resourceKeyword].join("");
        resultKey = "hits";
        break;

      case "facebook":
        if (this.globalService.getAccessToken("facebook"))
          this.populateFacebookImages();
        break;

      case "instagram":
        break;
    }

    if (["unsplash", "pixabay"].indexOf(this.selectedFeed) !== -1)
      this.http.get(feedURL).toPromise().then(res => {
        this.resourceImgList[this.selectedFeed] = resultKey ? res.json()[resultKey] : res.json();
      })
  }

  // get preview image url
  getPreviewImgURL(image) {
    let previewURL = "";

    switch (this.selectedFeed) {
      case "unsplash":
        previewURL = image.urls.thumb;
        break;

      case "facebook":
        if (image.images)
          previewURL = image.images[image.images.length - 1].source;
        break;

      case "instagram":
        if (image.images)
          previewURL = image.images.low_resolution.url;
        break;

      case "pixabay":
      default:
        previewURL = image.previewURL;
        break;
    }

    return previewURL;
  }

  // get image info
  getImageInfo(image) {
    let imgDesc = "";
    switch (this.selectedFeed) {
      case "unsplash":
        imgDesc = image.user.name;
        break;

      case "facebook":
        break;

      case "instagram":
        imgDesc = image.caption.text;
        break;

      case "pixabay":
      default:
        imgDesc = image.tags;
        break;
    }

    return imgDesc;
  }

  // facebook login
  facebookLogin() {
    this.fb.login({ scope: 'user_photos' })
      .then((res: LoginResponse) => {
        this.globalService.setAccessToken("facebook", res.authResponse.accessToken);
        this.populateFacebookImages();
      }).catch(err => {
        this.globalService.printLogData(err);
      })
  }

  // populate facebook image list
  populateFacebookImages() {
    let fbURL = "https://graph.facebook.com/v2.11/me/photos/uploaded?fields=album,height,id,images,width,name&limit=100&access_token=" + this.globalService.getAccessToken("facebook");
    this.http.get(fbURL).toPromise().then(res => {
      this.resourceImgList["facebook"] = res.json().data;
    })
  }

  // instagram login
  instagramLogin() {
    let URL = "", clientID = "";

    if (this.globalService.isLocalHost())
      clientID = "e4a12ca5a2e544af8622282398752e17";
    else
      clientID = "8a39fceacab2442bb45a61d2b80fe9e7";

    if (this.globalService.isLocalHost())
      URL = "http://localhost:8080";
    else if (this.globalService.isLiveSite())
      URL = "https://printbuilder.agentcloud.com";
    else
      URL = "https://devprintbuilder.agentcloud.com";

    window.open("https://api.instagram.com/oauth/authorize/?client_id=" + clientID + "&redirect_uri=" + URL + "/products/single-product&response_type=token", 'popup', 'width=600,height=600');

    let count = 0, interval = setInterval(() => {
      count++;
      let accessToken = this.globalService.getItem("access_token", false);

      if (accessToken) {
        this.globalService.setAccessToken("instagram", accessToken);
        this.populateInstagramImages(accessToken);
        this.globalService.removeItem("access_token");
        clearInterval(interval);
      } else if (count == 50) {
        clearInterval(interval);
      }
    }, 500);
  }

  // populate Instagram Images
  populateInstagramImages(accessToken = null) {
    let igURL = "https://api.instagram.com/v1/users/self/media/recent?access_token=" + (accessToken ? accessToken : this.globalService.getAccessToken("instagram"));

    this.http.get(igURL).toPromise().then(res => {
      this.resourceImgList["instagram"] = res.json().data;
    })
  }

  // check if hide login with social feed button
  hideLoginButton(feed) {
    return this.globalService.getAccessToken(feed) ? true : false;
  }

  // add image element to card editor canvas
  addImageElementToCanvas(image) {
    if (this.imgTab == 'img-upload') {
      this.addImageElement.emit(image.imgURL);
      return;
    }

    let imgURL = "";
    switch (this.selectedFeed) {
      case "unsplash":
        imgURL = image.urls.regular;
        break;

      case "facebook":
        image = image.images[image.images.length - 1];
        imgURL = image.source;
        break;

      case "instagram":
        image = image.images.standard_resolution;
        imgURL = image.url;
        break;

      case "pixabay":
      default:
        imgURL = image.webformatURL;
        break;
    }

    this.addImageElement.emit(imgURL);
  }
}
