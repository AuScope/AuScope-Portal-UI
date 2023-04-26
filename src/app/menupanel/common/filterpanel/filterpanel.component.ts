import { CsClipboardService, CsMapService, CsWMSService, FilterPanelService, LayerHandlerService,
         LayerModel, LayerStatusService, ManageStateService, UtilitiesService } from '@auscope/portal-core-ui';
import * as $ from 'jquery';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';
import { config } from '../../../../environments/config';
import { ref } from '../../../../environments/ref';
import { LayerAnalyticModalComponent } from '../../../modalwindow/layeranalytic/layer.analytic.modal.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { GraceService } from 'app/services/wcustom/grace/grace.service';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { FilterService, LayerTimes } from 'app/services/filter/filter.service';
import { LegendUiService } from 'app/services/legend/legend-ui.service';
import { UserStateService } from 'app/services/user/user-state.service';

declare let gtag: Function;

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filterpanel.component.html',
  styleUrls: ['./filterpanel.component.scss', '../../menupanel.scss']
})
export class FilterPanelComponent implements OnInit {
  @Input() layer: LayerModel;
  private providers: Array<Object>;
  public optionalFilters: Array<Object>;
  public selectedFilter;
  public advancedParam = [];
  public analyticMap;
  public advancedFilterMap;
  public showAdvancedFilter = true;
  public bApplyClipboardBBox = true;
  public layerTimes: LayerTimes;
  public layerFilterCollection: any;

  // Layer toolbar
  @ViewChild('advancedFilterComponents', { static: true, read: ViewContainerRef }) advancedFilterComponents: ViewContainerRef;


  constructor(private csMapService: CsMapService,
    private layerHandlerService: LayerHandlerService,
    private filterService: FilterService,
    private filterPanelService: FilterPanelService,
    private modalService: BsModalService,
    private manageStateService: ManageStateService,
    private csClipboardService: CsClipboardService,
    private csWMSService: CsWMSService,
    public layerStatus: LayerStatusService,
    private userStateService: UserStateService,
    private advancedComponentService: AdvancedComponentService,
    private legendUiService: LegendUiService,
    private graceService: GraceService) {
    this.providers = [];
    this.optionalFilters = [];
    this.analyticMap = ref.layeranalytic;
    this.advancedFilterMap = ref.advancedFilter;
  }

