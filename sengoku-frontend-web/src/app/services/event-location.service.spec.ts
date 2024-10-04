import { TestBed } from '@angular/core/testing';

import { EventLocationService } from './event-location.service';

describe('EventLocationService', () => {
  let service: EventLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventLocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
