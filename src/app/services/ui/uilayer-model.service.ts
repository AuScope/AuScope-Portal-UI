import { Injectable } from '@angular/core';
import { UILayerModel } from 'app/menupanel/common/model/ui/uilayer.model';

@Injectable({
  providedIn: 'root'
})
export class UILayerModelService {
  /**
   *  Keep track of the UILayerModels in use (Active Layers, Featured Layers, Custom Search and Catalogue Search)
   */
  private uiLayerModels = new Map<string, UILayerModel>();

  public getUILayerModel(layerId: string) {
    return this.uiLayerModels.get(layerId);
  }

  public setUILayerModel(layerId: string, uiLayerModel: UILayerModel) {
    this.uiLayerModels.set(layerId, uiLayerModel);
  }

  public removeUILayerModel(layerId: string) {
    this.uiLayerModels.delete(layerId);
  }
  
  /**
   * Check whether layer has been added to the map
   *
   * @param layerId ID of the layer
   * @returns true if layer has been added to the map, false otherwise
   */
  isLayerAdded(layerId: string) {
    return this.getUILayerModel(layerId) && this.getUILayerModel(layerId).statusMap.getRenderStarted();
  }
  
}
