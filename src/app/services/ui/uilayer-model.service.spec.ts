import { TestBed } from '@angular/core/testing';

import { UILayerModelService } from './uilayer-model.service';

describe('UILayerModelService', () => {
  let service: UILayerModelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UILayerModelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
