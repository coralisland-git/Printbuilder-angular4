import { Component, OnInit, ViewChild } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { AngularCropperjsComponent } from 'angular-cropperjs';


export interface ImageCropperDialogInterface {
  title: string,
  imgURL: string
}

@Component({
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.css']
})
export class ImageCropperDialogComponent extends DialogComponent<ImageCropperDialogInterface, boolean> implements ImageCropperDialogInterface {
  title: string;
  imgURL: string;

  @ViewChild('angularCropper') angularCropper: AngularCropperjsComponent;

  constructor(
    dialogService: DialogService
  ) {
    super(dialogService)
  }

  ngOnInit() {
    if (!this.imgURL) {
      this.close();
    }
  }

  confirm() {
    this.result = this.angularCropper.cropper.getCroppedCanvas().toDataURL();
    this.close()
  }

  cancel() {
    this.result = false;
    this.close();
  }
}
