import { Component } from '@angular/core';
import { CsMapService, LayerModel } from '@auscope/portal-core-ui';
import { MatSliderChange } from '@angular/material/slider';
import { ImagerySplitDirection } from 'cesium';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';

@Component({
  selector: '[appActiveLayers]',
  templateUrl: './activelayerspanel.component.html',
  styleUrls: ['../menupanel.scss']
})


export class ActiveLayersPanelComponent {

  constructor(private csMapService: CsMapService, private uiLayerModelService: UILayerModelService) { }

  /**
   * Get active layers
   */
  public getActiveLayers(): LayerModel[] {
    const activeLayers: LayerModel[] = [];
    let activeLayerKeys: string[] = Object.keys(this.csMapService.getLayerModelList());
    for(const layer of activeLayerKeys) {
      let currentLayer = this.csMapService.getLayerModelList()[layer];
      activeLayers.push(currentLayer);
    }
    return activeLayers;
  }

  /**
   * Retrieve UILayerModel from the UILayerModelService
   * @param layerId ID of layer
   */
  public getUILayerModel(layerId: string): UILayerModel {
    return this.uiLayerModelService.getUILayerModel(layerId);
  }

  /**
   * Remove the layer 
   *
   * @layerId layerId ID of LayerModel
   */
  removeLayer(layerId: string): void {
    let layerModelList = this.csMapService.getLayerModelList()
    if (layerModelList.hasOwnProperty(layerId)) {
      this.csMapService.removeLayer(layerModelList[layerId]);
    }
  }

  /**
   * Layer opacity slider change event
  */
  layerOpacityChange(event: MatSliderChange, layer: LayerModel) {
    this.csMapService.setLayerOpacity(layer, (event.value / 100));
  }

  /**
   * Split buttons will only be displayed if the split map is shown
   */
  public getSplitMapShown(): boolean {
    return this.csMapService.getSplitMapShown();
  }

  /**
   * Set a layer's split direction so that it will appear in either the left, right or both (none) panes.
   * 
   * @param event the event trigger
   * @param layer the layer to set split direction on
   * @param direction the split direction for the layer to occupy
   */
  public setLayerSplitDirection(event: any, layer: LayerModel, direction: string) {
    event.stopPropagation();
    let splitDir: ImagerySplitDirection;
    switch (direction) {
      case "left":
        splitDir = ImagerySplitDirection.LEFT;
        break;
      case "right":
        splitDir = ImagerySplitDirection.RIGHT;
        break;
      case "none":
      default:
        splitDir = ImagerySplitDirection.NONE;
        break;
    }
    layer.splitDirection = splitDir;
    this.csMapService.setLayerSplitDirection(layer, splitDir);
  }

  /**
   * Get the ImagerySplitrDirection of a layer as a string (template can't access ImagerySplitDirection)
   * @param layerId the ID of the layer
   */
  public getLayerSplitDirection(layerId: string): string {
    let splitDir = "none";
    if (this.csMapService.getLayerModel(layerId) !== null) {
      switch(this.csMapService.getLayerModel(layerId).splitDirection) {
        case ImagerySplitDirection.LEFT:
          splitDir = "left";
          break;
        case ImagerySplitDirection.RIGHT:
          splitDir = "right";
          break;
      }
    }
    return splitDir;
  }

}
