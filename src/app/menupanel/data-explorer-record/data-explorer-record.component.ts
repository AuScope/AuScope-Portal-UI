import { Component, Input, ViewContainerRef, OnInit } from "@angular/core";
import { CSWRecordModel, CsMapService,  UtilitiesService, LayerModel } from "@auscope/portal-core-ui";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserStateService } from "app/services/user/user-state.service";
import { RecordModalComponent } from "../record-modal/record-modal.component";
import { LayerManagerService } from "app/services/ui/layer-manager.service";
import { DataExplorerService } from "../data-explorer/data-explorer.service";

@Component({
  selector: "app-data-explorer-record",
  templateUrl: "./data-explorer-record.component.html",
  styleUrls: ["./data-explorer-record.component.scss"],
})
export class DataExplorerRecordComponent implements OnInit {
  recordButtons: ViewContainerRef;

  @Input() registries: any = [];
  @Input() cswRecord: CSWRecordModel;
  @Input() layer: LayerModel;

  public optionalFilters: Array<Object>;

  constructor(
    private dataExplorerService: DataExplorerService,
    public csMapService: CsMapService,
    private layerManagerService: LayerManagerService,
    private userStateService: UserStateService,
    public modalService: NgbModal
  ) {
    this.optionalFilters = [];
  }

  ngOnInit() {
    // VT: permanent link
    const stateId = UtilitiesService.getUrlParameterByName("state");
    if (stateId) {
      const me = this;
      this.userStateService.getPortalState(stateId).subscribe((layerStateObj: any) => {
        if (layerStateObj) {
          if (layerStateObj[me.layer.id]) {
            me.optionalFilters = layerStateObj[me.layer.id].optionalFilters;
            setTimeout(() => {
              me.addLayer(me.layer);
            }, 100);
          }
        }
      });
    }
  }

  /**
   * Display the record information dialog
   *
   * @param cswRecord CSW record for information
   */
  public displayRecordInformation(cswRecord: any) {
    if (cswRecord) {
      const modelRef = this.modalService.open(RecordModalComponent, {
        size: "lg",
        backdrop: false
      });
      modelRef.componentInstance.cswRecords = this.layer.cswRecords;
      modelRef.componentInstance.layer = this.layer;
    }
  }

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
    if (cswRecord.hasOwnProperty("onlineResources")) {
      for (const or of cswRecord.onlineResources) {
        if (this.dataExplorerService.isValidOnlineResourceType(or.type) && or.name && or.name !== '') {
          addable = true;
          break;
        }
      }
    }
    return addable;
  }

  /**
   * Check if a record has already been added to the map
   *
   * @param cswRecord the record to check
   */
  public isRecordAddedToMap(cswRecord: CSWRecordModel): boolean {
    return this.csMapService.layerExists(cswRecord.id);
  }

  /**
   * Add layer to map
   * @param layer the layer to add to map
   */
  public addLayer(layer): void {
    this.layerManagerService.addLayer(layer, this.optionalFilters, layer.filterCollection, undefined);
  }

  /**
   * Remove the layer
   *
   * @layerId layerId ID of LayerModel
   */
  removeLayer(layer: LayerModel): void {
    this.layerManagerService.removeLayer(layer);
  }

}
