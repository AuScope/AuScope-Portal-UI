import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OnlineResourceModel } from '../../../model/data/onlineresource.model';
import { GSML41StyleService } from './gsml41-style.service';
import { BoreholeStyleService } from './borehole-style.service';
import { NVCLBoreholeStyleService } from './nvcl-borehole-style.service';
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
import { LayerModel } from 'app/lib/portal-core-ui/model/data/layer.model';
import { config } from '../../../../../../../src/environments/config';

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
    onlineResource: OnlineResourceModel,
    param: any,
    layer: LayerModel
  ): Observable<any> {
    // Pass through any sld_bodys already set
    if (param?.sld_body && param.sld_body !== '') {
      return new Observable((observer) => {
        observer.next(param.sld_body);
        observer.complete();
      });
    }

    // Skip out if 'styles' already defined
    if (param.styles && param.styles !== '') {
      return new Observable((observer) => {
        observer.next("");
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
    const styleConfig = this.config.styleServices[layer.id];
    if (styleConfig) {
      return new Observable((observer) => {
        try {
          // Get the style service
          const StyleService = this.styleServiceMap[styleConfig.serviceName];
          if (!StyleService) {
            throw new Error(`Style service ${styleConfig.serviceName} not found`);
          }

          // Some services are GeoSciML-lite v4.1 and need XML namespace adjustment
          let url = null;
          try {
              url = new URL(onlineResource.url);
          } catch (_error) {
              // skip
          }
          for (const entry of config.insertGeoSciMLNS) {
            if (url?.hostname.endsWith(entry.url) && onlineResource.name === entry.layerName
                    && layer.id === entry.layerId) {
              param.gsmlpNamespace = entry.gsmlpNamespace;
              break;
            }
          }
          for (const entry of config.insertERLNS) {
            if (url?.hostname.endsWith(entry.url) && onlineResource.name === entry.layerName
                    && layer.id === entry.layerId) {
              param.erlNamespace = entry.erlNamespace;
              break;
            }
          }
          // End patch

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

    return new Observable((observer) => {
        observer.next(null);
        observer.complete();
    });
  }
}
