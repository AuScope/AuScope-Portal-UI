import { LayerModel } from '../../portal-core-ui/model/data/layer.model';
import { OlMapObject } from '../../portal-core-ui/service/openlayermap/ol-map-object';
import { OlMapService } from '../../portal-core-ui/service/openlayermap/ol-map.service';
import { OlCSWService } from '../../portal-core-ui/service/wcsw/ol-csw.service';
import { OlIrisService } from './../wcustom/iris/ol-iris.service';
import { Injectable } from '@angular/core';

/**
 * Wrapper class to provide all things related to the ol map such as adding layer or removing layer.
 */
@Injectable()
export class AuMapService {

   constructor(private olMapObject: OlMapObject, private olIrisService: OlIrisService, private olMapService: OlMapService, private olCSWService: OlCSWService) {}


  /**
   * Add layer to the wms
   * @param layer the layer to add to the map
   */
   public addLayer(layer: LayerModel, param: any): void {
     this.olMapObject.removeLayerById(layer.id);
     if (layer.id === 'seismology-in-schools-site') {
       this.olIrisService.addLayer(layer, param);
       this.olMapService.appendToLayerModelList(layer);
     } else {
       // VT: If all else fail, we render the layer as a csw and point the user to the resource.
       this.olCSWService.addLayer(layer, param);
       this.olMapService.appendToLayerModelList(layer);
     }
   }





}
