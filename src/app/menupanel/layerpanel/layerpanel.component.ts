import { Component, OnInit, Output, EventEmitter, ViewChildren, QueryList, Inject } from '@angular/core';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { CsClipboardService, CsMapService, LayerHandlerService, LayerModel, ManageStateService,
         RenderStatusService, ResourceType, UtilitiesService } from '@auscope/portal-core-ui';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MatSliderChange } from '@angular/material/slider';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { SplitDirection } from 'cesium';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterPanelComponent } from '../common/filterpanel/filterpanel.component';
import { config } from '../../../environments/config';
import { DOCUMENT } from '@angular/common';


// Filter modes available in the dropdown layer filter selector
enum FilterMode {
  Active = "Active Layer",
  Image = "Image Layer",
  Data = "Data Layer"
};

@Component({
    selector: '[appLayerPanel]',
    templateUrl: './layerpanel.component.html',
    styleUrls: ['../menupanel.scss']
})
export class LayerPanelComponent implements OnInit {

  @ViewChildren(FilterPanelComponent) filterComponents: QueryList<FilterPanelComponent>;

  // Create a FilterMode that can be used in the HTML template
  eFilterMode = FilterMode;

  layerGroups: {};  // TODO: This is a copy of what's in LayerHandlerService, we should just be using that
  bsModalRef: BsModalRef;
  @Output() expanded: EventEmitter<any> = new EventEmitter();
  areLayersFiltered: boolean;


  constructor(private layerHandlerService: LayerHandlerService,
      private renderStatusService: RenderStatusService, private activeModalService: NgbModal,
      private modalService: BsModalService, private csMapService: CsMapService,
      private manageStateService: ManageStateService, private CsClipboardService: CsClipboardService,
      private uiLayerModelService: UILayerModelService, private advancedMapComponentService: AdvancedComponentService,
      @Inject(DOCUMENT) document: Document) {
    this.CsClipboardService.filterLayersBS.subscribe(filterLayers => {
      this.areLayersFiltered = filterLayers;
    });
  }

  public selectTabPanel(layerId: string, panelType: string) {
    this.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
  }

