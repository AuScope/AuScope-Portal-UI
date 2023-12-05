import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { RectangleEditorObservable } from '@auscope/angular-cesium';

/*
import { Bbox, CsMapService, LayerHandlerService, LayerModel, 
         ManageStateService, UtilitiesService, Constants } from '@auscope/portal-core-ui';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { Observable, Subject, Subscription } from 'rxjs';
*/

import { Bbox, CSWRecordModel, CsMapService, LayerHandlerService, LayerModel, ManageStateService, RenderStatusService, UtilitiesService, Constants } from '@auscope/portal-core-ui';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { Observable, Subject, Subscription } from 'rxjs';

import { InfoPanelComponent } from '../common/infopanel/infopanel.component';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';
import { UILayerModel } from '../common/model/ui/uilayer.model';

import { HttpClient, HttpHeaders, HttpParams, HttpUrlEncodingCodec } from '@angular/common/http';
import { Download } from 'app/modalwindow/layeranalytic/nvcl/tsgdownload';
import * as saveAs from 'file-saver';
import { take } from 'rxjs/operators';

const DEFAULT_RESULTS_PER_PAGE = 10;

/*
>>>>>>> 59bf604 (Moving search to Elasticsearch)
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
*/
/*
public static final List<String> KNOWNLAYERANDRECORDS_QUERY_FIELDS = Arrays.asList(new String[]{
  "knownLayer.name", "knownLayer.description",
  // belongingRecords fields (CSWRecords)
  "belongingRecords.serviceName", "belongingRecords.descriptiveKeywords",
  "belongingRecords.dataIdentificationAbstract", "belongingRecords.layerName",
  // belongingRecords.onlineResources fields (OnlineResources)
  "belongingRecords.onlineResources.name", "belongingRecords.onlineResources.description",
  "belongingRecords.onlineResources.protocol", "belongingRecords.funder.organisationName"
});

// CSWRecord search fields
public static final List<String> CSWRECORD_QUERY_FIELDS = Arrays.asList(new String[]{
  "serviceName", "descriptiveKeywords", "dataIdentificationAbstract", "layerName",
  // onlineResources fields (OnlineResource)
  "onlineResources.name", "onlineResources.description", "onlineResources.protocol", "funder.organisationName"
});
*/

