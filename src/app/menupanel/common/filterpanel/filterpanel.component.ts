import { CsClipboardService } from '../../../lib/portal-core-ui/service/cesium-map/cs-clipboard.service';
import { ResourceType, GeometryType } from '../../../lib/portal-core-ui/utility/constants.service';
import { CsMapService } from '../../../lib/portal-core-ui/service/cesium-map/cs-map.service';
import { CsWMSService } from '../../../lib/portal-core-ui/service/wms/cs-wms.service';
import { FilterPanelService } from '../../../lib/portal-core-ui/service/filterpanel/filterpanel-service';
import { LayerHandlerService } from '../../../lib/portal-core-ui/service/cswrecords/layer-handler.service';
import { LayerModel } from '../../../lib/portal-core-ui/model/data/layer.model';
import { LayerStatusService } from '../../../lib/portal-core-ui/utility/layerstatus.service';
import { Polygon } from '../../../lib/portal-core-ui/service/cesium-map/cs-clipboard.service';
import { UtilitiesService } from '../../../lib/portal-core-ui/utility/utilities.service';
import { CsCSWService } from '../../../lib/portal-core-ui/service/wcsw/cs-csw.service';
import { ApplicationRef, Component, Inject, Input, OnInit, AfterViewInit, ViewChild, ViewContainerRef, OnChanges, SimpleChanges, inject } from '@angular/core';
import * as _ from 'lodash';
import { config } from '../../../../environments/config';
import { ref } from '../../../../environments/ref';
import { LayerAnalyticModalComponent } from '../../../modalwindow/layeranalytic/layer.analytic.modal.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { FilterService, LayerTimes } from 'app/services/filter/filter.service';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';


@Component({
    selector: 'app-filter-panel',
    templateUrl: './filterpanel.component.html',
    styleUrls: ['./filterpanel.component.scss', '../../menupanel.scss'],
    standalone: false
})
export class FilterPanelComponent implements OnChanges, OnInit, AfterViewInit {
  csMapService = inject(CsMapService);
  layerHandlerService = inject(LayerHandlerService);
  layerManagerService = inject(LayerManagerService);
  filterService = inject(FilterService);
  filterPanelService = inject(FilterPanelService);
  modalService = inject(BsModalService);
  csClipboardService = inject(CsClipboardService);
  csWMSService = inject(CsWMSService);
  csCSWService = inject(CsCSWService);
  layerStatus = inject(LayerStatusService);
  appRef = inject(ApplicationRef);
  advancedComponentService = inject(AdvancedComponentService);

  @Input() layer: LayerModel;
  private providers: Array<object>;
  public optionalFilters: Array<object>; // Optional filters currently rendered by this component
  public selectedFilter;
  public advancedParam = [];
  public analyticMap;
  public advancedFilterMap;
  public showAdvancedFilter = true;
  public bApplyClipboardBBox = true;
  public layerTimes: LayerTimes;
  public layerFilterCollection: any; // List of all filters that maybe rendered by this component

  // Layer toolbar
  @ViewChild('advancedFilterComponents', { static: true, read: ViewContainerRef }) advancedFilterComponents: ViewContainerRef;


  constructor(@Inject('conf') private conf) {
    this.providers = [];
    this.optionalFilters = [];
    this.analyticMap = ref.layeranalytic;
    this.advancedFilterMap = ref.advancedFilter;
  }

  public ngOnInit(): void {
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

    // set a filter flag for the layer
    this.layerManagerService.setFilters(this.layer.id, false);
    if (this.layerFilterCollection) {
      if (this.layerFilterCollection.optionalFilters) {
        this.layerManagerService.setFilters(this.layer.id, true);
      }
    }

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

    // Subscribe to receiving the layer's time extent, if it has one
    this.filterService.getLayerTimesBS(this.layer.id).subscribe(times => {
      this.layerTimes = times;
    });

    // Add any layer specific advanced filter components
    this.advancedComponentService.addAdvancedFilterComponents(this.layer, this.advancedFilterComponents);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Will fire when a layer is added and remove all existing panel filters
    if (changes.layer && changes.layer.currentValue) {
        setTimeout(() => {
            this.refreshFilter();
        }, 0);
    }
  }

  /**
   * Called once the panel has been drawn
   */
  public ngAfterViewInit() {
    // Update the time extent button/selector
    this.setLayerTimeExtent();
  }

