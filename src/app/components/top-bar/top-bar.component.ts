import { Component, OnInit } from '@angular/core';
import { UserInfoService, GlobalService, HttpService } from '../../services';

@Component({
  selector: 'top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {
  keyword: string = "";

  constructor(
    private userInfoService: UserInfoService,
    private httpService: HttpService,
    private globalService: GlobalService
  ) { }

  ngOnInit() { }

  // get user full name
  getUserFullName() {
    return this.userInfoService.getFullName();
  }

  // get user profile image
  getUserProfileImage() {
    return this.userInfoService.getProfileImage();
  }

  // log out
  logOut() {
    this.userInfoService.logOut();
  }

  // redirect to
  redirectTo(page) {
    let link = "";
    if (page == "settings")
      link = "https://crm.agentcloud.com/#/settings/profile_billing?sso=true&token=" + this.globalService.getItem("crm_token", false);
    else if (page == "search")
      link = "https://crm.agentcloud.com/#/search_result/" + this.keyword + "?sso=true&token=" + this.globalService.getItem("crm_token", false);

    this.globalService.redirectTo(link);
  }
}