  ngOnInit(): void {
    // Register filters with service
    if (this.layer.filterCollection) {
      this.filterService.registerLayerFilterCollection(this.layer.id, this.layer.filterCollection).subscribe(filterCollection => {
        this.layerFilterCollection = filterCollection;
        this.optionalFilters = this.layerFilterCollection.optionalFilters.filter(f => f.added === true);
        if (this.optionalFilters.length === 0) {
          this.selectedFilter = {};
        }
      });
    }

    // XXX Sidebar only..?
    if (this.layer.filterCollection && this.layer.filterCollection['mandatoryFilters']) {
      const mandatoryFilters = this.layer.filterCollection['mandatoryFilters'];
      for (const mandatoryFilter of mandatoryFilters) {
        if (mandatoryFilter['type'] === 'MANDATORY.CHECKBOX') {
          mandatoryFilter['value'] = mandatoryFilter['value'] === 'true';
        }
      }
    }

    // Set layer providers
    this.filterService.registerLayerProviders(this.layer).subscribe(layerProviders => {
      this.providers = layerProviders;
    });

    // Layer times
    this.filterService.getLayerTimes(this.layer.id).subscribe(times => {
      this.layerTimes = times;
    });

    // Add any layer specific advanced filter components
    this.advancedComponentService.addAdvancedFilterComponents(this.layer, this.advancedFilterComponents);

    // This sets the filter parameters using the state data in the permanent link
    const stateId = UtilitiesService.getUrlParameterByName('state');
    if (stateId) {
      this.userStateService.getPortalState(stateId).subscribe((layerStateObj: any) => {
        if (layerStateObj && layerStateObj[this.layer.id]) {
          // Populate layer times if necessary
          if (config.queryGetCapabilitiesTimes.indexOf(this.layer.id) > -1) {
            this.filterService.updateLayerTimes(this.layer, this.layerTimes);
          }
          // Current time
          if (layerStateObj[this.layer.id].time) {
            this.layerTimes.currentTime = layerStateObj[this.layer.id].time;
          }
          // Advanced filter
          if (layerStateObj[this.layer.id] && layerStateObj[this.layer.id].advancedFilter) {
            this.advancedComponentService.getAdvancedFilterComponentForLayer(this.layer.id).setAdvancedParams(layerStateObj[this.layer.id].advancedFilter);
          }
          if (layerStateObj.hasOwnProperty(this.layer.id)) {
            this.optionalFilters = this.optionalFilters.concat(layerStateObj[this.layer.id].optionalFilters);
            setTimeout(() => {
              this.addLayer(this.layer);
            }, 100);
          }
        }
      });
    }

    // LJ: nvclAnalyticalJob external link
    const nvclanid = UtilitiesService.getUrlParameterByName('nvclanid');
    if (nvclanid) {
      const me = this;
      if (this.layer.id === 'nvcl-v2-borehole') {
        this.layer.filterCollection['mandatoryFilters'][0].value = nvclanid;
        setTimeout(() => {
          this.addLayer(this.layer);
        });
      }
    }

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

  /**
   * Check to see if a layer is supported to be added to the map
   * @param layer layer to check
   * @returns true if supported layer, false otherwise
   */
  public isMapSupportedLayer(layer: LayerModel): boolean {
    return this.csMapService.isMapSupportedLayer(layer);
  }

  /**
   * String to display when a layer cannot be added to the map due to not
   * containing a supported OnlineResource type.
   */
  public getUnsupportedLayerMessage(): string {
    return 'This layer cannot be displayed. For Featured Layers, please wait for the layer cache to rebuild itself. ' +
      'For Custom Layers please note that only the following online resource types can be added to the map: ' +
      this.csMapService.getSupportedOnlineResourceTypes();
  }

  /**
   * Add layer to map
   * @param layer the layer to add to map
   */
  public addLayer(layer): void {
    this.onApplyClipboardBBox();
    if (environment.googleAnalyticsKey && typeof gtag === 'function') {
      gtag('event', 'Addlayer', {
        event_category: 'Addlayer',
        event_action: 'AddLayer:' + layer.id
      });
    }
    const param = {
      optionalFilters: _.cloneDeep(this.optionalFilters)
    };

    // TODO: Store time period with state
    // WMS layers may have a time set
    if (this.layerTimes.currentTime) {
      param['time'] = this.layerTimes.currentTime;
    }

    // TODO: Make more generic, perhaps have an SLD parameter that refers to a class or interface
    if (layer.id === 'grace-mascons') {
      param['sld_body'] = this.graceService.getGraceSld();
    }

    // Remove filters without values
    param.optionalFilters = param.optionalFilters.filter(f => this.filterHasValue(f));

    for (const optFilter of param.optionalFilters) {
      if (optFilter['options']) {
        optFilter['options'] = [];
      }
    }

    // Get AdvancedFilter params if applicable
    let advancedFilterParams = null;
    const advancedFilter = this.advancedComponentService.getAdvancedFilterComponentForLayer(layer.id);
    if (advancedFilter) {
      advancedFilterParams = advancedFilter.getAdvancedParams();
    }

    // Add a new layer in the layer state service
    this.manageStateService.addLayer(
      layer.id,
      this.layerTimes.currentTime,
      this.layerFilterCollection,
      this.optionalFilters,
      advancedFilterParams
    );

    // Remove any existing legends in case map re-added with new style
    this.legendUiService.removeLegend(layer.id);

    // Add layer to map in Cesium
    this.csMapService.addLayer(layer, param);

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($('#sidebar-toggle-btn').css('display') !== 'none') {
      $('#sidebar-toggle-btn').click();
    }

    // Add any advanced map components defined in refs.ts
    this.advancedComponentService.addAdvancedMapComponents(this.layer);
  }

  /**
   * Get Filter for NvclAnalytical
   * @param layer the layer to add to map
   */
  public getNvclFilter(layer): void {
    this.onApplyClipboardBBox();
    const param = {
      optionalFilters: _.cloneDeep(this.optionalFilters)
    };
    layer.wfsUrls = [];
    const wfsOnlineResources = this.layerHandlerService.getWFSResource(layer);
    for (const onlineResource of wfsOnlineResources) {
      if (
        UtilitiesService.filterProviderSkip(
          param.optionalFilters,
          onlineResource.url
        )
      ) {
        continue;
      }
      layer.wfsUrls.push(onlineResource.url);
    }
    try {
      this.csWMSService.getNvclFilter(layer, param).subscribe(response => {
        if (response.indexOf('<ogc:Intersects>') >= 0) {
          const ogcIntersects = UtilitiesService.getPolygonFilter(response);
          // eslint-disable-next-line max-len
          response = '<ogc:Filter xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\">' + ogcIntersects + '</ogc:Filter>';
        }
        layer.ogcFilter = response;
      });
    } catch (error) {
      alert('Unable to getNvclFilter');
    }
  }

  /**
   * Draw a polygon layer to map
   */
  public onApplyClipboardBBox(): void {
    this.csClipboardService.polygonsBS.subscribe(polygon => {
      if (polygon !== null && this.bApplyClipboardBBox) {
        if (!UtilitiesService.isEmpty(polygon)) {
          for (const optFilter of this.optionalFilters) {
            if (optFilter['type'] === 'OPTIONAL.POLYGONBBOX') {
              optFilter['value'] = polygon.coordinates;
            }
          }
        }
      } else {
        for (const optFilter of this.optionalFilters) {
          if (optFilter['type'] === 'OPTIONAL.POLYGONBBOX') {
            optFilter['value'] = null;
          }
        }
      }
    });
  }

  public getKey(options: Object): string {
    return UtilitiesService.getKey(options);
  }

  public getValue(options: Object): string {
    return UtilitiesService.getValue(options);
  }

  public onAdvancedParamChange($event) {
    this.advancedParam = $event;
  }

  private updateFilter(filter: any, filterAdded: boolean) {
    filter.added = filterAdded;
    const i = this.layerFilterCollection.optionalFilters.indexOf(this.layerFilterCollection.optionalFilters.find(f => f.label === filter.label));
    this.layerFilterCollection.optionalFilters[i] = filter;
    this.filterService.updateLayerFilterCollection(this.layer.id, this.layerFilterCollection);
  }

  /**
   * Adds a new filter to be displayed in the panel
   * @method addFilter
   * @param filter filter object to be added to the panel
   * @param addEmpty if true, set filter value to be empty.
   */
  public addFilter(filter, addEmpty?: boolean): void {
    if (filter == null) {
      return;
    }
    // If filter is already in panel
    for (const filterobject of this.optionalFilters) {
      if (filterobject['label'] === filter['label']) {
        return;
      }
    }
    // Initialise provider filter
    if (filter.type === 'OPTIONAL.PROVIDER') {
      filter.value = {};
      for (const provider of this.providers) {
        filter.value[provider['value']] = false;
      }
    }
    // Fill up dropdown remote filter with values fetched from external service
    if (
      UtilitiesService.isEmpty(filter.options) &&
      filter.type === 'OPTIONAL.DROPDOWNREMOTE'
    ) {
      this.filterPanelService
        .getFilterRemoteParam(filter.url)
        .subscribe(response => {
          filter.options = response;
          this.updateFilter(filter, true);
        });
      return;
    }
    // For polygon filter make clipboard visible on map
    if (filter.type === 'OPTIONAL.POLYGONBBOX') {
      this.csClipboardService.toggleClipboard(true);
    }
    // Initialise multiselect boolean filter's radio button
    if (filter.type === 'OPTIONAL.DROPDOWNSELECTLIST' && filter.multiSelect) {
      filter.boolOp = 'OR';
    }

    // Add filter to panel
    this.updateFilter(filter, true);
  }

  /**
   * Refresh and clear the filters
   */
  public refreshFilter(): void {
    // Clear out filter values
    for (const filter of this.optionalFilters) {
      if (filter['type'] === 'OPTIONAL.DROPDOWNSELECTLIST' ||
          filter['type'] === 'OPTIONAL.DATE' ||
          filter['type'] === 'OPTIONAL.TEXT' ||
          filter['type'] === 'OPTIONAL.DROPDOWNREMOTE') {
        filter['value'] = null;
        if (filter['multiSelect']) {
          filter['boolOp'] = 'OR';
        }
      }
      this.updateFilter(filter, false);
    }
    this.selectedFilter = {};
  }

  /**
   * Use to toggle the modal for any layer level analytic
   */
  public processLayerAnalytic(layer: LayerModel) {
    this.getNvclFilter(layer);
    const bsModalRef = this.modalService.show(LayerAnalyticModalComponent, {
      class: 'modal-lg'
    });
    bsModalRef.content.layer = layer;
  }

  /**
   * Set layer time extent
   */
  setLayerTimeExtent() {
    if (this.layerTimes.timeExtent.length === 0 && config.queryGetCapabilitiesTimes.indexOf(this.layer.id) > -1) {
      this.filterService.updateLayerTimes(this.layer, this.layerTimes);
    }
  }

  /**
   * WMS date dropdown change event, set the current time
   *
   * @param newDate new date chosen from time extent
   */
  public changeCurrentTime(newDate: Date) {
    this.layerTimes.currentTime = newDate;
    this.filterService.setLayerTimes(this.layer.id, this.layerTimes);
    // Re-add layer to map
    const layerModelList = this.csMapService.getLayerModelList();
    if (layerModelList.hasOwnProperty(this.layer.id)) {
      this.csMapService.removeLayer(layerModelList[this.layer.id]);
    }
    this.addLayer(this.layer);
  }

  /**
   * Check for a layer having a AdvancedFilterComponent so we can disable the No Filter message.
   *
   * @param layerId ID of layer to check for advanced filter components
   * @returns true if the layer has an AdvancedFilterComponent, false otherwise
   */
  layerHasAdvancedFilterComponent(layerId: string): boolean {
    return ref.advancedFilter[layerId];
  }

}
