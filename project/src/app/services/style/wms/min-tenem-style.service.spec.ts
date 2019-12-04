import { TestBed } from '@angular/core/testing';

import { MinTenemStyleService } from './min-tenem-style.service';

describe('MinTenemStyleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MinTenemStyleService = TestBed.get(MinTenemStyleService);
    expect(service).toBeTruthy();
  });
});
