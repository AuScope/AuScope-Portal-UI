import { Component, Input, ViewChildren, QueryList, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CsMapService } from '../../lib/portal-core-ui/service/cesium-map/cs-map.service';
import { ResourceType } from '../../lib/portal-core-ui/utility/constants.service';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { UtilitiesService } from '../../lib/portal-core-ui/utility/utilities.service';
import { ManageStateService } from '../../lib/portal-core-ui/service/permanentlink/manage-state.service';
import { LayerHandlerService } from '../../lib/portal-core-ui/service/cswrecords/layer-handler.service';
import { CsClipboardService } from '../../lib/portal-core-ui/service/cesium-map/cs-clipboard.service';
import { ref } from "../../../environments/ref";
import { SplitDirection } from 'cesium';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from '../../services/ui/uilayer-model.service';
import { LegendUiService } from '../../services/legend/legend-ui.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LayerManagerService } from '../../services/ui/layer-manager.service';
import { UserStateService } from '../../services/user/user-state.service';
import { environment } from '../../../environments/environment';
import { FilterPanelComponent } from '../common/filterpanel/filterpanel.component';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { DownloadPanelComponent } from '../common/downloadpanel/downloadpanel.component';
import { Bookmark } from '../../models/bookmark.model';
import { config } from '../../../environments/config';
import { AuthService } from '../../services/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';

// Filter modes available in the dropdown layer filter selector
enum FilterMode {
  Active = "Active Layer",
  Image = "Image Layer",
  Data = "Data Layer"
}

@Component({
    selector: '[app-active-layers]',
    templateUrl: './activelayerspanel.component.html',
    styleUrls: ['../menupanel.scss', './activelayerspanel.component.scss'],
    standalone: false
})
export class ActiveLayersPanelComponent implements AfterViewInit {
  csMapService = inject(CsMapService);
  uiLayerModelService = inject(UILayerModelService);
  layerManagerService = inject(LayerManagerService);
  legendUiService = inject(LegendUiService);
  layerHandlerService = inject(LayerHandlerService);
  csClipboardService = inject(CsClipboardService);
  userStateService = inject(UserStateService);
  manageStateService = inject(ManageStateService);
  authService = inject(AuthService);
  dialog = inject(MatDialog);
  changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChildren(FilterPanelComponent) filterComponents!: QueryList<FilterPanelComponent>;
  @ViewChildren(DownloadPanelComponent) downloadComponents!: QueryList<DownloadPanelComponent>;

  // Create a FilterMode that can be used in the HTML template
  eFilterMode = FilterMode;

  @Input() public layer: any; /* The layer object that this component represents */

  areLayersPolygonFiltered!: boolean;

  // User bookmarks (if logged in and stored)
  bookmarks: Bookmark[] = [];
  showingOnlyBookmarkedLayers = false;
  isSidebarOpen = false;



  constructor() {
    this.csClipboardService.filterLayersBS.subscribe(filterLayers => {
      this.areLayersPolygonFiltered = filterLayers;
    });
    // TODO: this forces a re-render, better to subscribe to layer list or use signals
    this.csMapService.getAddLayerSubject().subscribe(() => {
      this.changeDetectorRef.detectChanges();
    });
  }

  public isDownloadExpanded: boolean = false;

  /**
   * Open or close sidebar
   */
  public toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Open sidebar
   */
  public openSidebar() {
    this.isSidebarOpen = true;
  }

  /**
   * Close sidebar
   */
  public closeSidebar() {
    this.isSidebarOpen = false;
  }