  /**
   * Toggle layer expanded and load GetCapabilities if not already loaded
   *
   * @param layer LayerModel for layer
   */
  public layerClicked(layer: any) {
    layer.expanded = !layer.expanded;

    if (layer.expanded && config.queryGetCapabilitiesTimes.indexOf(layer.id) > -1) {
      const layerFilter: FilterPanelComponent = this.filterComponents.find(fc => fc.layer.id === layer.id);
      if (layerFilter) {
        layerFilter.setLayerTimeExtent();
      }
    }
  }
  /**
   * Check to see if a layer is supported to be added to the map
   * @param layer layer to check
   * @returns true if supported layer, false otherwise
   */
   public isMapSupportedLayer(layer: LayerModel): boolean {
    return this.csMapService.isMapSupportedLayer(layer);
   }
  /**
   * Check if a LayerModel contains a filter collection that has an optional filter of type "OPTIONAL.POLYGONBBOX"
   * @param layer the LayerModel
   * @returns true if a polygon filter is found, false otherwise
   */
  private layerHasPolygonFilter(layer: LayerModel): boolean {
    return layer.filterCollection !== undefined && (layer.filterCollection.optionalFilters !== null &&
      layer.filterCollection.optionalFilters.filter(f => f.type === 'OPTIONAL.POLYGONBBOX').length > 0);
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

  public ngOnInit() {
      const nvclanid = UtilitiesService.getUrlParameterByName('nvclanid');
      const state = UtilitiesService.getUrlParameterByName('state');
      const me = this;

      // Attempt to fetch state from permanent link database
      this.manageStateService.fetchStateFromDB(state).subscribe((layerStateObj: any) => {

        // If permanent link state is defined, then re-orient the camera
        if (!UtilitiesService.isEmpty(layerStateObj)) {
          me.manageStateService.resumeMapState(layerStateObj.map);
        }

        // Initialise layers and groups in sidebar
        me.layerHandlerService.getLayerRecord().subscribe(
          response => {
            me.layerGroups = response;
            // Loop over each group of layers
            for (const group in me.layerGroups) {
              // Loop over each layer in a group
              for (let layer_idx = 0; layer_idx < me.layerGroups[group].length; layer_idx++) {

                // Initialise a list of cesium layers
                me.layerGroups[group][layer_idx].csLayers = [];
                // Initialise UILayerModel
                const uiLayerModel = new UILayerModel(me.layerGroups[group][layer_idx].id, me.renderStatusService.getStatusBSubject(me.layerGroups[group][layer_idx]));
                me.uiLayerModelService.setUILayerModel(me.layerGroups[group][layer_idx].id, uiLayerModel);

                // Configure according to permanent link state
                if (layerStateObj && layerStateObj[uiLayerModel.id]) {
                  me.layerGroups[group].expanded = true;
                  me.layerGroups[group].loaded = me.layerGroups[group];
                  me.layerGroups[group][layer_idx].expanded = true;
                  if (layerStateObj[uiLayerModel.id].filterCollection && layerStateObj[uiLayerModel.id].filterCollection.hasOwnProperty('hiddenParams')) {
                    me.layerGroups[group][layer_idx].filterCollection.hiddenParams = layerStateObj[uiLayerModel.id].filterCollection.hiddenParams;
                  }
                  if (layerStateObj[uiLayerModel.id].filterCollection && layerStateObj[uiLayerModel.id].filterCollection.hasOwnProperty('mandatoryFilter')) {
                    me.layerGroups[group][layer_idx].filterCollection.mandatoryFilters = layerStateObj[uiLayerModel.id].filterCollection.mandatoryFilters;
                  }
                }

                // LJ: nvclAnalyticalJob link
                if (nvclanid && uiLayerModel.id === 'nvcl-v2-borehole') {
                  me.layerGroups[group].expanded = true;
                  me.layerGroups[group].loaded = me.layerGroups[group];
                  me.layerGroups[group][layer_idx].expanded = true;
                }
              }
            }
          });
      });

      // Groups/Layers can be expanded from the search panel
      this.manageStateService.layerToExpand.subscribe(layerId => {
        if (layerId !== null) {
          for (const group in me.layerGroups) {
            for (const layer in me.layerGroups[group]) {
              if (me.layerGroups[group][layer].id === layerId) {
                me.layerGroups[group].expanded = true;
                me.layerGroups[group].loaded = me.layerGroups[group];
                me.layerGroups[group][layer].expanded = true;
                setTimeout(() => {
                  const layerElement: HTMLElement = document.getElementById(me.layerGroups[group][layer].id + '-lp');
                  layerElement.scrollIntoView();
                });
                return;
              }
            }
          }
        }
      });
  }

  /**
   * Open the modal that display the status of the render
   */
  public openStatusReport(uiLayerModel: UILayerModel) {
    this.bsModalRef = this.modalService.show(NgbdModalStatusReportComponent, {class: 'modal-lg'});
    uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
      this.bsModalRef.content.resourceMap = value.resourceMap;
    });
  }

  /**
   * Remove the layer from the map
   */
  public removeLayer(layer: LayerModel) {
    this.getUILayerModel(layer.id).opacity = 100;
    this.csMapService.removeLayer(layer);
    // Remove any layer specific map components
    this.advancedMapComponentService.removeAdvancedMapComponents(layer.id);
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
   * Gets the layer's split direction
   * 
   * @param layerId layer id string
   * @returns a string "none" or "left" or "right"
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
   * Returns true if any layer in a layer group is active
   * "layerGroup" - an instance of this.layerGroups[key].value
   */
  public isLayerGroupActive(layerGroupValue): boolean {
    const activeLayers: string[] = Object.keys(this.csMapService.getLayerModelList());
    for (const layer of layerGroupValue) {
      if (activeLayers.indexOf(layer.id) > -1) {
        return true;
      }
    }
   return false;
  }

  /**
   * Gets a layers "UILayerModel"
   * 
   * @param layerId layer id string
   * @returns UILayerModel object 
   */
  public getUILayerModel(layerId: string): UILayerModel {
    return this.uiLayerModelService.getUILayerModel(layerId);
  }

  /**
   * Turn off Filter Layers (Polygon Filter)
   */
  public removeFilterLayers() {
    this.CsClipboardService.toggleFilterLayers(false);
  }

 /**
   * Display the record information dialog
   *
   * @param cswRecord CSW record for information
   */
  public displayRecordInformation(layer: any) {
    if (layer) {
      const modelRef = this.activeModalService.open(InfoPanelComponent, {
        size: "lg",
        backdrop: false
      });
      modelRef.componentInstance.cswRecords = layer.cswRecords;
      modelRef.componentInstance.layer = layer;
    }
  }

  public isInfoPanelExpanded(layerId: string): boolean {
    if (this.getUILayerModel(layerId)) {
      return this.getUILayerModel(layerId).tabpanel.infopanel.expanded;
    }
    return false;
  }

  public isFilterPanelExpanded(layerId: string): boolean {
    if (this.getUILayerModel(layerId)) {
      return this.getUILayerModel(layerId).tabpanel.filterpanel.expanded;
    }
    return false;
  }

  public isDownloadPanelExpanded(layerId: string): boolean {
    if (this.getUILayerModel(layerId)) {
      return this.getUILayerModel(layerId).tabpanel.downloadpanel.expanded;
    }
    return false;
  }

}
