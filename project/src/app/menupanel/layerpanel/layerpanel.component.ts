import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { LayerHandlerService } from '@auscope/portal-core-ui';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { LayerModel } from '@auscope/portal-core-ui';
import { CsMapService } from '@auscope/portal-core-ui';
import { CsClipboardService } from '@auscope/portal-core-ui';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { RenderStatusService } from '@auscope/portal-core-ui';
import { ManageStateService } from '@auscope/portal-core-ui';
import { UtilitiesService } from '@auscope/portal-core-ui';
import {config} from '../../../environments/config';
import { MatSliderChange } from '@angular/material/slider';
import { KeysPipe } from '@auscope/portal-core-ui'; // Necessary for 'getKey' pipe in "layerpanel.component.html"
import { ResourceType } from '@auscope/portal-core-ui';

@Component({
    selector: '[appLayerPanel]',
    templateUrl: './layerpanel.component.html',
    styleUrls: ['../menupanel.scss']
})


export class LayerPanelComponent implements OnInit {

  layerGroups: {};
  uiLayerModels: {};
  bsModalRef: BsModalRef;
  @Output() expanded: EventEmitter<any> = new EventEmitter();
  searchText: string
  searchMode: boolean;


  constructor(private layerHandlerService: LayerHandlerService, private renderStatusService: RenderStatusService,
    private modalService: BsModalService, private csMapService: CsMapService,
    private manageStateService: ManageStateService, private CsClipboardService: CsClipboardService) {
    this.uiLayerModels = {};
    this.searchMode = false;
   }

    public selectTabPanel(layerId: string, panelType: string) {
      (<UILayerModel>this.uiLayerModels[layerId]).tabpanel.setPanelOpen(panelType);
    }
    /**
     * search through the layers and filter out based on keyword
     */
    public searchFilter() {
      const reg = new RegExp(config.clipboard.supportedLayersRegName, 'gi');
      for (const layerGroupKey in this.layerGroups) {
        this.layerGroups[layerGroupKey].hide = true;
        for (const layer of this.layerGroups[layerGroupKey]) {
          if (layer.name.search(reg) >= 0) {
            layer.hide = false;
            this.layerGroups[layerGroupKey].hide = false;
          } else {
            layer.hide = true;
          }
        }
      }
    }
    /**
     * search through the layers and filter out based on keyword
     */
    public search() {
      if (this.searchText.trim() === '') {
        this.searchMode = false;
      } else {
        this.searchMode = true;
      }

      for (const layerGroupKey in this.layerGroups) {
        this.layerGroups[layerGroupKey].hide = true;
        for (const layer of this.layerGroups[layerGroupKey]) {
          if (layerGroupKey.toLowerCase().indexOf(this.searchText.toLowerCase()) >= 0
            || layer.description.toLowerCase().indexOf(this.searchText.toLowerCase()) >= 0
            || layer.name.toLowerCase().indexOf(this.searchText.toLowerCase()) >= 0) {
            layer.hide = false;
            this.layerGroups[layerGroupKey].hide = false;
          } else {
            layer.hide = true;
          }
        }
      }
    }

   /**
     * search through the layers and filter out based on keyword
     */
    public searchActive() {
      this.searchText = 'Active Layer';
      this.searchMode = true;

      for (const layerGroupKey in this.layerGroups) {
        this.layerGroups[layerGroupKey].hide = true;
        for (const layer of this.layerGroups[layerGroupKey]) {
          if (this.uiLayerModels[layer.id].statusMap.renderStarted) {
            layer.hide = false;
            this.layerGroups[layerGroupKey].hide = false;
            this.layerGroups[layerGroupKey].expanded = true;
            layer.expanded = false;
          } else {
            layer.hide = true;
            layer.expanded = false;
          }
        }
      }
    }

    /**
       * search through the layers and filter out based on keyword
       */
    public searchImage() {
      this.searchText = 'Image Layer';
      this.searchMode = true;

      for (const layerGroupKey in this.layerGroups) {
        this.layerGroups[layerGroupKey].hide = true;
        for (const layer of this.layerGroups[layerGroupKey]) {
          if (this.layerHandlerService.contains(layer, ResourceType.WMS)) {
            layer.hide = false;
            this.layerGroups[layerGroupKey].hide = false;
            this.layerGroups[layerGroupKey].expanded = true;
            layer.expanded = false;
          } else {
            layer.hide = true;
            layer.expanded = false;
          }
        }
      }
    }