  /**
   * Called after view is initialised
   */
  public ngAfterViewInit() {
    const stateId = UtilitiesService.getUrlParameterByName('state');

    // Attempt to fetch state from permanent link database
    this.userStateService.getPortalState(stateId).subscribe((layerStateObj: any) => {
      // If permanent link state is defined, then re-orient the camera
      if (!UtilitiesService.isEmpty(layerStateObj)) {
        this.manageStateService.resumeMapState(layerStateObj.map);
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

    // Look for bookmarks, if there are any
    this.userStateService.getBookmarks().subscribe({
      next: (bookMarkList: Bookmark[]) => {
        this.bookmarks = [];
        for (const bookMark of bookMarkList) {
          this.bookmarks.push(bookMark);
        }
      }
    });

  }

  /**
   * check if a layer has filters - used to hide the tab "Layer Styling"
   *
   * @param layerId
   * @returns boolean
   */
  public hasFilters(layerId: string): boolean {

    const filterState = this.layerManagerService.getFilters(layerId);
    /*
    // if the layer has no filters then set it to display the download tab
    if (this.getUILayerModel(layerId)) {
      this.selectTabPanel(layerId,'filterpanel');
      //this.getUILayerModel(layerId).tabpanel.downloadpanel.expanded = false;
      if (!filterState) {
        this.selectTabPanel(layerId,'downloadpanel');
        //this.getUILayerModel(layerId).tabpanel.downloadpanel.expanded = true;
      }
    }
    */

    return filterState;
  }

  /**
   * Check if a layer has advanced filter components
   * @param layerId the ID of the layer
   * @returns true if layer has advanced filter components, false otherwise
   */
  public hasAdvancedFilters(layerId: string): boolean {
    return Object.prototype.hasOwnProperty.call(ref.advancedFilter, layerId);
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
      this.layerHandlerService.getLayerModelsForIds([layerId]).subscribe(layers => {
        if (layers) {
          for (const layerModel of layers) {
            // This adds layer to the map
            this.layerManagerService.addLayer(layerModel,
              layerStateObj[layerId].optionalFilters,
              layerStateObj[layerId].filterCollection,
              layerStateObj[layerId].time);
            setTimeout(() => {
              const layerFilterPanel: FilterPanelComponent | undefined = this.filterComponents.find(fc => fc.layer.id === layerId);
              if (layerFilterPanel) {
                // Update filter values, times and map opacity
                layerFilterPanel.addLayerFromState(layerStateObj[layerId]);
                // Set opacity slider to correct position
                const uiLayerModel: any = this.uiLayerModelService.getUILayerModel(layerId);
                uiLayerModel.opacity = layerStateObj[layerId].opacity;
                this.uiLayerModelService.setUILayerModel(layerId, uiLayerModel);
              }
            }, 500);
          }
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
   *
   * @param layerId ID of layer
   */
  public getUILayerModel(layerId: string): UILayerModel | undefined {
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
   * Determine if a layer should have an opacity slider
   *
   * @param layer the layer
   * @returns true if a layer should have an opacity slider, false otherwise
   */
  public showOpacitySlider(layer: LayerModel): boolean {
    return this.csMapService.layerHasOpacity(layer);
  }

  /**
   * Layer opacity slider change event
   *
   * @param value slider change event
   * @param layer the layer object
   */
  public layerOpacityChangeValue(event: any, layer: LayerModel) {
    this.csMapService.setLayerOpacity(layer, Number(event.target.value) / 100);
  }

  /**
   * Split buttons will only be displayed if the split map is shown and the layer has started (or completed) rendering.
   *
   * @param layer the layer to show buttons on
   * @returns boolean
   */
  public getShowSplitMapButtons(layer: LayerModel): boolean {
    const uiLayer = this.getUILayerModel(layer.id);
    return !!uiLayer && this.csMapService.getSplitMapShown() &&
      (uiLayer.statusMap.getRenderStarted() || uiLayer.statusMap.getRenderComplete());
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
   * Get the ImagerySplitDirection of a layer as a string (template can't access SplitDirection)
   *
   * @param layerId the ID of the layer
   */
  public getLayerSplitDirection(layerId: string): string {
    let splitDir = "none";
    if (this.csMapService.getLayerModel(layerId) !== undefined) {
      switch (this.csMapService.getLayerModel(layerId)?.splitDirection) {
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
   * Open the modal that display the status of the render
   */
  public openStatusReport(uiLayerModel: UILayerModel) {
   const dialogRef = this.dialog.open(NgbdModalStatusReportComponent, {
      width: '800px',
      maxWidth: '800px'
    });
    const subscription = uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
      dialogRef.componentInstance.resourceMap = value.resourceMap;
    });
    dialogRef.afterClosed().subscribe(() => {
      subscription.unsubscribe();
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
        if (!record.legendSupport) { return false; }
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
   * Check whether a legend is already being displayed for layer
   *
   * @param layerId the ID of the layer
   * @returns true if a legend is being displayed for the supplied layer, false otherwise
   */
  public isLegendShown(layerId: string): boolean {
    return this.legendUiService.isLegendDisplayed(layerId);
  }

  /**
   * Event fired when a LayerModel has been been dropped after being dragged
   *
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
    const uiLayerModel = this.getUILayerModel(layerId);
    if (uiLayerModel) {
      uiLayerModel.tabpanel.setPanelOpen(panelType);
      this.isDownloadExpanded = uiLayerModel.tabpanel.downloadpanel.expanded;
    }
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
        const layerFilter = this.filterComponents.find(fc => fc.layer.id === layer.id);
        if (layerFilter) {
          layerFilter.setLayerTimeExtent();
        }
      }
    }
  }

  /**
   * Check to see if a layer is supported to be added to the map
   *
   * @param layer layer to check
   * @returns true if supported layer, false otherwise
   */
  public isMapSupportedLayer(layer: LayerModel): boolean {
    return UtilitiesService.isMapSupportedLayer(layer);
  }

  /**
  * Check to see if a layer supports downloading
  *
  * @param layer layer to check
  * @returns true if supported layer, false otherwise
  */
  public isDownloadSupportedLayer(layer: LayerModel): boolean {
    let isWCSDownloadSupported = false;
    let isCsvSupportedLayer = false;
    let isDatasetURLSupportedLayer = false;
    let isIRISDownloadSupported = false;

    if (config.wcsSupportedLayer[layer.id as keyof typeof config.wcsSupportedLayer]) {
      isWCSDownloadSupported = true;
    }
    isCsvSupportedLayer = layer.supportsCsvDownloads;

    isDatasetURLSupportedLayer = config.datasetUrlSupportedLayer[layer.id as keyof typeof config.datasetUrlSupportedLayer] !== undefined;

    if (config.datasetUrlAussPassLayer && layer.group && config.datasetUrlAussPassLayer[layer.group.toLowerCase() as keyof typeof config.datasetUrlAussPassLayer] !== undefined &&
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
  public isLayerGroupVisible(layerGroupValue: any): boolean {
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
   *
   * @param layerGroupValue - an instance of this.layerGroups[key].value
   */
  public isLayerGroupActive(layerGroupValue: any): boolean {
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
    * @param layer layer for information
    */
  public displayRecordInformation(layer: any) {
    if (layer) {
      this.dialog.open(InfoPanelComponent, {
        width: '1000px',
        maxWidth: '1000px',
        data: { cswRecords: layer.cswRecords, layer: layer, showRecordAddButton: false }
      });
    }
  }

  /**
   * Returns true iff info panel is visible
   *
   * @param layerId layer id
   * @returns true iff info panel is visible
   */
  public isInfoPanelExpanded(layerId: string): boolean {
    const uiLayerModel = this.getUILayerModel(layerId);
    if (uiLayerModel) {
      return uiLayerModel.tabpanel.infopanel.expanded;
    }
    return false;
  }

  /**
   * Returns true iff filter panel is visible
   *
   * @param layerId layer id
   * @returns true iff filter panel is visible
   */
  public isFilterPanelExpanded(layerId: string): boolean {
    const uiLayerModel = this.getUILayerModel(layerId);
    if (uiLayerModel) {
      return uiLayerModel.tabpanel.filterpanel.expanded;
    }
    return false;
  }

  /**
   * Returns true iff download panel is visible
   *
   * @param layerId layer id
   * @returns true iff download panel is visible
   */
  public isDownloadPanelExpanded(layerId: string): boolean {
    const uiLayerModel = this.getUILayerModel(layerId);
    if (uiLayerModel) {
      return uiLayerModel.tabpanel.downloadpanel.expanded;
    }
    return false;
  }

  /** Check if user is currently logged in
   *
   * @returns true if user is logged in, false otherwise
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
   * Add a layer bookmark
   *
   * @param layerId layer ID
   */
  public addLayerBookmark(layerId: string) {
    if (this.bookmarks?.find(b => b.fileIdentifier === layerId)) {
      return;
    }
    this.userStateService.addBookmark(layerId);
    const bookmark: Bookmark = { 'fileIdentifier': layerId, serviceId: '' };
    this.bookmarks.push(bookmark);
  }

  /**
   * Remove a layer bookmark
   *
   * @param layerId layer ID
   */
  public removeLayerBookmark(layerId: string) {
    this.userStateService.removeBookmark(layerId);
    this.bookmarks = this.bookmarks?.filter(b => b.fileIdentifier !== layerId);
  }

}
