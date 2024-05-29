import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { LayerHandlerService, RenderStatusService } from '@auscope/portal-core-ui';
import { UILayerModel } from '../menupanel/common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { LayerModel } from '@auscope/portal-core-ui'
import { LayerManagerService } from 'app/services/ui/layer-manager.service';
import { FilterService } from 'app/services/filter/filter.service';
import { SidebarService } from 'app/portal/sidebar.service';
import { Subscription } from 'rxjs';
import { UserStateService } from 'app/services/user/user-state.service';
import { AuthService } from 'app/services/auth/auth.service';


@Component({
    selector: 'app-browse-menu',
    templateUrl: './browsepanel.component.html',
    styleUrls: ['./browsepanel.component.scss']
})
export class BrowsePanelComponent implements OnInit, AfterViewInit, OnDestroy {

  public layerGroupColumn: {}; /* Holds the data structures for all layers and groups */
  public layerColumn: []; /* List of layers for a certain group */
  public layerColumnHeader = ""; /* Name of group is shown at the top of the layer column */
  public selectedLayer; /* Selected layer, assigned a layer object */
  public panelStayOpen = false; /* Checkbox state for user to keep panel open after adding a layer */
  public bShowBrowsePanel = false; /* If true menu panel is open */
  public isSidebarOpen = false; /* If true sidebar is open */
  public sidebarSubscription: Subscription;
  public layerBookmarked = {}; /* Object stores which layers are bookmarked. key is layer id, value is boolean */
  public showOnlyBookmarked = false; /* When true only bookmarked layers are shown in the browse menu */

  constructor(private layerHandlerService: LayerHandlerService,
      private layerManagerService: LayerManagerService,
      private renderStatusService: RenderStatusService,
      private uiLayerModelService: UILayerModelService,
      private filterService: FilterService,
      private sidebarService: SidebarService,
      private userStateService: UserStateService,
      private authService: AuthService
      ) {
  }

  /**
   * Toggle sidebar
   */
  public toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  /**
   * Initialise Component
   */
  public ngOnInit() {
    const me = this;
    this.sidebarSubscription = this.sidebarService.isSidebarOpen$.subscribe(
      isOpen => {
        this.isSidebarOpen = isOpen;
      }
    );
    // Initialise layers and groups in sidebar
    this.layerHandlerService.getLayerRecord().subscribe(
      response => {
        me.layerGroupColumn = response;
        // Loop over each group of layers
        for (const group in me.layerGroupColumn) {
          // Loop over each layer in a group
          for (let layer_idx = 0; layer_idx < me.layerGroupColumn[group].length; layer_idx++) {

            // Initialise a list of cesium layers
            me.layerGroupColumn[group][layer_idx].csLayers = [];
            // Initialise UILayerModel
            const uiLayerModel = new UILayerModel(me.layerGroupColumn[group][layer_idx].id, me.renderStatusService.getStatusBSubject(me.layerGroupColumn[group][layer_idx]));
            me.uiLayerModelService.setUILayerModel(me.layerGroupColumn[group][layer_idx].id, uiLayerModel);
          }
        }
        // Sort alphabetically by group name
        Object.keys(me.layerGroupColumn).forEach(group => {
          me.layerGroupColumn[group].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    );
  }

  /**
   * Called after Angular has initialised the view
   */
  public ngAfterViewInit() {
    const me = this;
    this.userStateService.getBookmarks().subscribe(bookMarkList => {
      me.layerBookmarked = {}
      for (const bookMark of bookMarkList) {
        me.layerBookmarked[bookMark.fileIdentifier] = true;
      }
    });
  }

  /**
   * Check is user is currently logged in
   *
   * @returns true if user is logged in, false otherwise
   */
  public isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  /**
   * See whether a layer group contains a layer that has been bookmarked by the user
   *
   * @param layerGroupKey the key (string) of the layer group
   * @returns true iff the layer group contains a layer that has been bookmarked, false otherwise
   */
  public layerGroupHasBookmarkedLayer(layerGroupKey: string): boolean {
    if (this.layerGroupColumn.hasOwnProperty(layerGroupKey)) {;
      for (const layer of this.layerGroupColumn[layerGroupKey]) {
        if (this.layerBookmarked?.hasOwnProperty(layer.id) && this.layerBookmarked[layer.id]) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Called when component destroyed
   */
  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
        this.sidebarSubscription.unsubscribe();
    }
  }

  /**
   * Select a group
   * 
   * @param layerGroup group
   */
  public selectGroup(layerGroup): void {
    this.layerColumn = layerGroup.value;
    this.layerColumnHeader = layerGroup.key;
    layerGroup.value.expanded = !layerGroup.value.expanded;
    this.selectedLayer = null;
  }

  /**
   * Select a layer 
   * 
   * @param layer layer 
   */
  public selectLayer(layer) {
    this.selectedLayer = layer;
  }

  /**
   * Add layer to map
   * 
   * @param layer the layer to add to map
   */
  public addLayer(layer: LayerModel): void {
    // Fetch layer times and add layer
    this.filterService.getLayerTimesBS(layer.id).subscribe(layerTimes => {
      this.layerManagerService.addLayer(layer, [], null, layerTimes.currentTime);
    });

    // Close panel once layer is added, unless user requests it stay open
    if (!this.panelStayOpen) {
      this.toggleBrowsePanel(false);
    }
    this.sidebarService.setOpenState(true);
  }

  /**
   * Opens and closes browse panel
   * 
   * @param open if true will open panel if false will close panel if missing will toggle 
   */
  public toggleBrowsePanel(open?: boolean) {
    if (open !== undefined) {
      this.bShowBrowsePanel = open;
    } else {
      this.bShowBrowsePanel = !this.bShowBrowsePanel;
    }
  } 
  

  /**
   * Is this layer selected?
   * 
   * @param layer LayerModel for layer
   * @returns t@returns true if this layer is selected
   */
  public isLayerSelected(layer: any) {
    return this.selectedLayer === layer;
  }

  /**
   * Is this group selected?
   *
   * @param layerGroup group
   * @returns true if this group is selected
   */
  public isGroupSelected(layerGroup: any) {
    return this.layerColumn === layerGroup.value;
  }

  /**
   * Checks if a layer has been bookmarked
   *
   * @param layerId layer id
   * @returns boolean, true iff layer has been bookmarked
   */

  public checkLayerBookmarked(layerId: string) {
    return this.layerBookmarked?.hasOwnProperty(layerId) && this.layerBookmarked[layerId];
  }
}
