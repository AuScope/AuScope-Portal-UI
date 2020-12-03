import { Bbox } from 'portal-core-ui/model/data/bbox.model';
import { CSWRecordModel } from 'portal-core-ui/model/data/cswrecord.model';
import { LayerModel } from 'portal-core-ui/model/data/layer.model';
import { LayerHandlerService } from 'portal-core-ui/service/cswrecords/layer-handler.service';
import { OlMapService } from 'portal-core-ui/service/openlayermap/ol-map.service';
import { RenderStatusService } from 'portal-core-ui/service/openlayermap/renderstatus/render-status.service';
import { Constants } from 'portal-core-ui/utility/constants.service';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { CataloguesearchService } from './cataloguesearch.service';
import { Component, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as Proj from 'ol/proj';
import { RecordModalComponent } from './record.modal.component';

// List of valid online resource types that can be added to the map
const VALID_ONLINE_RESOURCE_TYPES: string[] = ['WMS', 'WFS', 'CSW', 'WWW'];

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
  statusmsg: string;
  totalResults = [];
  currentPage: number;
 
  constructor(private olMapService: OlMapService, private cataloguesearchService: CataloguesearchService,
    private renderStatusService: RenderStatusService,  private modalService: NgbModal, private layerHandlerService: LayerHandlerService) {
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
        const bbox4326 = feature.getGeometry().transform(Constants.MAP_PROJ, 'EPSG:4326');
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
   * remove a layer from the map
   */
    public removeLayer(layer: LayerModel) {
      this.olMapService.removeLayer(layer);
    }

//================================================================================== 
//===================== Stu's code from nvgl =======================================
//==================================================================================    
   /**
     * Determine if a CSWRecord meets the criteria to be added to the map.
     *
     * Will return true if layer satisfies:
     *
     *   1. Has online resource.
     *   2. Has at least one defined geographicElement.
     *   3. Layer does not already exist on map.
     *   4. One online resource is of type WMS, WFS, CSW or WWW.
     *
     * @param cswRecord the CSWRecord to verify
     * @return true is CSWRecord can be added, false otherwise
     */
    public isAddableRecord(cswRecord: CSWRecordModel): boolean {
        let addable: boolean = false;
        if (cswRecord.hasOwnProperty('onlineResources') &&
                cswRecord.onlineResources != null &&
                cswRecord.onlineResources.some(resource => VALID_ONLINE_RESOURCE_TYPES.indexOf(resource.type) > -1) &&
                cswRecord.geographicElements.length > 0 &&
                !this.olMapService.layerExists(cswRecord.id)) {
            addable = true;
        }
        return addable;
    }
    /**
     * Display the record information dialog
     *
     * @param cswRecord CSW record for information
     */
    public displayRecordInformation(cswRecord) {
        if (cswRecord) {
            const modelRef = this.modalService.open(RecordModalComponent, { size: 'lg' });
            modelRef.componentInstance.record = cswRecord;
        }
    }


    /**
     *
     * @param layer
     */
    public showCSWRecordBounds(layer: any): void {
        if (layer.cswRecords) {
            for(let record of layer.cswRecords) {
                if(record.geographicElements && record.geographicElements.length > 0) {
                    let bounds = record.geographicElements.find(i => i.type === 'bbox');
                    if(bounds) {
                        const bbox: [number, number, number, number] =
                            [bounds.westBoundLongitude, bounds.southBoundLatitude, bounds.eastBoundLongitude, bounds.northBoundLatitude];
                        const extent = Proj.transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
                        this.olMapService.displayExtent(extent, 3000);
                        return;
                    }
                }
            }
        }
    }

    /**
     *
     * @param layer
     */
    public zoomToCSWRecordBounds(layer: any): void {
        if (layer.cswRecords) {
            for(let record of layer.cswRecords) {
                if(record.geographicElements && record.geographicElements.length > 0) {
                    let bounds = record.geographicElements.find(i => i.type === 'bbox');
                    const bbox: [number, number, number, number] =
                        [bounds.westBoundLongitude, bounds.southBoundLatitude, bounds.eastBoundLongitude, bounds.northBoundLatitude];
                    const extent = Proj.transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
                    this.olMapService.fitView(extent);
                    return;
                }
            }
        }
    }    

}
