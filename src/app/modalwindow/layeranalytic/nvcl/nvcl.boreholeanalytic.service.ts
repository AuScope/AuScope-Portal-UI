
import { throwError as observableThrowError, Observable } from 'rxjs';

import { catchError, map } from 'rxjs/operators';
import { LayerModel } from '../../../lib/portal-core-ui/model/data/layer.model';
import { RenderStatusService } from '../../../lib/portal-core-ui/service/cesium-map/renderstatus/render-status.service';
import { LayerHandlerService } from '../../../lib/portal-core-ui/service/cswrecords/layer-handler.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { config } from '../../../../environments/config';

import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { UILayerModel } from 'app/menupanel/common/model/ui/uilayer.model';

declare let Cesium;

@Injectable()
export class NVCLBoreholeAnalyticService {


  constructor(private http: HttpClient,
    private layerHandlerService: LayerHandlerService,
    private layerManagerService: LayerManagerService,
    private renderStatusService: RenderStatusService,
    private uiLayerModelService: UILayerModelService,
    @Inject(LOCAL_STORAGE) private storage: StorageService) {
  }

  private styleNVCLAnalyticalGeoJsonEntity(entity) {
    let dotColor = Cesium.Color.YELLOW;
    if (entity.properties.Message) {
      const message = entity.properties.Message.getValue();
      if (message.indexOf('Hit') >= 0) {
        dotColor = Cesium.Color.BLUE;
      } else if (message.indexOf('Fail') >= 0 || message.indexOf('Miss') >= 0) {
        dotColor = Cesium.Color.RED;
      } else {
        dotColor = Cesium.Color.YELLOW;
      }
    }
    entity.point = new Cesium.PointGraphics({
      color: dotColor,
      outlineColor: dotColor,
      outlineWidth: 2,
      pixelSize: 20,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 8000000.0),
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 0.35, 1.5e7, 0.35),
    });
  }

  public addGeoJsonLayer(name: string, jsonData: any): void {
    const layerId = 'GEOJSON_' + name;
    if (this.uiLayerModelService.isLayerAdded(layerId)) {
      alert("This NVCLAnalytical-Job-Result has been added already!");
      return;
    }
    const me = this;
    const proxyUrl = "";
    let layerRec: LayerModel= null;
    // Make a layer model object
    layerRec = me.layerHandlerService.makeCustomGEOJSONLayerRecord(name, proxyUrl, jsonData);
    layerRec.group = 'geojson-layer';
    layerRec.stylefn = this.styleNVCLAnalyticalGeoJsonEntity.bind(this);
    // Configure layers so it can be added to map
    const uiLayerModel = new UILayerModel(layerRec.id, 100, me.renderStatusService.getStatusBSubject(layerRec));
    me.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
    me.layerManagerService.addLayer(layerRec, [], null, null);
  }

  public getNVCLGeoJson(jobId:string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);
    httpParams = httpParams.append('format', 'json');
    return this.http.get(environment.nVCLAnalyticalUrl + 'downloadNVCLJobResult.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response) {
        return JSON.stringify(response);
      } else {
        return observableThrowError('error');
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }


  public getNVCLAlgorithms(): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = config.nvclUrl;

    httpParams = httpParams.append('serviceUrl', nvclUrl);
    return this.http.get(environment.portalBaseUrl + 'getNVCLAlgorithms.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public getNVCLClassifications(algorithmOutputIds: string[]): Observable<any> {
    if (algorithmOutputIds.length <= 0) {
      return observableThrowError('No algorithmOUtputId specified');
    }
    let httpParams = new HttpParams();
    const nvclUrl = config.nvclUrl;

    for (const algorithmOutputId of algorithmOutputIds) {
      httpParams = httpParams.append('algorithmOutputId', algorithmOutputId);
    }

    httpParams = httpParams.append('serviceUrl', nvclUrl);
    return this.http.get(environment.portalBaseUrl + 'getNVCLClassifications.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public getTSGAlgorithmList(): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('outputFormat', 'json');
    return this.http.get(environment.nVCLAnalyticalUrl + 'listTsgAlgorithms.do', {
      params: httpParams
    }).pipe(map(response => {
        return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }


  public getTSGAlgorithm(tsgAlgName: string): Observable<any> {

    let httpParams = new HttpParams();
    httpParams = httpParams.append('tsgAlgName', tsgAlgName);
    httpParams = httpParams.append('outputFormat', 'json');
    return this.http.get(environment.nVCLAnalyticalUrl + 'getTsgAlgorithms.do', {
      params: httpParams
    }).pipe(map(response => {
        return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public submitNVCLAnalyticalJob(parameters: any, layer: LayerModel): Observable<any> {
    let httpParams = new HttpParams();

    const wfsResources = this.layerHandlerService.getWFSResource(layer);
    for (const wfsUrl of layer.wfsUrls) {
      httpParams = httpParams.append('serviceurls', wfsUrl.toString());
    }

    httpParams = httpParams.append('email', parameters.email);
    httpParams = httpParams.append('jobname', parameters.jobName);

    for (const algorithmOutputId of parameters.algorithmOutputIds) {
      httpParams = httpParams.append('algorithmoutputid', algorithmOutputId);
    }

    httpParams = httpParams.append('classification', parameters.classification);
    if (parameters.logName) { httpParams = httpParams.append('logname', parameters.logName); }
    httpParams = httpParams.append('filter', parameters.ogcFilter);
    httpParams = httpParams.append('startdepth', parameters.startDepth);
    httpParams = httpParams.append('enddepth', parameters.endDepth);
    httpParams = httpParams.append('logicalop', parameters.operator);
    httpParams = httpParams.append('value', parameters.value);
    httpParams = httpParams.append('units', parameters.units);
    httpParams = httpParams.append('span', parameters.span);


    return this.http.get(environment.nVCLAnalyticalUrl + 'submitNVCLAnalyticalJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['response'] ==="SUCCESS") {
        return true;
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public submitNVCLTSGModJob(parameters: any, layer: LayerModel): Observable<any> {
    let httpParams = new HttpParams();

    for (const wfsUrl of layer.wfsUrls) {
      httpParams = httpParams.append('serviceurls', wfsUrl.toString());
    }
    httpParams = httpParams.append('email', parameters.email);
    httpParams = httpParams.append('jobname', parameters.jobName);
    httpParams = httpParams.append('tsgAlgName', parameters.tsgAlgName);
    httpParams = httpParams.append('tsgScript', parameters.tsgAlgorithm);
    httpParams = httpParams.append('filter', parameters.ogcFilter);
    httpParams = httpParams.append('startdepth', parameters.startDepth);
    httpParams = httpParams.append('enddepth', parameters.endDepth);
    httpParams = httpParams.append('logicalop', parameters.operator);
    httpParams = httpParams.append('value', parameters.value);
    httpParams = httpParams.append('units', parameters.units);
    httpParams = httpParams.append('span', parameters.span);


    return this.http.get(environment.nVCLAnalyticalUrl + 'submitNVCLTSGModJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['response'] ==="SUCCESS") {
        return true;
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public checkNVCLAnalyticalJobStatus(email: string): Observable<any> {
    let httpParams = new HttpParams();

    httpParams = httpParams.append('email', email);


    return this.http.get(environment.nVCLAnalyticalUrl + 'checkNVCLAnalyticalJobStatus.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response === null) {
        return observableThrowError(response['msg']);
      } else {
        return response;
      }
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public getNVCLJobPublishStatus(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'getNvclJobPublishStatus.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }

  public publishNvclJob(jobId: string, bPublished: boolean): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);
    httpParams = httpParams.append('publish', bPublished.toString());

    return this.http.get(environment.nVCLAnalyticalUrl + 'publishNvclJob.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
      ),);
  }
// download TsgJob json result file
  public downloadNVCLJobResult(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'downloadNVCLJobResult.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(map((response) => {
      return response;
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }),)
  }
  public downloadTsgJobData(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'downloadTsgJobData.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(map((response) => { // download TsgJob scalar data csv file
      return response;
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }),)
  }

  public hasSavedEmail(): boolean {
    return this.storage.has('email');
  }

  public setUserEmail(email: string): void {
    this.storage.set('email', email);
  }

  public getUserEmail(): string {
    return this.storage.get('email');
  }
}