    /**
       * search through the layers and filter out based on keyword
       */
    public searchData() {
      this.searchText = 'Data Layer';
      this.searchMode = true;

      for (const layerGroupKey in this.layerGroups) {
        this.layerGroups[layerGroupKey].hide = true;
        for (const layer of this.layerGroups[layerGroupKey]) {
          if (this.layerHandlerService.contains(layer, ResourceType.WFS)) {
            layer.hide = false;
            this.layerGroups[layerGroupKey].hide = false;
            this.layerGroups[layerGroupKey].expanded = true;
            layer.expanded = false;
          } else {
            layer.hide = true;
            layer.expanded = false;
          }
        }
      }
    }

    /**
     * Returns true if any layer in a layer group is visible in the sidebar
     * "layerGroup" - an instance of this.layerGroups[key].value
     */
    public isLayerGroupVisible(layerGroupValue): boolean {
        if (layerGroupValue.expanded && layerGroupValue.loaded) {
            for (const layer of layerGroupValue.loaded) {
                if (layer.hide === false) {
                    return true;
                }
            }
        }
        return false;
    }

  /**
   * Clear the search result
   */
    public clearSearch() {
      setTimeout(() => {
        this.searchMode = false;
        this.searchText = '';
        this.search();
      }, 0);
    }

    public ngOnInit() {
        const nvclanid = UtilitiesService.getUrlParameterByName('nvclanid');
        const state = UtilitiesService.getUrlParameterByName('state');
        const me = this;
        this.manageStateService.getUnCompressedString(state, function(result) {
          const layerStateObj = JSON.parse(result);
          if (!UtilitiesService.isEmpty(layerStateObj)) {
            me.manageStateService.resumeMapState(layerStateObj.map);
          }
          me.layerHandlerService.getLayerRecord().subscribe(
            response => {
              me.layerGroups = response;
              for (const key in me.layerGroups) {
                for (let i = 0; i < me.layerGroups[key].length; i++) {
                  me.layerGroups[key][i].csLayers = [];
                  const uiLayerModel = new UILayerModel(me.layerGroups[key][i].id, me.renderStatusService.getStatusBSubject(me.layerGroups[key][i]));
                  // VT: permanent link
                  if (layerStateObj && layerStateObj[uiLayerModel.id]) {
                    me.layerGroups[key].expanded = true;
                    me.layerGroups[key].loaded = me.layerGroups[key];
                    me.layerGroups[key][i].expanded = true;
                    me.layerGroups[key][i].filterCollection.hiddenParams = layerStateObj[uiLayerModel.id].filterCollection.hiddenParams
                    me.layerGroups[key][i].filterCollection.mandatoryFilters = layerStateObj[uiLayerModel.id].filterCollection.mandatoryFilters
                  }
                  // LJ: nvclAnalyticalJob link
                  if ( nvclanid && uiLayerModel.id === 'nvcl-v2-borehole') {
                    me.layerGroups[key].expanded = true;
                    me.layerGroups[key].loaded = me.layerGroups[key];
                    me.layerGroups[key][i].expanded = true;
                  }
                  me.uiLayerModels[me.layerGroups[key][i].id] = uiLayerModel;

                }
              }
            });
        });
        this.CsClipboardService.filterLayersBS.subscribe(
          (bFilterLayers) => {
            if (bFilterLayers) {
              this.searchFilter();
            } else {
              this.clearSearch();
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
     * remove the layer from the map
     */
    public removeLayer(layer: LayerModel) {
      this.uiLayerModels[layer.id].opacity = 100;
      this.csMapService.removeLayer(layer);
    }

    /**
     * Layer opacity slider change event
     */
    public layerOpacityChange(event: MatSliderChange, layer: LayerModel) {
      this.csMapService.setLayerOpacity(layer, (event.value / 100));
    }

}
