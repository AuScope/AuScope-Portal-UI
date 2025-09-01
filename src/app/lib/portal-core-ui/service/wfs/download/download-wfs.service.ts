import { throwError as observableThrowError,  Observable, ReplaySubject, Subject } from 'rxjs';

import { catchError, map, timeoutWith, mergeMap } from 'rxjs/operators';
import { Bbox } from '../../../model/data/bbox.model';
import { LayerModel } from '../../../model/data/layer.model';
import { LayerHandlerService } from '../../cswrecords/layer-handler.service';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import * as $ from 'jquery';

declare var gtag: Function;

/**
 * Service to download WFS data
 */
// @dynamic
@Injectable()
export class DownloadWfsService {
  public tsgDownloadBS: Subject<string> = null; 
  public tsgDownloadStartBS:Subject<string> = null;


  constructor(private layerHandlerService: LayerHandlerService, private http: HttpClient, @Inject('env') private env) {

  }

  /**
   * Calls AuScope API to download datasets and bundle them up into a blob object
   *
   * @param urlList list of dataset URLs
   * @returns a blob of datasets
   */
  private bundleDatasets(urlList: string[]) {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('filename', 'download.zip');
    for (const url of urlList) {
        httpParams = httpParams.append('serviceUrls', url);
    }
    return this.http.post(this.env.portalBaseUrl + 'downloadDataAsZip.do', httpParams,
    {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'blob'
    });
  }

  /**
   * Download a zip file of datasets using the 'datasetURL' feature name in
   * the getFeature response
   *
   * @param layer the layer to download
   * @param bbox the bounding box of the area to download
   * @param filter WFS filter parameter
   * @param datasetURL feature name which holds the URLs to download
   * @param omitGsmlpShapeProperty if true the gsmlp:shape property will be excluded from the download filter
   *                               (can cause problems with GADDS 2.0)
   * @returns Observable of response
   */
  public downloadDatasetURL(layer: LayerModel, bbox: Bbox, filter: string, datasetURL: string,
                            omitGsmlpShapeProperty: boolean): Observable<any> {
    try {
      const wfsResources = this.layerHandlerService.getWFSResource(layer);
      if (this.env.googleAnalyticsKey && typeof gtag === 'function') {
        gtag('event', 'DatasetDownload',  { 'event_category': 'DatasetDownload', 'event_action': layer.id });
      }
      omitGsmlpShapeProperty = omitGsmlpShapeProperty !== undefined ? omitGsmlpShapeProperty : false;
      let httpParams = new HttpParams();
      httpParams = httpParams.set('outputFormat', 'csv');
      httpParams = httpParams.set('serviceUrl', encodeURI(wfsResources[0].url))
                             .set('typeName', wfsResources[0].name)
                             .set('maxFeatures', 10000)
                             .set('outputFormat', 'json')
                             .set('bbox', bbox ? JSON.stringify(bbox) : '')
                             .set('filter', '')
                             .set('omitGsmlpShapeProperty', omitGsmlpShapeProperty);
      // Call WFS GetFeature to find the dataset URLs
      return this.http.get(this.env.portalBaseUrl + 'doBoreholeViewFilter.do', { params: httpParams}).pipe(
        timeoutWith(300000, observableThrowError(new Error('Request has timed out after 5 minutes'))),
        // 'mergeMap' can be used when you want to create nested observables
        mergeMap((response) => {
          if (response['success'] === true) {
            // Extract dataset URLs from JSON feature data
            const urlList: string[] = [];
            const jsonData = JSON.parse(response['data']['gml']);
            if (jsonData['type'] === 'FeatureCollection') {
              for (const feature of jsonData['features']) {
                  if (feature.properties.hasOwnProperty(datasetURL)) {
                    urlList.push(feature.properties[datasetURL]);
                  }
              }
            }
            // Call backend API to get zip datasets (using another observable)
            const bundle = this.bundleDatasets(urlList);
            return bundle;
          }
          return observableThrowError(response['msg']);
        })
      );
    } catch (e) {
      console.error('Download error: ', e);
      return observableThrowError(e);
    }
  }

  /**
   * Used to reset the TSG download counters
   */
  public resetTSGDownloads() {
    this.tsgDownloadBS = new ReplaySubject<string>(0);
  }

