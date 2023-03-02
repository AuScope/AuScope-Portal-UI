import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { RectangleEditorObservable } from '@auscope/angular-cesium';
import { Bbox, CsMapService, LayerHandlerService, LayerModel, ManageStateService, UtilitiesService } from '@auscope/portal-core-ui';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { Observable, Subscription } from 'rxjs';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { take } from 'rxjs/operators';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { LegendUiService } from 'app/services/legend/legend-ui.service';

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
  }];
const OGC_SERVICES = ['WMS', 'IRIS', 'WFS', 'WCS', 'WWW', 'KML'];
const NUMBER_OF_SUGGESTIONS = 5;

@Component({
    selector: 'app-search-panel',
    templateUrl: './searchpanel.component.html',
    styleUrls: ['./searchpanel.component.scss']
})
export class SearchPanelComponent implements OnInit {

  @ViewChild('queryinput') textQueryInput: ElementRef;
  @ViewChild('spatialOptionsDropdown') spatialOptionsDropdown: NgbDropdown;

  alertMessage = '';                  // Alert messages
  showingResultsPanel = false;        // True when results panel is being shown
  showingAdvancedOptions = false;     // True when advanced options are being displayed
  queryText = '';                     // User entered query text
  searching = false;                  // True if search in progress
  searchResults: SearchResult[] = []; // Search results
  showingAllLayers = false;           // True if all layers being shown (no search)

  // Options
  allSearchField: SearchField = new SearchField('All', '', true);
  searchFields: SearchField[] = SEARCH_FIELDS;
  allOGCServices: SearchField = new SearchField('All', '', true);
  ogcServices: SearchField[] = [];
  restrictBounds = false; // Could probably just use bbox if set
  bbox: Bbox;
  boundsRelationship = 'Intersects';

  // Pagination
  resultsPerPage: number = DEFAULT_RESULTS_PER_PAGE;
  currentPage = 1;

  // Need to keep track of internal clicks and close search results on external if info dialog not open
  searchClick = false;
  infoDialogOpen = false;

  // Limit bounds
  private boundsRectangleObservable: RectangleEditorObservable;
  private drawBoundsStarted = false;

  // Term suggestions
  @ViewChild('suggesterDropdown') suggesterDropdown: NgbDropdown;
  suggesterSubscription: Subscription;
  suggestedTerms: string[] = [];
  highlightedSuggestionIndex = -1;

  constructor(private searchService: SearchService, private advancedComponentService: AdvancedComponentService,
              private csMapService: CsMapService, private layerHandlerService: LayerHandlerService,
              private uiLayerModelService: UILayerModelService, private manageStateService: ManageStateService,
              private legendUiService: LegendUiService, private modalService: NgbModal) { }

  ngOnInit() {
    for (const service of OGC_SERVICES) {
      const field: SearchField = new SearchField(service, service, true);
      this.ogcServices.push(field);
    }
    // Populate search results with all layers by default
    this.showAllLayers();
  }

  /**
   * Detect internal clicks so we can differntiate from external
   */
  @HostListener('click')
  internalClick() {
    this.searchClick = true;
  }

  /**
   * Detect external component clicks so we can close components that need to be when this happens
   */
  @HostListener('document:click')
  externalClick() {
    if (!this.searchClick && this.showingResultsPanel && !this.infoDialogOpen) {
      this.showingResultsPanel = false;
    }
    this.searchClick = false;
  }

  /**
   * Clear query text input field
   */
  public clearQueryText() {
    this.queryText = '';
    this.textQueryInput.nativeElement.focus();
  }

  /**
   * Show all layers in search results
   */
  private showAllLayers() {
    this.queryText = '';
    this.searchResults = [];
    const layers = [];
    this.layerHandlerService.getLayerRecord().pipe(take(1)).subscribe(records => {
      for (const layerGroup in records) {
        if (layerGroup) {
          for (const layer of records[layerGroup]) {
            layers.push(new SearchResult(layer));
          }
        }
      }
      // Sort alphabetically
      layers.sort((a, b) => a.layer.name.localeCompare(b.layer.name));
      this.searchResults = layers;
      this.showingAllLayers = true;
    });
  }

