import {
  CsClipboardService, CsMapService, CsWMSService, FilterPanelService, GetCapsService, LayerHandlerService,
  LayerModel, LayerStatusService, ManageStateService, UtilitiesService
} from '@auscope/portal-core-ui';
import * as $ from 'jquery';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';
import { ref } from '../../../../environments/ref';
import { LayerAnalyticModalComponent } from '../../../modalwindow/layeranalytic/layer.analytic.modal.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { GraceService } from 'app/services/wcustom/grace/grace.service';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';

declare var gtag: Function;

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
  public timeExtent: Date[] = [];             // WMS time extent (optional)
  public currentTime: Date;                   // Current selected WMS time (from timeExtent)
  public loadingTimeExtent = false;  // Flag for WMS times loading

  // Layer toolbar
  @ViewChild('advancedFilterComponents', { static: true, read: ViewContainerRef }) advancedFilterComponents: ViewContainerRef;


  constructor(private csMapService: CsMapService,
    private layerHandlerService: LayerHandlerService,
    private filterPanelService: FilterPanelService,
    private modalService: BsModalService,
    private manageStateService: ManageStateService,
    private csClipboardService: CsClipboardService,
    private csWMSService: CsWMSService,
    public layerStatus: LayerStatusService,
    private advancedComponentService: AdvancedComponentService,
    private getCapsService: GetCapsService,
    private graceService: GraceService) {
    this.providers = [];
    this.optionalFilters = [];
    this.analyticMap = ref.layeranalytic;
    this.advancedFilterMap = ref.advancedFilter;
  }

  ngOnInit(): void {
    if (this.layer.filterCollection && this.layer.filterCollection['mandatoryFilters']) {
      const mandatoryFilters = this.layer.filterCollection['mandatoryFilters'];

      for (const mandatoryFilter of mandatoryFilters) {
        if (mandatoryFilter['type'] === 'MANDATORY.CHECKBOX') {
          mandatoryFilter['value'] = mandatoryFilter['value'] === 'true';
        }
      }
    }

    // Get capability records
    this.getcapabilityRecord();

    // Set time extent if WMS and present
    this.setLayerTimeExtent();

    // Add any layer specific advanced filter components
    this.advancedComponentService.addAdvancedFilterComponents(this.layer, this.advancedFilterComponents);

    // This sets the filter parameters using the state data in the permanent link
    const state = UtilitiesService.getUrlParameterByName('state');
    if (state) {
      const me = this;
      this.manageStateService.fetchStateFromDB(state).subscribe((layerStateObj: any) => {
        if (layerStateObj) {
          if (UtilitiesService.isEmpty(me.providers)) {
            me.getProvider();
          }
          // Time (if present)
          if (layerStateObj[me.layer.id] && layerStateObj[me.layer.id].time) {
            this.currentTime = layerStateObj[me.layer.id].time;
          }
          // Advanced filter
          if (layerStateObj[me.layer.id] && layerStateObj[me.layer.id].advancedFilter) {
            if (layerStateObj[me.layer.id].advancedFilter !== {}) {
              this.advancedComponentService.getAdvancedFilterComponentForLayer(me.layer.id).setAdvancedParams(layerStateObj[me.layer.id].advancedFilter);
            }
          }
          if (layerStateObj.hasOwnProperty(me.layer.id)) {
            me.optionalFilters = me.optionalFilters.concat(layerStateObj[me.layer.id].optionalFilters);
            setTimeout(() => {
              me.addLayer(me.layer);
            }, 100);
          }
        }
      });
    }

    // LJ: nvclAnalyticalJob external link
    const nvclanid = UtilitiesService.getUrlParameterByName('nvclanid');
    if (nvclanid) {
      const me = this;
      if (me.layer.id === 'nvcl-v2-borehole') {
        if (UtilitiesService.isEmpty(me.providers)) {
          me.getProvider();
        }
        me.layer.filterCollection['mandatoryFilters'][0].value = nvclanid;
        setTimeout(() => {
          me.addLayer(me.layer);
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
    if (filter['type'] === "OPTIONAL.PROVIDER") {
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
    return "This layer cannot be displayed. For Featured Layers, please wait for the layer cache to rebuild itself. " + 
      "For Custom Layers please note that only the following online resource types can be added to the map: " +
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

    // VT: append advance filter to mandatory filter.
    /*
    // deprecated, use AdvanceFilterDirective
    for (const idx in this.advancedParam) {
      if (!this.layer.filterCollection.mandatoryFilters) {
        this.layer.filterCollection.mandatoryFilters = [];
      }
      this.layer.filterCollection.mandatoryFilters.push({
        parameter: idx,
        value: this.advancedParam[idx]
      });
    }
    */
    // VT: End append

    // TODO: Store time period with state
    // WMS layers may have a time set
    if (this.currentTime) {
      param['time'] = this.currentTime;
    }

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
      this.currentTime,
      layer.filterCollection,
      this.optionalFilters,
      advancedFilterParams
    );

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
    const me = this;
    try {
      this.csWMSService.getNvclFilter(layer, param).subscribe(response => {
        if (response.indexOf('<ogc:Intersects>') >= 0) {
          const ogcIntersects = UtilitiesService.getPolygonFilter(response);
          // tslint:disable-next-line:max-line-length
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
   *
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
      if (UtilitiesService.isEmpty(this.providers)) {
        this.getProvider();
      }
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
          this.optionalFilters.push(filter);
        });
      return;
    }
    // For polygon filter make clipboard visible on map
    if (filter.type === 'OPTIONAL.POLYGONBBOX') {
      this.csClipboardService.toggleClipboard(true);
    }
    // Initialise multiselect boolean filter's radio button
    if (filter.type === 'OPTIONAL.DROPDOWNSELECTLIST' && filter.multiSelect) {
      filter.boolOp = "OR";
    }

    // Add filter to panel
    this.optionalFilters.push(filter);
  }

  /**
   * Assembles a list of providers, which will be displayed in the panel
   * @method getProvider
   */
  private getProvider(): void {
    const cswRecords = this.layer.cswRecords;

    // Set up a map of admin areas + URLs that belong to each
    const adminAreasMap = {};
    for (let i = 0; i < cswRecords.length; i++) {
      const adminArea = cswRecords[i].adminArea;
      if (adminArea !== null) {
        const allOnlineResources = this.layerHandlerService.getOnlineResourcesFromCSW(
          cswRecords[i]
        );
        if (allOnlineResources.length > 0) {
          adminAreasMap[adminArea] = UtilitiesService.getUrlDomain(
            allOnlineResources[0].url
          );
        }
      }
    }

    // Set up a list of each unique admin area
    for (const key in adminAreasMap) {
      this.providers.push({
        label: key,
        value: adminAreasMap[key]
      });
    }
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
          filter['boolOp'] = "OR";
        }
      }
    }
    this.optionalFilters = [];
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
   * Send a request to get the capability record and set layer's capability records
   */
  private getcapabilityRecord() {
    let wmsEndpointUrl = null;
    let layerName = null;
    // Check if WMS capability record present 
    if (this.layer.capabilityRecords && this.layer.capabilityRecords.length > 0) {
      return;
    }
    // Look for WMS endpoint in CSW records if not already found
    if (this.layer.cswRecords && this.layer.cswRecords.length > 0) {
      for (const cswRecord of this.layer.cswRecords) {
        if (cswRecord.onlineResources) {
          const resource = cswRecord.onlineResources.find(o => o.type.toLowerCase() === 'wms');
          if (resource) {
            wmsEndpointUrl = resource.url;
            layerName = resource.name;
            continue;
          }
        }
      }
    }

    // Query WMS GetCapabilities for timeExtent
    if (wmsEndpointUrl !== null && layerName !== null) {
      if (wmsEndpointUrl.indexOf('?') !== -1) {
        wmsEndpointUrl = wmsEndpointUrl.substring(0, wmsEndpointUrl.indexOf('?'));
      }
      this.getCapsService.getCaps(wmsEndpointUrl).subscribe(response => {
        if (response.data && response.data.capabilityRecords.length === 1) {
          this.layer.capabilityRecords = response.data.capabilityRecords;
        }
      });
    }
  }

  /**
   * Set time extent for a layer, first looking at the layer's capability records
   * and then the CSW records.
   */
  private setLayerTimeExtent() {
    this.timeExtent = [];
    let wmsEndpointUrl = null;
    let layerName = null;

    // Check if WMS capability record present
    if (!(this.layer.capabilityRecords && this.layer.capabilityRecords.length > 0)) {
      this.getcapabilityRecord();
    }

    // Check if WMS capability record present and time extent set
    if (this.layer.capabilityRecords && this.layer.capabilityRecords.length > 0) {
      const layerCapRec = this.layer.capabilityRecords.find(c => c.serviceType.toLowerCase() === 'wms');
      if (layerCapRec && layerCapRec.layers.length > 0) {
        if (layerCapRec.layers[0].timeExtent) {
          this.timeExtent = layerCapRec.layers[0].timeExtent;
          this.currentTime = this.timeExtent[0];
        }
      }
    }
    // Look for WMS endpoint in CSW records if not already found
    if (!this.currentTime && this.layer.cswRecords && this.layer.cswRecords.length > 0) {
      for (const cswRecord of this.layer.cswRecords) {
        if (cswRecord.onlineResources) {
          const resource = cswRecord.onlineResources.find(o => o.type.toLowerCase() === 'wms');
          if (resource) {
            wmsEndpointUrl = resource.url;
            layerName = resource.name;
            continue;
          }
        }
      }
    }
    // Query WMS GetCapabilities for timeExtent
    if (this.timeExtent.length === 0 && wmsEndpointUrl !== null && layerName !== null) {
      this.loadingTimeExtent = true;
      if (wmsEndpointUrl.indexOf('?') !== -1) {
        wmsEndpointUrl = wmsEndpointUrl.substring(0, wmsEndpointUrl.indexOf('?'));
      }
      this.getCapsService.getCaps(wmsEndpointUrl).subscribe(response => {
        if (response.data && response.data.capabilityRecords.length === 1 && response.data.capabilityRecords[0].layers.length > 0) {
          const responseLayers = response.data.capabilityRecords[0].layers.filter(l => l.name === layerName);
          if (responseLayers && responseLayers.length > 0 && responseLayers[0].timeExtent) {
            // Sort by date (newest first)
            this.timeExtent = responseLayers[0].timeExtent.sort((a, b) => {
              return <any>new Date(b) - <any>new Date(a);
            });
            // Time may have already been set from retrieving state
            if (!this.currentTime) {
              this.currentTime = this.timeExtent[0];
            }
          }
        }
        this.loadingTimeExtent = false;
      }, () => {
        this.loadingTimeExtent = false;
      });
    }
  }

  /**
   * WMS date dropdown change event, set the current time
   *
   * @param newDate new date chosen from time extent
   */
  public changeCurrentTime(newDate: Date) {
    this.currentTime = newDate;
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
