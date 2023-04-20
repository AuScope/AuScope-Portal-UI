import { Directive } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';


/**
 * Abstract class from which to extend advanced filter components
 */
@Directive()
 export abstract class AdvancedFilterDirective {

  layer: LayerModel;
  // This will be used when saving/fetching states, can be overridden in sub-classes if necessary
  public advancedParams = {};

  public getLayer(): LayerModel {
      return this.layer;
  }

  public setLayer(layer: LayerModel) {
    this.layer = layer;
  }

  /**
   * Sets the advanced parameters.
   *
   * Note that this method will be called when the state is loaded so if there's any special processing
   * required then overwrite this in the sub-class, call super.setAdvancedParams(...) and add any 
   * necessary code.
   *
   * @param params the advanced parameters
   */
  public setAdvancedParams(params: any) {
    this.advancedParams = params;
  }

  public getAdvancedParams(): any {
    return this.advancedParams;
  }

  /**
   * Optional method to supply any call parameters that an AdvancedFilter sub-class may require
   */
  public getCallParams?();

}
