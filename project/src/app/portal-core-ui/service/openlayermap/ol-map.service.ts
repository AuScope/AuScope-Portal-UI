
import { CSWRecordModel } from '../../model/data/cswrecord.model';
import { Injectable, Inject } from '@angular/core';
import olLayerVector from 'ol/layer/vector';
import olLayer from 'ol/layer/layer';
import olFeature from 'ol/feature';
import olProj from 'ol/proj';
import {BehaviorSubject,  Subject } from 'rxjs';
import { point } from '@turf/helpers';
import * as inside from '@turf/inside';
import * as bboxPolygon from '@turf/bbox-polygon';
import {LayerModel} from '../../model/data/layer.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { ManageStateService } from '../permanentlink/manage-state.service';
import { OlCSWService } from '../wcsw/ol-csw.service';
import { OlWFSService } from '../wfs/ol-wfs.service';
import { OlMapObject } from './ol-map-object';
import { OlWMSService } from '../wms/ol-wms.service';



/**
 * Wrapper class to provide all things related to the ol map such as adding layer or removing layer.
 */
@Injectable()
export class OlMapService {

   // VT: a storage to keep track of the layers that have been added to the map. This is use to handle click events.
   private layerModelList: { [key: string]: LayerModel; } = {};
   private addLayerSubject: Subject<LayerModel>;

   private clickedLayerListBS = new BehaviorSubject<any>({});

   constructor(private layerHandlerService: LayerHandlerService, private olWMSService: OlWMSService,
     private olWFSService: OlWFSService, private olMapObject: OlMapObject, private manageStateService: ManageStateService,
     @Inject('conf') private conf, private olCSWService: OlCSWService) {

     this.olMapObject.registerClickHandler(this.mapClickHandler.bind(this));
     this.addLayerSubject = new Subject<LayerModel>();
   }

  /**
   * get a observable subject that triggers an event whenever a map is clicked on
   * @returns the observable subject that returns the list of map layers that was clicked on in the format {clickedFeatureList,
   *         clickedLayerList, pixel,clickCoord}
   */
   public getClickedLayerListBS(): BehaviorSubject<any> {
     return this.clickedLayerListBS;
   }

   /**
    * Gets called when a map click event is recognised
    * @param pixel coordinates of clicked on pixel (units: pixels)
    */
   public mapClickHandler(pixel: number[]) {
      try {
           // Convert pixel coords to map coords
           const map = this.olMapObject.getMap();
           const clickCoord = map.getCoordinateFromPixel(pixel);
           const lonlat = olProj.transform(clickCoord, 'EPSG:3857', 'EPSG:4326');
           const clickPoint = point(lonlat);

           // Compile a list of clicked on layers
           // NOTO BENE: forEachLayerAtPixel() cannot be used because it causes CORS problems
           const activeLayers = this.olMapObject.getLayers();
           const clickedLayerList: olLayer[] = [];
           const layerColl = map.getLayers();
           const me = this;
           layerColl.forEach(function(layer) {
               for (const layerId in activeLayers) {
                   for (const activeLayer of activeLayers[layerId]) {
                       if (layer === activeLayer) {
                           const layerModel = me.getLayerModel(layerId);
                           if (!this.layerHandlerService.containsWMS(layerModel)) {
                             continue;
                           }
                           for (const cswRecord of layerModel.cswRecords) {
                               for (const bbox of cswRecord.geographicElements) {
                                   const tBbox = [bbox.eastBoundLongitude, bbox.southBoundLatitude, bbox.westBoundLongitude, bbox.northBoundLatitude];
                                   const poly = bboxPolygon(tBbox);
                                   if (inside(clickPoint, poly) && !clickedLayerList.includes(activeLayer)) {
                                     // Add to list of clicked layers
                                     clickedLayerList.push(activeLayer);
                                   }
                               }
                           }
                       }
                   }
               }
           }, me);

           // Compile a list of clicked on features
           const clickedFeatureList: olFeature[] = [];
           const featureHit = map.forEachFeatureAtPixel(pixel, function(feature) {
              // LJ: skip the olFeature
              if (feature.get('bClipboardVector')) {
                return;
              }
              clickedFeatureList.push(feature);
           });

           this.clickedLayerListBS.next({
             clickedFeatureList: clickedFeatureList,
             clickedLayerList: clickedLayerList,
             pixel: pixel,
             clickCoord: clickCoord
           });
      } catch (error) {
        throw error;
      }
   }



