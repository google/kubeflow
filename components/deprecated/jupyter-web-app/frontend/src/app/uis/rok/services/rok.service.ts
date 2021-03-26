import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from "@angular/common/http";

import { environment } from "src/environments/environment";
import { Resp, SnackType, emptyVolume, Volume } from "src/app/utils/types";
import { SnackBarService } from "src/app/services/snack-bar.service";
import { Observable, throwError } from "rxjs";
import { tap, map, catchError } from "rxjs/operators";
import {
  RokToken,
  RokResponse,
  JupyterLab,
  emptyJupyterLab
} from "../utils/types";

@Injectable({
  providedIn: "root"
})
export class RokService {
  constructor(private http: HttpClient, private snackBar: SnackBarService) {}

  public getRokSecret(ns: string): Observable<RokToken> {
    // Get the Token needed for Rok Api requests
    const url = environment.apiUrl + `/api/rok/namespaces/${ns}/token`;

    return this.http.get<RokResponse>(url).pipe(
      tap(data => this.handleBackendError(data)),
      catchError(error => this.handleError(error)),
      map(data => {
        return data.token;
      })
    );
  }

  public getJupyterLab(url: string, token: string): Observable<JupyterLab> {
    // Get the Token needed for Rok Api requests
    const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

    return this.http
      .head<RokResponse>(url, {
        headers: new HttpHeaders({
          "X-Auth-Token": token
        }),
        observe: "response"
      })
      .pipe(
        tap(resp => this.handleBackendError(resp.body)),
        catchError(error => this.handleError(error)),
        map(resp => {
          const headers = resp.headers;
          const notebook: JupyterLab = emptyJupyterLab();

          // Fill the notebook with the info from the response
          notebook.image = this.getHeader(headers, "X-Object-Meta-image");
          notebook.cpu = this.getHeader(headers, "X-Object-Meta-cpu");
          notebook.memory = this.getHeader(headers, "X-Object-Meta-memory");
          notebook.extra = this.getHeader(
            headers,
            "X-Object-Meta-extraResources"
          );

          // Workspace Volume
          let version = this.getHeader(
            headers,
            "X-Object-Group-Member-0-Version"
          );
          let obj = this.getHeader(headers, "X-Object-Group-Member-0-Object");
          notebook.wsvolume.extraFields = {
            rokUrl: baseUrl + obj + "?version=" + version
          };

          // Data Volumes
          const vols_num = this.getHeader(
            headers,
            "X-Object-Group-Member-Count"
          );
          for (let i = 1; i < parseInt(vols_num); i++) {
            version = this.getHeader(
              headers,
              "X-Object-Group-Member-" + i + "-Version"
            );
            obj = this.getHeader(
              headers,
              "X-Object-Group-Member-" + i + "-Object"
            );

            const vol = emptyVolume();
            vol.extraFields = {
              rokUrl: baseUrl + obj + "?version=" + version
            };
            notebook.dtvolumes.push(vol);
          }

          return notebook;
        })
      );
  }

  public getVolume(url: string, token: string): Observable<Volume> {
    return this.http
      .head<RokResponse>(url, {
        headers: new HttpHeaders({
          "X-Auth-Token": token
        }),
        observe: "response"
      })
      .pipe(
        tap(resp => this.handleBackendError(resp.body)),
        catchError(error => this.handleError(error)),
        map(resp => {
          const headers = resp.headers;
          const volume: Volume = emptyVolume();

          // Fill the notebook with the info from the response
          volume.name = this.getHeader(headers, "X-Object-Meta-dataset");
          if (volume.name === null) {
            volume.name = this.getHeader(headers, "X-Object-Meta-workspace");
          }

          let size = parseInt(this.getHeader(headers, "Content-Length"));
          size = size / Math.pow(1024, 3);
          volume.size = size.toString() + "Gi";

          volume.path = this.getHeader(headers, "X-Object-Meta-mountpoint");

          return volume;
        })
      );
  }

  // -----------------------------Utils-----------------------------------------
  private getHeader(obj: HttpHeaders, key: string) {
    if (obj.get(key) === null) {
      return null;
    }
    return decodeURIComponent(obj.get(key));
  }

  // ---------------------------Error Handling----------------------------------
  private handleBackendError(response: RokResponse | Resp) {
    if (response && !response.success) {
      throw response;
    }
  }

  private handleError(error: HttpErrorResponse | RokResponse | Resp) {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong,
    console.error(error);
    if (error instanceof HttpErrorResponse) {
      this.snackBar.show(
        `${error.status}: There was an error trying to connect ` +
          `to the backend API. ${error.message}`,
        SnackType.Error
      );
      return throwError(error.message);
    } else {
      // Backend error thrown from handleBackendError
      const backendError = error as RokResponse;
      this.snackBar.show(backendError.log, SnackType.Error);
      return throwError(backendError.log);
    }
  }
}
