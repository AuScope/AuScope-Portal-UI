import { DataExplorerService } from "./data-explorer.service";
import { Observable, Subject, merge } from "rxjs";
import { Component, OnInit, ViewChild, ElementRef} from "@angular/core";
import { filter, debounceTime, distinctUntilChanged,  map} from "rxjs/operators";
import { Bbox, CsMapService, CSWRecordModel,  LayerModel,  OnlineResourceModel,  UtilitiesService} from "@auscope/portal-core-ui";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { UILayerModelService } from "app/services/ui/uilayer-model.service";
import { RenderStatusService } from "@auscope/portal-core-ui";
import { Registry } from "./data-model";
import { RectangleEditorObservable } from "@auscope/angular-cesium";
import { UILayerModel } from "../common/model/ui/uilayer.model";
import { environment } from "environments/environment";

@Component({
  selector: "[appDataExplorer]",
  templateUrl: "./data-explorer.component.html",
  styleUrls: ["../menupanel.scss", "./data-explorer.component.scss" ],
  providers: [DataExplorerService],
})
export class DataExplorerComponent implements OnInit{
  bbox: Bbox;
  public cswRegistries = [];

  // the rectangle drawn on the map
  private rectangleObservable: RectangleEditorObservable;

  readonly CSW_RECORD_PAGE_LENGTH = 10;

  // Search results
  cswSearchResults: Map<string, LayerModel[]> = new Map<string, LayerModel[]>();
  searchConducted = false;  // Has a search has been conducted?
  layerOpacities: Map<string, number> = new Map<string, number>();

  // Collapsable menus
  anyTextIsCollapsed: boolean = true;
  spatialBoundsIsCollapsed: boolean = true;
  keywordsIsCollapsed: boolean = true;
  servicesIsCollapsed: boolean = true;
  pubDateIsCollapsed: boolean = true;
  registriesIsCollapsed: boolean = true;
  searchResultsIsCollapsed: boolean = true;

  // Faceted search parameters
  anyTextValue: string = "";
  spatialBoundsText: string = "";
  availableKeywords: string[] = []; // List of available keywords
  selectedKeywords: string[] = []; // Chosen keywords for filtering
  availableServices: any = [];
  dateTo: Date = null;
  dateFrom: Date = null;
  availableRegistries: Map<string, Registry> = new Map<string, Registry>();

  currentYear: number;

  @ViewChild("instance") typeaheadInstance: NgbTypeahead;
  @ViewChild("searchResults") searchResultsElement: ElementRef;

  click$ = new Subject<string>();

  searchKeywords = (text$: Observable<string>) =>
    merge(
      this.click$.pipe(filter(() => !this.typeaheadInstance.isPopupOpen()))
    ).pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((term) =>
        (term === ""
          ? this.availableKeywords
          : this.availableKeywords.filter(
              (v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1
            )
        ).slice(0, 10)
      )
    );

  constructor(
    private csMapService: CsMapService,
    private dataExplorerService: DataExplorerService,
    private renderStatusService: RenderStatusService,
    private uiLayerModelService: UILayerModelService
  ) { }

  ngOnInit() {
    this.currentYear = new Date().getFullYear();

    // Load available registries
    this.dataExplorerService.updateRegistries().subscribe(
      (data: Registry[]) => {
        // Update registries
        for (const registry of data) {
          registry.checked = true;
          registry.startIndex = 1;
          registry.prevIndices = [];
          registry.recordsMatched = 0;
          registry.searching = false;
          registry.currentPage = 1;
          this.availableRegistries.set(registry.id, registry);
        }

        // Populate initial results (if this isn't desired, add checks to
        // facetedSearch to ensure at least 1 filter has been used or de-
        // selecting a registry will populate results)
        this.getFacetedKeywords();
      },
      (error) => {
        // TODO: Proper error reporting
        console.log("Unable to retrieve registries: " + error.message);
      }
    );

    // Define available services
    this.availableServices = [
      { id: "wcs", name: "WCS", checked: false },
      { id: "ncss", name: "NCSS", checked: false },
      { id: "opendap", name: "OPeNDAP", checked: false },
      { id: "wfs", name: "WFS", checked: false },
      { id: "wms", name: "WMS", checked: false },
    ];

    this.anyTextIsCollapsed = false;
    this.searchResultsIsCollapsed = false;
  }


  /**
   *
   * @param serviceId
   */
  public getRegistryTabTitle(serviceId: string) {
    let title: string = this.availableRegistries.get(serviceId).title;
    if (this.availableRegistries.get(serviceId).searching) {
      title += " (Searching)";
    } else if (this.availableRegistries.get(serviceId).recordsMatched) {
      title +=
        " (" + this.availableRegistries.get(serviceId).recordsMatched + ")";
    }
    return title;
  }

