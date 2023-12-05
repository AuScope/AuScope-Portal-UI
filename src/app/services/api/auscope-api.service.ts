import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Bookmark } from 'app/models/bookmark.model';
import { PermanentLink } from 'app/models/permanentlink.model';
import { User } from 'app/models/user.model';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SearchResponse } from 'app/models/searchresponse.model';

interface ApiResponse<T> {
  data: T;
  msg: string;
  success: boolean;
}

function apiData<T>(response: ApiResponse<T>): Observable<T> {
  // Convert a VGL error into an Observable error
  if (!response.success) {
    console.log('API response error: ' + JSON.stringify(response));
    return throwError(response.msg);
  }

  // Otherwise, wrap the response data in a new Observable an return.
  return of(response.data);
}

@Injectable({ providedIn: 'root' })
export class AuscopeApiService {

  constructor(private http: HttpClient) {}

  private apiRequest<T>(endpoint: string, options: any = {}): Observable<T> {
    const params = options.params || {};
    const opts = {...options};
    delete opts.params;
    return this.apiGet<T>(endpoint, params, opts);
  }

  private apiPost<T>(endpoint: string, params = {}, options = {}): Observable<T> {
    const url = environment.portalProxyUrl + endpoint;
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
    const url = environment.portalProxyUrl + endpoint;
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

  public searchLayersAndRecords(searchFields: string[], query: string): Observable<any> {
    let params: HttpParams = new HttpParams();
    params = params.append('query', query);
    for (const field of searchFields) {
      params = params.append('searchFields', field);
    }
    return this.apiGet<any>('searchCSWRecords.do', params);
  }

  public searchLayersAndRecordsBounds(searchFields: string[], query: string, spatialRelation: string, westBoundLongitude: number,
                                southBoundLatitude: number, eastBoundLongitude: number, northBoundLatitude: number): Observable<any> {
    let params: HttpParams = new HttpParams();
    params = params.append('query', query);
    for (const field of searchFields) {
      params = params.append('searchFields', field);
    }
    params = params.append('spatialRelation', spatialRelation);
    params = params.append('southBoundLatitude', southBoundLatitude);
    params = params.append('westBoundLongitude', westBoundLongitude);
    params = params.append('northBoundLatitude', northBoundLatitude);
    params = params.append('eastBoundLongitude', eastBoundLongitude);
    return this.apiGet<any>('searchCSWRecords.do', params);
  }

  public getSearchKeywords(): Observable<string[]> {
    return this.apiGet<string[]>('getSearchKeywords.do');
  }

  /*
  public suggestTerms(term: string, num: number): Observable<string[]> {
    const params = {
      term: term,
      num: num
    };
    return this.apiGet<string[]>('suggestTerms.do', params);
  }
  */
  public suggestTerms(term: string): Observable<string[]> {
    const params = {
      query: term
    };
    //return this.apiGet<string[]>('suggestTerms.do', params);
    return this.apiGet<string[]>('getIndexSuggestions.do', params);
  }

  public get user(): Observable<User> {
    return this.apiGet<User>('secure/getUser.do');
  }

  // Add bookmark to database
  public addBookmark(layerId: string): Observable<number> {
    const options = {
        params: {
            fileIdentifier: layerId,
            serviceId: ''
        }
    };
    return this.apiRequest('secure/addBookMark.do', options);
  }

  // Remove bookmark information from database
  public removeBookmark(bookmarkId: number) {
    const options = {
        params: {
            id: bookmarkId.toString()
        }
    };
    return this.apiRequest('secure/deleteBookMark.do', options);
  }

  // Get list of bookmarks for a user
  public getBookmarks(): Observable<Bookmark[]> {
      return this.apiRequest('secure/getBookMarks.do');
  }

  /**
   * List of map states for the currently logged in user
   * @returns list of PermanentLinks
   */
  public getUserPortalStates(): Observable<PermanentLink[]> {
    return this.apiRequest<PermanentLink[]>('secure/getUserPortalStates.do').pipe(map(states => {
      const stateArray = [];
      for(const s of states) {
        s.jsonState = JSON.parse(s.jsonState);
        stateArray.push(s);
      }
      return stateArray;
    }));
  }

  /**
   * Retrieve a specific state, if it is private then it must belong to the currently logged in user
   * @param stateId the ID of the state
   * @returns the PermanentLink
   */
  public getPortalState(stateId: string): Observable<PermanentLink> {
    const options = {
      params: {
          stateId: stateId
      }
    };
    return this.apiRequest<PermanentLink>('getPortalState.do', options).pipe(map(state => {
      state.jsonState = JSON.parse(state.jsonState);
      return state;
    }), catchError(
      (error: HttpResponse<any>) => {
        return throwError(error);
      }),
    );
  }

  /**
   * Save a user map state
   * @param id the state ID
   * @param name the state name
   * @param description optional state description
   * @param jsonState the map state as a JSON string
   * @param isPublic if true the state is accessible by all, false then only the currently logged in user
   * @returns true response on success, false otherwise
   */
  public saveUserPortalState(id: string, name: string, description: string, jsonState: string, isPublic: boolean) {
    const options = {
      params: {
          id: id,
          name: name,
          description: description,
          jsonState: jsonState,
          isPublic: isPublic
      }
    };
    return this.apiRequest<string>('secure/savePortalState.do', options);
  }

  /**
   * Save an anonymous user map state
   * @param id the state ID
   * @param name the state name
   * @param description optional state description
   * @param jsonState the map state as a JSON string
   * @param isPublic if true the state is accessible by all, false then only the currently logged in user
   * @returns true response on success, false otherwise
   */
  public saveAnonymousPortalState(id: string, name: string, description: string, jsonState: string, isPublic: boolean) {
    const options = {
      params: {
          id: id,
          name: name,
          description: description,
          jsonState: jsonState,
          isPublic: isPublic
      }
    };
    return this.apiRequest<string>('savePortalState.do', options);
  }

  /**
   * Update existing user map state
   * @param id the ID of the state to update
   * @param userId the ID of the user
   * @param name the name of the state
   * @param description optional description of the state
   * @param isPublic if true the state is accessible by all, false then only the currently logged in user
   * @returns true response on success, false otherwise
   */
  public updateUserPortalState(id: string, userId: string, name: string, description: string, isPublic: boolean) {
    const options = {
      params: {
          id: id,
          userId: userId,
          name: name,
          description: description,
          isPublic: isPublic
      }
    };
    return this.apiRequest<string>('secure/updatePortalState.do', options);
  }

  /**
   * Delete a user map state
   * @param stateId the ID of the state to delete
   * @returns true response on success, false otherwise
   */
  public deleteUserPortalState(stateId: string) {
    const options = {
      params: {
          id: stateId,
      }
    };
    return this.apiRequest<string>('secure/deletePortalState.do', options);
  }

  /**
   * 
   * @param searchFields 
   * @param queryText 
   * @param includeCSWRecordResults 
   * @returns 
   */
  /*
  public queryKnownLayersAndCswRecords(searchFields: string[], queryText: string, includeCSWRecordResults: boolean): Observable<SearchResponse> {
    let params: HttpParams = new HttpParams();
    params = params.append('query', queryText);
    for (const field of searchFields) {
      params = params.append('fields', field);
    }
    params = params.append('includeCSWRecordResults', includeCSWRecordResults);
    return this.apiGet<any>('queryKnownLayersAndCSWRecords.do', params);
  }
  */
  /*
  public facetedSearchKnownLayersAndCswRecordsMultiSearch(queryText: string, searchFields: string[], ogcServices: string[], spatialRelation: string, westBoundLongitude: number,
      eastBoundLongitude: number, southBoundLatitude: number, northBoundLatitude: number, includeCSWRecordResults: boolean): Observable<SearchResponse> {
    let params: HttpParams = new HttpParams();
    params = params.append('query', queryText);
    for (const field of searchFields) {
      params = params.append('fields', field);
    }
    if (spatialRelation && spatialRelation !== '') {
      params = params.append('spatialRelation', spatialRelation);
    }
    if (ogcServices && ogcServices.length > 0) {
      for (const service of ogcServices) {
        params = params.append('ogcServices', service);
      }
    }
    if (westBoundLongitude && eastBoundLongitude && southBoundLatitude && northBoundLatitude) {
      params = params.append('westBoundLongitude', westBoundLongitude);
      params = params.append('eastBoundLongitude', eastBoundLongitude);
      params = params.append('southBoundLatitude', southBoundLatitude);
      params = params.append('northBoundLatitude', northBoundLatitude);
    }
    params = params.append('includeCSWRecordResults', includeCSWRecordResults);
    return this.apiGet<any>('facetedSearchKnownLayersAndCSWRecords.do', params);
  }
  */

  public queryKnownLayersAndCswRecords(queryText: string, searchFields: string[], pageNo: number, ogcServices: string[], spatialRelation: string, westBoundLongitude: number,
            eastBoundLongitude: number, southBoundLatitude: number, northBoundLatitude: number, includeCSWRecordResults: boolean): Observable<SearchResponse> {
    let params: HttpParams = new HttpParams();
    params = params.append('query', queryText);
    for (const field of searchFields) {
      params = params.append('fields', field);
    }
    if (pageNo && pageNo !== 0) {
      params = params.append('pageNo', pageNo);
    }
    if (spatialRelation && spatialRelation !== '') {
      params = params.append('spatialRelation', spatialRelation);
    }
    if (ogcServices && ogcServices.length > 0) {
      for (const service of ogcServices) {
        params = params.append('ogcServices', service);
      }
    }
    if (westBoundLongitude && eastBoundLongitude && southBoundLatitude && northBoundLatitude) {
      params = params.append('westBoundLongitude', westBoundLongitude);
      params = params.append('eastBoundLongitude', eastBoundLongitude);
      params = params.append('southBoundLatitude', southBoundLatitude);
      params = params.append('northBoundLatitude', northBoundLatitude);
    }
    params = params.append('includeCSWRecordResults', includeCSWRecordResults);
    return this.apiGet<any>('queryKnownLayersAndCSWRecords.do', params);
  }

  public searchCSWRecords(queryText: string, searchFields: string[], page: number, pageSize: number, ogcServices: string[], spatialRelation: string, westBoundLongitude: number,
      eastBoundLongitude: number, southBoundLatitude: number, northBoundLatitude: number): Observable<SearchResponse> {
    let params: HttpParams = new HttpParams();
    params = params.append('query', queryText);
    for (const field of searchFields) {
    params = params.append('fields', field);
    }
    if (page) {
      params = params.append('page', page);
    }
    if (pageSize) {
      params = params.append('pageSize', pageSize);
    }
    if (spatialRelation && spatialRelation !== '') {
    params = params.append('spatialRelation', spatialRelation);
    }
    if (ogcServices && ogcServices.length > 0) {
    for (const service of ogcServices) {
    params = params.append('ogcServices', service);
    }
    }
    if (westBoundLongitude && eastBoundLongitude && southBoundLatitude && northBoundLatitude) {
    params = params.append('westBoundLongitude', westBoundLongitude);
    params = params.append('eastBoundLongitude', eastBoundLongitude);
    params = params.append('southBoundLatitude', southBoundLatitude);
    params = params.append('northBoundLatitude', northBoundLatitude);
    }
    return this.apiGet<any>('searchCSWRecords.do', params);
  }

}
