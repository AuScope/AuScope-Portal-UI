import { Component, OnInit } from '@angular/core';
import { LayerHandlerService, RenderStatusService } from '@auscope/portal-core-ui';
import { UILayerModel } from '../menupanel/common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { LayerModel } from '@auscope/portal-core-ui'
import { LayerManagerService } from 'app/services/ui/layer-manager.service';
import { FilterService, LayerTimes } from 'app/services/filter/filter.service';
import { config } from '../../environments/config';


@Component({
    selector: 'app-browse-menu',
    templateUrl: './browsepanel.component.html',
    styleUrls: ['./browsepanel.component.scss']
})
export class BrowsePanelComponent implements OnInit {

  public layerGroupColumn: {}; /* Holds the data structures for all layers and groups */
  public layerColumn: []; /* List of layers for a certain group */
  public layerColumnHeader = ""; /* Name of group is shown at the top of the layer column */
  public selectedLayer; /* Selected layer, assigned a layer object */
  public panelStayOpen = false; /* Checkbox state for user to keep panel open after adding a layer */
  public bShowBrowsePanel = false; /* If true menu panel is open */

  constructor(private layerHandlerService: LayerHandlerService,
      private layerManagerService: LayerManagerService,
      private renderStatusService: RenderStatusService,
      private uiLayerModelService: UILayerModelService,
      private filterService: FilterService
      ) {
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
    this.filterService.getLayerTimes(layer.id).subscribe(layerTimes => {
      if (config.queryGetCapabilitiesTimes.indexOf(layer.id) > -1) {
        this.filterService.updateLayerTimes(layer, layerTimes);
      }
      this.layerManagerService.addLayer(layer, [], null, layerTimes.currentTime);
    });

    // Close panel once layer is added, unless user requests it stay open
    if (!this.panelStayOpen) {
      this.toggleBrowsePanel(false);
    }
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
   * Initialise Component
   */
  public ngOnInit() {
    const me = this;

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
        Object.keys(me.layerGroupColumn).forEach(group => {
          me.layerGroupColumn[group].sort((a, b) => a.name.localeCompare(b.name));
        });
    });
  }

}
