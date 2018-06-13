import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListingsPanelComponent } from './listings-panel.component';

describe('ListingsPanelComponent', () => {
  let component: ListingsPanelComponent;
  let fixture: ComponentFixture<ListingsPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListingsPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListingsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
