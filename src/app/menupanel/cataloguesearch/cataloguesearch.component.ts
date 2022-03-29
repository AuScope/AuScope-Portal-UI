import { Bbox } from '@auscope/portal-core-ui';
import { LayerModel } from '@auscope/portal-core-ui';
import { CsMapService } from '@auscope/portal-core-ui';
import { RenderStatusService } from '@auscope/portal-core-ui';
import { UtilitiesService } from '@auscope/portal-core-ui';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { CataloguesearchService } from './cataloguesearch.service';
import { Component, AfterViewInit } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { RectangleEditorObservable } from '@auscope/angular-cesium';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';


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
  bsModalRef: BsModalRef;
  statusmsg: string;
  pageList = [];
  currentPage: number;
     
  // the rectangle drawn on the map
  private rectangleObservable: RectangleEditorObservable;

  constructor(private csMapService: CsMapService, private cataloguesearchService: CataloguesearchService,
              private renderStatusService: RenderStatusService,  private modalService: BsModalService,
              private uiLayerModelService: UILayerModelService) {
    this.drawStarted = false;
    this.searchMode = true;
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
    });
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
    });
  }

  /**
   * clear the bounding box
   */
  public clearBound(): void {
    this.bbox = null;
    this.form.north = null;
    this.form.south = null;
    this.form.east = null;
    this.form.west = null;
    // clear rectangle on the map
    if (this.rectangleObservable) {
        this.rectangleObservable.dispose();
        this.rectangleObservable = null;
    }
  }

  /**
   * Draw bound to get the bbox for download
   */
  public drawBound(): void {
    setTimeout(() => this.drawStarted = true, 0);

    const me = this;
    this.rectangleObservable = this.csMapService.drawBound();
    this.rectangleObservable.subscribe((vector) => {
      me.drawStarted = false;
      if (!vector.points) {
          // drawing hasn't started
          return;
      }
      if (vector.points.length < 2
              || vector.points[0].getPosition().x == vector.points[1].getPosition().x
              || vector.points[0].getPosition().y == vector.points[1].getPosition().y) {
          // drawing hasn't finished
          return;
      }
      //EPSG:4326    
      me.bbox = UtilitiesService.reprojectToWGS84(vector.points);
      me.form.north = me.bbox.northBoundLatitude;
      me.form.south = me.bbox.southBoundLatitude;
      me.form.east = me.bbox.eastBoundLongitude;
      me.form.west = me.bbox.westBoundLongitude;
    });
  }

  public selectTabPanel(layerId, panelType) {
    this.uiLayerModelService.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
  }

  public closeResult() {
    this.searchMode = true;
    this.currentPage = 1;
  }

  /**
   * Search list of wms layer given the wms url
   */
  public search() {
    // clear rectangle on the map because there is no way to remove it after search is displayed
    if (this.rectangleObservable) {
      this.rectangleObservable.dispose();
      this.rectangleObservable = null;
    }
    this.layerGroups = [];
    this.loading = true;
    this.searchMode = false;
    const me = this;
    this.cataloguesearchService.getFilteredCSWRecords(this.form, this.currentPage).subscribe(
      response => {
        this.loading = false;
        if (response != null) {
          me.layerGroups = response.itemLayers;
          me.pageList = [];
          for (let i = 1; i <= Math.ceil(response.totalResults / CataloguesearchService.RESULTS_PER_PAGE); i++) {
            me.pageList.push(i);
          }
          for (const key in this.layerGroups) {
            for (let i = 0; i < this.layerGroups[key].length; i++) {
              const uiLayerModel = new UILayerModel(this.layerGroups[key][i].id, this.renderStatusService.getStatusBSubject(this.layerGroups[key][i]));
              this.uiLayerModelService.setUILayerModel(me.layerGroups[key][i].id, uiLayerModel);
            }
          }
        } else {
          this.statusmsg = '<div class="text-danger">No records Found</div>';
        }
      }, error => {
        this.loading = false;
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
    this.csMapService.removeLayer(layer);
  }

  /**
   * Retrieve UILayerModel from the UILayerModelService
   * @param layerId ID of layer
   */
  public getUILayerModel(layerId: string): UILayerModel {
    return this.uiLayerModelService.getUILayerModel(layerId);
  }

}
