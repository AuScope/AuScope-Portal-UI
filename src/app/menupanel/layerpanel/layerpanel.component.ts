import { Component, OnInit, Output, EventEmitter, ViewChildren, QueryList, Inject } from '@angular/core';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { CsClipboardService, CsMapService, LayerHandlerService, LayerModel, ManageStateService,
         RenderStatusService, ResourceType, UtilitiesService } from '@auscope/portal-core-ui';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MatLegacySliderChange as MatSliderChange } from '@angular/material/legacy-slider';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { SplitDirection } from 'cesium';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterPanelComponent } from '../common/filterpanel/filterpanel.component';
import { config } from '../../../environments/config';
import { DOCUMENT } from '@angular/common';
import { DownloadPanelComponent } from '../common/downloadpanel/downloadpanel.component';
import { LegendUiService } from 'app/services/legend/legend-ui.service';
import { UserStateService } from 'app/services/user/user-state.service';
import { Bookmark } from 'app/models/bookmark.model';
import { AuthService } from 'app/services/auth/auth.service';


// Filter modes available in the dropdown layer filter selector
enum FilterMode {
  Active = "Active Layer",
  Image = "Image Layer",
  Data = "Data Layer"
}

@Component({
    selector: '[appLayerPanel]',
    templateUrl: './layerpanel.component.html',
    styleUrls: ['../menupanel.scss', './layerpanel.component.scss']
})
export class LayerPanelComponent implements OnInit {

  @ViewChildren(FilterPanelComponent) filterComponents: QueryList<FilterPanelComponent>;
  @ViewChildren(DownloadPanelComponent) downloadComponents: QueryList<DownloadPanelComponent>;

  // Create a FilterMode that can be used in the HTML template
  eFilterMode = FilterMode;

  layerGroups: {};  // TODO: This is a copy of what's in LayerHandlerService, we should just be using that
  bsModalRef: BsModalRef;
  @Output() expanded: EventEmitter<any> = new EventEmitter();
  areLayersPolygonFiltered: boolean;

  // User bookmarks (if logged in and stored)
  bookmarks: Bookmark[];
  showingOnlyBookmarkedLayers = false;


