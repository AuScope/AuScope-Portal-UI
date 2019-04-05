import { Component, Output, EventEmitter } from '@angular/core';
import { LayerHandlerService } from '../../portal-core-ui/service/cswrecords/layer-handler.service';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { LayerModel } from '../../portal-core-ui/model/data/layer.model';
import { OlMapService } from '../../portal-core-ui/service/openlayermap/ol-map.service';
import { RenderStatusService } from '../../portal-core-ui/service/openlayermap/renderstatus/render-status.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap';
import { UILayerModel } from '../common/model/ui/uilayer.model';


@Component({
    selector: '[appCustomPanel]',
    templateUrl: './custompanel.component.html',
    styleUrls: ['../menupanel.scss']
})


export class CustomPanelComponent {

   searchUrl: string;
   loading: boolean;
   statusmsg: string;

   layerGroups: {};
    uiLayerModels: {};
    bsModalRef: BsModalRef;
    @Output() expanded: EventEmitter<any> = new EventEmitter();

    constructor(private layerHandlerService: LayerHandlerService, private renderStatusService: RenderStatusService,
      private modalService: BsModalService, private olMapService: OlMapService) {
      this.uiLayerModels = {};
      this.loading = false;
      this.statusmsg = 'Enter your WMS service endpoint URL and hit <i class="fa fa-search"></i>';
    }

    public selectTabPanel(layerId: string, panelType: string) {
      (<UILayerModel>this.uiLayerModels[layerId]).tabpanel.setPanelOpen(panelType);
    }
    /**
     * Search list of wms layer given the wms url
     */
    public search() {
      this.loading = true;
      this.layerHandlerService.getCustomLayerRecord(this.searchUrl).subscribe(
        response => {
          this.loading = false;
          if (response != null) {
            this.layerGroups = response;
            for (const key in this.layerGroups) {
              for (let i = 0; i < this.layerGroups[key].length; i++) {
                const uiLayerModel = new UILayerModel(this.layerGroups[key][i].id, this.renderStatusService.getStatusBSubject(this.layerGroups[key][i]));
                this.uiLayerModels[this.layerGroups[key][i].id] = uiLayerModel;
              }
            }
          } else {
            this.statusmsg = '<div class="text-danger">No viable WMS found on the service endpoint. Kindly check your URL again.</div>';
          }
        });
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
   * remove a layer from the map
   */
    public removeLayer(layer: LayerModel) {
      this.olMapService.removeLayer(layer);
    }

}
