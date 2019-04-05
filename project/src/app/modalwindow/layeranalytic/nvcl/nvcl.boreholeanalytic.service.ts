
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';
import { LayerModel } from '../../../portal-core-ui/model/data/layer.model';
import { LayerHandlerService } from '../../../portal-core-ui/service/cswrecords/layer-handler.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

@Injectable()
export class NVCLBoreholeAnalyticService {


  constructor(private http: HttpClient, private layerHandlerService: LayerHandlerService, @Inject(LOCAL_STORAGE) private storage: StorageService) {

  }

  public getNVCLAlgorithms(): Observable<any> {
    let httpParams = new HttpParams();
    const nvclUrl = 'http://nvclwebservices.vm.csiro.au/NVCLDataServices'

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
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCLClassifications(algorithmOutputIds: string[]): Observable<any> {
    if (algorithmOutputIds.length <= 0) {
      return observableThrowError('No algorithmOUtputId specified');
    }
    let httpParams = new HttpParams();
    const nvclUrl = 'http://nvclwebservices.vm.csiro.au/NVCLDataServices'

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
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getTSGAlgorithmList(): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('outputFormat', 'json');
    return this.http.get(environment.nVCLAnalyticalUrl + 'listTsgAlgorithms.do', {params: httpParams}).pipe(map(response => {
        return response;
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }


  public getTSGAlgorithm(tsgAlgName: string): Observable<any> {

    let httpParams = new HttpParams();
    httpParams = httpParams.append('tsgAlgName', tsgAlgName);
    return this.http.get(environment.portalBaseUrl + 'getTsgAlgorithms.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }


  public submitSF0NVCLProcessingJob(parameters: any, layer: LayerModel): Observable<any> {
    let httpParams = new HttpParams();

    const wfsResources = this.layerHandlerService.getWFSResource(layer);
    for (const wfsResource of wfsResources) {
      httpParams = httpParams.append('wfsUrl', wfsResource.url);
    }

    httpParams = httpParams.append('email', parameters.email);
    httpParams = httpParams.append('jobName', parameters.jobName);
    httpParams = httpParams.append('existingAlg', 'existingAlg');
    httpParams = httpParams.append('algorithm', parameters.algorithm);

    for (const algorithmOutputId of parameters.algorithmOutputIds) {
      httpParams = httpParams.append('algorithmOutputId', algorithmOutputId);
    }

    httpParams = httpParams.append('classification', parameters.classification);
    if (parameters.logName) { httpParams = httpParams.append('logName', parameters.logName); }
    httpParams = httpParams.append('startDepth', parameters.startDepth);
    httpParams = httpParams.append('endDepth', parameters.endDepth);
    httpParams = httpParams.append('operator', parameters.operator);
    httpParams = httpParams.append('value', parameters.value);
    httpParams = httpParams.append('units', parameters.units);
    httpParams = httpParams.append('span', parameters.span);


    return this.http.get(environment.portalBaseUrl + 'submitSF0NVCLProcessingJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['success'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public submitSF0NVCLProcessingTsgJob(parameters: any, layer: LayerModel): Observable<any> {
    let httpParams = new HttpParams();

    const wfsResources = this.layerHandlerService.getWFSResource(layer);
    for (const wfsResource of wfsResources) {
      httpParams = httpParams.append('wfsUrl', wfsResource.url);
    }

    httpParams = httpParams.append('email', parameters.email);
    httpParams = httpParams.append('jobName', parameters.jobName);
    httpParams = httpParams.append('existingAlg', 'existingAlg');

    httpParams = httpParams.append('tsgAlgName', parameters.tsgAlgName);
    httpParams = httpParams.append('tsgAlgorithm', parameters.tsgAlgorithm);

    httpParams = httpParams.append('startDepth', parameters.startDepth);
    httpParams = httpParams.append('endDepth', parameters.endDepth);
    httpParams = httpParams.append('operator', parameters.operator);
    httpParams = httpParams.append('value', parameters.value);
    httpParams = httpParams.append('units', parameters.units);
    httpParams = httpParams.append('span', parameters.span);


    return this.http.get(environment.portalBaseUrl + 'submitSF0NVCLProcessingTsgJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['success'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public checkNVCLProcessingJob(email: string): Observable<any> {
    let httpParams = new HttpParams();

    httpParams = httpParams.append('email', email);


    return this.http.get(environment.portalBaseUrl + 'checkNVCLProcessingJob.do', {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public getNVCLJobPublishStatus(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'getNvclJobPublishStatus.do', {
      params: httpParams
    }).pipe(map(response => {
      return response;
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
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
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public downloadNVCLProcessingResults(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobId', jobId);

    return this.http.get(environment.portalBaseUrl + 'downloadNVCLProcessingResults.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(map((response) => { // download TsgJob json result file
      return response;
    }), catchError((error: Response) => {
      return observableThrowError(error);
    }), )
  }
  public downloadTsgJobData(jobId: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jobid', jobId);

    return this.http.get(environment.nVCLAnalyticalUrl + 'downloadTsgJobData.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(map((response) => { // download TsgJob scalar data csv file
      return response;
    }), catchError((error: Response) => {
      return observableThrowError(error);
    }), )
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
