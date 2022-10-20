import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RectangleEditorObservable } from '@auscope/angular-cesium';
import { Bbox, CsMapService, LayerHandlerService, LayerModel, ManageStateService, UtilitiesService } from '@auscope/portal-core-ui';
import { NgbAccordion, NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { Observable } from 'rxjs';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';

const DEFAULT_RESULTS_PER_PAGE = 10;
const SEARCH_FIELDS = [{
    name: 'Name',
    field: 'name',
    checked: true
  }, {
    name: 'Description',
    field: 'description',
    checked: true
  }, {
    name: 'Keyword',
    field: 'keyword',
    checked: true
  }, {
    name: 'CSW Abstract',
    field: 'abstract',
    checked: true
  }
  // ID seems a bit useless, but maybe there's a scientist out there..?
  /*, {
    name: 'ID',
    field: 'id',
    checked: true
  }*/];
const OGC_SERVICES = ['WMS', 'IRIS', 'WFS', 'WCS', 'WWW'];

@Component({
    selector: 'app-search-panel',
    templateUrl: './searchpanel.component.html',
    styleUrls: ['./searchpanel.component.scss']
})
export class SearchPanelComponent implements OnInit {

  searchMessage = '';
  alertMessage = '';

  showingSearchPanel = true;
  showingAdvancedOptions = false;
  queryText = '';
  searching = false;
  searchResults: SearchResult[] = null;

  @ViewChild('queryinput') textQueryInput: ElementRef;

  @ViewChild(NgbAccordion) private searchAccordion: NgbAccordion;

  // Options
  allSearchField: SearchField = new SearchField('All', '', true);
  searchFields: SearchField[] = SEARCH_FIELDS;
  allOGCServices: SearchField = new SearchField('All', '', true);
  ogcServices: SearchField[] = [];
  restrictBounds = false; // Could probably just use bbox if set
  bbox: Bbox;
  boundsRelationship = 'Intersects';
  @ViewChild('spatialOptionsDropdown') spatialOptionsDropdown: NgbDropdown;

  // Pagination
  resultsPerPage: number = DEFAULT_RESULTS_PER_PAGE;
  pageList: number[] = [1];
  currentPage = 1;

  // Limit bounds
  private boundsRectangleObservable: RectangleEditorObservable;
  private drawBoundsStarted = false;

  constructor(private searchService: SearchService, private advancedComponentService: AdvancedComponentService,
              private csMapService: CsMapService, private layerHandlerService: LayerHandlerService,
              private uiLayerModelService: UILayerModelService, private manageStateService: ManageStateService, private modalService: NgbModal) { }

  ngOnInit() {
    for (const service of OGC_SERVICES) {
      const field: SearchField = new SearchField(service, service, true);
      this.ogcServices.push(field);
    }
    /*
    this.searchService.getSearchKeywords().subscribe(keywords => {
      console.log('keywords: ' + JSON.stringify(keywords));
    });
    */
  }

  /**
   * Clear query text input field
   *
   * TODO: Clear results as well?
   */
  public clearQueryText() {
    this.queryText = '';
    this.textQueryInput.nativeElement.focus();
  }

  /**
   * When opening/closing the search panel or changing search result pages
   * the open/close state of the search result accordion panels is lost.
   * This re-opens any panels that should be open.
   */
  expandOpenSearchResultPanels() {
    if (this.showingSearchPanel && this.searchResults && this.searchResults.length > 0) {
      setTimeout(() => {
        for (const result of this.searchResults) {
          if (result.expanded) {
            this.searchAccordion.expand(result.layer.id);
          }
        }
      });
    }
  }

  /**
   * Toggle the search panel
   */
  public toggleSearchPanel() {
    this.showingSearchPanel = !this.showingSearchPanel;
    this.expandOpenSearchResultPanels();
  }

  /**
   * A search field has been checked or unchecked
   *
   * @param fieldName the name of the field
   */
  public searchFieldChange(fieldName: string) {
    const field = this.searchFields.find(f => f.name === fieldName);
    // If the last option was just un-checked, re-check it so we have at least one field
    if (field && this.searchFields.filter(f => f.checked === true).length === 0) {
      setTimeout(() => {
        field.checked = true;
      });
    }
  }

  /**
   * All fields has been checked or unchecked
   */
  public allSearchFieldChange() {
    if (this.allSearchField.checked) {
      for (const field of this.searchFields) {
        field.checked = true;
      }
    }
  }

  /**
   * A service has been checked/unchecked
   *
   * @param serviceName name of service
   */
  public ogcServiceChange(serviceName: string) {
    const field = this.ogcServices.find(f => f.name === serviceName);
    // If the last option was just un-checked, re-check it so we have at least one field
    if (field && this.ogcServices.filter(f => f.checked === true).length === 0) {
      setTimeout(() => {
        field.checked = true;
      });
    }
  }

  /**
   * All services has been checked or unchecked
   */
   public allOGCServicesChange() {
    if (this.allSearchField.checked) {
      for (const field of this.ogcServices) {
        field.checked = true;
      }
    }
  }

  /**
   * Subset of search results matching current pagination values
   * @returns sliced array of results for current page
   */
  public paginatedSearchResults(): SearchResult[] {
    const startPos = (this.currentPage - 1) * this.resultsPerPage;
    const endPos = startPos + this.resultsPerPage;
    return this.searchResults.slice(startPos, endPos);
  }

  /**
   * Advance results one page
   */
  public previousPage() {
    this.currentPage--;
    this.expandOpenSearchResultPanels();
  }

  /**
   * Go back one page in results
   */
  public nextPage() {
    this.currentPage++;
    this.expandOpenSearchResultPanels();
  }

  /**
   * Display layer information dialog
   *
   * @param layer LayerModel for layer
   */
  public showLayerInformation(layer: LayerModel) {
    if (layer) {
      const modelRef = this.modalService.open(InfoPanelComponent, {
        size: 'lg',
        backdrop: false
      });
      modelRef.componentInstance.cswRecords = layer.cswRecords;
      modelRef.componentInstance.layer = layer;
    }
  }

  /**
   * Layer warning content
   *
   * @param layer LayerModel of layer
   */
  public layerWarningMessage(layer): string {
    return 'This layer cannot be displayed. For Featured Layers, please wait for the layer cache to rebuild itself. ' +
      'For Custom Layers please note that only the following online resource types can be added to the map: ' +
      this.csMapService.getSupportedOnlineResourceTypes();
  }

  /**
   * Add layer to map
   *
   * @param layer LayerModel of layer
   */
  public addLayer(layer: LayerModel) {
    // TODO: Do we need to apply clipboard like FilterPanel.addLayer(...) does?
    const param = {
      optionalFilters: []
    };

    // Add a new layer in the layer state service
    this.manageStateService.addLayer(
      layer.id,
      null,
      layer.filterCollection,
      [],
      []
    );

    // Add layer to map in Cesium
    this.csMapService.addLayer(layer, param);

    // If on a small screen, when a new layer is added, roll up the sidebar to expose the map */
    if ($('#sidebar-toggle-btn').css('display') !== 'none') {
      $('#sidebar-toggle-btn').click();
    }

    // Add any advanced map components defined in refs.ts
    this.advancedComponentService.addAdvancedMapComponents(layer);
  }

  /**
   * Remove a layer from the map
   *
   * @param layer the LayerModel for the layer
   */
  public removeLayer(layer: LayerModel) {
    this.uiLayerModelService.getUILayerModel(layer.id).opacity = 100;
    this.csMapService.removeLayer(layer);
    // Remove any layer specific map components
    this.advancedComponentService.removeAdvancedMapComponents(layer.id);
  }

  /**
   * Append " (All)" to Search Fields title if all have been selected.
   *
   * @returns a string for the Search Fields title
   */
  public getSearchFieldTitle(): string {
    let title = 'Search Fields';
    if (this.allSearchField.checked) {
      title += ' (All)';
    }
    return title;
  }

  /**
   * Append " (All)" to OGC Services title if all have been selected.
   *
   * @returns a string for the OGC Services title
   */
  public getServicesTitle(): string {
    let title = 'OGC Services';
    if (this.allOGCServices.checked) {
      title += ' (All)';
    }
    return title;
  }

  /**
   * Append " (Restricted)" or " (Unrestricted)" to Spatial Bounds title
   * depending on if bounds are being used.
   *
   * @returns a string for the Search Fields title
   */
  public getSpatialBoundsTitle(): string {
    let title = 'Spatial Bounds';
    if (this.restrictBounds) {
      title += ' (Restricted)';
    } else {
      title += ' (None)';
    }
    return title;
  }

  /**
   * Clear the bounding box
   */
  public clearBounds(): void {
    this.bbox = null;
    // clear rectangle on the map
    if (this.boundsRectangleObservable) {
      this.boundsRectangleObservable.dispose();
      this.boundsRectangleObservable = null;
    }
  }

  /**
   * Draw bounds to get the bbox for spatial bounds searching.
   *
   * TODO: This is a different operation to the one in download, that may get confusing. If made common,
   * there's some WCS covergae stuff that has been trimmed from this version (also clearBounds()).
   */
  public drawBounds(): void {
      this.clearBounds();

      this.searchMessage = 'Click to start drawing bounds';
      this.restrictBounds = true;
      this.showingSearchPanel = false;

      setTimeout(() => this.drawBoundsStarted = true, 0);
      this.boundsRectangleObservable = this.csMapService.drawBound();
      this.boundsRectangleObservable.subscribe((vector) => {
        this.drawBoundsStarted = false;
        if (!vector.points) {
          // drawing hasn't started
          return;
        }
        if (vector.points.length < 2
          || vector.points[0].getPosition().x === vector.points[1].getPosition().x
          || vector.points[0].getPosition().y === vector.points[1].getPosition().y) {
          // drawing hasn't finished

          this.searchMessage = 'Click again to finish drawing bounds';

          return;
        }
        const points = vector.points;

        // Reproject to EPSG:4326
        this.bbox = UtilitiesService.reprojectToWGS84(points);

        this.searchMessage = '';
        this.showingSearchPanel = true;
        this.restrictBounds = true;

        setTimeout(() => {
          this.spatialOptionsDropdown.open();
        });
      });
  }

  /**
   * Reset all advanced search options to default
   */
  public resetAdvancedSearch() {
    for (const field of this.ogcServices) {
      field.checked = true;
    }
    this.allOGCServices.checked = true;
    for (const field of this.searchFields) {
      field.checked = true;
    }
    this.allSearchField.checked = true;
    this.restrictBounds = false;
    this.boundsRelationship = 'Intersects';
    this.clearBounds();
  }

  /**
   * Check specific search conditions, such as only allowing no query text if a spatial search has been selected.
   * (Note we could make this a form and use validation to highlight areas that are invalid before submission)
   */
  private validateSearchInputs(): boolean {
    if (this.queryText === '' && (!this.restrictBounds || !this.bbox)) {
      this.alertMessage = 'Please enter a search query, or to search by bounds ensure that Spatial Bounds is set in Advanced Options';
      return false;
    }
    return true;
  }

  /**
   * Keep track of open/closed search result panels in accordion.
   *
   * @param event the NgbPanelChangeEvent
   */
  public toggleSearchResultExpanded(event: any) {
    const searchResult: SearchResult = this.searchResults.find(r => r.layer.id === event.panelId);
    if (searchResult) {
      searchResult.expanded = event.nextState;
    }
  }

  /**
   * Search index using specified fields and search query
   */
   public search() {
    // Validate parameters before continuing
    if (!this.validateSearchInputs()) {
      return;
    }

    this.searching = true;
    this.searchResults = null;
    this.pageList = [];   // List of page numbers for pagination
    this.currentPage = 1;
    this.alertMessage = '';
    this.searchMessage = '';

    const selectedSearchFields: string[] = [];
    for (const sField of this.searchFields.filter(f => f.checked === true)) {
      selectedSearchFields.push(sField.field);
    }

    let textToQuery = this.queryText;

    // Append service info to query if specific services have been selected
    const checkedServices = this.ogcServices.filter(s => s.checked === true);
    if (checkedServices.length < OGC_SERVICES.length) {
      let appendQueryText = ' AND service:(';
      for (let i = 0; i < checkedServices.length; i++) {
        appendQueryText += checkedServices[i].field;
        if (i !== checkedServices.length - 1) {
          appendQueryText += ' OR ';
        }
      }
      appendQueryText += ')';
      textToQuery += appendQueryText;
    }

    // Create a call to the search api based on whether spatial bounds are required or not
    let searchObservable: Observable<[]>;
    if (this.restrictBounds && this.bbox) {
      searchObservable = this.searchService.searchBounds(selectedSearchFields, textToQuery,
        this.boundsRelationship, this.bbox.westBoundLongitude, this.bbox.southBoundLatitude, this.bbox.eastBoundLongitude, this.bbox.northBoundLatitude);
    } else {
      searchObservable = this.searchService.search(selectedSearchFields, textToQuery);
    }

    searchObservable.subscribe(searchResponse => {
      this.layerHandlerService.getLayerModelsForIds(searchResponse).subscribe(layers => {
        this.searchResults = [];
        for (const l of layers) {
          this.searchResults.push(new SearchResult(l));
        }
        // Create page list
        for (let i = 1; i <= Math.ceil(this.searchResults.length / this.resultsPerPage); i++) {
          this.pageList.push(i);
        }
        this.searching = false;
      });
    }, error => {
      this.alertMessage = error;
      this.searching = false;
    });
  }

}

/**
 * Class for advanced search option checkbox names/fields/checked status
 */
export class SearchField {
  name: string;     // Name of field for display
  field: string;    // Field name in search index
  checked: boolean; // Is field checked in UI?

  constructor(name: string, field: string, checked: boolean) {
    this.name = name;
    this.field = field;
    this.checked = checked;
  }

}

/**
 * Class for search results, including layer and some UI states
 */
export class SearchResult {
  layer: LayerModel;
  expanded: boolean;
  openTab: string;

  constructor(layer: LayerModel) {
    this.layer = layer;
    this.expanded = false;
    this.openTab = 'filter';
  }

}
