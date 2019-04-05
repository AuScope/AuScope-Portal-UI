import { Bbox } from '../../portal-core-ui/model/data/bbox.model';
import { LayerModel } from '../../portal-core-ui/model/data/layer.model';
import { LayerHandlerService } from '../../portal-core-ui/service/cswrecords/layer-handler.service';
import { OlMapService } from '../../portal-core-ui/service/openlayermap/ol-map.service';
import { RenderStatusService } from '../../portal-core-ui/service/openlayermap/renderstatus/render-status.service';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { CataloguesearchService } from './cataloguesearch.service';
import { Component, AfterViewInit } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap';


@Component({
    selector: '[appCatalogueSearchPanel]',
    templateUrl: './cataloguesearch.component.html',
    providers : [CataloguesearchService],
    styleUrls: ['./cataloguesearch.component.scss', '../menupanel.scss']
})


export class CatalogueSearchComponent implements AfterViewInit {

  drawStarted: boolean;
  bbox: Bbox;
  form: any
  public ngSelectiveConfig = {};
  public ngSelectiveOptions = [];
  public cswRegistries = [];

  loading: boolean;
  searchMode: boolean;
  layerGroups = [];
  uiLayerModels: {};
  bsModalRef: BsModalRef;
  statusmsg: string;
  totalResults = [];
  currentPage: number;

  constructor(private olMapService: OlMapService, private cataloguesearchService: CataloguesearchService,
    private renderStatusService: RenderStatusService,  private modalService: BsModalService, private layerHandlerService: LayerHandlerService) {
    this.drawStarted = false;
    this.searchMode = true;
    this.uiLayerModels = {};
    this.loading = false;
    this.form = {};
    this.currentPage = 1;
    this.ngSelectiveConfig = {
      labelField: 'label',
      valueField: 'value',
      maxItems: 5
    }

  }

  ngAfterViewInit(): void {
    this.cataloguesearchService.getCSWServices().subscribe(response => {
      this.cswRegistries = response;

      for (const reg of this.cswRegistries) {
        if (reg['selectedByDefault'] === true) {
          this.form.cswService = reg;
          this.setkeywords(reg);
        }

      }
    })

  }


  private setkeywords(registry) {
    this.cataloguesearchService.getFilteredCSWKeywords(registry.id).subscribe(keywords => {
      this.ngSelectiveOptions = [];
      for (const keyword of keywords) {
        this.ngSelectiveOptions.push({
          label: keyword.keyword,
          value: keyword.keyword
        });
      }
      this.form.keywords = [];
    })
  }

    /**
   * clear the bounding box
   */
  public clearBound(): void {
    this.bbox = null;
  }

  /**
   * Draw bound to get the bbox for download
   */
  public drawBound(): void {
    setTimeout(() => this.drawStarted = true, 0);

    this.olMapService.drawBound().subscribe((vector) => {
      this.drawStarted = false;
      const features = vector.getSource().getFeatures();
      const me = this;
      // Go through this array and get coordinates of their geometry.
      features.forEach(function(feature) {
        me.bbox = new Bbox();
        me.bbox.crs = 'EPSG:4326';
        const bbox4326 = feature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
        me.bbox.eastBoundLongitude = bbox4326.getExtent()[2];
        me.bbox.westBoundLongitude = bbox4326.getExtent()[0];
        me.bbox.northBoundLatitude = bbox4326.getExtent()[3];
        me.bbox.southBoundLatitude = bbox4326.getExtent()[1];
        me.form.north = me.bbox.northBoundLatitude;
        me.form.south = me.bbox.southBoundLatitude;
        me.form.east = me.bbox.eastBoundLongitude;
        me.form.west = me.bbox.westBoundLongitude;
      });
    });
  }

  public selectTabPanel(layerId, panelType) {
    (<UILayerModel>this.uiLayerModels[layerId]).tabpanel.setPanelOpen(panelType);
  }

  public closeResult() {
    this.searchMode = true;
    this.currentPage = 1;
  }
  /**
   * Search list of wms layer given the wms url
   */
  public search() {
    this.layerGroups = [];
    this.loading = true;
    this.searchMode = false;
    const me = this;
    this.cataloguesearchService.getFilteredCSWRecords(this.form, this.currentPage).subscribe(
      response => {
        this.loading = false;
        if (response != null) {
          me.layerGroups = response.itemLayers;
          for (let i = 1; i <= response.totalResults; i++) {
            me.totalResults.push(i);
          }
          for (const key in this.layerGroups) {
            for (let i = 0; i < this.layerGroups[key].length; i++) {
              const uiLayerModel = new UILayerModel(this.layerGroups[key][i].id, this.renderStatusService.getStatusBSubject(this.layerGroups[key][i]));
              me.uiLayerModels[me.layerGroups[key][i].id] = uiLayerModel;
            }
          }
        } else {
          this.statusmsg = '<div class="text-danger">No records Found</div>';
        }
      });
  }
    /**
     * open the modal that display the status of the render
     */
    public openStatusReport(uiLayerModel: UILayerModel) {
      this.bsModalRef = this.modalService.show(NgbdModalStatusReportComponent, {class: 'modal-lg'});
      uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
        this.bsModalRef.content.resourceMap = value.resourceMap;
      });
    }

  /**
   * remove a layer from the map
   */
    public removeLayer(layer: LayerModel) {
      this.olMapService.removeLayer(layer);
    }

}