  /**
   *
   */
  public getTotalSearchResultCount(): number {
    let count: number = 0;
    this.availableRegistries.forEach((registry: Registry) => {
      count += registry.recordsMatched;
    });
    return count;
  }

  /**
   * Search all registries using current facets.
   */
  public facetedSearchAllRegistries(): void {
    this.searchConducted = true;

    // Available registries and start
    let serviceIds: string[] = [];
    let starts: number[] = [];
    let registrySelected: boolean = false;
    this.availableRegistries.forEach(
      (registry: Registry, serviceId: string) => {
        if (registry.checked) {
          registrySelected = true;
          serviceIds.push(registry.id);
          starts.push(registry.startIndex);
        }
      }
    );

    // If no registries are selected, there's nothing to search
    if (!registrySelected) {
      return;
    }

    let fields: string[] = [];
    let values: string[] = [];
    let types: string[] = [];
    let comparisons: string[] = [];

    // Any text search
    if (this.anyTextValue) {
      fields.push("anytext");
      values.push(this.anyTextValue);
      types.push("string");
      comparisons.push("eq");
    }

    // Spatial bounds
    let me = this;
    if (me.bbox != null) {
      fields.push("bbox");
      let boundsStr =
        '{"northBoundLatitude":' +
        me.bbox.northBoundLatitude +
        ',"southBoundLatitude":' +
        me.bbox.southBoundLatitude +
        ',"eastBoundLongitude":' +
        me.bbox.eastBoundLongitude +
        ',"westBoundLongitude":' +
        me.bbox.westBoundLongitude +
        ',"crs":"EPSG:4326"}';
      values.push(boundsStr);
      types.push("bbox");
      comparisons.push("eq");
    }

    // Keywords
    this.selectedKeywords.forEach((keyword) => {
      if (keyword !== "") {
        fields.push("keyword");
        values.push(keyword);
        types.push("string");
        comparisons.push("eq");
      }
    });

    // Available services
    for (let service of this.availableServices) {
      if (service.checked) {
        fields.push("servicetype");
        values.push(service.name);
        types.push("servicetype");
        comparisons.push("eq");
      }
    }

    // Publication dates
    if (this.dateFrom != null && this.dateTo != null) {
      fields.push("datefrom");
      fields.push("dateto");
      // For some reason getMilliseconds doesn't work on these Date objects,
      // so parse from string
      let fromDate = Date.parse(this.dateFrom.toString());
      let toDate = Date.parse(this.dateTo.toString());
      values.push(fromDate.toString());
      values.push(toDate.toString());
      types.push("date");
      types.push("date");
      comparisons.push("gt");
      comparisons.push("lt");
    }

    this.availableRegistries.forEach(
      (registry: Registry, serviceId: string) => {
        if (registry.checked) {
          registry.searching = true;
          registry.searchError = null;
          this.dataExplorerService
            .getFacetedSearch(
              registry.id,
              registry.startIndex,
              this.CSW_RECORD_PAGE_LENGTH,
              registry.title,
              fields,
              values,
              types,
              comparisons
            )
            //this.dataExplorerService.getFilteredCSWRecords(registry, this.CSW_RECORD_PAGE_LENGTH)
            .subscribe(
              (response) => {
                registry.prevIndices.push(registry.startIndex);
                registry.startIndex = response["data"].nextIndexes[registry.id];
                registry.recordsMatched = response["data"].recordsMatched;
                if (
                  response["data"].hasOwnProperty("searchErrors") &&
                  response["data"].searchErrors[registry.id] != null
                ) {
                  registry.searchError =
                    response["data"].searchErrors[registry.id];
                }
                for (const item of response["itemLayers"]) {
                  const uiLayerModel = new UILayerModel(item.id, this.renderStatusService.getStatusBSubject(item));
                  this.uiLayerModelService.setUILayerModel(item.id, uiLayerModel);                  
                }
                response["itemLayers"].useDefaultProxy = true;
                response["itemLayers"].useProxyWhitelist = false;

                this.cswSearchResults.set(registry.id, response["itemLayers"]);
                registry.searching = false;

                this.searchResultsIsCollapsed = false;
                //this.searchResultsElement.nativeElement.scrollIntoView(false);
              }, () => {
                this.cswSearchResults.set(serviceId, null);
                registry.searching = false;
              }
            );
        }
      }
    );
  }

