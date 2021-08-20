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
  
}
