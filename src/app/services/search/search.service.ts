import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuscopeApiService } from '../api/auscope-api.service';
import { SearchResponse } from 'app/models/searchresponse.model';


@Injectable({ providedIn: 'root' })
export class SearchService {

  constructor(private apiService: AuscopeApiService) {}

  /*
   * Lucene search
   */

  public getSearchKeywords(): Observable<string[]> {
    return this.apiService.getSearchKeywords();
  }

  public search(searchFields: string[], query: string): Observable<[]> {
    return this.apiService.searchLayersAndRecords(searchFields, query);
  }

  public searchBounds(searchFields: string[], query: string, spatialRelation, westBoundLongitude: number,
                      southBoundLatitude: number, eastBoundLongitude: number, northBoundLatitude: number) {
    return this.apiService.searchLayersAndRecordsBounds(searchFields, query, spatialRelation, westBoundLongitude,
                                                        southBoundLatitude, eastBoundLongitude, northBoundLatitude);
  }

  /*
  public suggestTerm(query: string, num: number) {
    return this.apiService.suggestTerms(query, num);
  }
  */
  public suggestTerm(query: string) {
    return this.apiService.suggestTerms(query);
  }

  /*
   * Elasticsearch search
   */

  /*
  public queryKnownLayersAndCSWRecords(searchFields: string[], query: string, includeCSWRecordResults: boolean): Observable<SearchResponse> {
    return this.apiService.queryKnownLayersAndCswRecords(searchFields, query, includeCSWRecordResults);
  }
  */

  /*
  public facetedSearchKnownLayersAndCSWRecordsMultiSearch(queryText: string, searchFields: string[], ogcServices: string[], spatialRelation: string, westBoundLongitude: number,
      eastBoundLongitude: number, southBoundLatitude: number, northBoundLatitude: number, includeCSWRecordResults: boolean): Observable<SearchResponse> {
    return this.apiService.facetedSearchKnownLayersAndCswRecordsMultiSearch(queryText, searchFields, ogcServices, spatialRelation, westBoundLongitude,
                                eastBoundLongitude, southBoundLatitude, northBoundLatitude, includeCSWRecordResults);
  }
  */

  /*
  public queryKnownLayersAndCSWRecords(queryText: string, searchFields: string[], pageNo: number,
              ogcServices: string[], spatialRelation: string, westBoundLongitude: number, eastBoundLongitude: number, southBoundLatitude: number,
              northBoundLatitude: number, includeCSWRecordResults: boolean): Observable<SearchResponse> {
    return this.apiService.queryKnownLayersAndCswRecords(queryText, searchFields, pageNo, ogcServices,
              spatialRelation, westBoundLongitude, eastBoundLongitude, southBoundLatitude, northBoundLatitude, includeCSWRecordResults);
  }
  */
  public searchCSWRecords(queryText: string, searchFields: string[], page: number, pageSize: number, ogcServices: string[], spatialRelation: string,
          westBoundLongitude: number, eastBoundLongitude: number, southBoundLatitude: number, northBoundLatitude: number): Observable<SearchResponse> {
  return this.apiService.searchCSWRecords(queryText, searchFields, page, pageSize, ogcServices,
    spatialRelation, westBoundLongitude, eastBoundLongitude, southBoundLatitude, northBoundLatitude);
  }

}
