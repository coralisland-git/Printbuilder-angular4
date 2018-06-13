import { Component, OnInit, ViewChild } from '@angular/core';
import { LoadingIconComponent } from '../../components';
import { UserInfoService } from '../../services';

@Component({
  selector: 'checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  @ViewChild(LoadingIconComponent) loadingIcon: LoadingIconComponent;
  constructor(
    private userInfoService: UserInfoService
  ) { }

  ngOnInit() {
    this.loadingIcon.setLoadingIconType("cloud");
  }

  showLoadingIcon() {
    return this.userInfoService.getCheckingOutStatus();
  }
}
