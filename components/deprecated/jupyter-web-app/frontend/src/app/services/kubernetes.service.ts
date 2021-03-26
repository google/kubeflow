import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { Observable, throwError } from "rxjs";
import { tap, map, catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";

import {
  Resp,
  Resource,
  SnackType,
  Volume,
  Config,
  PodDefault
} from "../utils/types";
import { SnackBarService } from "../services/snack-bar.service";

@Injectable()
export class KubernetesService {
  constructor(private http: HttpClient, private snackBar: SnackBarService) {}

  // GETers
  getNamespaces(): Observable<string[]> {
    const url = environment.apiUrl + `/api/namespaces`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.namespaces;
      })
    );
  }

  getResource(ns: string): Observable<Resource[]> {
    // Get existing PVCs in a namespace
    const url =
      environment.apiUrl + `/api/namespaces/${ns}/${environment.resource}`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.notebooks as Resource[];
      })
    );
  }

  getStorageClasses(): Observable<string[]> {
    // Get existing PVCs in a namespace
    const url = environment.apiUrl + `/api/storageclasses`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.storageclasses;
      })
    );
  }

  getDefaultStorageClass(): Observable<string> {
    const url = environment.apiUrl + `/api/storageclasses/default`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.defaultStorageClass;
      })
    );
  }

  getConfig(): Observable<Config> {
    const url = environment.apiUrl + `/api/config`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.config;
      })
    );
  }

  getVolumes(ns: string): Observable<Volume[]> {
    // Get existing PVCs in a namespace
    const url = environment.apiUrl + `/api/namespaces/${ns}/pvcs`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.pvcs;
      })
    );
  }

  getPodDefaults(ns: string): Observable<PodDefault[]> {
    // Get existing PodDefaults in a namespace
    const url = environment.apiUrl + `/api/namespaces/${ns}/poddefaults`;

    return this.http.get<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.poddefaults;
      })
    );
  }

  // Delete functions
  deleteResource(ns: string, nm: string): Observable<string> {
    const url =
      environment.apiUrl +
      `/api/namespaces/${ns}/${environment.resource}/${nm}`;

    return this.http.delete<Resp>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(_ => {
        return "deleted";
      })
    );
  }

  // Post Functions
  postResource(rsrc: Resource): Observable<string> {
    const url =
      environment.apiUrl +
      `/api/namespaces/${rsrc.namespace}/${environment.resource}`;

    return this.http.post<Resp>(url, rsrc).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(_ => {
        return "posted";
      })
    );
  }

  // ---------------------------Error Handling----------------------------------
  private handleBackendError(response: Resp) {
    if (!response.success) {
      throw response;
    }
  }

  private handleError(error: HttpErrorResponse | Resp): Observable<never> {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
    if (error instanceof HttpErrorResponse) {
      this.snackBar.show(
        `${error.status}: There was an error trying to connect ` +
          `to the backend API. ${error.message}`,
        SnackType.Error
      );
      return throwError(error.message);
    } else {
      // Backend error thrown from handleBackendError
      const backendError = error as Resp;
      this.snackBar.show(backendError.log, SnackType.Error);
      return throwError(backendError.log);
    }
  }
}
