import { Injectable, inject } from '@angular/core';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerModel } from '../../model/data/layer.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { MapsManagerService } from '@auscope/angular-cesium';
import { ResourceType } from '../../utility/constants.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { UtilitiesService } from '../../utility/utilities.service';
import { Rectangle } from 'cesium';
import { KmlDataSource } from 'cesium';
declare let Cesium: any;
/**
 * Use Cesium to add layer to map. This service class adds KML layer to the map
 */
@Injectable()
export class CsKMLService {
  private layerHandlerService = inject(LayerHandlerService);
  private renderStatusService = inject(RenderStatusService);
  private mapsManagerService = inject(MapsManagerService);


  // List of KML layers that have been cancelled
  private cancelledLayers: Array<string> = [];
  // Number of KML resources added for a given layer
  private numberOfResourcesAdded: Map<string, number> = new Map<string, number>();

  private overlayDoc!: Node; // used to make a temporary copy of <GroundOverlay> for restoring to layer.kmlDoc

  /**
   * removes the <GroundOverlay> element from the kml document
   *
   * @param kmlResource KML resource to be fetched
   * @returns updated kml document and saves the removed nodes to overlayDoc
   */
  private removeOverlay(kmlDoc: Document): Document {
    const gos = kmlDoc.querySelectorAll("GroundOverlay");
    if (gos) {
      gos.forEach(go => {
        // backup <GroundOverlay> and restore after the kml source is loaded
        this.overlayDoc = go.cloneNode(true);
        go.remove();
      });
    }
    return kmlDoc;
  }


