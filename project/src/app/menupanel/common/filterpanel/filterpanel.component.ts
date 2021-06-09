import { LayerModel } from '@auscope/portal-core-ui';
import { LayerHandlerService } from '@auscope/portal-core-ui';
import { FilterPanelService } from '@auscope/portal-core-ui';
import { CsMapService } from '@auscope/portal-core-ui';
import { CsClipboardService } from '@auscope/portal-core-ui';
import * as $ from 'jquery';
import { UtilitiesService } from '@auscope/portal-core-ui';
import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';
import { ref } from '../../../../environments/ref';
import { LayerAnalyticModalComponent } from '../../../modalwindow/layeranalytic/layer.analytic.modal.component';
import { ManageStateService } from '@auscope/portal-core-ui';
// import { AuMapService } from '../../../services/wcustom/au-map.service';
import { CsIrisService } from '@auscope/portal-core-ui';
import { BsModalService } from 'ngx-bootstrap/modal';
import { CsWMSService } from '@auscope/portal-core-ui';
import { LayerStatusService } from '@auscope/portal-core-ui';

declare var gtag: Function;

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filterpanel.component.html',
  providers: [CsIrisService, LayerStatusService],
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

  constructor(
    private csMapService: CsMapService,
    private layerHandlerService: LayerHandlerService,
    // private auscopeMapService: AuMapService,
    private filterPanelService: FilterPanelService,
    private modalService: BsModalService,
    private manageStateService: ManageStateService,
    private CsClipboardService: CsClipboardService,
    private csWMSService: CsWMSService,
    public layerStatus: LayerStatusService
  ) {
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
          me.addLayer(me.layer);
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
        me.addLayer(me.layer);
      }
    }
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

    // Add layer      
    this.csMapService.addLayer(layer, param);

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($('#sidebar-toggle-btn').css('display') !== 'none') {
      $('#sidebar-toggle-btn').click();
    }
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
        console.log(response);
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
    if (this.bApplyClipboardBBox) {
      this.CsClipboardService.polygonsBS.subscribe(polygonBBoxs => {
        if (!UtilitiesService.isEmpty(polygonBBoxs)) {
          for (const optFilter of this.optionalFilters) {
            if (optFilter['type'] === 'OPTIONAL.POLYGONBBOX') {
              optFilter['value'] = polygonBBoxs.coordinates;
            }
          }
        }
      });
    } else {
      for (const optFilter of this.optionalFilters) {
        if (optFilter['type'] === 'OPTIONAL.POLYGONBBOX') {
          optFilter['value'] = null;
        }
      }
    }
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
      this.CsClipboardService.toggleClipboard(true);
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
}
