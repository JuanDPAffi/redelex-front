import { TestBed } from '@angular/core/testing';

import { RedelexService } from './redelex.service';

describe('Redelex', () => {
  let service: RedelexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RedelexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