  /**
   * Download the TsgFileUrls from qurey result of a bbox or polygon filter
   *
   * @param layer the layer to download
   * @param bbox the bounding box of the area to download
   * @param polygonFilter WFS filter parameter
   */
  public downloadTsgFileUrls(layer: LayerModel, bbox: Bbox, email: string, polygonFilter: string): Observable<any> {
      try {
        const wfsResources = this.layerHandlerService.getWFSResource(layer);
        if (this.env.googleAnalyticsKey && typeof gtag === 'function') {
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
        httpParams = httpParams.set('email', email);

        for (let i = 0; i < wfsResources.length; i++) {
          const filterParameters = {
            serviceUrl: wfsResources[i].url,
            typeName: wfsResources[i].name,
            maxFeatures: 10000,
            outputFormat: 'csv',
            bbox: bbox ? JSON.stringify(bbox) : '',
            filter: polygonFilter
          };
          const serviceUrl = this.env.portalBaseUrl + downloadUrl + '?';
          httpParams = httpParams.append('serviceUrls', serviceUrl + $.param(filterParameters));
        }

        return this.http.post(this.env.portalBaseUrl + 'downloadTsgFiles.do', httpParams.toString(), {
          headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
          responseType: 'text'
        }).pipe(timeoutWith(360000, observableThrowError(new Error('Request have timeout out after 6 minutes'))),
          map((response) => { // download file
            return response;
      }), catchError((error: HttpResponse<any>) => {
            return observableThrowError(error);
          }), );
      } catch (e) {
        return observableThrowError(e);
      }

    }
  public checkTsgDownloadAvailable(): Observable<any> {
    return this.http.get(this.env.portalBaseUrl + 'isTSGDownloadAvailable.do', {
      responseType: 'json'
    }).pipe(timeoutWith(360000, observableThrowError(new Error('Request have timeout out after 6 minutes'))),
      map((response) => {
        return response;
    }), catchError((error: HttpResponse<any>) => {
        return observableThrowError(error);
    }), );
  }

  /**
   * Download a TSG file
   *
   * @param url 
   */
  public downloadTsgFile(url: string): Observable<any> {
    //https://nvcldb.blob.core.windows.net/nvcldb/GBD021_chips.zip
    //https://nvclanalyticscache.z8.web.core.windows.net/Qld/Mirrica1.zip'
    return this.http.get( url, { responseType: 'blob'}).pipe(timeoutWith(6000000, observableThrowError(new Error('Request have timeout out after 100 minutes'))),
      map((response) => { // download file
      return response;
    }), catchError((error: HttpResponse<any>) => {
        return observableThrowError(error);
    }), );

  }

  /**
   * Download the layer feature info as a CSV file
   *
   * @param layer the layer to download
   * @param bbox the bounding box of the area to download
   * @param polygonFilter WFS filter parameter
   * @param bZip download as a zip file
   */
  public downloadCSV(layer: LayerModel, bbox: Bbox, polygonFilter: String, bZip: boolean): Observable<any> {

    try {
      const wfsResources = this.layerHandlerService.getWFSResource(layer);
      if (this.env.googleAnalyticsKey && typeof gtag === 'function') {
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
          maxFeatures: 10000,
          outputFormat: 'csv',
          bbox: bbox ? JSON.stringify(bbox) : '',
          filter: polygonFilter
        };
        const serviceUrl = this.env.portalBaseUrl + downloadUrl + '?';
        httpParams = httpParams.append('serviceUrls', serviceUrl + $.param(filterParameters));
      }
      let downloadObserver; 
      if (bZip) {
        downloadObserver = this.http.post(this.env.portalBaseUrl + 'downloadGMLAsZip.do', httpParams.toString(), {
          headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'), 
          responseType: 'blob'
        });
      } else {
        downloadObserver = this.http.post(this.env.portalBaseUrl + 'downloadNvclCSV.do', httpParams.toString(), {
          headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'), 
          responseType: 'text'
        });
      }
      return downloadObserver.pipe(timeoutWith(360000, observableThrowError(new Error('Request have timeout out after 6 minutes'))),
        map((response) => { // download file
          return response;
        }), catchError((error: HttpResponse<any>) => {
          return observableThrowError(error);
        }), );
    } catch (e) {
      return observableThrowError(e);
    }

  }
}
