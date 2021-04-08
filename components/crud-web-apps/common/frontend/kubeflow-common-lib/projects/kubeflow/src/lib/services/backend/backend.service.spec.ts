import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { BackendService } from './backend.service';
import { SnackBarService } from '../../snack-bar/snack-bar.service';
import { HttpClient } from '@angular/common/http';

export const MOCK_NAMESPACES = ['kubeflow', 'kubeflow-user'];

export class MockBackendService {
  getNamespaces(): Observable<string[]> {
    return of(MOCK_NAMESPACES);
  }
}

describe('BackendService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: {} },
        { provide: SnackBarService, useValue: {} },
      ],
    }),
  );

  it('should be created', () => {
    const service: BackendService = TestBed.inject(BackendService);
    expect(service).toBeTruthy();
  });
});
