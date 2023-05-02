import { Component, Input } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';


@Component({
    selector: 'layer-group',
    templateUrl: './layergroup.component.html',
    styleUrls: ['../menupanel.scss']
})
export class LayerGroupComponent {

  // Contains the layers on display 
  @Input() layerGroups: { 'Results': LayerModel[] };

  constructor(private uiLayerModelService: UILayerModelService, private layerManagerService: LayerManagerService,
    public activeModalService: NgbModal) {
  }

  /**
   * Retrieve UILayerModel from the UILayerModelService
   * 
   * @param layerId ID of layer
   */
  public getUILayerModel(layerId: string): UILayerModel {
    return this.uiLayerModelService.getUILayerModel(layerId);
  }

  /**
   * Remove a layer from the map
   * 
   * @param layer layer to be removed
   */
  public removeLayer(layer: LayerModel) {
    this.layerManagerService.removeLayer(layer);
  }

  /**
   * Display the record information dialog
   *
   * @param cswRecord CSW record for information
   */
  public displayRecordInformation(layer: LayerModel) {
    if (layer) {
      const modelRef = this.activeModalService.open(InfoPanelComponent, {
        size: "lg",
        backdrop: false
      });
      modelRef.componentInstance.cswRecords = layer.cswRecords;
      modelRef.componentInstance.layer = layer;
    }
  }
}