  /**
   * Search a single registry using current facets.
   * @param registry the single registry to search
   */
  public facetedSearchSingleRegistry(registry: Registry): void {
    this.searchConducted = true;

    let fields: string[] = [];
    let values: string[] = [];
    let types: string[] = [];
    let comparisons: string[] = [];

    // Any text search
    if (this.anyTextValue) {
      fields.push("anytext");
      values.push(this.anyTextValue);
      types.push("string");
      comparisons.push("eq");
    }

    // Spatial bounds
    let me = this;
    if (me.bbox != null) {
      fields.push("bbox");
      let boundsStr =
        '{"northBoundLatitude":' +
        me.bbox.northBoundLatitude +
        ',"southBoundLatitude":' +
        me.bbox.southBoundLatitude +
        ',"eastBoundLongitude":' +
        me.bbox.eastBoundLongitude +
        ',"westBoundLongitude":' +
        me.bbox.westBoundLongitude +
        ',"crs":"EPSG:4326"}';
      values.push(boundsStr);
      types.push("bbox");
      comparisons.push("eq");
    }

    // Keywords
    this.selectedKeywords.forEach((keyword) => {
      if (keyword !== "") {
        fields.push("keyword");
        values.push(keyword);
        types.push("string");
        comparisons.push("eq");
      }
    });

    // Available services
    for (let service of this.availableServices) {
      if (service.checked) {
        fields.push("servicetype");
        values.push(service.name);
        types.push("servicetype");
        comparisons.push("eq");
      }
    }

    // Publication dates
    if (this.dateFrom != null && this.dateTo != null) {
      fields.push("datefrom");
      fields.push("dateto");
      // For some reason getMilliseconds doesn't work on these Date objects,
      // so parse from string
      let fromDate = Date.parse(this.dateFrom.toString());
      let toDate = Date.parse(this.dateTo.toString());
      values.push(fromDate.toString());
      values.push(toDate.toString());
      types.push("date");
      types.push("date");
      comparisons.push("gt");
      comparisons.push("lt");
    }

    registry.searching = true;
    registry.searchError = null;

    this.dataExplorerService
      .getFacetedSearch(
        registry.id,
        registry.startIndex,
        this.CSW_RECORD_PAGE_LENGTH,
        registry.title,
        fields,
        values,
        types,
        comparisons
      )
      .subscribe(
        (response) => {
          registry.prevIndices.push(registry.startIndex);
          registry.startIndex = response["data"].nextIndexes[registry.id];
          registry.recordsMatched = response["data"].recordsMatched;
          if ((<CSWRecordModel[]>response["data"].records).length > 0) {
            for (let i = 0; i < response["itemLayers"].length; i++) {
              response["itemLayers"].useDefaultProxy = true;
              response["itemLayers"].useProxyWhitelist = false;
            }
            this.cswSearchResults.set(registry.id, response["itemLayers"]);
          }
          if (
            response["data"].searchErrors &&
            response["data"].searchErrors.length > 0
          ) {
            registry.searchError = response["data"].searchErrors[registry.id];
          }
          registry.searching = false;
          this.searchResultsIsCollapsed = false;
          // this.searchResultsElement.nativeElement.scrollIntoView(false);
        },
        (error) => {
          this.cswSearchResults.set(registry.id, null);
          registry.searchError = error.message;
          registry.searching = false;
        }
      );
  }

  /**
   *
   */
  public getFacetedKeywords(): void {
    let registrySelected = false;
    const serviceIds = [];
    this.availableRegistries.forEach(
      (registry: Registry) => {
        if (registry.checked) {
          registrySelected = true;
          serviceIds.push(registry.id);
        }
      }
    );
    // If no registries are selected, there's nothing to search
    if (!registrySelected) {
      return;
    }
    this.dataExplorerService.getFacetedKeywords(serviceIds).subscribe(
      (data) => {
        this.availableKeywords = data.sort((a, b) => a.trim().toLowerCase().localeCompare(b.trim().toLowerCase()));
      },
      (error) => {
        // TODO: Proper error reporting
        console.log('Faceted keyword error: ' + error.message);
      }
    );
  }

  /**
   *
   */
  public resetFacetedSearch(): void {
    // Reset results and registry indices
    this.cswSearchResults = new Map<string, LayerModel[]>();
    this.availableRegistries.forEach(
      (registry: Registry, serviceId: string) => {
        registry.startIndex = 1;
        registry.prevIndices = [];
        registry.currentPage = 1;
      }
    );
    this.facetedSearchAllRegistries();
  }

