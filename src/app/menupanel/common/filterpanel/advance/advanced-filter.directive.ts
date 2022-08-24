import { Directive } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';
import { BehaviorSubject } from 'rxjs';


/**
 * Abstract class from which to extend advanced filter components
 */
@Directive()
 export abstract class AdvancedFilterDirective {

  layer: LayerModel;
  // This will be used when saving/fetching states, can be overridden in sub-classes if necessary
  public advancedParams = {};
  public advancedParamsBS = new BehaviorSubject<any>({});

  public getLayer(): LayerModel {
      return this.layer;
  }

  public setLayer(layer: LayerModel) {
    this.layer = layer;
  }

  public setAdvancedParams(params: any) {
    this.advancedParams = params;
    this.advancedParamsBS.next(params);
  }

  public getAdvancedParams(): any {
    return this.advancedParams;
  }

}
