import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesPanelComponent } from './templates-panel';

describe('TemplatesPanelComponent', () => {
  let component: TemplatesPanelComponent;
  let fixture: ComponentFixture<TemplatesPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TemplatesPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
