import { CsClipboardService, CsMapService, CsWMSService, FilterPanelService, GetCapsService, LayerHandlerService,
         LayerModel, LayerStatusService, ManageStateService, UtilitiesService } from '@auscope/portal-core-ui';
import * as $ from 'jquery';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';
import { ref } from '../../../../environments/ref';
import { LayerAnalyticModalComponent } from '../../../modalwindow/layeranalytic/layer.analytic.modal.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ToolbarComponentsService } from 'app/services/ui/toolbar-components.service';
import { GraceStyleService } from 'app/services/wcustom/grace/grace-style.service';

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
  private selectedFilter;
  public advanceparam = [];
  public analyticMap;
  public advanceFilterMap;
  public showAdvanceFilter = false;
  public bApplyClipboardBBox = true;
  public timeExtent: Date[] = [];             // WMS time extent (optional)
  public currentTime: Date;                   // Current selected WMS time (from timeExtent)
  public loadingTimeExtent = false;  // Flag for WMS times loading

  // Layer toolbar
  @ViewChild('toolbars', { static: true, read: ViewContainerRef }) filterToolbars: ViewContainerRef;


  constructor(private csMapService: CsMapService,
              private layerHandlerService: LayerHandlerService,
              private filterPanelService: FilterPanelService,
              private modalService: BsModalService,
              private manageStateService: ManageStateService,
              private csClipboardService: CsClipboardService,
              private csWMSService: CsWMSService,
              public layerStatus: LayerStatusService,
              private getCapsService: GetCapsService,
              private toolbarService: ToolbarComponentsService,
              private graceStyleService: GraceStyleService) {
    this.providers = [];
    this.optionalFilters = [];
    this.analyticMap = ref.layeranalytic;
    this.advanceFilterMap = ref.advanceFilter;
  }

  ngOnInit(): void {
    if (
      this.layer.filterCollection &&
      this.layer.filterCollection['mandatoryFilters']
    ) {
      const mandatoryFilters = this.layer.filterCollection['mandatoryFilters'];

      for (const mandatoryFilter of mandatoryFilters) {
        if (mandatoryFilter['type'] === 'MANDATORY.CHECKBOX') {
          mandatoryFilter['value'] = mandatoryFilter['value'] === 'true';
        }
      }
    }

    // VT: permanent link
    const state = UtilitiesService.getUrlParameterByName('state');
    if (state) {
      const me = this;
      this.manageStateService.getUnCompressedString(state, function(result) {
        const layerStateObj = JSON.parse(result);
        if (layerStateObj[me.layer.id]) {
          if (UtilitiesService.isEmpty(me.providers)) {
            me.getProvider();
          }
          me.optionalFilters = layerStateObj[me.layer.id].optionalFilters;
          setTimeout(() => {
            me.addLayer(me.layer);
          }, 100)
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

    // Add any layer specific toolbars
    this.toolbarService.addFilterPanelToolbarComponents(this.layer, this.filterToolbars);

    // Set time extent if WMS and present
    this.setLayerTimeExtent();
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
    return "This layer is not supported. Only layers containing the " +
           "following online resource types can be added to the map: " +
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

    // Remove filters without values
    param.optionalFilters = param.optionalFilters.filter(f => this.filterHasValue(f));

    for (const optFilter of param.optionalFilters) {
      if (optFilter['options']) {
        optFilter['options'] = [];
      }
    }

    this.manageStateService.addLayer(
      layer.id,
      layer.filterCollection,
      this.optionalFilters
    );

    // VT: append advance filter to mandatory filter.
    if (this.showAdvanceFilter) {
      for (const idx in this.advanceparam) {
        if (!this.layer.filterCollection.mandatoryFilters) {
          this.layer.filterCollection.mandatoryFilters = [];
        }
        this.layer.filterCollection.mandatoryFilters.push({
          parameter: idx,
          value: this.advanceparam[idx]
        });
      }
    }
    // VT: End append

    // WMS layers may have a time set
    if (this.currentTime) {
      param['time'] = this.currentTime;
    }

    if (layer.id === 'grace-mascons') {
      param['sld_body'] = this.graceStyleService.getGraceSld();
    }

    // Add layer
    this.csMapService.addLayer(layer, param);

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($('#sidebar-toggle-btn').css('display') !== 'none') {
      $('#sidebar-toggle-btn').click();
    }

    // Add any toolbar components to map defined in refs.ts
    this.toolbarService.addMapToolbarComponents(this.layer);
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

  public onAdvanceParamChange($event) {
    this.advanceparam = $event;
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
    for (const filterobject of this.optionalFilters) {
      if (filterobject['label'] === filter['label']) {
        return;
      }
    }
    if (
      UtilitiesService.isEmpty(this.providers) &&
      filter.type === 'OPTIONAL.PROVIDER'
    ) {
      this.getProvider();
      filter.value = {};
      for (const provider of this.providers) {
        filter.value[provider['value']] = false;
      }
    }
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

    if (filter.type === 'OPTIONAL.POLYGONBBOX') {
      this.csClipboardService.toggleClipboard(true);
    }
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
   * refresh and clear the filters;
   */
  public refreshFilter(): void {
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
   * Set time extent for a layer, first looking at the layer's capability records
   * and then the CSW records.
   */
  private setLayerTimeExtent() {
    this.timeExtent = [];
    let wmsEndpointUrl = null;
    let layerName = null;
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
        if (response.data.capabilityRecords.length === 1 && response.data.capabilityRecords[0].layers.length > 0) {
          const responseLayers = response.data.capabilityRecords[0].layers.filter(l => l.name === layerName);
          if (responseLayers && responseLayers.length > 0 && responseLayers[0].timeExtent) {
            // Sort by date (newest first)
            this.timeExtent = responseLayers[0].timeExtent.sort((a, b) => {
              return <any>new Date(b) - <any>new Date(a);
            });
            this.currentTime = this.timeExtent[0];
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

}
