import { Component } from '@angular/core';
import { CsClipboardService, CsMapService, LayerHandlerService, LayerModel, ResourceType } from '@auscope/portal-core-ui';
import { MatSliderChange } from '@angular/material/slider';
import { SplitDirection } from 'cesium';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';

@Component({
  selector: '[appActiveLayers]',
  templateUrl: './activelayerspanel.component.html',
  styleUrls: ['../menupanel.scss']
})


export class ActiveLayersPanelComponent {
  bsModalRef: BsModalRef;

  constructor(private csClipboardService: CsClipboardService, private csMapService: CsMapService,
    private uiLayerModelService: UILayerModelService, private layerHandlerService: LayerHandlerService,
    private modalService: BsModalService) { }

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
    let layerModelList = this.csMapService.getLayerModelList();
    if (layerModelList.hasOwnProperty(layerId)) {
      this.csMapService.removeLayer(layerModelList[layerId]);
    }
    // Remove polygon filter if was opened and no layers present
    /*
    if (Object.keys(layerModelList).length === 0) {
      this.csClipboardService.clearClipboard();
      this.csClipboardService.toggleClipboard(false);
    }
    */
  }

  /**
   * Layer opacity slider change event
  */
  layerOpacityChange(event: MatSliderChange, layer: LayerModel) {
    this.csMapService.setLayerOpacity(layer, (event.value / 100));
  }

  /**
   * Split buttons will only be displayed if the split map is shown and the layer has started (or completed) rendering.
   */
  public getShowSplitMapButtons(layer: LayerModel): boolean {
    return this.csMapService.getSplitMapShown() &&
           (this.getUILayerModel(layer.id).statusMap.getRenderStarted() || this.getUILayerModel(layer.id).statusMap.getRenderComplete());
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
    let splitDir: SplitDirection;
    switch (direction) {
      case "left":
        splitDir = SplitDirection.LEFT;
        break;
      case "right":
        splitDir = SplitDirection.RIGHT;
        break;
      case "none":
      default:
        splitDir = SplitDirection.NONE;
        break;
    }
    layer.splitDirection = splitDir;
    this.csMapService.setLayerSplitDirection(layer, splitDir);
  }

  /**
   * Get the ImagerySplitrDirection of a layer as a string (template can't access SplitDirection)
   * @param layerId the ID of the layer
   */
  public getLayerSplitDirection(layerId: string): string {
    let splitDir = "none";
    if (this.csMapService.getLayerModel(layerId) !== null) {
      switch(this.csMapService.getLayerModel(layerId).splitDirection) {
        case SplitDirection.LEFT:
          splitDir = "left";
          break;
        case SplitDirection.RIGHT:
          splitDir = "right";
          break;
      }
    }
    return splitDir;
  }

  /**
   * Only show the split map buttons if the layer has a WMS resource.
   * 
   * @param layer current LayerModel
   */
  public getApplicableSplitLayer(layer: LayerModel): boolean {
    return this.layerHandlerService.contains(layer, ResourceType.WMS);
  }

  /**
   * open the modal that display the status of the render
   */
   public openStatusReport(uiLayerModel: UILayerModel) {
    this.bsModalRef = this.modalService.show(NgbdModalStatusReportComponent, {class: 'modal-lg'});
    uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
      this.bsModalRef.content.resourceMap = value.resourceMap;
    });
  }

}
