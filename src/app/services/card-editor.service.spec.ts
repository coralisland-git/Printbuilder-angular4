import { TestBed, inject } from '@angular/core/testing';

import { CardEditorService } from './card-editor.service';

describe('CardEditorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardEditorService]
    });
  });

  it('should be created', inject([CardEditorService], (service: CardEditorService) => {
    expect(service).toBeTruthy();
  }));
});
