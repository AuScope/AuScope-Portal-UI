import { Directive } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';
import { BehaviorSubject } from 'rxjs';


/**
 * Abstract class from which to extend advanced filter components
 */
@Directive()
 export abstract class AdvancedFilterComponent {

  layer: LayerModel;
  public advancedParams = {};

  public getLayer(): LayerModel {
      return this.layer;
  }

  public setLayer(layer: LayerModel) {
      this.layer = layer;
  }

}
