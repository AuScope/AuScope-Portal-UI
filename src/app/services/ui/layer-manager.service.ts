import { Injectable } from '@angular/core';
import { CsMapService, LayerModel, ManageStateService } from '@auscope/portal-core-ui';
import { AdvancedComponentService } from './advanced-component.service';
import { LegendUiService } from '../legend/legend-ui.service';
import { UILayerModelService } from './uilayer-model.service';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import * as $ from 'jquery';

declare let gtag: Function;

/**
 * Class for managing the addition and removal of map layers.
 */
@Injectable()
export class LayerManagerService {

  constructor(private csMapService: CsMapService, private manageStateService: ManageStateService,
              private uiLayerModelService: UILayerModelService,
              private advancedComponentService: AdvancedComponentService,
              private legendUiService: LegendUiService) {}

  /**
   * Add a layer - this is the generic function to add a layer to the map
   *  - adds the layer to the Cesium map
   *  - updates the map state service
   *  - sets up the optional and mandatory filters
   * 
   *
   * @param layer LayerModel object
   * @param optionalFilters layer's optional filters that have been selected already
   * @param layerFilterCollection the layer's filter collection, 
   *         i.e. mandatory filters and optional filters that can be selected
   * @param layerTime time range to display
   *
   * TODO: FilterPanel is only place bounding box filter can currently be set, better to shift flag to FilterService
   * and apply here when it's needed to adding from SearchPanel etc. will apply filter as well
   */
  public addLayer(layer: LayerModel, optionalFilters: Array<Object>, layerFilterCollection: any, layerTime: Date) {
    if (environment.googleAnalyticsKey && typeof gtag === 'function') {
      gtag('event', 'Addlayer', {
        event_category: 'Addlayer',
        event_action: 'AddLayer:' + layer.id
      });
    }
    const param = {
      optionalFilters: _.cloneDeep(optionalFilters)
    };

    if (layerTime) {
      param['time'] = layerTime;
    }

    // Get AdvancedFilter params if applicable
    let advancedFilterParams = null;
    const advancedFilter = this.advancedComponentService.getAdvancedFilterComponentForLayer(layer.id);
    if (advancedFilter) {
      advancedFilterParams = advancedFilter.getAdvancedParams();
      // Append any call parameters the AdvancedFilter may add
      Object.assign(param, advancedFilter.getCallParams());
    }

    // Remove filters without values from parameter list
    param.optionalFilters = param.optionalFilters.filter(f => this.filterHasValue(f));
    for (const optFilter of param.optionalFilters) {
      if (optFilter['options']) {
        optFilter['options'] = [];
      }
    }

    // Remove any existing legends in case map re-added with new style
    this.legendUiService.removeLegend(layer.id);

    // Transfer mandatory filters from the 'layerFilterCollection' input to the 'layer' object
    if (layer?.filterCollection?.mandatoryFilters && 
        layerFilterCollection?.mandatoryFilters) {
      for (const layerFilt of layer.filterCollection.mandatoryFilters) {
        for (const mandFilt of layerFilterCollection.mandatoryFilters) {
          if (layerFilt.label === mandFilt.label) {
            // Set value of filter
            layerFilt.value = mandFilt.value;
          }
        }
      }
    }

    // Add layer to map in Cesium
    this.csMapService.addLayer(layer, param);

    // Update the optional filter display
    this.csMapService.updateFilterDisplay(layer.id, optionalFilters);

    // Add a new layer in the layer state service
    this.manageStateService.addLayer(
      layer.id,
      layerTime,
      layerFilterCollection,
      optionalFilters,
      advancedFilterParams
    );

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($('#sidebar-toggle-btn').css('display') !== 'none') {
      $('#sidebar-toggle-btn').click();
    }

    // Add any advanced map components defined in refs.ts
    this.advancedComponentService.addAdvancedMapComponents(layer);
  }

  /**
   * Remove a layer. Removes from map, resets opacity, and removes advanced map components and legends
   * @param layer the layer to remove
   */
  public removeLayer(layer: LayerModel) {
    // Reset opacity to 100, mainly so UI resets and matches layer if re-added later
    // TODO: we should keep as is and use it when re-added
    const uiLayerModel = this.uiLayerModelService.getUILayerModel(layer.id);
    if (uiLayerModel) {
      uiLayerModel.opacity = 100;
      this.uiLayerModelService.setUILayerModel(layer.id, uiLayerModel);
    }
    //
    this.csMapService.removeLayer(layer);
    // Remove any layer specific map components
    this.advancedComponentService.removeAdvancedMapComponents(layer.id);
    this.legendUiService.removeLegend(layer.id);
  }

  /**
   * Test if a filter contains a value. This means non-null for all filters, with the added
   * requirement for OPTIONAL.PROVIDER filters that at least one value in the list be true
   * @param filter the filter to test
   * @returns true if the filter contains a valid value
   */
  private filterHasValue(filter: Object): boolean {
    let hasValue = false;
    if (filter['type'] === 'OPTIONAL.PROVIDER') {
      for (const provider in filter['value']) {
        if (filter['value'][provider] === true) {
          hasValue = true;
          break;
        }
      }
    } else if (filter['value'] !== null) {
      hasValue = true;
    }
    return hasValue;
  }

}