  /**
   * Check if a layer has filters - filterList array
   */
  public hasFilters(layerId : string): boolean {
    let filterState: boolean = false;
    filterState = this.layerManagerService.getFilters(layerId);
    return filterState;
  }

  /**
   * Add layer from the saved layer state. Will be called by parent LayerPanel.
   * @param layerState layer state is JSON
   */
  public addLayerFromState(layerState: any) {
    // Populate layer times if necessary
    if (config.queryGetCapabilitiesTimes.indexOf(this.layer.id) > -1) {
      this.filterService.updateLayerTimes(this.layer, this.layerTimes);
    }
    // Current time
    if (layerState.time) {
      this.layerTimes.currentTime = layerState.time;
    }
    // Advanced filter
    if (layerState.advancedFilter) {
      this.advancedComponentService.getAdvancedFilterComponentForLayer(this.layer.id).setAdvancedParams(layerState.advancedFilter);
    }
    // Merge state filters with optional filters
    this.optionalFilters = this.optionalFilters.map(optFilt => {
        const filt = layerState.optionalFilters.find((filt) => filt.label === optFilt['label']);
        if (filt) {
          return filt;
        }
        return optFilt;
    });

    setTimeout(() => {
      for (const optFilter of this.optionalFilters) {
        if (optFilter['value'] && optFilter['type'] === 'OPTIONAL.POLYGONBBOX') {
          const geometry = optFilter['value'];
          const swappedGeometry = this.csClipboardService.swapGeometry(geometry);
          const strToday=new Date();
          const dt= new Date(strToday).toISOString();
          const name = 'Polygon-' + dt.slice(0,dt.lastIndexOf('.'));
          const newPolygon:Polygon = {
            name: name,
            srs: 'EPSG:4326',
            geometryType: GeometryType.POLYGON,
            coordinates: swappedGeometry
          };
          this.csClipboardService.clearClipboard();
          this.csClipboardService.addPolygon(newPolygon);
          this.csClipboardService.toggleClipboard(true);
          this.appRef.tick();
        }
      }
      this.layerManagerService.addLayer(this.layer, this.optionalFilters, this.layerFilterCollection, this.layerTimes.currentTime);

      // Set opacity of the layer on the map
      if (UtilitiesService.layerContainsResourceType(this.layer, ResourceType.WMS)) {
        this.csWMSService.setLayerOpacity(this.layer, layerState.opacity / 100.0);
      } else if (UtilitiesService.layerContainsBboxGeographicElement(this.layer)) {
        this.csCSWService.setLayerOpacity(this.layer, layerState.opacity / 100.0);
      }
    }, 500);
  }

  /**
   * Test if a filter contains a value. This means non-null for all filters, with the added
   * requirement for OPTIONAL.PROVIDER filters that at least one value in the list be true
   * @param filter the filter to test
   * @returns true if the filter contains a valid value
   */
  private filterHasValue(filter: object): boolean {
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
    return UtilitiesService.isMapSupportedLayer(layer);
  }

  /**
   * String to display when a layer cannot be added to the map due to not
   * containing a supported OnlineResource type.
   */
  public getUnsupportedLayerMessage(): string {
    return 'This layer cannot be displayed. Only the following online resource types can be added to the map: ' +
      UtilitiesService.getSupportedOnlineResourceTypes().join(" ")
  }

  /**
   * Add layer to map
   * @param layer the layer to add to map
   */
  public addLayer(layer): void {
    this.onApplyClipboardBBox();
    this.layerManagerService.addLayer(layer, this.optionalFilters, this.layerFilterCollection, this.layerTimes.currentTime);
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
      console.error('Unable to getNvclFilter', error);
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

  public getKey(options: object): string {
    return UtilitiesService.getKey(options);
  }

  public getValue(options: object): string {
    return UtilitiesService.getValue(options);
  }

  public onAdvancedParamChange($event) {
    this.advancedParam = $event;
  }

  /**
   * Update the filter service with a new filter or remove one
   *
   * @param filter filter
   * @param filterAdded boolean, if 'true' will add, if 'false' remove
   */
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
  public addFilter(filter, _addEmpty?: boolean): void {
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
  public setLayerTimeExtent() {
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
    this.csMapService.removeLayerById(this.layer.id);
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
