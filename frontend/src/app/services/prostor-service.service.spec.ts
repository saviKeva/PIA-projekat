import { TestBed } from '@angular/core/testing';
import { ProstorService } from './prostor-service.service';


describe('ProstorServiceService', () => {
  let service: ProstorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProstorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