  /**
   * Fires when a registry is changed, resets keywords and re-runs facted
   * search if registry has been added, as well as resetting search indices.
   */
  public registryChanged(registry: Registry): void {
    this.getFacetedKeywords();
    if (registry.checked) {
      this.facetedSearchSingleRegistry(registry);
    } else {
      registry.currentPage = 1;
      registry.startIndex = 1;
      registry.prevIndices = [];
      registry.recordsMatched = 0;
      if (this.cswSearchResults.has(registry.id)) {
        this.cswSearchResults.delete(registry.id);
      }
    }
  }
  /**
   * clear the bounding box
   */
  public clearBound(): void {
    this.bbox = null;
    // clear rectangle on the map
    if (this.rectangleObservable) {
      this.rectangleObservable.dispose();
      this.rectangleObservable = null;
    }
    this.spatialBoundsText = "";

    this.resetFacetedSearch();
  }

  /**
   * Draw bound to get the bbox for download
   */
  public drawBound(): void {

    const me = this;
    this.rectangleObservable = this.csMapService.drawBound();
    this.rectangleObservable.subscribe((vector) => {
      if (!vector.points) {
        // drawing hasn't started
        return;
      }
      if (
        vector.points.length < 2 ||
        vector.points[0].getPosition().x == vector.points[1].getPosition().x ||
        vector.points[0].getPosition().y == vector.points[1].getPosition().y
      ) {
        // drawing hasn't finished
        return;
      }
      //EPSG:4326
      me.bbox = UtilitiesService.reprojectToWGS84(vector.points);
      this.updateSpatialBoundsText(me.bbox);
      this.resetFacetedSearch();
    });
  }

  /**
   *
   * @param extent
   */
  public updateSpatialBoundsText(bbox: Bbox): void {
    if (bbox == null) {
      this.clearBound();
    } else {
      let w = bbox.northBoundLatitude.toFixed(4);
      let n = bbox.southBoundLatitude.toFixed(4);
      let s = bbox.eastBoundLongitude.toFixed(4);
      let e = bbox.westBoundLongitude.toFixed(4);

      this.spatialBoundsText = w + ", " + n + " to " + s + ", " + e;
    }
  }

  /**
   * Re-run faceted search when publication dates change
   */
  public publicationDateChanged(): void {
    if (
      this.isValidDate(new Date(this.dateFrom)) &&
      this.isValidDate(new Date(this.dateTo))
    ) {
      this.resetFacetedSearch();
    }
  }

    /**
   * Fires when a new keyword is selected from a keyword typeahead
   *
   * @param $event allows us to get the typeahead selection
   */
  public keywordChanged(): void {
    this.resetFacetedSearch();
  }

  /**
   * Get service information
   *
   * @param id the ID of the service
   */
  public getService(id: string): any {
    return this.availableServices.find((s) => s.id === id);
  }

  /**
   * Are there more results to display?
   *
   * @returns true if at least one registry has (nextIndex > 0), false
   *          otherwise
   */
  public hasNextResultsPage(serviceId: string): boolean {
    if (
      this.availableRegistries.get(serviceId).startIndex !== 0 &&
      this.availableRegistries.get(serviceId).startIndex !== 1
    ) {
      return true;
    }
    return false;
  }

  /**
   *
   */
  public previousResultsPage(serviceId: string): void {
    if (this.availableRegistries.get(serviceId).currentPage !== 1) {
      this.availableRegistries.get(serviceId).currentPage -= 1;
      if (this.availableRegistries.get(serviceId).prevIndices.length >= 2) {
        this.availableRegistries.get(serviceId).startIndex =
          this.availableRegistries.get(serviceId).prevIndices[
            this.availableRegistries.get(serviceId).prevIndices.length - 2
          ];
        this.availableRegistries
          .get(serviceId)
          .prevIndices.splice(
            this.availableRegistries.get(serviceId).prevIndices.length - 2,
            2
          );
      }
      this.facetedSearchSingleRegistry(this.availableRegistries.get(serviceId));
    }
  }

  /**
   *
   */
  public nextResultsPage(serviceId: string): void {
    this.availableRegistries.get(serviceId).currentPage += 1;
    this.facetedSearchSingleRegistry(this.availableRegistries.get(serviceId));
  }

  /**
   * TODO: Maybe switch event to lose focus, this will check after every key press.
   *       Tried to use (change) but ngbDatepicker hijacks the event.
   * @param date
   */
  private isValidDate(date: Date): boolean {
    if (date && date.getFullYear() && date.getMonth()) {
      return true;
    }
    return false;
  }
}