  /**
   * Add layer to the wms
   * @param layer the layer to add to the map
   */
   public addLayer(layer: LayerModel, param: any): void {
     this.olMapObject.removeLayerById(layer.id);
     delete this.layerModelList[layer.id];
     if (this.conf.cswrenderer && this.conf.cswrenderer.includes(layer.id)) {
       this.olCSWService.addLayer(layer, param);
       this.cacheLayerModelList(layer.id, layer);
     } else if (this.layerHandlerService.containsWMS(layer)) {
       this.olWMSService.addLayer(layer, param);
       this.cacheLayerModelList(layer.id, layer);
     } else if (this.layerHandlerService.containsWFS(layer)) {
       this.olWFSService.addLayer(layer, param);
       this.cacheLayerModelList(layer.id, layer);
     } else {
       throw new Error('No Suitable service found');
     }
   }

   private cacheLayerModelList(id: string, layer: LayerModel) {
     this.layerModelList[layer.id] = layer;
     this.addLayerSubject.next(layer);
   }

   /**
    *  In the event we have custom layer that is handled outside olMapService, we will want to register that layer here so that
    *  it can be handled by the clicked event handler.
    *  this is to support custom layer renderer such as iris that uses kml
    */
   public appendToLayerModelList(layer) {
     this.cacheLayerModelList(layer.id, layer);
   }

  /**
   * Add layer to the map. taking a short cut by wrapping the csw in a layerModel
   * @param layer the layer to add to the map
   */
   public addCSWRecord(cswRecord: CSWRecordModel): void {
        const itemLayer = new LayerModel();
        itemLayer.cswRecords = [cswRecord];
        itemLayer['expanded'] = false;
        itemLayer.id = cswRecord.id;
        itemLayer.description = cswRecord.description;
        itemLayer.hidden = false;
        itemLayer.layerMode = 'NA';
        itemLayer.name = cswRecord.name;
       this.addLayer(itemLayer, {});
   }

  /**
   * Remove layer from map
   * @param layer the layer to remove from the map
   */
  public removeLayer(layer: LayerModel): void {
      this.manageStateService.removeLayer(layer.id);
      this.olMapObject.removeLayerById(layer.id);
      delete this.layerModelList[layer.id];
  }

  /**
   * Retrieve the layer model given an id string
   * @param layerId layer's id string
   */
  public getLayerModel(layerId: string): LayerModel {
      if (this.layerModelList.hasOwnProperty(layerId)) {
          return this.layerModelList[layerId];
      }
      return null;
  }

  public getAddLayerSubject(): Subject<LayerModel> {
    return this.addLayerSubject;
  }

  /**
   * Fit the map to the extent that is provided
   * @param extent An array of numbers representing an extent: [minx, miny, maxx, maxy]
   */
  public fitView(extent: [number, number, number, number]): void {
      this.olMapObject.getMap().getView().fit(extent);
  }

  /**
   * DrawBound
   * @returns a observable object that triggers an event when the user have completed the task
   */
  public drawBound(): Subject<olLayerVector> {
    return this.olMapObject.drawBox();
  }

  /**
    * Method for drawing a dot on the map.
    * @returns the layer vector on which the dot is drawn on. This provides a handle for the dot to be deleted
    */
  public drawDot(coord): olLayerVector {
    return this.olMapObject.drawDot(coord);
  }

  /**
   * remove a vector layer from the map
   * @param the vector layer to be removed
   */
  public removeVector(vector: olLayerVector) {
    this.olMapObject.removeVector(vector);
  }


}
