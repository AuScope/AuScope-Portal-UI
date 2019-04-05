
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map, timeoutWith} from 'rxjs/operators';
import { Bbox } from '../../../model/data/bbox.model';
import { LayerModel } from '../../../model/data/layer.model';
import { LayerHandlerService } from '../../cswrecords/layer-handler.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable, Inject} from '@angular/core';
import * as $ from 'jquery';
import { environment } from '../../../../../environments/environment';
declare var gtag: Function;

/**
 * Use OlMapService to add layer to map. This service class adds wfs layer to the map
 */
@Injectable()
export class DownloadWfsService {



  constructor(private layerHandlerService: LayerHandlerService, private http: HttpClient, @Inject('env') private env) {

  }

  /**
   * down the layer
   * @param the layer to download
   * @param bbox the bounding box of the area to download
   */
  public download(layer: LayerModel, bbox: Bbox): Observable<any> {

    try {
      const wfsResources = this.layerHandlerService.getWFSResource(layer);
      if (environment.googleAnalyticsKey && typeof gtag === 'function') {
        gtag('event', 'CSVDownload',  {'event_category': 'CSVDownload', 'event_action': layer.id });
      }
      let downloadUrl = 'getAllFeaturesInCSV.do';
      if (layer.proxyDownloadUrl && layer.proxyDownloadUrl.length > 0) {
        downloadUrl = layer.proxyDownloadUrl;
      } else if (layer.proxyUrl && layer.proxyUrl.length > 0) {
        downloadUrl = layer.proxyUrl;
      }

      let httpParams = new HttpParams();
      httpParams = httpParams.set('outputFormat', 'csv');

      for (let i = 0; i < wfsResources.length; i++) {
        const filterParameters = {
          serviceUrl: wfsResources[i].url,
          typeName: wfsResources[i].name,
          maxFeatures: 0,
          outputFormat: 'csv',
          bbox: bbox ? JSON.stringify(bbox) : ''
        };

        const serviceUrl = this.env.portalBaseUrl + downloadUrl + '?';


        httpParams = httpParams.append('serviceUrls', serviceUrl + $.param(filterParameters));
      }

      return this.http.get(this.env.portalBaseUrl + 'downloadGMLAsZip.do', {
        params: httpParams,
        responseType: 'blob'
      }).pipe(timeoutWith(360000, observableThrowError(new Error('Request have timeout out after 5 minutes'))),
        map((response) => { // download file
          return response;
        }), catchError((error: Response) => {
          return observableThrowError(error);
        }), );
    } catch (e) {
      return observableThrowError(e);
    }

  }
}
