import {LayerModel} from '../../../portal-core-ui/model/data/layer.model';
import {LayerHandlerService} from '../../../portal-core-ui/service/cswrecords/layer-handler.service';
import {FilterPanelService} from '../../../portal-core-ui/service/filterpanel/filterpanel-service';
import {OlMapService} from '../../../portal-core-ui/service/openlayermap/ol-map.service';
import {OlClipboardService} from '../../../portal-core-ui/service/openlayermap/ol-clipboard.service';
import * as $ from 'jquery';
import {UtilitiesService} from '../../../portal-core-ui/utility/utilities.service';
import {Component, Input, OnInit} from '@angular/core';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';
import { ref } from '../../../../environments/ref';
import { LayerAnalyticModalComponent } from '../../../modalwindow/layeranalytic/layer.analytic.modal.component';
import { ManageStateService } from '../../../portal-core-ui/service/permanentlink/manage-state.service';
import { AuMapService } from '../../../services/wcustom/au-map.service';
import { OlIrisService } from '../../../services/wcustom/iris/ol-iris.service';
import { BsModalService } from 'ngx-bootstrap/modal';
declare var gtag: Function;

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filterpanel.component.html',
  providers: [AuMapService, OlIrisService],
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

  constructor(private olMapService: OlMapService, private layerHandlerService: LayerHandlerService, private auscopeMapService: AuMapService,
    private filterPanelService: FilterPanelService, private modalService: BsModalService,
     private manageStateService: ManageStateService, private olClipboardService: OlClipboardService) {

    this.providers = [];
    this.optionalFilters = [];
     this.analyticMap = ref.layeranalytic;
    this.advanceFilterMap = ref.advanceFilter;
  }

  ngOnInit(): void {
    if (this.layer.filterCollection && this.layer.filterCollection['mandatoryFilters']) {
      const mandatoryFilters = this.layer.filterCollection['mandatoryFilters'];

      for (const mandatoryFilter of mandatoryFilters) {
        if (mandatoryFilter['type'] === 'MANDATORY.CHECKBOX') {
          mandatoryFilter['value'] = (mandatoryFilter['value'] === 'true')
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

      })
    }
  }

  /**
   * Add layer to map
   * @param layer the layer to add to map
   */
  public addLayer(layer): void {
    this.onApplyClipboardBBox();
    if (environment.googleAnalyticsKey && typeof gtag === 'function') {
      gtag('event', 'Addlayer', { 'event_category': 'Addlayer', 'event_action': 'AddLayer:' + layer.id});
    }
    const param = {
      optionalFilters: _.cloneDeep(this.optionalFilters)
    };

    for (const optFilter of param.optionalFilters) {
      if (optFilter['options']) {
        optFilter['options'] = [];
      }

    }

    this.manageStateService.addLayer(layer.id, layer.filterCollection, this.optionalFilters);

    // VT: append advance filter to mandatory filter.
    if (this.showAdvanceFilter) {
      for (const idx in this.advanceparam) {
        if (!this.layer.filterCollection.mandatoryFilters) {
          this.layer.filterCollection.mandatoryFilters = [];
        }
        this.layer.filterCollection.mandatoryFilters.push({
          parameter: idx,
          value: this.advanceparam[idx]
        })
      }
    }
    // VT: End append
    try {
      this.olMapService.addLayer(layer, param);
    } catch (error) {
      // VT: If portal-core-ui is unable to render the layer, it must be a auscope specific layer. E.g Iris
      try {
        this.auscopeMapService.addLayer(layer, param);
      } catch (error) {
          alert('Unable to render layer as this layer is missing vital information required for rendering');
      }

    }

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($('#sidebar-toggle-btn').css('display') !== 'none') {
      $('#sidebar-toggle-btn').click();
    }
  }

  /**
   * Draw a polygon layer to map
   *
   */
  public onApplyClipboardBBox(): void {
    if (this.bApplyClipboardBBox) {
      this.olClipboardService.polygonsBS.subscribe(
        (polygonBBoxs) => {
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
    if (UtilitiesService.isEmpty(this.providers) && filter.type === 'OPTIONAL.PROVIDER') {
      this.getProvider();
      filter.value = {};
      for (const provider of this.providers) {
        filter.value[provider['value']] = false;
      }


    }
    if (UtilitiesService.isEmpty(filter.options) && filter.type === 'OPTIONAL.DROPDOWNREMOTE') {
      this.filterPanelService.getFilterRemoteParam(filter.url).subscribe(response => {
        filter.options = response;
        this.optionalFilters.push(filter);
      });
      return;
    }

    if (filter.type === 'OPTIONAL.POLYGONBBOX') {
      this.olClipboardService.toggleClipboard(true);
    }
    this.optionalFilters.push(filter);

  };

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
        const allOnlineResources = this.layerHandlerService.getOnlineResourcesFromCSW(cswRecords[i]);
        if (allOnlineResources.length > 0) {
          adminAreasMap[adminArea] = UtilitiesService.getUrlDomain(allOnlineResources[0].url);
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

  };

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
    const bsModalRef = this.modalService.show(LayerAnalyticModalComponent, {class: 'modal-lg'});
    bsModalRef.content.layer = layer;
  }
}
