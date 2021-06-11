import { LayerModel } from '@auscope/portal-core-ui';
import { CsMapService } from '@auscope/portal-core-ui';
import { CsCSWService } from '@auscope/portal-core-ui';
import { OlIrisService } from './../wcustom/iris/ol-iris.service';
import { Injectable } from '@angular/core';

/**
 * Wrapper class to provide all things related to the ol map such as adding layer or removing layer.
 */
@Injectable()
export class AuMapService {

   constructor(private csIrisService: OlIrisService, private csMapService: CsMapService, private csCSWService: CsCSWService) {}


  /**
   * Add layer to the wms
   * @param layer the layer to add to the map
   */
   public addLayer(layer: LayerModel, param: any): void {
     this.csMapService.removeLayer(layer);
     if (layer.id === 'seismology-in-schools-site') {
       this.csIrisService.addLayer(layer, param);
       this.csMapService.appendToLayerModelList(layer);
     } else {
       // VT: If all else fail, we render the layer as a csw and point the user to the resource.
       this.csCSWService.addLayer(layer, param);
       this.csMapService.appendToLayerModelList(layer);
     }
   }





}
