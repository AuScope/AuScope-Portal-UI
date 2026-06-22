import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable()
export class RemanentAnomaliesService {
  private http = inject(HttpClient);


}
