
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';

import { Injectable, Inject } from '@angular/core';
import {LayerModel} from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { PrimitiveModel } from '../../model/data/primitive.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { OlMapObject } from '../openlayermap/ol-map-object';
import {HttpClient, HttpParams} from '@angular/common/http';
import olMap from 'ol/map';
import olPoint from 'ol/geom/point';
import olProj from 'ol/proj';
import olFeature from 'ol/feature';
import olStyle from 'ol/style/style';
import olIcon from 'ol/style/icon';
import olLayerVector from 'ol/layer/vector';
import olSourceVector from 'ol/source/vector';
import { GMLParserService } from '../../utility/gmlparser.service';
import { Constants } from '../../utility/constants.service';
import { UtilitiesService } from '../../utility/utilities.service';
import { RenderStatusService } from '../openlayermap/renderstatus/render-status.service';

/**
 * Use OlMapService to add layer to map. This service class adds wfs layer to the map
 */
@Injectable()
export class OlWFSService {

  private map: olMap;

  constructor(private layerHandlerService: LayerHandlerService,
                  private olMapObject: OlMapObject,
                  private http: HttpClient,
                  private gmlParserService: GMLParserService,
                  private renderStatusService: RenderStatusService, @Inject('env') private env) {
    this.map = this.olMapObject.getMap();
  }

  /**
   * A get feature request
   * @param layer the wfs layer for the getfeature request to be made
   * @param onlineresource the wfs online resource
   * @return Observable the observable from the http request
   */
  public getFeature(layer: LayerModel, onlineResource: OnlineResourceModel, param: any): Observable<any> {


    let httpParams = Object.getOwnPropertyNames(param).reduce((p, key1) => p.set(key1, param[key1]), new HttpParams());
    httpParams = httpParams.append('serviceUrl', onlineResource.url);
    httpParams = httpParams.append('typeName', onlineResource.name);
    httpParams = UtilitiesService.convertObjectToHttpParam(httpParams, param);

    if (layer.proxyUrl) {
      return this.http.get(this.env.portalBaseUrl + layer.proxyUrl, {
        params: httpParams
      }).pipe(map(response => {
        return response['data'];
      }));
    } else {
      return this.http.get(this.env.portalBaseUrl + 'getAllFeatures.do', {
        params: httpParams
      }).pipe(map(response => {
        return response['data'];
      }), catchError(
        (error: Response) => {
          return observableThrowError(error);
        }
      ), );
    }
  }



  /**
   * Add geometry type point to the map
   * @param layer the layer where this point derived from
   * @param primitive the point primitive
   */
  public addPoint(layer: LayerModel, onlineResource: OnlineResourceModel, primitive: PrimitiveModel): void {
     const geom = new olPoint(olProj.transform([primitive.coords.lng, primitive.coords.lat], 'EPSG:4326', 'EPSG:3857'));
       const feature = new olFeature(geom);
       feature.setStyle([
          new olStyle({
             image: new olIcon(({
                     anchor: [0.5, 1],
                     anchorXUnits: 'fraction',
                     anchorYUnits: 'fraction',
                     // size: [32, 32],
                     scale: 0.5,
                     opacity: 1,
                     src: layer.iconUrl
           }))
          })
       ]);

       if (primitive.name) {
         feature.setId(primitive.name);
       }
       feature.onlineResource = onlineResource;
       feature.layer = layer;
    // VT: we chose the first layer in the array based on the assumption that we only create a single vector
    // layer for each wfs layer. WMS may potentially contain more than 1 layer in the array. note the difference
    (<olLayerVector>this.olMapObject.getLayerById(layer.id)[0]).getSource().addFeature(feature);
  }

  public addLine(primitive: PrimitiveModel): void {

  }

  public addPoloygon(primitive: PrimitiveModel): void {

  }

  /**
   * Add the wfs layer
   * @param layer the layer to add to the map
   * @param the wfs layer to be added to the map
   */
  public addLayer(layer: LayerModel, param?: any): void {
    const wfsOnlineResources = this.layerHandlerService.getWFSResource(layer);

    // VT: create the vector on the map if it does not exist.
    if (!this.olMapObject.getLayerById(layer.id)) {
        const markerLayer = new olLayerVector({
                    source: new olSourceVector({ features: []})
                });

        this.olMapObject.addLayerById(markerLayer, layer.id);
    }

    for (const onlineResource of wfsOnlineResources) {
      if (UtilitiesService.filterProviderSkip(param.optionalFilters, onlineResource.url)) {
        this.renderStatusService.skip(layer, onlineResource);
        continue;
      }
      this.renderStatusService.addResource(layer, onlineResource);
      const collatedParam = UtilitiesService.collateParam(layer, onlineResource, param);
      this.getFeature(layer, onlineResource, collatedParam).subscribe(response => {
        this.renderStatusService.updateComplete(layer, onlineResource);
        const rootNode = this.gmlParserService.getRootNode(response.gml);
        const primitives = this.gmlParserService.makePrimitives(rootNode);
        if (!layer.iconUrl) {
          layer.iconUrl = Constants.getRandomPaddle();
        }
        for (const primitive of primitives) {
          switch (primitive.geometryType) {
            case Constants.geometryType.POINT:
               this.addPoint(layer, onlineResource, primitive);
              break;
            case Constants.geometryType.LINESTRING:
               this.addLine(primitive);
               break;
            case Constants.geometryType.POLYGON:
               this.addPoloygon(primitive);
               break;
          }
        }

      },
      err =>  {
        this.renderStatusService.updateComplete(layer, onlineResource, true);
      });
    }
  }


}
