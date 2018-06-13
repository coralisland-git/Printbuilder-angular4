import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagesPanelComponent } from './images-panel.component';

describe('ImagesPanelComponent', () => {
  let component: ImagesPanelComponent;
  let fixture: ComponentFixture<ImagesPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImagesPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImagesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
