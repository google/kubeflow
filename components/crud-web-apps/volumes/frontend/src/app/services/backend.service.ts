import { Injectable } from '@angular/core';
import { BackendService, SnackBarService } from 'kubeflow';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PVCResponseObject, VWABackendResponse, PVCPostObject } from '../types';

@Injectable({
  providedIn: 'root',
})
export class VWABackendService extends BackendService {
  constructor(public http: HttpClient, public snackBar: SnackBarService) {
    super(http, snackBar);
  }

  public getPVCs(namespace: string): Observable<PVCResponseObject[]> {
    const url = `api/namespaces/${namespace}/pvcs`;

    return this.http.get<VWABackendResponse>(url).pipe(
      catchError(error => this.handleError(error)),
      map((resp: VWABackendResponse) => {
        return resp.pvcs;
      }),
    );
  }

  // POST
  public createViewer(namespace: string, viewer: string) {
    const url = `api/namespaces/${namespace}/viewers`;

    return this.http
      .post<VWABackendResponse>(url, { name: viewer })
      .pipe(catchError(error => this.handleError(error)));
  }

  public createPVC(namespace: string, pvc: PVCPostObject) {
    const url = `api/namespaces/${namespace}/pvcs`;

    return this.http
      .post<VWABackendResponse>(url, pvc)
      .pipe(catchError(error => this.handleError(error)));
  }

  // DELETE
  public deletePVC(namespace: string, pvc: string) {
    const url = `api/namespaces/${namespace}/pvcs/${pvc}`;

    return this.http
      .delete<VWABackendResponse>(url)
      .pipe(catchError(error => this.handleError(error, false)));
  }
}
