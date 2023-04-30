import { Component } from '@angular/core';
import { CsMapService, LayerHandlerService, LayerModel, ResourceType } from '@auscope/portal-core-ui';
import { MatSliderChange } from '@angular/material/slider';
import { SplitDirection } from 'cesium';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { LegendUiService } from 'app/services/legend/legend-ui.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';

@Component({
  selector: '[appActiveLayers]',
  templateUrl: './activelayerspanel.component.html',
  styleUrls: ['../menupanel.scss', './activelayerspanel.component.scss']
})
export class ActiveLayersPanelComponent {
  bsModalRef: BsModalRef;

  constructor(private csMapService: CsMapService,
    private uiLayerModelService: UILayerModelService, private layerHandlerService: LayerHandlerService,
    private layerManagerService: LayerManagerService, private legendUiService: LegendUiService,
    private modalService: BsModalService) { }

  /**
   * Get active layers
   */
  public getActiveLayers(): LayerModel[] {
    const reversedLayers = [...this.csMapService.getLayerModelList()].reverse();
    return reversedLayers;
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
  removeLayer(layer: LayerModel): void {
    this.layerManagerService.removeLayer(layer);
    // Remove polygon filter if was opened and no layers present
    /*
    if (Object.keys(layerModelList).length === 0) {
      this.csClipboardService.clearClipboard();
      this.csClipboardService.toggleClipboard(false);
    }
    */
  }

  /**
   * Determine if a layer hsould have an opacity slider
   * @param layer the layer
   * @returns true if a layer should have an opacity slider, false otherwise
   */
  showOpacitySlider(layer: LayerModel): boolean {
    return this.csMapService.layerHasOpacity(layer);
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
    if (this.csMapService.getLayerModel(layerId) !== undefined) {
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

  /**
   * Check whether the layer has at least one associated WMS online resource
   * that can be queried for a legend
   *
   * @param layer the layer
   * @returns true if the layer has at least one WMS online resource, false otherwise
   */
  public hasLegend(layer: LayerModel): boolean {
    // Hack for GRACE layer which uses a custom app-built legend
    if (layer.id === 'grace-mascons') {
      return false;
    }
    // Some layers have static legend images on the server
    if (layer.legendImg && layer.legendImg !== '') {
      return true;
    }
    // Look for a WMS URL
    if (layer.cswRecords) {
      for (const record of layer.cswRecords) {
        if (record.onlineResources.find(r => r.type.toLowerCase() === 'wms')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Tell the LegendUiService to display the legend for a layer
   *
   * @param layer the layer
   */
  public showLegend(layer: LayerModel) {
    this.legendUiService.showLegend(layer);
  }

  /**
   * Check whether a legend is already being displayed for alyer
   *
   * @param layerId the ID of the layer
   * @returns true if a legend is being displayed for the supplied layer, false otherwise
   */
  public isLegendShown(layerId: string): boolean {
    return this.legendUiService.isLegendDisplayed(layerId);
  }

  /**
   * Event fired when a LayerModel has been been dropped after being dragged
   * @param event the CdkDragDrop event
   */
  public layerDropped(event: CdkDragDrop<LayerModel[]>) {
    // Active layers list was reversed so invert array indices
    const fromIndex = this.getActiveLayers().length - event.previousIndex - 1;
    const toIndex = this.getActiveLayers().length - event.currentIndex - 1;
    if (fromIndex !== toIndex) {
      this.csMapService.moveLayer(fromIndex, toIndex);
    }
  }

}
