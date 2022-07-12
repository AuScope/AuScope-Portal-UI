import { Directive } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';


/**
 * Abstract class from which to extend advanced map components
 */
@Directive()
 export abstract class AdvancedMapComponent {

  layer: LayerModel;
  public advancedParams = {};

  public getLayer(): LayerModel {
      return this.layer;
  }

  public setLayer(layer: LayerModel) {
      this.layer = layer;
  }

}
