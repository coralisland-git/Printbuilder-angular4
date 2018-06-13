import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsViewerComponent } from './products-viewer.component';

describe('ProductsViewerComponent', () => {
  let component: ProductsViewerComponent;
  let fixture: ComponentFixture<ProductsViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductsViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
