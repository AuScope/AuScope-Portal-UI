
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {catchError, map} from 'rxjs/operators';

import { CSWRecordModel } from 'portal-core-ui';
import { Injectable, Inject } from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {LayerModel} from 'portal-core-ui';
import { OnlineResourceModel } from 'portal-core-ui';
import { LayerHandlerService } from 'portal-core-ui';
import { CsMapObject } from 'portal-core-ui';
import olMap from 'ol/Map';
import olLayerVector from 'ol/layer/Vector';
import olSourceVector from 'ol/source/Vector';
import olFormatKML from 'ol/format/KML';
import olStyle from 'ol/style/Style';
import olStyleCircle from 'ol/style/Circle';
import olStyleFill from 'ol/style/Fill';
import olStyleStroke from 'ol/style/Stroke';
import olStyleText from 'ol/style/Text';
import { MapsManagerService } from 'angular-cesium';
import { Constants } from 'portal-core-ui';
import { RenderStatusService } from 'portal-core-ui';

declare var Cesium: any;

/**
 * Use Cesium to add layer to map. This service class adds wfs layer to the map
 */
@Injectable()
export class CsIrisService {

  private map: olMap;

  constructor(private csMapObject: CsMapObject,
              private layerHandlerService: LayerHandlerService,
              private http: HttpClient,
              private renderStatusService: RenderStatusService,
              private mapsManagerService: MapsManagerService,
              @Inject('env') private env) {
    this.map = this.csMapObject.getMap();
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
        (error: HttpResponse<any>) => {
          return observableThrowError(error);
        }
      ), );
    };
  }

  /**
   * Creates style for the points on the map
   * 
   * @param label label attached to data point on map
   * @returns openlayers style object
   */
  private irisStyleFunction(label: string) {
      var dotStyle = new olStyle({
        // Makes a circle with white boundary and purple inner
        image: new olStyleCircle({
          radius: 5,
          stroke: new olStyleStroke({
            color: 'white',
            width: 2
          }),
          fill: new olStyleFill({
            color: 'purple'
          })
        }),
        // Dark grey writing
        text: new olStyleText({
          text: label,
          textAlign: 'left',
          font: '12px roboto,sans-serif',
          fill: new olStyleFill({
              color: '#33333'
          }),
          offsetX: 6,
          offsetY: 0,
        })
      });
      return dotStyle;
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
        const parser = new DOMParser();
        const dom = parser.parseFromString(response, "application/xml");

        this.renderStatusService.updateComplete(layer, onlineResource);

        const viewer = this.getViewer();
        const options = {
          camera: viewer.scene.camera,
          canvas: viewer.scene.canvas
        };
        var source = new Cesium.KmlDataSource(options);
        source.load(dom).then(function(dataSource) {
          var entities = dataSource.entities.values;
          console.log("entities=", entities);
          for(var i=0; i<entities.length; i++) {
		        var entity = entities[i];
            if (entity.label) {
			        entity.label.showBackground = true;
			        entity.label.backgroundColor = new Cesium.Color.fromRandom({red : 0.1, maximumGreen : 0.8, minimumBlue : 0.1, alpha : 0.5});
			        entity.label.fillColor = Cesium.Color.YELLOW;
			        entity.label.outlineColor = Cesium.Color.RED;
			        entity.label.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(1.0, 8000000.0);
			        entity.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
		        }
		        if (entity.billboard) {
			        entity.billboard.color = new Cesium.Color.fromRandom({red : 0.5, maximumGreen : 0.3, minimumBlue : 0.5, alpha : 1.0});
			        entity.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
			        entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(1.0, 8000000.0);
		        }
          }
          viewer.dataSources.add(dataSource);
        }
                                                        );



        // // Set extractStyles = false to disable default style
        // const features = new olFormatKML({extractStyles: false}).readFeatures(response, {
        //   dataProjection: 'EPSG:4326',
        //   featureProjection: Constants.MAP_PROJ
        // });
        // // Loop over features and apply new style and LayerVector for each feature
        // features.forEach(feature => {

          // const kmlLayer = new olLayerVector({
          //   source: new olSourceVector({features: []}),
          //   style: this.irisStyleFunction(feature.get('name'))
          // });
          // feature.layer = layer;
          // kmlLayer.getSource().addFeature(feature);
          // this.csMapObject.addLayerById(kmlLayer, layer.id);
        // });
      },
        err => {
          this.renderStatusService.updateComplete(layer, onlineResource, true);
        });
    }
  }

  public addCSWRecord(cswRecord: CSWRecordModel) {

  }

  private getViewer() {
    return this.mapsManagerService.getMap().getCesiumViewer();
  }

}