// XXX Going to have make field an array ('fields') fo rhwn searching KnownLayerAndRecords AND CSWRecords
const SEARCH_FIELDS = [{
  name: 'Name',
  fields: ['knownLayer.name'],
  checked: true
}, {
  name: 'Description',
  fields: ['knownLayer.description'],
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

//const OGC_SERVICES = ['WMS', 'IRIS', 'WFS', 'WCS', 'WWW', 'KML'];
// XXX Check IRIS etc when matching KnownLayers (maybe others as well)
const OGC_SERVICES = [
  {
    name: 'WMS',
    fields: ['OGC:WMS'],
    checked: true
  }, {
    name: 'IRIS',
    fields: ['OGC:IRIS'],
    checked: true
  }, {
    name: "KML",
    fields: ['OGC:KML'],
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
    fields: ['OGC:WWW'],
    checked: true
  }]

//const NUMBER_OF_SUGGESTIONS = 5;

@Component({
    selector: 'app-search-panel',
    templateUrl: './searchpanel.component.html',
    styleUrls: ['./searchpanel.component.scss']
})
export class SearchPanelComponent implements OnInit {

  RESULTS_PER_PAGE = 10;

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
  private mapDownloadLayers = new Map<string, any>();
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

  /*
<<<<<<< HEAD
  constructor(private searchService: SearchService,
              private csMapService: CsMapService,
              private layerHandlerService: LayerHandlerService,
              private layerManagerService: LayerManagerService,
              private uiLayerModelService: UILayerModelService,
              private manageStateService: ManageStateService,
              private modalService: NgbModal,
              private http: HttpClient,
              @Inject('env') private env
    ) { }
=======
*/
  constructor(private searchService: SearchService, private csMapService: CsMapService,
              private layerHandlerService: LayerHandlerService, private layerManagerService: LayerManagerService,
              private uiLayerModelService: UILayerModelService, private renderStatusService: RenderStatusService,
              private manageStateService: ManageStateService, private modalService: NgbModal,
              private http: HttpClient, @Inject('env') private env) { }
//>>>>>>> 59bf604 (Moving search to Elasticsearch)

  ngOnInit() {
    // Populate search results with all layers by default
    this.showFeaturedLayers();
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
   * Display featured layers in search results
   */
  private showFeaturedLayers() {
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
      this.showingAllLayers = true;
      // Splice results to current page
      //const indexForPage = (this.currentPage - 1) * this.RESULTS_PER_PAGE;
      //this.searchResults = layers.splice(indexForPage, this.RESULTS_PER_PAGE);
      this.searchResults = layers;
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
    const startPos = (this.currentPage - 1) * this.RESULTS_PER_PAGE;
    const endPos = startPos + this.RESULTS_PER_PAGE;
    return this.searchResults.slice(startPos, endPos);
  }

  /**
   * remove one Layer from  MapDownloadLayers
   *
   */
  public removeDownloadLayer(layer: LayerModel){
    console.log('removeDownloadLayer');
    this.mapDownloadLayers.delete(layer.id);
    return;
  }
  /**
   * clearDownloadLayers
   *
   */
  public clearDownloadLayers(){
    console.log('clearDownloadLayers');
    this.mapDownloadLayers.clear();
    return;
  }
  /**
   * OnChange for MapDownloadLayers
   *
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
        let downloadOb = new Observable<Download>();
        this.mapDownloadLayers.set(layer.id, {Layer:layer, Ob:null});
      }
    }
  }
  /**
   * downloadAll event
   *
   */
  public async downloadAll(){
    console.log('downloadAll');
    this.completed0 = 0;
    this.total0 = this.mapDownloadLayers.size;
    for(let key of this.mapDownloadLayers.keys()) {
      await this.downloadAsCSV(this.mapDownloadLayers.get(key).Layer);
      this.completed0++;
    }
    return;
  }
  /**
   * isCsvDownloadable
   *
   */
  public isCsvDownloadable(layer:LayerModel):boolean {
    for (let i = 0; i < layer.cswRecords.length; i++) {
      let cswRecord = layer.cswRecords[i];
      let onlineResourcesWFS = cswRecord.onlineResources.find((item)=>item.type.toLowerCase().indexOf('wfs')>=0);
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
    //console.log("downloadAsCSV");
    let me = this;
    me.total = layer.cswRecords.length;
    me.completed =0;
    me.mapDownloadLayers.get(layer.id).Ob = {completed:me.completed,total:me.total};
    for (let i = 0; i < layer.cswRecords.length; i++) {
      let cswRecord = layer.cswRecords[i];
      let onlineResourcesWFS = cswRecord.onlineResources.find((item)=>item.type.toLowerCase().indexOf('wfs')>=0);
      if (!onlineResourcesWFS) {
        continue;
      }
      let typename = onlineResourcesWFS.name;
      let type = onlineResourcesWFS.type;
      if (!type || type.toLowerCase().indexOf('wfs')<0 ) {
        console.log('No WFS finded for');
      }

      let httpParams = new HttpParams({
        encoder: new HttpUrlEncodingCodec(),
      });

      let url0 = onlineResourcesWFS.url;
      let url1 = url0 + '?service=WFS&request=GetFeature&version=1.0.0&outputFormat=csv&maxFeatures=1000000&typeName=' + typename;
      let url = me.env.portalBaseUrl + Constants.PROXY_API + '?usewhitelist=false&' + httpParams.append('url',url1 ).toString();
      let filename = typename + '.' + url0 + '.csv';
      filename = filename.replace(/:|\/|\\/g,'-');
      let ob = await this.http.get(url, { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'), responseType: 'text'}).toPromise();
      const blob = new Blob([ob], { type: 'application/csv' });
      saveAs(blob, filename);
      me.completed++;
      me.mapDownloadLayers.get(layer.id).Ob.progress = Math.round(me.completed/me.total*100);
      //console.log('downloaded:' + url);
    }
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
    console.log("[searchpanel.component.ts]layerWarningMessage()");
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
    if (!this.uiLayerModelService.getUILayerModel(layer.id)) {
      console.log('Adding UI Layer Model: XXX ALSO DATA SEARCH PANEL< FILTER PANEL ETC (and probably state load)');
      const uiLayerModel = new UILayerModel(layer.id, this.renderStatusService.getStatusBSubject(layer));
      this.uiLayerModelService.setUILayerModel(layer.id, uiLayerModel);
    }
    this.layerManagerService.addLayer(layer, [], layer.filterCollection, undefined);
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
    this.layerManagerService.removeLayer(layer);
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
  /*
  private escapeQueryText(queryText: string): string {
    //return queryText.replace(/[-\/\\^+&!~\:()|[\]{}]/g, '\\$&');
    let textToQuery = queryText;
    if (!textToQuery.startsWith('"')) {
      textToQuery = '\"' + textToQuery;
    }
    if (!textToQuery.endsWith('"')) {
      textToQuery = textToQuery + '\"';
    }
    return textToQuery;
  }
  */

  /**
   * 
   * @param cswRecord 
   * @returns 
   */
  /*
  private createLayerModelForCSWRecord(cswRecord: CSWRecordModel): LayerModel {
    const layerModel: LayerModel = {
      cswRecords: [cswRecord],
      capabilityRecords: undefined,
      description: cswRecord.description,
      group: 'CSW',
      id: cswRecord.id,
      name: cswRecord.name + ' (CSW)',  // XXX Until we have a better way of delinieating
      hidden: undefined,
      csLayers: [],
      layerMode: undefined,
      order: undefined,
      proxyDownloadUrl: undefined,
      proxyStyleUrl: undefined,
      proxyUrl: undefined,
      useDefaultProxy: true,    // Use the default proxy (getViaProxy.do) if true (custom layers)
      useProxyWhitelist: true,  // Use the default proxy whitelist if true (custom layers)
      relatedRecords: undefined,
      singleTile: undefined,
      iconUrl: undefined,
      filterCollection: undefined,
      stackdriverFailingHosts: [],
      ogcFilter: undefined,
      wfsUrls: [],
      sldBody: undefined,      // SLD_BODY for 1.1.1 GetMap/GetFeatureInfo requests
      clickCSWRecordsIndex: [],
      clickPixel: undefined,
      clickCoord: undefined,
      // Layer supports downloading, usually feature data in CSV form
      supportsCsvDownloads: undefined,
      kmlDoc: undefined, // Document object for custom KML layer
    };
    return layerModel;
  }
  */

  private createLayerModelForCSWRecord(record: CSWRecordModel): LayerModel {
    const layer = new LayerModel();
    // This will allow us to easily identify CSW layers
    layer.id = 'registry-csw:' + record.id;
    layer.name = record.name;
    layer.description = record.description;
    //layer.useDefaultProxy = true;

    layer.useDefaultProxy = true,    // Use the default proxy (getViaProxy.do) if true (custom layers)
    layer.useProxyWhitelist = true,  // Use the default proxy whitelist if true (custom layers)


    layer.cswRecords = [record];
    return layer;
  }

  /**
   * Search index using specified fields and text query
   */
   public search(newSearch: boolean) {

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
    //this.currentPage = 1;
    this.alertMessage = '';


    // XXX ADD A CHECKBOX FOR THIS AND RETRIEVE VALUE
    const includeCSWResults = true;


    const selectedSearchFields: string[] = [];
    for (const sField of this.searchFields.filter(f => f.checked === true)) {
      selectedSearchFields.push(sField.fields[0]);
      // If including CSW results and there's an associated CSWRecord field, add it
      if (includeCSWResults && sField.fields.length === 2) {
        selectedSearchFields.push(sField.fields[1]);
      }
    }

    //let textToQuery = this.escapeQueryText(this.queryText);

    // OGC services if selected
    const selectedServices: string[] = [];
    const checkedServices = this.ogcServices.filter(s => s.checked === true);
    if (checkedServices.length < OGC_SERVICES.length) {
      for (const service of checkedServices) {

        console.log('Adding selectedService: ' + service.fields[0]);

        selectedServices.push(service.fields[0]);
      }
    }

    /*
    const spatialRelation = undefined;
    const west: number = undefined;
    const east: number = undefined;
    const south:number = undefined;
    const north: number = undefined;
    if (this.restrictBounds && this.bbox) {
        spatialRelation = this.boundsRelationship;
        west = this.bbox.westBoundLongitude, this.bbox.southBoundLatitude, this.bbox.eastBoundLongitude, this.bbox.northBoundLatitude);
    }
    */

    //const page = this.currentPage > 1 ? this.currentPage - 1 : undefined;
    //console.log('Searching with pageNo: ' + page);
    console.log('Current page: ' + this.currentPage);

    //this.searchService.queryKnownLayersAndCSWRecords(textToQuery, selectedSearchFields, pageNo, selectedServices, spatialRelation, west, east, south, north, includeCSWResults).subscribe(searchResponse => {
    //this.searchService.queryKnownLayersAndCSWRecords(textToQuery, selectedSearchFields, pageNo, selectedServices,
    /* Paged search
    this.searchService.searchCSWRecords(this.queryText, selectedSearchFields, (this.currentPage - 1), this.RESULTS_PER_PAGE, selectedServices,
        this.boundsRelationship.toLowerCase(), this.bbox?.westBoundLongitude, this.bbox?.eastBoundLongitude, this.bbox?.southBoundLatitude,
        this.bbox?.northBoundLatitude).subscribe(searchResponse => {
    */
    this.searchService.searchCSWRecords(this.queryText, selectedSearchFields, null, null, selectedServices,
        this.boundsRelationship.toLowerCase(), this.bbox?.westBoundLongitude, this.bbox?.eastBoundLongitude,
        this.bbox?.southBoundLatitude, this.bbox?.northBoundLatitude).subscribe(searchResponse => {

      console.log('Number of records: ' + searchResponse.cswRecords.length);

      this.searchResults = [];
      this.totalSearchHits = searchResponse.totalCSWRecordHits;

      console.log('totalSearchHits (CSW): ' + this.totalSearchHits);

      // Add KnownLayers to list first
      if (searchResponse.knownLayerIds?.length > 0) {
        console.log('Number of layers : ' + searchResponse.knownLayerIds.length);

        console.log('IDs: ' + searchResponse.knownLayerIds);

        this.totalSearchHits += searchResponse.knownLayerIds.length;
      }
        console.log('totalSearchHits (CSW + KL): ' + this.totalSearchHits);
        
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
          if (!this.showingResultsPanel) {
            this.showingResultsPanel = true;
          }

        });
      //} else {
      //  // XXX
      //  console.log('No layers');
      //}

      

      console.log('search results length: ' + this.searchResults.length);
      console.log('RESULTS_PER_PAGE: ' + this.RESULTS_PER_PAGE);

      /*
      const layerIds: string[] = [];
      for (const k of searchResponse.knownLayerAndRecords) {
        layerIds.push(k.knownLayer.id);
      }

      this.layerHandlerService.getLayerModelsForIds(layerIds).subscribe(layers => {
        this.searchResults = [];

        // Add KnownLayers
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
        if (!this.showingResultsPanel) {
          this.showingResultsPanel = true;
        }
      });
      */
    }, error => {
      this.alertMessage = error;
      this.searching = false;
    });

    /*
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

    // XXX Other fields, Include CSW checkbox
    this.searchService.queryKnownLayersAndCSWRecords(selectedSearchFields, textToQuery, true).subscribe(searchResponse => {
      console.log('Number of records: ' + searchResponse.cswRecords.length);
      console.log('Number of layers : ' + searchResponse.knownLayerAndRecords.length);

      const layerIds: string[] = [];
      for (const k of searchResponse.knownLayerAndRecords) {
        layerIds.push(k.knownLayer.id);
      }

      this.layerHandlerService.getLayerModelsForIds(layerIds).subscribe(layers => {
        this.searchResults = [];

        // Add KnownLayers
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
        if (!this.showingResultsPanel) {
          this.showingResultsPanel = true;
        }
      });
    }, error => {
      this.alertMessage = error;
      this.searching = false;
    });
    */

    /*
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
    */

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
  public suggestedTermSelected(term: string) {
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
   * 
   * @param pageChangeEvent 
   */
  public pageChange(newPageNo) {
    this.currentPage = newPageNo;

    console.log('new page: ' + this.currentPage);

    if (this.showingAllLayers) {
      this.showFeaturedLayers();
    } else {
      this.search(false);
    }
  }

}

/**
 * Class for advanced search option checkbox names/fields/checked status
 */
export class SearchField {
  name: string;     // Name of field for display
  fields: string[];    // Field name in search index
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
