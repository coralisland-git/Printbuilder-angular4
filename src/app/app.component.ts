import { Component, OnInit, ViewChild } from '@angular/core';
import { SideBarComponent, ACDialogComponent } from './components';
import { UserInfoService } from './services';
import { DialogService } from 'ng2-bootstrap-modal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private isToggled: boolean = false;

  @ViewChild('sidenav') private sidenav;
  @ViewChild(SideBarComponent) private sidebarComponent: SideBarComponent;

  constructor(
    private dialogService: DialogService,
    private userInfoService: UserInfoService
  ) { }

  ngOnInit() { }

  // event when router url is changed
  onActivate() {
    this.sidebarComponent.setActivatedLink();
  }

  // is user info is populated
  isVisible() {
    if (this.isToggled)
      return true;
    else if (this.userInfoService.isEnabledUserInfo() || this.userInfoService.isWaitingResponse()) {
      if (this.userInfoService.isEnabledUserInfo()) {
        this.sidenav.toggle();
        this.isToggled = true;

        if (!this.userInfoService.isAcceptedTermsOfUse()) {
          this.dialogService.addDialog(ACDialogComponent, {
            dlgType: "terms-of-use",
            dlgData: {}
          }).subscribe(result => {
            this.userInfoService.setTermsOfUse(result ? "accept" : "decline");
          });
        }
      }

      return true;
    }
    else
      return false;
  }
}