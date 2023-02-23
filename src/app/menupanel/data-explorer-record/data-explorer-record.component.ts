import { Component, Input, ViewContainerRef, OnInit } from "@angular/core";
import {  CSWRecordModel,  CsMapService,  ManageStateService,  UtilitiesService,  LayerModel} from "@auscope/portal-core-ui";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LegendUiService } from "app/services/legend/legend-ui.service";
import { AdvancedComponentService } from "app/services/ui/advanced-component.service";
import { environment } from "environments/environment";
import * as _ from "lodash";
import { RecordModalComponent } from "../record-modal/record-modal.component";

// List of valid online resource types that can be added to the map
const VALID_ONLINE_RESOURCE_TYPES: string[] = ["WMS", "WFS", "CSW", "WWW"];

declare var gtag: Function;

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
    public csMapService: CsMapService,
    private manageStateService: ManageStateService,
    private advancedMapComponentService: AdvancedComponentService,
    private legendUiService: LegendUiService,
    public modalService: NgbModal
  ) {
    this.optionalFilters = [];
  }

  ngOnInit() {
    // VT: permanent link
    const state = UtilitiesService.getUrlParameterByName("state");
    if (state) {
      const me = this;
      this.manageStateService.fetchStateFromDB(state).subscribe((layerStateObj: any) => {
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
    if (
      cswRecord.hasOwnProperty("onlineResources") &&
      cswRecord.onlineResources != null &&
      cswRecord.onlineResources.some(
        (resource) => VALID_ONLINE_RESOURCE_TYPES.indexOf(resource.type) > -1
      ) &&
      cswRecord.geographicElements.length > 0 &&
      !this.csMapService.layerExists(cswRecord.id)
    ) {
      addable = true;
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
    if (environment.googleAnalyticsKey && typeof gtag === "function") {
      gtag("event", "Addlayer", {
        event_category: "Addlayer",
        event_action: "AddLayer:" + layer.id,
      });
    }
    const param = {
      optionalFilters: _.cloneDeep(this.optionalFilters),
    };


    for (const optFilter of param.optionalFilters) {
      if (optFilter["options"]) {
        optFilter["options"] = [];
      }
    }

    this.manageStateService.addLayer(
      layer.id,
      null,
      layer.filterCollection,
      this.optionalFilters,
      // No advanced filters in data search panel
      null
    );

    // Remove any existing legends in case map re-added with new style
    this.legendUiService.removeLegend(layer.id);

    // Add layer
    this.csMapService.addLayer(layer, param);

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($("#sidebar-toggle-btn").css("display") !== "none") {
      $("#sidebar-toggle-btn").click();
    }

    // Add any advanced map components to map defined in refs.ts
    this.advancedMapComponentService.addAdvancedMapComponents(this.layer);
  }

  /**
   * Remove the layer
   *
   * @layerId layerId ID of LayerModel
   */
  removeLayer(layerId: string): void {
    const layerModelList = this.csMapService.getLayerModelList();
    if (layerModelList.hasOwnProperty(layerId)) {
      this.csMapService.removeLayer(layerModelList[layerId]);
      // Remove any layer specific components
      this.advancedMapComponentService.removeAdvancedMapComponents(layerId);
    }
    this.legendUiService.removeLegend(layerId);
  }
}
