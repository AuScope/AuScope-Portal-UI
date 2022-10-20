import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuscopeApiService } from '../api/auscope-api.service';


@Injectable({ providedIn: 'root' })
export class SearchService {

  constructor(private apiService: AuscopeApiService) {}

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

}
