import { Component, ElementRef, HostListener, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { RectangleEditorObservable } from '@auscope/angular-cesium';

import { CSWRecordModel } from '../../lib/portal-core-ui/model/data/cswrecord.model';
import { Bbox } from '../../lib/portal-core-ui/model/data/bbox.model';
import { CsMapService } from '../../lib/portal-core-ui/service/cesium-map/cs-map.service';
import { LayerHandlerService } from '../../lib/portal-core-ui/service/cswrecords/layer-handler.service';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { RenderStatusService } from '../../lib/portal-core-ui/service/cesium-map/renderstatus/render-status.service';
import { UtilitiesService } from '../../lib/portal-core-ui/utility/utilities.service';
import { Constants } from '../../lib/portal-core-ui/utility/constants.service';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { Observable, Subject, Subscription } from 'rxjs';

import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';

import { HttpClient, HttpHeaders, HttpParams, HttpUrlEncodingCodec } from '@angular/common/http';
import { Download } from 'app/modalwindow/layeranalytic/nvcl/tsgdownload';
import * as saveAs from 'file-saver';
import { take } from 'rxjs/operators';

import { SidebarService } from 'app/portal/sidebar.service';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { DownloadAuScopeCatModalComponent } from 'app/modalwindow/download-auscopecat/download-auscopecat.modal.component';

// Search fields
const SEARCH_FIELDS = [{
  name: 'Name',
  fields: ['knownLayerNames'],
  checked: true
}, {
  name: 'Description',
  fields: ['knownLayerDescriptions'],
  checked: true
}, {
  name: 'CSW Keywords',
  fields: ['belongingRecords.descriptiveKeywords', 'descriptiveKeywords'],
  checked: true
}, {
  name: 'CSW Name',
  fields: ['belongingRecords.serviceName', 'serviceName'],
  checked: true
}, {
  name: 'CSW Abstract',
  fields: ['dataIdentificationAbstract'],
  checked: true
}, {
  name: 'Layer Name',
  fields: ['belongingRecords.layerName', 'layerName'],
  checked: true
}, {
  name: 'Online Resource Name',
  fields: ['belongingRecords.onlineResources.name', 'onlineResources.name'],
  checked: true
}, {
  name: 'Online Resource description',
  fields: ['belongingRecords.onlineResources.description', 'onlineResources.description'],
  checked: true
}];

// OGC Services
const OGC_SERVICES = [
  {
    name: 'WMS',
    fields: ['OGC:WMS'],
    checked: true
  }, {
    name: 'IRIS',
    fields: ['iris'],
    checked: true
  }, {
    name: "KML",
    fields: ['kml'],
    checked: true
  }, {
    name: 'WFS',
    fields: ['OGC:WFS'],
    checked: true
  }, {
    name: 'WCS',
    fields: ['OGC:WCS'],
    checked: true
  }, {
    name: 'WWW',
    fields: ['OGC:WWW', 'WWW:LINK-1.0-http--link'],
    checked: true
  }]

@Component({
    selector: 'app-search-panel',
    templateUrl: './searchpanel.component.html',
    styleUrls: ['./searchpanel.component.scss'],
    standalone: false
})
export class SearchPanelComponent implements OnInit {

  RESULTS_PER_PAGE = 10;

  @ViewChild('queryinput') textQueryInput: ElementRef;
  @ViewChild('spatialOptionsDropdown') spatialOptionsDropdown: NgbDropdown;

  alertMessage = ''; // Alert messages
  showingResultsPanel = false; // True when results panel is being shown
  showingAdvancedOptions = false; // True when advanced options are being displayed
  showingKmlOgcOptions = false; // True when KML/OGC panel is displayed
  showingInfoPanel = false;
  queryText = ''; // User entered query text
  searching = false; // True if search in progress
  searchResults: SearchResult[] = []; // Search results
  showingAllLayers = false; // True if all layers being shown (no search)
  selectedSearchResult; // Currently selected search result

  // Options
  allSearchField: SearchField = new SearchField('All', [], true);
  searchFields: SearchField[] = SEARCH_FIELDS;
  allOGCServices: SearchField = new SearchField('All', [], true);
  ogcServices: SearchField[] = OGC_SERVICES;
  restrictBounds = false; // Could probably just use bbox if set
  bbox: Bbox;
  boundsRelationship = 'Intersects';

  // Pagination
  currentPage = 1;
  totalSearchHits = 0;

  // Need to keep track of internal clicks and close search results on external if info dialog not open
  searchClick = false;
  infoDialogOpen = false;

  // Limit bounds
  private boundsRectangleObservable: RectangleEditorObservable;
  private drawBoundsStarted = false;

  // DownloadLayers to CSV files.
  public mapDownloadLayers = new Map<string, any>();
  public total0: number=0;
  public completed0:number=0;
  public total:number=0;
  public completed:number=0;
  public isDownloading = false;
  public downloadOneCompletS:Subject<string> = null;
  public download1$: Observable<Download>;

  // Term suggestions
  @ViewChild('suggesterDropdown') suggesterDropdown: NgbDropdown;
  suggesterSubscription: Subscription;
  suggestedTerms: string[] = [];
  highlightedSuggestionIndex = -1;

  constructor(private searchService: SearchService, private csMapService: CsMapService,
              private layerHandlerService: LayerHandlerService, private layerManagerService: LayerManagerService,
              private uiLayerModelService: UILayerModelService, private renderStatusService: RenderStatusService,
              private sidebarService: SidebarService, private modalService: NgbModal,
              private http: HttpClient, @Inject('env') private env,
              private ngZone: NgZone) { }

  ngOnInit() {
    // Populate search results with all layers by default
    this.showFeaturedLayers();
  }
  /**
   * Detect internal clicks so we can differntiate from external
   */
  @HostListener('click')
  internalClick(): void {
    this.searchClick = true;
  }

  /**
   * Detect external component clicks so we can close components that need to be when this happens
   */
  @HostListener('document:click')
  externalClick(): void {
    if (!this.searchClick && !this.infoDialogOpen) {
      if (this.showingResultsPanel) {
        this.setShowingResultsPanel(false);
      } else if (this.showingKmlOgcOptions) {
        this.setShowingKmlOgcOptions(false);
      }
    }
    this.searchClick = false;
  }

  /**
   * Clear query text input field
   */
  public clearQueryText(): void {
    this.queryText = '';
    this.textQueryInput.nativeElement.focus();
  }

  /**
   * Display featured layers in search results
   */
  private showFeaturedLayers(): void {
    this.queryText = '';
    this.searchResults = [];
    const layers = [];
    this.layerHandlerService.getLayerRecord().pipe(take(1)).subscribe(records => {
      let totalLayerCount = 0;
      for (const layerGroup in records) {
        if (layerGroup) {
          for (const layer of records[layerGroup]) {
            totalLayerCount += 1;
            layers.push(new SearchResult(layer));
          }
        }
      }
      this.currentPage = 1;
      this.totalSearchHits = totalLayerCount;
      // Sort alphabetically
      layers.sort((a, b) => a.layer.name.localeCompare(b.layer.name));

      this.searchResults = layers;

      // Select first result
      if (this.searchResults.length > 0) {
        this.selectSearchResult(this.searchResults[0]);
      }

      this.showingAllLayers = true;
    });
  }

  public setShowingResultsPanel(showingResults: boolean): void {
    if (showingResults && this.showingKmlOgcOptions) {
      this.showingKmlOgcOptions = false;
    }
    this.showingResultsPanel = showingResults;
    if (this.selectedSearchResult) {
      this.showingInfoPanel = showingResults;
    }
  }

  public setShowingKmlOgcOptions(showingOptions: boolean): void {
    if (showingOptions && this.showingResultsPanel) {
      this.showingResultsPanel = false;
      this.showingInfoPanel = false;
      // TODO: Kill searching if in the middle of one
      //this.searching = !this.searching
    }
    this.showingKmlOgcOptions = showingOptions;
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
    const startPos = (this.currentPage - 1) * this.RESULTS_PER_PAGE;
    const endPos = startPos + this.RESULTS_PER_PAGE;
    return this.searchResults.slice(startPos, endPos);
  }

  /**
   * Set the current search result as clicked by user in search results
   * @param searchResult the currently selected SearchResult
   */
  public selectSearchResult(searchResult: SearchResult) {
    this.selectedSearchResult = searchResult;
    if (this.showingResultsPanel) {
      this.showingInfoPanel = true;
    }
  }

  /**
   * remove one Layer from  MapDownloadLayers
   */
  public removeDownloadLayer(layer: LayerModel){
    console.log('removeDownloadLayer');
    this.mapDownloadLayers.delete(layer.id);
    return;
  }

  /**
   * clearDownloadLayers
   */
  public clearDownloadLayers() {
    console.log('clearDownloadLayers');
    this.mapDownloadLayers.clear();
    return;
  }

  /**
   * OnChange for MapDownloadLayers
   */
  public OnChangeDownloadLayers(layer: LayerModel) {
    if (!this.isCsvDownloadable(layer)) {
      return;
    }
    if (layer.id) {
      console.log(layer.name);
      if (this.mapDownloadLayers.has(layer.id)) {
        this.mapDownloadLayers.delete(layer.id);
      } else {
        this.mapDownloadLayers.set(layer.id, { Layer:layer, Ob:null });
      }
    }
  }

  /**
   * downloadAll event
   */
  public async downloadAll() {
    console.log('downloadAll');
    this.completed0 = 0;
    this.total0 = this.mapDownloadLayers.size;
    for(const key of this.mapDownloadLayers.keys()) {
      await this.downloadAsCSV(this.mapDownloadLayers.get(key).Layer);
      this.completed0++;
    }
    return;
  }

  /**
   * isCsvDownloadable
   */
  public isCsvDownloadable(layer:LayerModel):boolean {
    for (let i = 0; i < layer.cswRecords.length; i++) {
      const cswRecord = layer.cswRecords[i];
      const onlineResourcesWFS = cswRecord.onlineResources.find((item)=>item.type.toLowerCase().indexOf('wfs')>=0);
      if (onlineResourcesWFS) {
        return true;
      }
    }
    return false;
  }

  /**
   * downloadAsCSV for one layer.
   * @param layer
   */
  public async downloadAsCSV(layer:LayerModel) {
    const me = this;
    me.total = layer.cswRecords.length;
    me.completed =0;
    me.mapDownloadLayers.get(layer.id).Ob = { completed:me.completed,total:me.total };
    for (let i = 0; i < layer.cswRecords.length; i++) {
      const cswRecord = layer.cswRecords[i];
      const onlineResourcesWFS = cswRecord.onlineResources.find((item)=>item.type.toLowerCase().indexOf('wfs')>=0);
      if (!onlineResourcesWFS) {
        continue;
      }
      const typename = onlineResourcesWFS.name;
      const type = onlineResourcesWFS.type;
      if (!type || type.toLowerCase().indexOf('wfs')<0) {
        console.log('No WFS finded for');
      }

      const httpParams = new HttpParams({
        encoder: new HttpUrlEncodingCodec(),
      });

      const url0 = onlineResourcesWFS.url;
      const url1 = url0 + '?service=WFS&request=GetFeature&version=1.0.0&outputFormat=csv&maxFeatures=1000000&typeName=' + typename;
      const url = me.env.portalBaseUrl + Constants.PROXY_API + '?usewhitelist=false&' + httpParams.append('url',url1).toString();
      let filename = typename + '.' + url0 + '.csv';
      filename = filename.replace(/:|\/|\\/g,'-');
      const ob = await this.http.get(url, { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'), responseType: 'text' }).toPromise();
      const blob = new Blob([ob], { type: 'application/csv' });
      saveAs(blob, filename);
      me.completed++;
      me.mapDownloadLayers.get(layer.id).Ob.progress = Math.round(me.completed/me.total*100);
    }
  }

  /**
   * Display layer information dialog
   *
   * @param event the click event
   * @param layer LayerModel for layer
   */
  public showLayerInformation(event: any, layer: LayerModel): void {
    event.stopPropagation();
    if (layer) {
      const modalRef = this.modalService.open(InfoPanelComponent, {
        size: 'lg',
        backdrop: false,
        scrollable: true
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
      UtilitiesService.getSupportedOnlineResourceTypes();
  }

  /**
   * Check if map layer is supported and addable to map
   *
   * @param layer the LayerModel
   */
  isMapSupportedLayer(layer: LayerModel): boolean {
    return UtilitiesService.isMapSupportedLayer(layer);
  }

  /**
   * Add layer to map
   *
   * @param layer LayerModel
   */
  public addLayer(layer: LayerModel) {

    if (!this.uiLayerModelService.getUILayerModel(layer.id)) {
      const uiLayerModel = new UILayerModel(layer.id, 100, this.renderStatusService.getStatusBSubject(layer));
      this.uiLayerModelService.setUILayerModel(layer.id, uiLayerModel);
    }

    this.layerManagerService.addLayer(layer, [], layer.filterCollection, undefined);
    this.sidebarService.setOpenState(true);
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
    this.layerManagerService.removeLayer(layer);
    this.sidebarService.setOpenState(false);
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
      this.setShowingResultsPanel(false);
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
        this.restrictBounds = true;

        // Re-open bounds dropdown
        setTimeout(() => {
          this.ngZone.run(() => {
            this.spatialOptionsDropdown.open();
          });
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
      title = 'Featured Layers ';
    } else {
      title = 'Results ';
    }
    title += '(' + this.totalSearchHits + ')';
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
    if (this.suggesterSubscription && !this.suggesterSubscription.closed) {
      this.suggesterSubscription.unsubscribe();
    }
    this.highlightedSuggestionIndex = -1;
    if (this.suggesterDropdown.isOpen()) {
      this.suggesterDropdown.close();
    }
  }

  /**
   * Create a LayerModel object for the supplied CSWRecordModel
   * @param record the CSWRecordModel
   * @returns a LayerModel wrapper for the CSWRecordModel
   */
  private createLayerModelForCSWRecord(record: CSWRecordModel): LayerModel {
    const layer = new LayerModel();
    // Identify CSW layers
    layer.id = 'registry-csw:' + record.id;
    layer.group = 'registry-csw';
    layer.name = record.name;
    layer.description = record.description;
    layer.useDefaultProxy = false, // Use the default proxy (getViaProxy.do) if true (custom layers)
    layer.useProxyWhitelist = true, // Use the default proxy whitelist if true (custom layers)
    layer.cswRecords = [record];
    return layer;
  }

  /**
   * Search index using specified fields and text query
   */
  public search(newSearch: boolean) {

    this.selectedSearchResult = null;
    this.showingAllLayers = false;

    // Validate parameters before continuing
    if (!this.validateSearchInputs()) {
      return;
    }

    if (newSearch) {
      this.currentPage = 1;
      this.totalSearchHits = 0;
    }

    this.resetSuggestedTerms();
    this.searching = true;
    this.searchResults = [];
    this.alertMessage = '';

    // TODO: ADD A CHECKBOX FOR INCLUDING CSWRECORDS
    const includeCSWResults = true;

    const selectedSearchFields: string[] = [];
    for (const sField of this.searchFields.filter(f => f.checked === true)) {
      selectedSearchFields.push(sField.fields[0]);
      // If including CSW results and there's an associated CSWRecord field, add it
      if (includeCSWResults && sField.fields.length === 2) {
        selectedSearchFields.push(sField.fields[1]);
      }
    }

    // OGC services if selected
    const selectedServices: string[] = [];
    if (!this.allOGCServices.checked) {
      const checkedServices = this.ogcServices.filter(s => s.checked === true);
      for (const service of checkedServices) {
        for (const serviceField of service.fields) {
          selectedServices.push(serviceField);
        }
      }
    }

    let westBounds: number = undefined;
    let eastBounds: number = undefined;
    let northBounds: number = undefined;
    let southBounds: number = undefined;
    if (this.restrictBounds && this.bbox) {
      westBounds = this.bbox.westBoundLongitude;
      eastBounds = this.bbox.eastBoundLongitude;
      northBounds = this.bbox.northBoundLatitude;
      southBounds = this.bbox.southBoundLatitude;
    }

    // Search CSW records
    this.searchService.searchCSWRecords(this.queryText, selectedSearchFields, null, null, selectedServices,
        this.boundsRelationship.toLowerCase(), westBounds, eastBounds,
        southBounds, northBounds).subscribe(searchResponse => {

      this.searchResults = [];
      this.totalSearchHits = searchResponse.totalCSWRecordHits;

      // Add KnownLayers to list first
      if (searchResponse.knownLayerIds?.length > 0) {
        this.totalSearchHits += searchResponse.knownLayerIds.length;
      }

      this.layerHandlerService.getLayerModelsForIds(searchResponse.knownLayerIds).subscribe(layers => {
        for (const l of layers) {
          this.searchResults.push(new SearchResult(l));
        }

        // Now add CSWRecords
        for (const cswRecord of searchResponse.cswRecords) {
          const layerModel: LayerModel = this.createLayerModelForCSWRecord(cswRecord);
          this.searchResults.push(new SearchResult(layerModel));
        }
        this.searching = false;
        this.showingAllLayers = false;

        // Select first result
        if (this.searchResults.length > 0) {
          this.selectSearchResult(this.searchResults[0]);
        }

        if (!this.showingResultsPanel) {
          this.setShowingResultsPanel(true);
        }
      });
    }, error => {
      this.alertMessage = error.error;
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

    // Search if user has pressed on a suggestion
    if (event.key === 'Enter' && this.queryText !== '') {
      this.search(true);
      return;
    }

    if(this.queryText !== '') {
      // Populate suggester with query text
      if (this.suggesterSubscription && !this.suggesterSubscription.closed) {
        this.suggesterSubscription.unsubscribe();
      }
      this.suggesterSubscription = this.searchService.suggestTerm(this.queryText.toLowerCase()/*, NUMBER_OF_SUGGESTIONS*/).subscribe(terms => {
        this.suggestedTerms = terms;
        if (this.suggestedTerms.length > 0 && !this.suggesterDropdown.isOpen()) {
          this.suggesterDropdown.open();
        } else if (this.suggestedTerms.length === 0 && this.suggesterDropdown.isOpen()) {
          this.suggesterDropdown.close();
        }
      });
    }
  }

  /**
   * A suggested term has been selected
   *
   * @param term the selected term
   */
  public suggestedTermSelected(term: string): void {
    this.suggesterDropdown.close();
    this.resetSuggestedTerms();
    this.queryText = term;
    this.search(true);
  }

  /**
   * Get layers that have been added to map
   *
   * @returns a list of LayerModels representing layers that have been added to the map
   */
  public getActiveLayers(): LayerModel[] {
    return this.csMapService.getLayerModelList();
  }

  /**
   * Search page change
   * @param pageChangeEvent
   */
  public pageChange(newPageNo): void {
    this.currentPage = newPageNo;
    if (this.showingAllLayers) {
      this.showFeaturedLayers();
    } else {
      this.search(false);
    }
  }

  downloadWithAuScopeCat(layer: LayerModel): void {
    const bsModalRef = this.modalService.open(DownloadAuScopeCatModalComponent, {
      size: 'lg',
      backdrop: false
    });
    bsModalRef.componentInstance.layer = layer;
    bsModalRef.componentInstance.bbox = this.bbox;
    //bsModalRef.componentInstance.polygon = this.polygonFilter;
  }

}

/**
 * Class for advanced search option checkbox names/fields/checked status
 */
export class SearchField {
  name: string; // Name of field for display
  fields: string[]; // Field name in search index
  checked: boolean; // Is field checked in UI?

  constructor(name: string, fields: string[], checked: boolean) {
    this.name = name;
    this.fields = fields;
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
