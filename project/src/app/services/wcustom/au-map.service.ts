import { LayerModel } from 'portal-core-ui';
import { CsMapObject } from 'portal-core-ui';
import { CsMapService } from 'portal-core-ui';
import { OlCSWService } from 'portal-core-ui';
import { OlIrisService } from './../wcustom/iris/ol-iris.service';
import { Injectable } from '@angular/core';

/**
 * Wrapper class to provide all things related to the ol map such as adding layer or removing layer.
 */
@Injectable()
export class AuMapService {

   constructor(private csMapObject: CsMapObject, private olIrisService: OlIrisService, private csMapService: CsMapService, private olCSWService: OlCSWService) {}


  /**
   * Add layer to the wms
   * @param layer the layer to add to the map
   */
   public addLayer(layer: LayerModel, param: any): void {
     this.csMapObject.removeLayerById(layer.id);
     if (layer.id === 'seismology-in-schools-site') {
       this.olIrisService.addLayer(layer, param);
       this.csMapService.appendToLayerModelList(layer);
     } else {
       // VT: If all else fail, we render the layer as a csw and point the user to the resource.
       this.olCSWService.addLayer(layer, param);
       this.csMapService.appendToLayerModelList(layer);
     }
   }





}
