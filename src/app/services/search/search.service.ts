import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuscopeApiService } from '../api/auscope-api.service';
import { SearchResponse } from 'app/models/searchresponse.model';


@Injectable({ providedIn: 'root' })
export class SearchService {

  constructor(private apiService: AuscopeApiService) {}

  public getSearchKeywords(): Observable<string[]> {
    return this.apiService.getSearchKeywords();
  }

  /**
   * Suggest terms for search completion
   * @param query the query text
   * @returns a list of completion suggestion strings
   */
  public suggestTerm(query: string): Observable<string[]> {
    return this.apiService.suggestTerms(query);
  }

  /**
   * Search CSW records and known layers
   * @param queryText the query text
   * @param searchFields the CSWRecordModel fields to search
   * @param page current page
   * @param pageSize page size
   * @param ogcServices list of OGC services to include
   * @param spatialRelation spatial relation (e.g. "intersects")
   * @param westBoundLongitude West bound
   * @param eastBoundLongitude East bound
   * @param southBoundLatitude South bound
   * @param northBoundLatitude North bound
   * @returns a list of CSW records and known layers
   */
  public searchCSWRecords(queryText: string, searchFields: string[], page: number, pageSize: number, ogcServices: string[], spatialRelation: string,
          westBoundLongitude: number, eastBoundLongitude: number, southBoundLatitude: number, northBoundLatitude: number): Observable<SearchResponse> {
  return this.apiService.searchCSWRecords(queryText, searchFields, page, pageSize, ogcServices,
    spatialRelation, westBoundLongitude, eastBoundLongitude, southBoundLatitude, northBoundLatitude);
  }

}
