import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { CsClipboardService, CsMapService, LayerHandlerService, LayerModel, ManageStateService, RenderStatusService, ResourceType, UtilitiesService } from '@auscope/portal-core-ui';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MatSliderChange } from '@angular/material/slider';
import { ImagerySplitDirection } from 'cesium';


@Component({
    selector: '[appLayerPanel]',
    templateUrl: './layerpanel.component.html',
    styleUrls: ['../menupanel.scss']
})
export class LayerPanelComponent implements OnInit {

  layerGroups: {};
  bsModalRef: BsModalRef;
  @Output() expanded: EventEmitter<any> = new EventEmitter();
  searchText: string
  searchMode: boolean;
  areLayersFiltered: boolean;

  constructor(private layerHandlerService: LayerHandlerService, private renderStatusService: RenderStatusService,
      private modalService: BsModalService, private csMapService: CsMapService,
      private manageStateService: ManageStateService, private CsClipboardService: CsClipboardService,
      private uiLayerModelService: UILayerModelService) {
    this.searchMode = false;
    this.CsClipboardService.filterLayersBS.subscribe(filterLayers => {
      this.areLayersFiltered = filterLayers;
    });
  }

  public selectTabPanel(layerId: string, panelType: string) {
    this.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
  }
  
  /**
   * Filter layers based on polygon filter compatibility
   */
  public searchFilter() {
    for (const layerGroupKey in this.layerGroups) {
      this.layerGroups[layerGroupKey].hide = true;
      for (const layer of this.layerGroups[layerGroupKey]) {
        // Look for layers with a filterCollection containing an optional filter of type 'OPTIONAL.POLYGONBBOX'
        if (layer.filterCollection !== undefined && (layer.filterCollection.optionalFilters !== null &&
            layer.filterCollection.optionalFilters.filter(f => f.type === 'OPTIONAL.POLYGONBBOX').length > 0)) {
          layer.hide = false;
          this.layerGroups[layerGroupKey].hide = false;

          this.layerGroups[layerGroupKey].expanded = true;
          this.layerGroups[layerGroupKey].loaded = this.layerGroups[layerGroupKey];

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
        if (this.getUILayerModel(layer.id).statusMap.getRenderStarted()) {
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
                if (nvclanid && uiLayerModel.id === 'nvcl-v2-borehole') {
                  me.layerGroups[key].expanded = true;
                  me.layerGroups[key].loaded = me.layerGroups[key];
                  me.layerGroups[key][i].expanded = true;
                }
                me.uiLayerModelService.setUILayerModel(me.layerGroups[key][i].id, uiLayerModel);
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
    this.getUILayerModel(layer.id).opacity = 100;
    this.csMapService.removeLayer(layer);
  }

  /**
   * Layer opacity slider change event
   */
  public layerOpacityChange(event: MatSliderChange, layer: LayerModel) {
    this.csMapService.setLayerOpacity(layer, (event.value / 100));
  }

  /**
   * Split buttons will only be displayed if the split map is shown and the layer has started (or completed) rendering
   */
  public getShowSplitMapButtons(layer: LayerModel): boolean {
    return this.csMapService.getSplitMapShown() &&
            (this.getUILayerModel(layer.id).statusMap.getRenderStarted() || this.getUILayerModel(layer.id).statusMap.getRenderComplete());
  }

  /**
   * Set a layer's split direction so that it will appear in either the left, right or both (None) panes.
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

  /**
   * Only show the split map buttons if the layer has a WMS resource.
   * 
   * @param layer current LayerModel
   */
  public getApplicableSplitLayer(layer: LayerModel): boolean {
    return this.layerHandlerService.contains(layer, ResourceType.WMS);
  }

  /**
   * Returns true if any layer in a layer group is active 
   * "layerGroup" - an instance of this.layerGroups[key].value
   */
  public isLayerGroupActive(layerGroupValue): boolean {
    let activeLayers: string[] = Object.keys(this.csMapService.getLayerModelList());
    for (const layer of layerGroupValue) {
      if(activeLayers.indexOf(layer.id)>-1){
        return true;
      }
    }
   return false;
  }

  public getUILayerModel(layerId: string): UILayerModel {
    return this.uiLayerModelService.getUILayerModel(layerId);
  }

  /**
   * Turn off Filter Layers (Polygon Filter)
   */
  public removeFilterLayers() {
    this.CsClipboardService.toggleFilterLayers(false);
  }

}