  /**
   * Toggle the results panel
   */
   public toggleResultsPanel() {
    this.showingResultsPanel = !this.showingResultsPanel;
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
   * Subset of search results for current page
   *
   * @returns sliced array of results corresponding to current page
   */
  public paginatedSearchResults(): SearchResult[] {
    const startPos = (this.currentPage - 1) * this.resultsPerPage;
    const endPos = startPos + this.resultsPerPage;
    return this.searchResults.slice(startPos, endPos);
  }

  /**
   * Display layer information dialog
   *
   * @param event the click event
   * @param layer LayerModel for layer
   */
  public showLayerInformation(event: any, layer: LayerModel) {
    event.stopPropagation();
    if (layer) {
      const modalRef = this.modalService.open(InfoPanelComponent, {
        size: 'lg',
        backdrop: false
      });
      modalRef.componentInstance.cswRecords = layer.cswRecords;
      modalRef.componentInstance.layer = layer;
      this.infoDialogOpen = true;
      modalRef.result.then(() => {
        // Delay setting infoDialogOpen to false so external click handler has time to see it open
        setTimeout(() => {
          this.infoDialogOpen = false;
        });
      }, () => {
        this.infoDialogOpen = false;
      });
    }
  }

  /**
   * Layer warning content
   *
   * @param layer LayerModel of layer
   */
  public layerWarningMessage(layer: LayerModel): string {
    return 'This layer cannot be displayed. For Featured Layers, please wait for the layer cache to rebuild itself. ' +
      'For Custom Layers please note that only the following online resource types can be added to the map: ' +
      this.csMapService.getSupportedOnlineResourceTypes();
  }

  /**
   * Add layer to map
   *
   * @param layer LayerModel
   */
  public addLayer(layer: LayerModel) {
    const param = {
      optionalFilters: []
    };

    // Add a new layer in the layer state service, no filters
    this.manageStateService.addLayer(
      layer.id,
      null,
      layer.filterCollection,
      [],
      []
    );

    // Remove any existing legends in case map re-added with new style
    this.legendUiService.removeLegend(layer.id);

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
   * Scroll to the specified layer in sidebar (Featured Layers)
   *
   * @param layer the layer
   */
  public scrollToLayer(layer: LayerModel) {
    this.manageStateService.setLayerToExpand(layer.id);
  }

  /**
   * Check whether layer has been added to the map
   *
   * @param layerId ID of the layer
   * @returns true if layer has been added to the map, false otherwise
   */
  isLayerAdded(layerId: string) {
    return this.uiLayerModelService.getUILayerModel(layerId) && this.uiLayerModelService.getUILayerModel(layerId).statusMap.getRenderStarted();
  }

  /**
   * Remove a layer from the map
   *
   * @param event the click event
   * @param layer the LayerModel for the layer
   */
  public removeLayer(event: any, layer: LayerModel) {
    event.stopPropagation();
    this.uiLayerModelService.getUILayerModel(layer.id).opacity = 100;
    this.csMapService.removeLayer(layer);
    // Remove any layer specific map components
    this.advancedComponentService.removeAdvancedMapComponents(layer.id);
    this.legendUiService.removeLegend(layer.id);
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
      this.alertMessage = 'Click to start drawing bounds';
      this.restrictBounds = true;
      this.showingResultsPanel = false;
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
          this.alertMessage = 'Click again to finish drawing bounds';
          return;
        }
        const points = vector.points;

        // Reproject to EPSG:4326
        this.bbox = UtilitiesService.reprojectToWGS84(points);

        this.alertMessage = '';
        this.showingResultsPanel = true;
        this.restrictBounds = true;

        // Re-open bounds dropdown
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
   * Search results title will either be "All Layers" or "Search Results (<number>)"
   *
   * @returns the search results title
   */
  public getSearchResultsTitle(): string {
    let title = '';
    if (this.showingAllLayers) {
      title = 'All Layers ';
    } else {
      title = 'Results ';
    }
    title += '(' + this.searchResults.length + ')';
    return title;
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
   * Reset suggested terms/indices, close dropdown if open
   */
  private resetSuggestedTerms() {
    this.suggestedTerms = [];
    this.highlightedSuggestionIndex = -1;
    if (this.suggesterDropdown.isOpen()) {
      this.suggesterDropdown.close();
    }
  }

  /**
   * Escape query text
   *
   * @param queryText the query text
   * @returns an escaped query text string
   */
  private escapeQueryText(queryText: string): string {
    return queryText.replace(/[-\/\\^+&!~\:()|[\]{}]/g, '\\$&');
  }

  /**
   * Search index using specified fields and text query
   */
   public search() {
    // Validate parameters before continuing
    if (!this.validateSearchInputs()) {
      return;
    }
    this.resetSuggestedTerms();
    this.searching = true;
    this.searchResults = null;
    this.currentPage = 1;
    this.alertMessage = '';

    const selectedSearchFields: string[] = [];
    for (const sField of this.searchFields.filter(f => f.checked === true)) {
      selectedSearchFields.push(sField.field);
    }
    let textToQuery = this.escapeQueryText(this.queryText);

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
        this.searching = false;
        this.showingAllLayers = false;
        if (!this.showingResultsPanel) {
          this.showingResultsPanel = true;
        }
      });
    }, error => {
      this.alertMessage = error;
      this.searching = false;
    });

  }

  /**
   * Disable Escape key as it was throwing an error in the console when the suggester dropdown menu was open
   *
   * @param event the keydown event
   */
  public onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
    }
  }

  /**
   * Call the suggester when a key has been pressed, or deal with suggestion navigation
   *
   * @param event the keyup event
   */
  public onKeyUp(event: KeyboardEvent) {
    // Arrow keys scroll down/down through suggestions if they're open and Enter will select
    if (this.suggesterDropdown.isOpen() && this.suggestedTerms.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          if (this.highlightedSuggestionIndex === -1) {
            this.highlightedSuggestionIndex = 0;
          } else if (this.highlightedSuggestionIndex !== this.suggestedTerms.length - 1) {
            this.highlightedSuggestionIndex += 1;
          }
          return;
        case 'ArrowUp':
          if (this.highlightedSuggestionIndex === -1) {
            this.highlightedSuggestionIndex = 0;
          } else if (this.highlightedSuggestionIndex !== 0) {
            this.highlightedSuggestionIndex -= 1;
          }
          return;
        case 'Enter':
          if (this.highlightedSuggestionIndex !== -1) {
            this.queryText = this.suggestedTerms[this.highlightedSuggestionIndex];
            this.suggesterDropdown.close();
            this.highlightedSuggestionIndex = -1;
          }
          break;
      }
    }

    // Search if user has pressed Enter without a selected suggestion
    if (event.key === 'Enter') {
      this.search();
      return;
    }

    // Populate suggester with query text
    if (this.suggesterSubscription && !this.suggesterSubscription.closed) {
      this.suggesterSubscription.unsubscribe();
    }
    this.suggesterSubscription = this.searchService.suggestTerm(this.queryText, NUMBER_OF_SUGGESTIONS).subscribe(terms => {
      this.suggestedTerms = terms;
      if (this.suggestedTerms.length > 0 && !this.suggesterDropdown.isOpen()) {
        this.suggesterDropdown.open();
      } else if (this.suggestedTerms.length === 0 && this.suggesterDropdown.isOpen()) {
        this.suggesterDropdown.close();
      }
    });
  }

  /**
   * A suggested term has been selected
   *
   * @param term the selected term
   */
  public suggestedTermSelected(term: string) {
    this.suggesterDropdown.close();
    this.resetSuggestedTerms();
    this.queryText = term;
    this.search();
  }

  /**
   * Get layers that have been added to map
   *
   * @returns a list of LayerModels representing layers that have been added to the map
   */
  public getActiveLayers(): LayerModel[] {
    const activeLayers: LayerModel[] = [];
    const activeLayerKeys: string[] = Object.keys(this.csMapService.getLayerModelList());
    for (const layer of activeLayerKeys) {
      const currentLayer = this.csMapService.getLayerModelList()[layer];
      activeLayers.push(currentLayer);
    }
    return activeLayers;
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
