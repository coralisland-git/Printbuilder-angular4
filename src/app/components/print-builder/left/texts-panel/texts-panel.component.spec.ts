import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextsPanelComponent } from './texts-panel.component';

describe('TextsPanelComponent', () => {
  let component: TextsPanelComponent;
  let fixture: ComponentFixture<TextsPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextsPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
