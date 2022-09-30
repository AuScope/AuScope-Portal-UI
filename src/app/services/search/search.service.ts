import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuscopeApiService } from '../api/auscope-api.service';

@Injectable({ providedIn: 'root' })
export class SearchService {

  constructor(private apiService: AuscopeApiService) {}

  public search(searchFields: string[], query: string): Observable<[]> {
    return this.apiService.searchLayersAndRecords(searchFields, query);
  }

}
