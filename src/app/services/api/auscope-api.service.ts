import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { switchMap } from "rxjs/operators";
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  data: T;
  msg: string;
  success: boolean;
}

function apiData<T>(response: ApiResponse<T>): Observable<T> {
  // Convert a VGL error into an Observable error
  if (!response.success) {
    console.log('VGL response error: ' + JSON.stringify(response));
    return throwError(response.msg);
  }

  // Otherwise, wrap the response data in a new Observable an return.
  return of(response.data);
}

@Injectable({ providedIn: "root" })
export class AuscopeApiService {

  constructor(private http: HttpClient) {}

  private apiRequest<T>(endpoint: string, options: any = {}): Observable<T> {
    const params = options.params || {};
    const opts = {...options};
    delete opts.params;
    return this.apiGet<T>(endpoint, params, opts);
  }

  private apiPost<T>(endpoint: string, params = {}, options = {}): Observable<T> {
    const url = environment.portalBaseUrl + endpoint;

    const body = new FormData();
    for (const key in params) {
      const val = params[key];
      if (Array.isArray(val)) {
        val.forEach(v => body.append(key, v));
      } else {
        body.append(key, val);
      }
    }

    const opts: { observe: 'body' } = { ...options, observe: 'body' };

    return this.http.post<ApiResponse<T>>(url, body, opts).pipe(switchMap(apiData));
  }

  private apiGet<T>(endpoint: string, params = {}, options?): Observable<T> {
    const url = environment.portalBaseUrl + endpoint;
    const opts: { observe: 'body' } = { ...options, observe: 'body', params: params };

    return this.http.get<ApiResponse<T>>(url, opts).pipe(switchMap(apiData));
  }

  public getWmsCapabilities(serviceUrl: string, version: string): Observable<any> {
    if (serviceUrl.indexOf('?') !== -1) {
      serviceUrl = serviceUrl.substring(0, serviceUrl.indexOf('?'));
    }
    const params = {
      serviceUrl: serviceUrl,
      version: version
    };
    return this.apiGet<any>('getWMSCapabilities.do', params);
  }

}
