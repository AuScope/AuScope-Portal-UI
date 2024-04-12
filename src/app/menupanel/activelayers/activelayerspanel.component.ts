import { ChangeDetectorRef, Component, Input, ViewChildren, ViewChild, QueryList, AfterViewInit } from '@angular/core';
import { CsMapService, LayerModel, ResourceType, UtilitiesService } from '@auscope/portal-core-ui';
import { ManageStateService, LayerHandlerService, CsClipboardService } from '@auscope/portal-core-ui';
import { SplitDirection } from 'cesium';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { LegendUiService } from 'app/services/legend/legend-ui.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';
import { UserStateService } from 'app/services/user/user-state.service';
import { environment } from 'environments/environment';
import { FilterPanelComponent } from '../common/filterpanel/filterpanel.component';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { DownloadPanelComponent } from '../common/downloadpanel/downloadpanel.component';
import { Bookmark } from 'app/models/bookmark.model';
import { config } from '../../../environments/config';
import { AuthService } from 'app/services/auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Filter modes available in the dropdown layer filter selector
enum FilterMode {
  Active = "Active Layer",
  Image = "Image Layer",
  Data = "Data Layer"
}

@Component({
  selector: '[appActiveLayers]',
  templateUrl: './activelayerspanel.component.html',
  styleUrls: ['../menupanel.scss', './activelayerspanel.component.scss']
})
export class ActiveLayersPanelComponent implements AfterViewInit {
  bsModalRef: BsModalRef;

  @ViewChildren(FilterPanelComponent) filterComponents: QueryList<FilterPanelComponent>;
  @ViewChildren(DownloadPanelComponent) downloadComponents: QueryList<DownloadPanelComponent>;

  // Create a FilterMode that can be used in the HTML template
  eFilterMode = FilterMode;

  @Input() public layer; /* The layer object that this component represents */

  areLayersPolygonFiltered: boolean;

  // User bookmarks (if logged in and stored)
  bookmarks: Bookmark[];
  showingOnlyBookmarkedLayers = false;

  constructor(private csMapService: CsMapService,
    private uiLayerModelService: UILayerModelService, private layerManagerService: LayerManagerService,
    private legendUiService: LegendUiService, private modalService: BsModalService,
    private layerHandlerService: LayerHandlerService, private csClipboardService: CsClipboardService,
    private userStateService: UserStateService, private manageStateService: ManageStateService,
    private authService: AuthService, private activeModalService: NgbModal) { 
      this.csClipboardService.filterLayersBS.subscribe(filterLayers => {
        this.areLayersPolygonFiltered = filterLayers;
      });
    }

  public ngAfterViewInit() {
    const stateId = UtilitiesService.getUrlParameterByName('state');
    const me = this;

    // Attempt to fetch state from permanent link database
    this.userStateService.getPortalState(stateId).subscribe((layerStateObj: any) => {
      // If permanent link state is defined, then re-orient the camera
      if (!UtilitiesService.isEmpty(layerStateObj)) {
        me.manageStateService.resumeMapState(layerStateObj.map);
      } else if (stateId !== undefined) {
        alert('The specified state could not be found, it may have been deleted or made private.');
      }

      // Set base map if "baseMap" key is present
      if (layerStateObj.hasOwnProperty('baseMap')) {
        const baseMap = environment.baseMapLayers.find(bm => bm.value === layerStateObj['baseMap']);
        if (baseMap) {
          this.csMapService.setBaseMapLayer(baseMap.viewValue);
        }
      }
      // Load state layers in corresponding FilterPanels
      this.loadFilterPanelLayersFromState(layerStateObj);
    });
  }

  /**
   * Load permanent link state layers from their respective FilterPanels
   *
   * @param layerStateObj the permanent link state JSON Object
   */
  private loadFilterPanelLayersFromState(layerStateObj: any) {
    // Re-order layers by index field provided index field is present (it won't be in older states)
    const orderedLayerKeys: string[] = [];
    for (const layer of Object.keys(layerStateObj)) {
      if (layer.toLowerCase() !== 'map' && layer.toLowerCase() !== 'basemap') {
        // Add layer at 'index' position of array, else just push
        if (layerStateObj[layer].hasOwnProperty('index')) {
          orderedLayerKeys[layerStateObj[layer].index] = layer;
        } else {
          orderedLayerKeys.push(layer);
        }
      }
    }

    // Add ordered layers to map
    for (const layerId of orderedLayerKeys) {
      const me = this;
      this.layerHandlerService.getLayerModelsForIds([layerId]).subscribe(layers => {
        for (const layerModel of layers) {
          // This adds layer to the map
          me.layerManagerService.addLayer(layerModel, 
                                          layerStateObj[layerId].optionalFilters,
                                          layerStateObj[layerId].filterCollection,
                                          layerStateObj[layerId].time);
          setTimeout(() => {
            const layerFilterPanel: FilterPanelComponent = me.filterComponents.find(fc => fc.layer.id === layerId);
            if (layerFilterPanel) {
              // Update filter values, times and map opacity 
              layerFilterPanel.addLayerFromState(layerStateObj[layerId]);
              // Set opacity slider to correct position
              const uiLayerModel = this.uiLayerModelService.getUILayerModel(layerId);
              uiLayerModel.opacity = layerStateObj[layerId].opacity;
              this.uiLayerModelService.setUILayerModel(layerId, uiLayerModel);
            }
          }, 500);
        }
      });
    }
  }

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
  public removeLayer(layer: LayerModel): void {
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
  public showOpacitySlider(layer: LayerModel): boolean {
    return this.csMapService.layerHasOpacity(layer);
  }

  /**
   * Layer opacity slider change event
   * @param value slider change event
   * @param layer the layer object
   */
  public layerOpacityChangeValue(event: any, layer: LayerModel) {
    this.csMapService.setLayerOpacity(layer, Number(event.target.value) / 100);
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
    return UtilitiesService.layerContainsResourceType(layer, ResourceType.WMS);
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

  /**
   * Makes a filter or download tab panel visible
   * 
   * @param layerId layer id string
   * @param panelType panel type string, either 'filterpanel' or 'downloadpanel'
   */
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
      UtilitiesService.layerContainsResourceType(layer, ResourceType.IRIS)) {
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


  /**
   * Returns true if any layer in a layer group is active
   * "layerGroup" - an instance of this.layerGroups[key].value
   */
  public isLayerGroupActive(layerGroupValue): boolean {
    for (const layer of layerGroupValue) {
      if (this.csMapService.getLayerModelList().findIndex(l => l.id === layer.id) > -1) {
        return true;
      }
    }
    return false;
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
        backdrop: false,
        scrollable: true
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
    return this.bookmarks?.length > 0;
  }

  /**
   * See if a specific layer has been bookmarked
   *
   * @param layerId the layer ID
   * @returns true if layer is bookmarked for current user, false otherwise
   */
  public isLayerBookmarked(layerId: string): boolean {
    if (this.bookmarks?.find(b => b.fileIdentifier === layerId)) {
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
    /*if (this.layerGroups[layerGroupKey]) {
      for (const layer of this.layerGroups[layerGroupKey]) {
        if (this.bookmarks?.find(b => b.fileIdentifier === layer.id)) {
          return true;
        }
      }
    }*/
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
