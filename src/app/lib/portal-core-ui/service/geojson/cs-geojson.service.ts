
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerModel } from '../../model/data/layer.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { MapsManagerService } from '@auscope/angular-cesium';
import { ResourceType } from '../../utility/constants.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { UtilitiesService } from '../../utility/utilities.service';


declare var Cesium;

/**
 * Use Cesium to add layer to map. This service class adds GeoJSON layer to the map
 */
@Injectable()
export class CsGeoJsonService {

  // List of geoJson layers that have been cancelled
  private cancelledLayers: Array<string> = [];
  // Number of geoJson resources added for a given layer
  private numberOfResourcesAdded: Map<string, number> = new Map<string, number>();

  constructor(private layerHandlerService: LayerHandlerService,
    private http: HttpClient,
    private renderStatusService: RenderStatusService,
    private mapsManagerService: MapsManagerService,
    @Inject('env') private env) {
  }

  /**
   * Add the geoJson layer
   * @param layer the geoJson layer to add to the map
   * @param param parameters for the geoJson layer
   */
  public addLayer(layer: LayerModel, param?: any): void {
    // Remove from cancelled layer list (if present)
    this.cancelledLayers = this.cancelledLayers.filter(l => l !== layer.id);

    let jsonOnlineResources: OnlineResourceModel[];

    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.GEOJSON)) {
        jsonOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.GEOJSON);
    }
    const me = this;

    // Get CesiumJS viewer
    const viewer = me.getViewer();
    const options = {
      camera: viewer.scene.camera,
      canvas: viewer.scene.canvas,
    };

    for (const onlineResource of jsonOnlineResources) {
      // Tell UI that we're about to add a resource to map
      me.renderStatusService.addResource(layer, onlineResource);
      // Create data source
      const source = new Cesium.GeoJsonDataSource(options);
      // Add an event to tell us when loading is finished
      source.loadingEvent.addEventListener((evt, isLoading: boolean) => {
        if (!isLoading) {
          // Tell UI that we have completed updating the map
          me.renderStatusService.updateComplete(layer, onlineResource);
        }
      });

      if (!me.numberOfResourcesAdded.get(layer.id)) {
        me.numberOfResourcesAdded.set(layer.id, 0);
      }

      if (UtilitiesService.layerContainsResourceType(layer, ResourceType.GEOJSON)) {
        // add geoJson to map
        if (! layer.stylefn) {
           layer.stylefn = me.styleGeoJsonEntity;
        }
        var promise;
        if (layer.jsonDoc) {
          promise = Cesium.GeoJsonDataSource.load(JSON.parse(layer.jsonDoc));
        } else {
          promise = Cesium.GeoJsonDataSource.load(layer.proxyUrl);
        }
        promise
          .then(function (dataSource) {
            viewer.dataSources.add(dataSource);      
            //Get the array of entities
            for (const entity of dataSource.entities.values) {
              // Style each geoJson point
              layer.stylefn(entity);
            }
            layer.csLayers.push(dataSource);
            me.incrementLayersAdded(layer, 1);
            me.renderStatusService.updateComplete(layer, onlineResource, true);
          })
          .catch(function (error) {
            window.alert(error);
          });      

      }
    }
  }
  private styleGeoJsonEntity(entity) {
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
  /**
   * Increment the number of layers added for a given LayerModel, and clear the layer from the
   * cancelled layer list if all layers have been added
   * @param layer the LayerModel
   * @param totalLayers total number of layers for LayerModel
   */
  private incrementLayersAdded(layer: LayerModel, totalLayers: number) {
    this.numberOfResourcesAdded.set(layer.id, this.numberOfResourcesAdded.get(layer.id) + 1);
    if (this.numberOfResourcesAdded.get(layer.id) === totalLayers) {
      this.cancelledLayers = this.cancelledLayers.filter(l => l !== layer.id);
    }
  }

  /**
   * Request cancellation of layer if it's still being added
   * @param layerId ID of layer
   */
  public cancelLayerAdded(layerId: string) {
    if (this.cancelledLayers.indexOf(layerId) === -1) {
      this.cancelledLayers.push(layerId);
    }
  }

  /**
   * Removes VMF layer from the map
   * @method rmLayer
   * @param layer the VMF layer to remove from the map.
   */
  public rmLayer(layer: LayerModel): void {
    // Request cancellation of layer if it's still being added
    this.cancelLayerAdded(layer.id);

    const viewer = this.getViewer();
    for (const dataSrc of layer.csLayers) {
      viewer.dataSources.remove(dataSrc);
    }
    layer.csLayers = [];
    this.renderStatusService.resetLayer(layer.id);
  }

  /**
   * Fetches Cesium 'Viewer'
   */
  private getViewer() {
    return this.mapsManagerService.getMap().getCesiumViewer();
  }

}
