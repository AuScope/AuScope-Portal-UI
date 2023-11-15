import { Injectable, Inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { tsgdownload, Download } from './tsgdownload'
import { Observable, Subject } from 'rxjs'
import { SAVER, Saver } from './saver.provider'

@Injectable({providedIn: 'root'})
export class TSGDownloadService {
  public downloadOneCompletBS:Subject<string> = null;
  constructor(private http: HttpClient, @Inject(SAVER) private save: Saver) {

  }
 /**
 * Download function to start the download and return the progress feedback.
 * @param url the url for the source of download.
 * @filename the filename to save to local
 */
  download(url: string, filename?: string): Observable<Download> {
    return this.http.get(url, {
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    }).pipe(tsgdownload(blob => this.save(blob, filename)))
  }
}


