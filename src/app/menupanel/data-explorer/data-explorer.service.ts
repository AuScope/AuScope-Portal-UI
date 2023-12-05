import { throwError as observableThrowError,  Observable, BehaviorSubject } from 'rxjs';

import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { LayerModel } from '@auscope/portal-core-ui';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Registry } from './data-model';


@Injectable()
export class DataExplorerService {

  static RESULTS_PER_PAGE: number = 35;

  // List of valid online resource types that can be added to the map
  static VALID_ONLINE_RESOURCE_TYPES: Array<string> = [ "WMS", "IRIS", "CSW", "KML" ];


  private _registries: BehaviorSubject<Registry[]> = new BehaviorSubject([]);
  public readonly registries: Observable<Registry[]> = this._registries.asObservable();

  constructor(private http: HttpClient) { }

  /*
  public getFilteredCSWKeywords(cswServiceId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('cswServiceIds', cswServiceId);
    return this.http.post(environment.portalBaseUrl + 'getFilteredCSWKeywords.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError((error: HttpResponse<any>) => {
        return observableThrowError(error);
    }), );
  }
  */

  public getCSWServices(): Observable<any> {
    return this.http.post(environment.portalBaseUrl + 'getCSWServices.do', {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }), );
  }

  /**
   * executes getFacetedCSWServices.do in vgl service
   */
  public updateRegistries(): Observable<Registry[]> {
    const obs = this.getCSWServices();
    obs.subscribe(registryList => this._registries.next(registryList));
    return obs;
  }

  /**
   * @param serviceId
   * @param start
   * @param limit
   * @param field
   * @param value
   * @param type
   * @param comparison
   */
  // XXX GET RID OF THIS AND REPLACE WITH NEXT METHOD
  public getFacetedSearch(serviceId: string, start: number, limit: number,
    field: string[], value: string[], type: string[], comparison: string[]): Observable<any> {

    let httpParams = new HttpParams();
    if (limit) {
        httpParams = httpParams.append('limit', limit.toString());
    }
    if (start) {
        httpParams = httpParams.append('start', start.toString());
    }
    if (serviceId) {
        httpParams = httpParams.append('serviceId', serviceId);
    }
    if (field) {
        field.forEach(f => {
            httpParams = httpParams.append('field', f);
        });
    }
    if (value) {
        value.forEach(v => {
            httpParams = httpParams.append('value', v);
        });
    }
    if (type) {
        type.forEach(t => {
            httpParams = httpParams.append('type', t);
        });
    }
    if (comparison) {
        comparison.forEach(c => {
            httpParams = httpParams.append('comparison', c);
        });
    }

    return this.http.post(environment.portalBaseUrl + 'facetedCSWSearch.do', httpParams.toString(), {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
        responseType: 'json'
    }).pipe(map(response => {
      const cswRecords = response['data'].records;
      const itemLayers = [];

      cswRecords.forEach(function(item, i, ar) {
        const itemLayer = new LayerModel();
        itemLayer.cswRecords = [item];
        itemLayer['expanded'] = false;
        itemLayer.id = item.id;
        itemLayer.description = item.description;
        itemLayer.hidden = false;
        itemLayer.layerMode = 'NA';
        itemLayer.name = item.name;
        // All data search layers will use proxy
        itemLayer.useDefaultProxy = true;
        itemLayer.useProxyWhitelist = false;
        itemLayers.push(itemLayer);
      });

      return {
        itemLayers: itemLayers,
        data: response['data']
      }
    }, error => {
      console.log('Faceted search error: ' + error.message);
    }));
  }

  public getFacetedSearchForUserRegistry(serviceId: string, serviceTitle: string, serviceUrl: string, recordUrl: string, serviceType: string,
    start: number, limit: number, field: string[], value: string[], type: string[], comparison: string[]): Observable<any> {
    let httpParams = new HttpParams();
    if (limit) {
        httpParams = httpParams.append('limit', limit.toString());
    }
    if (start) {
        httpParams = httpParams.append('start', start.toString());
    }
    if (serviceId) {
        httpParams = httpParams.append('serviceId', serviceId);
    }
    if (serviceTitle) {
      httpParams = httpParams.append('serviceTitle', serviceTitle);
  }
    if (serviceUrl) {
      httpParams = httpParams.append('serviceUrl', serviceUrl);
    }
    if (recordUrl) {
      httpParams = httpParams.append('recordUrl', recordUrl);
    }
    if (serviceType) {
      httpParams = httpParams.append('serviceType', serviceType);
    }
    if (field) {
        field.forEach(f => {
            httpParams = httpParams.append('field', f);
        });
    }
    if (value) {
        value.forEach(v => {
            httpParams = httpParams.append('value', v);
        });
    }
    if (type) {
        type.forEach(t => {
            httpParams = httpParams.append('type', t);
        });
    }
    if (comparison) {
        comparison.forEach(c => {
            httpParams = httpParams.append('comparison', c);
        });
    }

    return this.http.post(environment.portalBaseUrl + 'facetedCSWSearch.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      const cswRecords = response['data'].records;
      const itemLayers = [];

      cswRecords.forEach(function(item, i, ar) {
        const itemLayer = new LayerModel();
        itemLayer.cswRecords = [item];
        itemLayer['expanded'] = false;
        itemLayer.id = item.id;
        itemLayer.description = item.description;
        itemLayer.hidden = false;
        itemLayer.layerMode = 'NA';
        itemLayer.name = item.name;
        // All data search layers will use proxy
        itemLayer.useDefaultProxy = true;
        itemLayer.useProxyWhitelist = false;
        itemLayers.push(itemLayer);
      });

      return {
        itemLayers: itemLayers,
        data: response['data']
      }
    }, error => {
      console.log('Faceted search error: ' + error.message);
    }));
  }

  /**
   * Returns an array of keywords for specified service IDs
   * @param serviceIds an array of service IDs
   */
  public getFacetedKeywords(serviceIDs: string[]): Observable<string[]> {
    let httpParams = new HttpParams();
    serviceIDs.forEach(id => {
        httpParams = httpParams.append('serviceId', id);
    });
    return this.http.post(environment.portalBaseUrl + 'facetedKeywords.do', httpParams.toString(), {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
        responseType: 'json'
    }).pipe(map(response => {
        return response['data'];
    }));
  }

  /**
   * Retrieve a list of addable OnlineResource types
   *
   * @returns a list of valid OnlineResourceTypes
   */
  public getValidOnlineResourceTypes(): string[] {
    return DataExplorerService.VALID_ONLINE_RESOURCE_TYPES;
  }

  public isValidOnlineResourceType(type: string): boolean {
    if (DataExplorerService.VALID_ONLINE_RESOURCE_TYPES.indexOf(type) > -1) {
      return true;
    }
    return false;
  }

}
