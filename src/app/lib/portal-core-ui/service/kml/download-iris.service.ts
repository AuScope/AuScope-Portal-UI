import { throwError as observableThrowError, Observable } from 'rxjs';
import { Bbox } from '../../model/data/bbox.model';
import { LayerModel } from '../../model/data/layer.model';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

/**
 * Service to download IRIS data
 */
// @dynamic
@Injectable()
export class DownloadIrisService {

    constructor(private http: HttpClient, @Inject('env') private env) {
    }

    /**
   * Download a zip file of dataselect dataset by constructing a data download URL
   * 
   * @param layer the layer to download
   * @param station station parameter for filtering
   * @param channel channel parameter for filtering
   * @param startDate startDate parameter for filtering
   * @param endDate endDate parameter for filtering
   * @param datasetURL feature name which holds the URLs to download
   * @returns Observable of response
   */
    public downloadIRISDataselect(layer: LayerModel, station: string, channel: string, startDate: string, endDate: string): Observable<any> {
        try {
            let url = layer.cswRecords[0].onlineResources[0].url + "/fdsnws/dataselect/1/query?";
            const querystring = new URLSearchParams({
                net: layer.cswRecords[0].onlineResources[0].name,
            });
            if (station) {
                querystring.append('sta', station);
            }
            if (channel) {
                querystring.append('cha', channel);
            }
            if (startDate) {
                querystring.append('start', startDate);
            }
            if (endDate) {
                querystring.append('end', endDate);
            }
            url = url + decodeURIComponent(querystring.toString());
            let httpParams = new HttpParams();
            httpParams = httpParams.set('filename', 'download.zip');
            httpParams = httpParams.append('serviceUrls', url);
            return this.http.post(this.env.portalBaseUrl + 'downloadDataAsZip.do', httpParams, {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'blob',
                observe: 'response'
            });
        } catch (e) {
            console.error("Download error:", e);
            return observableThrowError(e);
        }
    }

    /**
   * Download a zip file of station dataset by constructing a data download URL
   * 
   * @param layer the layer to download
   * @param bbox the bounding box of the area to download
   * @param station station parameter for filtering
   * @param channel channel parameter for filtering
   * @param startDate startDate parameter for filtering
   * @param endDate endDate parameter for filtering
   * @param datasetURL feature name which holds the URLs to download
   * @returns Observable of response
   */
    public downloadIRISStation(layer: LayerModel, bbox: Bbox, station: string, channel: string, startDate: string, endDate: string): Observable<any> {
        try {
            let url = layer.cswRecords[0].onlineResources[0].url + "/fdsnws/station/1/query?";
            const querystring = new URLSearchParams({
                network: layer.cswRecords[0].onlineResources[0].name,
            });
            if (station) {
                querystring.append('station', station);
            }
            if (channel) {
                querystring.append('channel', channel);
            }
            if (startDate) {
                querystring.append('start', startDate);
            }
            if (endDate) {
                querystring.append('end', endDate);
            }
            if (bbox) {
                querystring.append('maxlatitude', Math.max(bbox.southBoundLatitude, bbox.northBoundLatitude).toString());
                querystring.append('minlatitude', Math.min(bbox.southBoundLatitude, bbox.northBoundLatitude).toString());
                querystring.append('maxlongitude', Math.max(bbox.westBoundLongitude, bbox.eastBoundLongitude).toString());
                querystring.append('minlongitude', Math.min(bbox.westBoundLongitude, bbox.eastBoundLongitude).toString());
            }
            url = url + decodeURIComponent(querystring.toString());
            let httpParams = new HttpParams();
            httpParams = httpParams.set('filename', 'download.zip');
            httpParams = httpParams.append('serviceUrls', url);
            return this.http.post(this.env.portalBaseUrl + 'downloadDataAsZip.do', httpParams,
                {
                    headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                    responseType: 'blob',
                    observe: 'response'
                });
        } catch (e) {
            console.error("Download error:", e);
            return observableThrowError(e);
        }
    }
}