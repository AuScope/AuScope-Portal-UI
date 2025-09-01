
import { throwError as observableThrowError, Observable } from 'rxjs';
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerModel } from '../../model/data/layer.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { MapsManagerService } from '@auscope/angular-cesium';
import { ResourceType } from '../../utility/constants.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { UtilitiesService } from '../../utility/utilities.service';

// NB: Cannot use "import { XXX, YYY, ZZZ, Color } from 'cesium';" - it prevents initialising ContextLimits.js properly
// which causes a 'DeveloperError' when trying to draw the VMF 
declare var Cesium;

/**
 * Use Cesium to add layer to map. This service class adds GeoJSON layer to the map
 */
@Injectable()
export class CsVMFService {

  // List of VMF layers that have been cancelled
  private cancelledLayers: Array<string> = [];
  // Number of VMF resources added for a given layer
  private numberOfResourcesAdded: Map<string, number> = new Map<string, number>();

  constructor(private layerHandlerService: LayerHandlerService,
    private http: HttpClient,
    private renderStatusService: RenderStatusService,
    private mapsManagerService: MapsManagerService,
    @Inject('env') private env) {
  }

  /**
   * Downloads geojson that is cropped to polygon
   *
   * @param vmfResource VMF resource to be fetched
   * @returns  VMF geojson text
   */
  private getVMFFeature(url: string, polygon: string, apikey: string, maps: string): Observable<any> {
    /*
    const body =
    {
      "key": "_7AyXpOSiefzoaCbUaPOM",
      "maps": "territories",
      "polygon_geojson": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Polygon",
              "coordinates": [
                [ [146.26, -10.53], [132.45, -8.23], [111.64, -17.61], [110.29, -34.29], [147.95, -45.25], [159.37, -24.57], [146.26, -10.53] ]
              ]
            }
          }
        ]
      }
    };
    */
    const body=
    {
      "key": apikey, // "_7AyXpOSiefzoaCbUaPOM", // https://api-docs.native-land.ca/
      "maps": maps, // "territories",
      "polygon_geojson": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Polygon",
              "coordinates": [JSON.parse(polygon)]
            }
          }
        ]
      }
    };
    
    //url="https://native-land.ca/api/index.php";
    return this.http.post(url, body, { 
      // this will cause a preflight )OPTIONS/CORS) error - 'application/json'
      headers: new HttpHeaders().set('Content-Type', 'text/plain')
    }).pipe(map(response => {
      return response;
    }), catchError((error: HttpResponse<any>) => {
      return observableThrowError(error);
    }),);

  }

  /**
   * Add the VMF layer
   * @param layer the VMF layer to add to the map
   * @param param parameters for the VMF layer
   */
  public addLayer(layer: LayerModel, param?: any): void {
    // Remove from cancelled layer list (if present)
    this.cancelledLayers = this.cancelledLayers.filter(l => l !== layer.id);

    let vmfOnlineResources: OnlineResourceModel[];

    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.VMF)) {
      vmfOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.VMF);
    }
    const me = this;

    // Get CesiumJS viewer
    const viewer = this.getViewer();
    const options = {
      camera: viewer.scene.camera,
      canvas: viewer.scene.canvas,
    };

    for (const onlineResource of vmfOnlineResources) {
      // Tell UI that we're about to add a resource to map
      this.renderStatusService.addResource(layer, onlineResource);

      // Create data source
      const source = new Cesium.GeoJsonDataSource(options);
      // Add an event to tell us when loading is finished
      source.loadingEvent.addEventListener((evt, isLoading: boolean) => {
        if (!isLoading) {
          // Tell UI that we have completed updating the map
          me.renderStatusService.updateComplete(layer, onlineResource);
        }
      });

      if (!this.numberOfResourcesAdded.get(layer.id)) {
        this.numberOfResourcesAdded.set(layer.id, 0);
      }

      if (UtilitiesService.layerContainsResourceType(layer, ResourceType.VMF)) {
        // add VMF to map

        //const proxyUrl = this.env.portalBaseUrl + "getViaProxy.do?usewhitelist=false&url=" + onlineResource.url;
        //const proxyUrl = "https://portal.auscope.org.au/"  + "getViaProxy.do?usewhitelist=false&url=" + onlineResource.url;
        const proxyUrl = onlineResource.url;
        const polygon = layer["geojson"]["polygon"];
        var polygonStr = "[";
        var delim = ",";
        var i = 0;
        for (const coord of polygon) {
          const lon = coord[0];
          const lat = coord[1];
          if (i == (polygon.length-1)) { delim = ""; }
          polygonStr = polygonStr + "["+lon+","+lat+"]"+delim;
          i = i + 1;
        }
        polygonStr = polygonStr + "]";
        const apikey = layer["apikey"];
        const maps = layer["maps"];
        this.getVMFFeature(proxyUrl,polygonStr,apikey,maps).subscribe(geojsonTxt => {
          geojsonTxt = JSON.stringify(geojsonTxt);
          // make a geojson features collection
          let fcTxt = '{"type": "FeatureCollection","features":' + geojsonTxt + '}';
          let geojson = JSON.parse(fcTxt);
     
          source.load(geojson).then(dataSource => {
            if (this.cancelledLayers.indexOf(layer.id) === -1) {
              viewer.dataSources.add(dataSource).then(dataSrc => {

                //Get the array of entities
                const entities = dataSource.entities.values;

                for (let i = 0; i < entities.length; i++) {
                  //For each entity (polygon), get the colour property and make the polygon that colour
                  const entity = entities[i];
                  const properties = entity.properties;
                  const color = properties.color;
                  let value = color._value;
                  // remake the color as a hex string (RGB) with opactiy first
                  value = "0x40" + value.substring(5,7)+value.substring(3,5)+value.substring(1,3);
                  var cesiumColor = Cesium.Color.fromRgba(value);
                  //Set the polygon material to our color.
                  entity.polygon.material = cesiumColor;
                  //Remove the outlines.
                  entity.polygon.outline = false;
                  //Extrude the polygon 
                  entity.polygon.extrudedHeight = 1.0;
                }

                layer.csLayers.push(dataSrc);
                this.incrementLayersAdded(layer, vmfOnlineResources.length);
              }, (err) => {
                console.error('Unable to add viewer.dataSources VMF: ', err);
              }).catch(function(err){
                console.error('Unable to add viewer.dataSources VMF (otherwise): ', err);
            });
            }
          }, (err) => {
            console.error('Unable to load source.load VMF: ', err);
          }).catch(function(err){
            console.error('Unable to load geojson VMF (otherwise): ', err);
        });
        }, (err) => {
          alert('Unable to load VMF: ' + err.message);
          console.error('Unable to load VMF: ', err);
          // Tell UI that we have completed updating the map & there was an error
          this.renderStatusService.updateComplete(layer, onlineResource, true);
          this.incrementLayersAdded(layer, vmfOnlineResources.length);
        });

      }

    }
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
