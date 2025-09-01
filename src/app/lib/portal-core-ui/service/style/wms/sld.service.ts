import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OnlineResourceModel } from '../../../model/data/onlineresource.model';
import { UtilitiesService } from '../../../utility/utilities.service';
import { GSML41StyleService } from './gsml41-style.service';
import { MinTenemStyleService } from './min-tenem-style.service';
import { BoreholeStyleService } from './borehole-style.service';
import { NVCLBoreholeStyleService } from './nvcl-borehole-style.service';
import { MinOccurViewStyleService } from './min-occur-view-style.service';
import { MineStyleService } from './mine-style.service';
import { MineralOccurrenceStyleService } from './mineral-occurrence-style.service';
import { MiningActivityStyleService } from './mining-activity-style.service';
import { ErlCommodityStyleService } from './erl-commodity-resource-style.service';
import { ErlMineViewStyleService } from './erl-mine-view-style.service';
import { ErlMineralOccurrenceStyleService } from './erl-mineral-occurrence-style.service';
import { GeologicalProvincesStyleService } from './geological-provinces-style.service';
import { MineralTenementStyleService } from './mineral-tenement-style.service';
import { RemanentAnomaliesAutoSearchStyleService } from './remanent-anomalies-auto-search-style.service';
import { RemanentAnomaliesStyleService } from './remanent-anomalies-style.service';
import { GenericStyleService } from './generic-style.service';

@Injectable()
export class SldService {
  private styleServiceMap = {
    'BoreholeStyleService': BoreholeStyleService,
    'NVCLBoreholeStyleService': NVCLBoreholeStyleService,
    'MineralTenementStyleService': MineralTenementStyleService,
    'MineStyleService': MineStyleService,
    'MineralOccurrenceStyleService': MineralOccurrenceStyleService,
    'MiningActivityStyleService': MiningActivityStyleService,
    'ErlCommodityStyleService': ErlCommodityStyleService,
    'ErlMineViewStyleService': ErlMineViewStyleService,
    'ErlMineralOccurrenceStyleService': ErlMineralOccurrenceStyleService,
    'GeologicalProvincesStyleService': GeologicalProvincesStyleService,
    'RemanentAnomaliesStyleService': RemanentAnomaliesStyleService,
    'RemanentAnomaliesAutoSearchStyleService': RemanentAnomaliesAutoSearchStyleService,
    'GenericStyleService': GenericStyleService
  };

  constructor(
    private http: HttpClient,
    @Inject('env') private env,
    @Inject('conf') private config
  ) {}

  /**
   * Get the SLD from the URL
   * @param sldUrl the url containing the SLD
   * @param usePost use a HTTP POST request
   * @param onlineResource details of resource
   * @return an Observable of the HTTP request
   */
  public getSldBody(
    sldUrl: string,
    usePost: boolean,
    onlineResource: OnlineResourceModel,
    param?: any,
    layerId?: string
  ): Observable<any> {
    // Pass through any sld_bodys already set
    if (param && param.sld_body && param.sld_body !== '') {
      return new Observable((observer) => {
        observer.next(param.sld_body);
        observer.complete();
      });
    }

    // For GeoSciML 4.1 boreholes
    if (onlineResource.name === 'gsmlbh:Borehole') {
      return new Observable((observer) => {
        param.styles = onlineResource.name;
        // If borehole name was set in filter
        let nameFilter = '';
        if ('optionalFilters' in param && param.optionalFilters.length > 0) {
          for (const filt of param.optionalFilters) {
            if (filt.label === 'Name') {
              nameFilter = filt.value;
              break;
            }
          }
        }
        const sldBody = GSML41StyleService.getSld(
          onlineResource.name,
          param.styles,
          nameFilter
        );
        observer.next(sldBody);
        observer.complete();
      });
    }

    // Check if layer has a style service configured
    const styleConfig = this.config.styleServices[layerId];
    if (styleConfig) {
      return new Observable((observer) => {
        try {
          // Get the style service
          const StyleService = this.styleServiceMap[styleConfig.serviceName];
          if (!StyleService) {
            throw new Error(`Style service ${styleConfig.serviceName} not found`);
          }

          // Just merge the params and pass them through
          
          
          const sldBody = StyleService.getSld(
            onlineResource.name,
            param.styles,
            param
          );

          observer.next(sldBody);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      });
    }

    // If there is no SLD URL coming from config
    if (!sldUrl) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }

    let httpParams = Object.getOwnPropertyNames(param).reduce(
      (p, key1) => p.set(key1, param[key1]),
      new HttpParams()
    );
    httpParams = UtilitiesService.convertObjectToHttpParam(httpParams, param);
    if (!usePost) {
      return this.http
        .get(this.env.portalBaseUrl + sldUrl, {
          responseType: 'text',
          params: httpParams,
        })
        .pipe(
          map((response) => {
            return response;
          })
        );
    } else {
      return this.http
        .post(this.env.portalBaseUrl + sldUrl, httpParams.toString(), {
          headers: new HttpHeaders().set(
            'Content-Type',
            'application/x-www-form-urlencoded'
          ),
          responseType: 'text',
        })
        .pipe(
          map((response) => {
            return response;
          }),
          catchError((error: HttpResponse<any>) => {
            return throwError(error);
          })
        );
    }
  }

}
