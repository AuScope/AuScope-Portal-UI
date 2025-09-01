import { Injectable } from '@angular/core';
import { LayerModel } from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';

import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { MapsManagerService, AcMapComponent } from '@auscope/angular-cesium';
import { Rectangle, Color, ColorMaterialProperty, Cartesian3, Cartesian2, CallbackProperty, HorizontalOrigin, DistanceDisplayCondition, Entity } from 'cesium';

// Alpha of the CSW bounding box rectangles
const POLYGON_ALPHA = 0.4;

// Colour of the CSW bounding box rectangles
const POLYGON_COLOUR = new Color(0.0, 0.0, 1.0, POLYGON_ALPHA);

// Colour of the font and background used to label the CSW rectangles on the map 
const LABEL_COLOUR = Color.ANTIQUEWHITE;
const LABEL_BACKGROUND_COLOUR = Color.BLACK;

/**
 * Use Cesium to add CSW layer like reports to map. This service class adds CSW layer to the map as a rectangle and a label
 */
@Injectable()
export class CsCSWService {

  // VT in the event we cannot find a suitable renderer, we default to csw. we need to store the layers that have been rendered
  // so that the querier will be able to know which layer have been rendered as csw
  public static cswDiscoveryRendered = [];

  private map: AcMapComponent = null;
  private viewer: any = null;
  

  constructor(private layerHandlerService: LayerHandlerService,
                  private renderStatusService: RenderStatusService, 
                  private mapsManagerService: MapsManagerService) {
  }

  
  /**
   * rmLayer - remove layer from map
   * @param layer layer to be removed
   */
  public rmLayer(layer) {
    if (!this.map) {
      this.map = this.mapsManagerService.getMap();
      this.viewer = this.map.getCesiumViewer();
    }
    for (const entity of layer.csLayers) {
      this.viewer.entities.remove(entity);
    }
    layer.csLayers = [];
    this.renderStatusService.resetLayer(layer.id);
  }

  /**
   * setLayerOpacity - sets opacity for a given layer
   * @param layer the LayerModel
   * @param opacity value from 0.0 to 1.0 
   */
  public setLayerOpacity(layer, opacity: number) {
    for (const entity of layer.csLayers) {
      if (entity.rectangle) {
        entity.rectangle.material = new ColorMaterialProperty(Color.fromAlpha(POLYGON_COLOUR, opacity * POLYGON_ALPHA));
      } else if (entity.label) {
        entity.label.fillColor = Color.fromAlpha(LABEL_COLOUR, opacity);
        entity.label.backgroundColor = Color.fromAlpha(LABEL_BACKGROUND_COLOUR, opacity);
      }
    }
  }

  /**
   * addLabel - adds a label to screen
   * @param name - name to be put on label 
   * @param lon - longitude in degrees
   * @param lat - latitude in degrees
   */
  private addLabel(name:string, lon: number, lat: number): Entity {
    return this.viewer.entities.add({
      position : Cartesian3.fromDegrees(lon, lat),
      label : {
          text : name.substring(0,70),  // Label only displays first 70 characters
          font : '16px sans-serif',
          fillColor:  LABEL_COLOUR,
          showBackground : true,
          horizontalOrigin : HorizontalOrigin.LEFT,
          distanceDisplayCondition: new DistanceDisplayCondition(0.0, 7000000.0),
          // Randomize position a little to reduce chance of 2 labels overwriting each other
          pixelOffset: new Cartesian2(5, (Math.random() * 26) - 5)
      }
    });
  }

  /**
   * addPolygon - adds a polygon to screen
   * @param name - name to be put on label 
   * @param bbox - bounding box object; members: westBoundLongitude, southBoundLatitude, eastBoundLongitude, northBoundLatitude
   */
  private addPolygon(name, bbox): Entity {
    return this.viewer.entities.add({
      name: name,
      rectangle: {
        coordinates: Rectangle.fromDegrees(
          bbox.westBoundLongitude, // West
          bbox.southBoundLatitude,  // South
          bbox.eastBoundLongitude, // East
          bbox.northBoundLatitude // North
        ),
        // 'CallBackProperty' is used to avoid flickering when material colour is changed
        material: new ColorMaterialProperty(new CallbackProperty(function(time, result) {
          return Color.fromAlpha(POLYGON_COLOUR, POLYGON_ALPHA);
         }, true))
      },
    });
  }

  /**
   * Add the CSW layer
   * @param layer the layer to add to the map
   */
  public addLayer(layer: LayerModel): void {
    const cswRecords = this.layerHandlerService.getCSWRecord(layer);
    this.map = this.mapsManagerService.getMap();
    this.viewer = this.map.getCesiumViewer();

    const onlineResource = new OnlineResourceModel();
    onlineResource.url = 'Rendering from csw records';
    this.renderStatusService.addResource(layer, onlineResource);

    // Render each CSW record on map
    for (const cswRecord of cswRecords) {
      const geoEls = cswRecord.geographicElements;
      for (let j = 0; j < geoEls.length; j++) {
        const geoEl = geoEls[j];
        // Check for bounding box
        if (geoEl.eastBoundLongitude && geoEl.westBoundLongitude && geoEl.southBoundLatitude && geoEl.northBoundLatitude) {
          // If the BBOX is a point or line then render a little square on map
          if (geoEl.eastBoundLongitude === geoEl.westBoundLongitude ||
            geoEl.southBoundLatitude === geoEl.northBoundLatitude) {
            const littleBox: any = { ...geoEl };
            littleBox.westBoundLongitude = littleBox.eastBoundLongitude - 0.05;
            littleBox.southBoundLatitude = littleBox.northBoundLatitude - 0.05;
            layer.csLayers.push(this.addPolygon(cswRecord.name, littleBox));
          } else {
            // Render polygon same size as CSW record's bounding box, but first check that coords aren't reversed
            if ((geoEl.westBoundLongitude > geoEl.eastBoundLongitude) || (geoEl.northBoundLatitude < geoEl.southBoundLatitude)) {
              console.warn("Cannot add layer", cswRecord.name, " - BBOX coords are not in correct north > south or east > west order");
              continue;
            }
            layer.csLayers.push(this.addPolygon(cswRecord.name, geoEl));
          }
          layer.csLayers.push(this.addLabel(cswRecord.name, geoEl.eastBoundLongitude, geoEl.northBoundLatitude));
        }
      }
    }
    this.renderStatusService.updateComplete(layer, onlineResource);
  }

}
