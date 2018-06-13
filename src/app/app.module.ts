import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BootstrapModalModule } from 'ng2-bootstrap-modal';
import { FacebookModule } from 'ngx-facebook';
import { ColorPickerModule } from 'ngx-color-picker';
import { AngularCropperjsModule } from 'angular-cropperjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModules } from './angular-material';
import { AppComponent } from './app.component';

import {
  GlobalService,
  CardEditorService,
  UserInfoService,
  HttpService
} from './services';

// components
import {
  SideBarComponent,
  TopBarComponent,
  PageHeroComponent,
  ACDialogComponent,
  TextsPanelComponent,
  ImagesPanelComponent,
  LayersPanelComponent,
  ListingsPanelComponent,
  CardEditorComponent,
  TemplatesPanelComponent,
  LoadingIconComponent,
  EditBarComponent,
  ImageCropperDialogComponent,
  OptionsPanelComponent,
  ReviewOrderComponent,
  ProductListComponent,
  PaymentInfoComponent
} from './components';

// pages
import {
  IndexComponent,
  ProductsViewerComponent,
  SingleProductComponent,
  CheckoutComponent,
  ThankYouComponent
} from './pages';

const ROUTES = [{
  path: "",
  component: IndexComponent,
  pathMatch: "full",
}, {
  path: "products",
  children: [{
    path: "",
    pathMatch: "full",
    component: ProductsViewerComponent,
  }, {
    path: "single-product",
    component: SingleProductComponent
  }]
},
{
  path: "checkout",
  component: CheckoutComponent,
  pathMatch: "full",
},
{
  path: "thank-you",
  component: ThankYouComponent,
  pathMatch: "full"
}];

@NgModule({
  declarations: [
    AppComponent,
    SideBarComponent,
    TopBarComponent,
    IndexComponent,
    ProductsViewerComponent,
    PageHeroComponent,
    ACDialogComponent,
    SingleProductComponent,
    TemplatesPanelComponent,
    TextsPanelComponent,
    ImagesPanelComponent,
    ListingsPanelComponent,
    LayersPanelComponent,
    CardEditorComponent,
    LoadingIconComponent,
    EditBarComponent,
    ImageCropperDialogComponent,
    OptionsPanelComponent,
    ReviewOrderComponent,
    CheckoutComponent,
    ProductListComponent,
    PaymentInfoComponent,
    ThankYouComponent,
  ],
  entryComponents: [
    ACDialogComponent,
    ImageCropperDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(ROUTES),
    BootstrapModalModule,
    FacebookModule.forRoot(),
    NoopAnimationsModule,
    ColorPickerModule,
    AngularCropperjsModule,
    AngularMaterialModules
  ],
  providers: [UserInfoService, GlobalService, CardEditorService, HttpService, AngularMaterialModules],
  bootstrap: [AppComponent]
})
export class AppModule { }