  constructor(private layerHandlerService: LayerHandlerService,
      private renderStatusService: RenderStatusService, private activeModalService: NgbModal,
      private modalService: BsModalService, private csMapService: CsMapService,
      private manageStateService: ManageStateService, private csClipboardService: CsClipboardService,
      private uiLayerModelService: UILayerModelService, private advancedMapComponentService: AdvancedComponentService,
      private userStateService: UserStateService, private legendUiService: LegendUiService,
      private authService: AuthService, @Inject(DOCUMENT) document: Document) {
      this.csClipboardService.filterLayersBS.subscribe(filterLayers => {
      this.areLayersPolygonFiltered = filterLayers;
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
    if (layer.expanded) {
      if (config.queryGetCapabilitiesTimes.indexOf(layer.id) > -1) {
        const layerFilter: FilterPanelComponent = this.filterComponents.find(fc => fc.layer.id === layer.id);
        if (layerFilter) {
          layerFilter.setLayerTimeExtent();
        }
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
  * Check to see if a layer is support downloading
  * @param layer layer to check
  * @returns true if supported layer, false otherwise
  */
  public isDownloadSupportedLayer(layer: LayerModel): boolean {
    let isWCSDownloadSupported = false;
    let isCsvSupportedLayer = false;
    let isDatasetURLSupportedLayer = false;
    let isIRISDownloadSupported = false;

    if (config.wcsSupportedLayer[layer.id]) {
      isWCSDownloadSupported = true;
    }
    isCsvSupportedLayer = layer.supportsCsvDownloads;

    isDatasetURLSupportedLayer = config.datasetUrlSupportedLayer[layer.id] !== undefined;

    if (config.datasetUrlAussPassLayer[layer.group.toLowerCase()] !== undefined &&
      this.layerHandlerService.contains(layer, ResourceType.IRIS)) {
      isIRISDownloadSupported = true;
    }

    const isDownloadSupported = isCsvSupportedLayer || isWCSDownloadSupported || isDatasetURLSupportedLayer || isIRISDownloadSupported;
    return isDownloadSupported;
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
      const stateId = UtilitiesService.getUrlParameterByName('state');
      const me = this;

      // Attempt to fetch state from permanent link database
      this.userStateService.getPortalState(stateId).subscribe((layerStateObj: any) => {
        // If permanent link state is defined, then re-orient the camera
        if (!UtilitiesService.isEmpty(layerStateObj)) {
          me.manageStateService.resumeMapState(layerStateObj.map);
        } else if(stateId !== undefined) {
          alert('The specified state could not be found, it may have been deleted or made private.');
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

      // Filter layers by ability to use polygon filter
      this.csClipboardService.filterLayersBS.subscribe(
        (bFilterLayers) => {
          if (bFilterLayers) {
            this.showLayersWithPolygonFilter();
          } else {
            this.showAllLayers();
          }
        });
      // Keep track of bookmarks
      this.userStateService.bookmarks.subscribe(bookmarks => {
        this.bookmarks = bookmarks;
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
    this.legendUiService.removeLegend(layer.id);
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
    this.csClipboardService.toggleFilterLayers(false);
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

  /**
   * Check if a LayerModel contains a filter collection that has an optional filter of type "OPTIONAL.POLYGONBBOX"
   *
   * @param layer the LayerModel
   * @returns true if a polygon filter is found, false otherwise
   */
  private layerHasPolygonFilter(layer: LayerModel): boolean {
    return layer.filterCollection !== undefined && (layer.filterCollection.optionalFilters !== null &&
      layer.filterCollection.optionalFilters.find(f => f.type === 'OPTIONAL.POLYGONBBOX'));
  }

  /**
   * Only display layers in the Featured Layers list that have a polygon filter
   */
  private showLayersWithPolygonFilter() {
    for (const group in this.layerGroups) {
      this.layerGroups[group].hide = true;
      for (const layer of this.layerGroups[group]) {
        layer.hide = true;
        // Only layers with a polygon filter
        if (this.layerHasPolygonFilter(layer)) {
          layer.hide = false;
          this.layerGroups[group].hide = false;
          this.layerGroups[group].expanded = true;
          this.layerGroups[group].loaded = this.layerGroups[group];
        }
      }
    }
  }

  /**
   * Display all layers in the Featured Layers list
   */
  private showAllLayers() {
    for (const group in this.layerGroups) {
      this.layerGroups[group].hide = false;
      for (const layer of this.layerGroups[group]) {
        layer.hide = false;
        this.layerGroups[group].hide = false;
        this.layerGroups[group].loaded = this.layerGroups[group];
      }
    }
  }
   /** Check is user is currently logged in
   *
   * @returns true if user is logge din, false otherwise
   */
  public isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  /**
   * Set whether to show all layers or only bookmarks (id user is logged in)
   *
   * @param showBookmarks true if only showing bookmarks, false for all layers
   */
  public setShowingOnlyBookmarkedLayers(onlyBookmarks: boolean) {
    this.showingOnlyBookmarkedLayers = onlyBookmarks;
  }

  /**
   * Get whether user has at least one bookmarked layer
   *
   * @returns true if user at least one bookmarked layer, false otherwise
   */
  public hasBookmarkedLayers(): boolean {
    return this.bookmarks && this.bookmarks.length > 0;
  }

  /**
   * See if a specific layer has been bookmarked
   *
   * @param layerId the layer ID
   * @returns true if layer is bookmarked for current user, false otherwise
   */
  public isLayerBookmarked(layerId: string): boolean {
    if (this.bookmarks && this.bookmarks.find(b => b.fileIdentifier === layerId)) {
      return true;
    }
    return false;
  }

  /**
   * See whether a layer group contains a layer that has been bookmarked by the user
   *
   * @param layerGroupKey the key (string) of the layer group
   * @returns true if the layer group ocntains a layer that has been bookmarked, false otherwise
   */
  public layerGroupHasBookmarkedLayer(layerGroupKey: string): boolean {
    if (this.layerGroups[layerGroupKey]) {
      for (const layer of this.layerGroups[layerGroupKey]) {
        if (this.bookmarks && this.bookmarks.find(b => b.fileIdentifier === layer.id)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Add a layer bookmark
   *
   * @param layerId layer ID
   */
  public addLayerBookmark(layerId: string) {
    this.userStateService.addBookmark(layerId);
  }

  /**
   * Remove a layer bookmark
   *
   * @param layerId layer ID
   */
  public removeLayerBookmark(layerId: string) {
    this.userStateService.removeBookmark(layerId);
  }

}
