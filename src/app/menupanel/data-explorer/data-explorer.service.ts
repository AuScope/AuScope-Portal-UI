import {throwError as observableThrowError,  Observable, BehaviorSubject } from 'rxjs';

import {map, catchError} from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { LayerModel } from '@auscope/portal-core-ui';
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders, HttpResponse} from '@angular/common/http';
import { Registry } from './data-model';


@Injectable()
export class DataExplorerService {

  static RESULTS_PER_PAGE: number = 35;

  constructor(private http: HttpClient) { }

  private _registries: BehaviorSubject<Registry[]> = new BehaviorSubject([]);
  public readonly registries: Observable<Registry[]> = this._registries.asObservable();
  
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
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getFilteredCSWRecords(param: any, page: number): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('key', 'cswServiceId');
    httpParams = httpParams.append('key', 'keywordMatchType');

    if (param.anyText) {
      httpParams = httpParams.append('key', 'anyText');
    }
    if (param.title) {
      httpParams = httpParams.append('key', 'title');
    }
    if (param.abstract) {
      httpParams = httpParams.append('key', 'abstract');
    }
    if (param.north) {
      httpParams = httpParams.append('key', 'north');
    }
    if (param.south) {
      httpParams = httpParams.append('key', 'south');
    }
    if (param.east) {
      httpParams = httpParams.append('key', 'east');
    }
    if (param.west) {
      httpParams = httpParams.append('key', 'west');
    }
    if (param.keywords) {
      httpParams = httpParams.append('key', 'keywords');
    }

    httpParams = httpParams.append('value', param.cswService.id);
    httpParams = httpParams.append('value', 'Any');
    if (param.anyText) {
      httpParams = httpParams.append('value', param.anyText);
    }
    if (param.title) {
      httpParams = httpParams.append('value', param.title);
    }
    if (param.abstract) {
      httpParams = httpParams.append('value', param.abstract);
    }
    if (param.north) {
      httpParams = httpParams.append('value', param.north);
    }
    if (param.south) {
      httpParams = httpParams.append('value', param.south);
    }
    if (param.east) {
      httpParams = httpParams.append('value', param.east);
    }
    if (param.west) {
      httpParams = httpParams.append('value', param.west);
    }
    if (param.keywords) {
      httpParams = httpParams.append('value', param.keywords);
    }

    const start = ((page - 1) * DataExplorerService.RESULTS_PER_PAGE);
    httpParams = httpParams.append('page', page.toString());
    httpParams = httpParams.append('start', start.toString());
    httpParams = httpParams.append('limit', DataExplorerService.RESULTS_PER_PAGE.toString());

    return this.http.post(environment.portalBaseUrl + 'getFilteredCSWRecords.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        const cswRecords = response['data'];
        const itemLayers = [];
        itemLayers[param.cswService.title] = [];
        cswRecords.forEach(function(item, i, ar) {
          const itemLayer = new LayerModel();
          itemLayer.cswRecords = [item];
          itemLayer['expanded'] = false;
          itemLayer.id = item.id;
          itemLayer.description = item.description;
          itemLayer.hidden = false;
          itemLayer.layerMode = 'NA';
          itemLayer.name = item.name;
          itemLayers[param.cswService.title].push(itemLayer);
        });
        return {
          itemLayers: itemLayers,
          totalResults: parseInt(response['totalResults'], 10)
        }
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }), );
  }


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
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ), );
  }

    /**
     * executes getFacetedCSWServices.do in vgl service
     */
    public updateRegistries(): Observable<Registry[]> {
      let obs = this.getCSWServices();
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
    public getFacetedSearch(serviceId: string, start: number, limit: number, title:string,
      field: string[], value: string[],
      type: string[], comparison: string[]): Observable<any> {

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

        // itemLayers[title] = [];
        cswRecords.forEach(function(item, i, ar) {
          const itemLayer = new LayerModel();
          itemLayer.cswRecords = [item];
          itemLayer['expanded'] = false;
          itemLayer.id = item.id;
          itemLayer.description = item.description;
          itemLayer.hidden = false;
          itemLayer.layerMode = 'NA';
          itemLayer.name = item.name;
          itemLayers.push(itemLayer);
        });

          // return response['data'];
          return {
            itemLayers: itemLayers,
            data:response['data']
          }
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

}
