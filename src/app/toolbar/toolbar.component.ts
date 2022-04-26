import { LayerModel } from '@auscope/portal-core-ui';


export enum ToolbarType {
  'Map',
  'FilterPanel'
}
/**
 * Abstract class tofrom which to extend tooolbar components
 */
 export abstract class ToolbarComponent {

  layer: LayerModel;

  public getLayer(): LayerModel {
      return this.layer;
  }

  public setLayer(layer: LayerModel) {
      this.layer = layer;
  }

}