  /**
   * Add the KML layer
   * @param layer the KML layer to add to the map
   * @param param parameters for the KML layer
   */
  public addLayer(layer: LayerModel, _param?: any) {
    // Remove from cancelled layer list (if present)
    this.cancelledLayers = this.cancelledLayers.filter(l => l !== layer.id);

    let kmlOnlineResources: OnlineResourceModel[] = [];

    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.KML)) {
      kmlOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.KML);
    }
    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.KMZ)) {
      kmlOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.KMZ);
    }
    const me = this;

    // Get CesiumJS viewer
    const viewer = this.getViewer();
    const options = {
      camera: viewer.scene.camera,
      canvas: viewer.scene.canvas,
    };

    for (const onlineResource of kmlOnlineResources) {
      // Tell UI that we're about to add a resource to map
      this.renderStatusService.addResource(layer, onlineResource);

      // Create data source
      const source = new KmlDataSource(options);
      // Add an event to tell us when loading is finished
      source.loadingEvent.addEventListener((_evt, isLoading: boolean) => {
        if (!isLoading) {
          // Tell UI that we have completed updating the map
          me.renderStatusService.updateComplete(layer, onlineResource);
        }
      });

      // If KML is sourced from a file loaded from a browser, else URL
      // note: KML and KMZ, loaded either from a local file or url now have
      // a layer.kmlDoc entry - so some of the following code is redundant
      if (layer.kmlDoc) {
        let iconObject: any;
        let overlayRect: Rectangle;

        if (layer.kmlDoc instanceof XMLDocument) {
          iconObject = this.getIcon(layer.kmlDoc);
          // TODO: elements still to handle: name, description, rotation
          if (iconObject.rectangle) {
            overlayRect = Rectangle.fromDegrees(iconObject.rectangle.west, iconObject.rectangle.south, iconObject.rectangle.east, iconObject.rectangle.north);
            // remove <GroundOverlay> from KML
            this.removeOverlay(layer.kmlDoc);
          }
        }

        // Load KML or KMZ file into CesiumJS data source, and add to map if not cancelled
        source.load(layer.kmlDoc).then(dataSource => {
          if (this.cancelledLayers.indexOf(layer.id) === -1) {

            viewer.dataSources.add(dataSource).then((dataSrc: KmlDataSource) => {
              layer.csLayers.push(dataSrc);

              if (!iconObject?.url) {
                this.incrementLayersAdded(layer, 1);
                // If there is a <LookAt> placemark in the KML, fly to the rectangle
                if (layer.kmlDoc instanceof XMLDocument) {
                  const placemarkObject = this.getPlacemark(layer.kmlDoc);
                  if (placemarkObject?.rectangle) {
                    const placemarkRect = Rectangle.fromDegrees(placemarkObject.rectangle.west, placemarkObject.rectangle.south, placemarkObject.rectangle.east, placemarkObject.rectangle.north);
                    setTimeout(() => {
                      viewer.camera.flyTo({ destination: placemarkRect });
                    }, 100);
                  }
                }
              } else {
                // Use ground overlay rectangle to fly to, and add the overlay to the map
                this.incrementLayersAdded(layer, 2);
                const layerObj = viewer.entities.add({
                  name: layer.name,
                  rectangle: {
                    coordinates: overlayRect,
                    material: new Cesium.ImageMaterialProperty({
                      image: iconObject.url,
                      transparent: true
                    })
                  }
                });
                layer.csLayers.push(layerObj);
                setTimeout(() => {
                  viewer.camera.flyTo({ destination: overlayRect });
                }, 100);
                layer.kmlDoc.querySelector("Folder").appendChild(this.overlayDoc);
              }
            })
          }
        }, (error) => {
          // rejected
          console.error("Could not load KML doc:", error);
          alert("Could not load KML doc:" + error);
        });
      } // if
    } // for 
  } 


  /**
   * Increment the number of layers added for a given LayerModel, and clear the layer from the
   * cancelled layer list if all layers have been added
   * @param layer the LayerModel
   * @param totalLayers total number of layers for LayerModel
   */
  private incrementLayersAdded(layer: LayerModel, totalLayers: number) {
    if (!this.numberOfResourcesAdded.get(layer.id)) {
      this.numberOfResourcesAdded.set(layer.id, 0);
    }
    const currentCount = this.numberOfResourcesAdded.get(layer.id) ?? 0;
    const nextCount = currentCount + 1;
    this.numberOfResourcesAdded.set(layer.id, nextCount);
    if (nextCount === totalLayers) {
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
   * Removes KML layer from the map
   * @method rmLayer
   * @param layer the KML layer to remove from the map.
   */
  public rmLayer(layer: LayerModel): void {
    // Request cancellation of layer if it's still being added
    this.cancelLayerAdded(layer.id);

    const viewer = this.getViewer();
    for (const dataSrc of layer.csLayers) {
      viewer.dataSources.remove(dataSrc);
      viewer.imageryLayers.remove(dataSrc);
      viewer.entities.remove(dataSrc);
    }
    viewer.imageryLayers.remove(layer);
    layer.csLayers = [];
    this.renderStatusService.resetLayer(layer.id);
  }

  /**
   * Fetches Cesium 'Viewer'
   */
  private getViewer() {
    return this.mapsManagerService.getMap()?.getCesiumViewer();
  }

  /**
   * gets the icon from the KML if the url is http...
   *
   * @param kmlResource KML resource to be fetched
   * @returns icon object (url and rectangle coords) or {} if no <GroundOverlay> & <Icon> found
   */

  private getIcon(kmlDoc: Document): any {
    let result = {};
    const gos = kmlDoc?.querySelectorAll("GroundOverlay");
    if (gos) {
      gos.forEach(go => {
        const iconEntity = go.querySelector("Icon");
        const iconURL = iconEntity?.querySelector('href')?.textContent;
        if (iconURL?.toLowerCase().startsWith("http")) {
          const rectEntity = go.querySelector("LatLonBox");
          if (rectEntity) {
            const north = rectEntity.querySelector('north')?.textContent;
            const south = rectEntity.querySelector('south')?.textContent;
            const east = rectEntity.querySelector('east')?.textContent;
            const west = rectEntity.querySelector('west')?.textContent;
            if (north && south && east && west) {
              result = { url: iconURL, rectangle: { north: north, south: south, east: east, west: west } };
            }
          }
        }
      });
    }
    return result;
  }

  /**
   * Gets the <Placemark>/<LookAt> coords from the KML
   *
   * @param kmlResource KML resource to be fetched
   * @returns placemark object (bounds of all placemarks coords), or {} if no placemarks
   */

  private getPlacemark(kmlDoc: Document): any {
    let result = {};
    const pms = kmlDoc.querySelectorAll("Placemark");
    const pts: { lat: number, lon: number }[] = [];
    let maxLon: number = 0.0, minLon: number = 180.0, maxLat: number = -90.0, minLat: number = 0.0;
    if (pms) {
      pms.forEach(pm => {
        const lookatEntity = pm.querySelector("LookAt");
        if (lookatEntity) {
          const lon = lookatEntity.querySelector('longitude')?.textContent;
          const lat = lookatEntity.querySelector('latitude')?.textContent;
          if (lon && lat) {
            pts.push({ "lat": Number(lat), "lon": Number(lon) });
          }
        }
      })
      if (pts.length === 1) {
        maxLat = pts[0].lat + Number(0.05);
        minLat = pts[0].lat - Number(0.05);
        maxLon = pts[0].lon + Number(0.05);
        minLon = pts[0].lon - Number(0.05);
        result = { rectangle: { north: maxLat, south: minLat, east: maxLon, west: minLon } };
      } else if (pts.length > 1){
        pts.forEach((pt) => {
          if (pt.lat > maxLat) { maxLat = pt.lat; }
          if (pt.lat < minLat) { minLat = pt.lat; }
          if (pt.lon > maxLon) { maxLon = pt.lon; }
          if (pt.lon < minLon) { minLon = pt.lon; }
        })
        result = { rectangle: { north: maxLat, south: minLat, east: maxLon, west: minLon } };
      }
    }
    return result;
  }
}
