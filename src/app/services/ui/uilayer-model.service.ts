import { Injectable, signal } from '@angular/core';
import { UILayerModel } from '../../menupanel/common/model/ui/uilayer.model';

@Injectable({
  providedIn: 'root'
})
export class UILayerModelService {
  /**
   *  Keep track of the UILayerModels in use (Active Layers, Featured Layers, Custom Search and Catalogue Search)
   */
  private uiLayerModels = signal(new Map<string, UILayerModel>());

  public getUILayerModel(layerId: string): UILayerModel | undefined{
    return this.uiLayerModels().get(layerId);
  }

  public setUILayerModel(layerId: string, uiLayerModel: UILayerModel): void {
    const currentModels = this.uiLayerModels();
    currentModels.set(layerId, uiLayerModel);
    this.uiLayerModels.set(currentModels);
  }

  public removeUILayerModel(layerId: string): void {
    const currentModels = this.uiLayerModels();
    currentModels.delete(layerId);
    this.uiLayerModels.set(currentModels);
  }

  /**
   * Check whether layer has been added to the map
   *
   * @param layerId ID of the layer
   * @returns true if layer has been added to the map, false otherwise
   */
  isLayerAdded(layerId: string): boolean {
    return this.getUILayerModel(layerId)?.statusMap.getRenderStarted() ?? false;
  }

  /**
   * Notify subscribers that the UILayerModel has changed as the signal does not automatically detect changes to the Map object
   */
  notifyChanged() {
    this.uiLayerModels.update(map => new Map(map));
  }

}
