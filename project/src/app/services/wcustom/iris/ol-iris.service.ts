
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';

import { CSWRecordModel } from '../../../portal-core-ui/model/data/cswrecord.model';
import { Injectable, Inject } from '@angular/core';
import {LayerModel} from '../../../portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../../portal-core-ui/model/data/onlineresource.model';
import { LayerHandlerService } from '../../../portal-core-ui/service/cswrecords/layer-handler.service';
import { OlMapObject } from '../../../portal-core-ui/service/openlayermap/ol-map-object';
import {HttpClient, HttpParams} from '@angular/common/http';
import olMap from 'ol/map';
import olLayerVector from 'ol/layer/vector';
import olSourceVector from 'ol/source/vector';
import olFormatKML from 'ol/format/kml';
import { Constants } from '../../../portal-core-ui/utility/constants.service';
import { RenderStatusService } from '../../../portal-core-ui/service/openlayermap/renderstatus/render-status.service';

/**
 * Use OlMapService to add layer to map. This service class adds wfs layer to the map
 */
@Injectable()
export class OlIrisService {

  private map: olMap;

  constructor(private olMapObject: OlMapObject, private layerHandlerService: LayerHandlerService,
                  private http: HttpClient,
                  private renderStatusService: RenderStatusService, @Inject('env') private env) {
    this.map = this.olMapObject.getMap();
  }

  /**
   * A get feature request
   * @param layer the wfs layer for the getfeature request to be made
   * @param onlineresource the wfs online resource
   * @return Observable the observable from the http request
   */
  public getKMLFeature(layer: LayerModel, onlineResource: OnlineResourceModel): Observable<any> {

    const irisResources = this.layerHandlerService.getOnlineResources(layer, Constants.resourceType.IRIS);
    const irisResource = irisResources[0];
    const serviceUrl = irisResource.url;
    const networkCode = irisResource.name;

    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', irisResource.url);
    httpParams = httpParams.append('networkCode', irisResource.name);


    if (layer.proxyUrl) {
      return this.http.get(this.env.portalBaseUrl + layer.proxyUrl, {
        params: httpParams
      }).pipe(map(response => {
        if (response['success'] === true) {
          return response['msg'];
        } else {
          return observableThrowError(response['Error retriving IRIS data']);
        }
      }), catchError(
        (error: Response) => {
          return observableThrowError(error);
        }
      ), );
    };
  }


  /**
   * Add the wfs layer
   * @param layer the layer to add to the map
   * @param the wfs layer to be added to the map
   */
  public addLayer(layer: LayerModel, param?: any): void {
    const irisOnlineResources = this.layerHandlerService.getOnlineResources(layer, Constants.resourceType.IRIS);


    for (const onlineResource of irisOnlineResources) {

      this.renderStatusService.addResource(layer, onlineResource);

      this.getKMLFeature(layer, onlineResource).subscribe(response => {
        this.renderStatusService.updateComplete(layer, onlineResource);
        const kmlLayer = new olLayerVector({
          source: new olSourceVector({features: []})
        });
        const features = new olFormatKML().readFeatures(response, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });
        features.forEach(feature => {
          feature.layer = layer;
          kmlLayer.getSource().addFeature(feature);
        })
        this.olMapObject.addLayerById(kmlLayer, layer.id);

      },
        err => {
          this.renderStatusService.updateComplete(layer, onlineResource, true);
        });
    }
  }

  public addCSWRecord(cswRecord: CSWRecordModel) {

  }


}
