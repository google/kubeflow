import { TestBed } from '@angular/core/testing';

import { VWABackendService } from './backend.service';
import { HttpClientModule } from '@angular/common/http';

describe('VWABackendService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientModule]
  }));

  it('should be created', () => {
    const service: VWABackendService = TestBed.get(VWABackendService);
    expect(service).toBeTruthy();
  });
});
