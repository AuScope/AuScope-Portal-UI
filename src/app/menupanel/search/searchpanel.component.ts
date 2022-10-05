import { Component, OnInit } from '@angular/core';
import { CsMapService, LayerHandlerService, LayerModel, ManageStateService } from '@auscope/portal-core-ui';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
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
  }, {
    name: 'ID',
    field: 'id',
    checked: true
  }];
const OGC_SERVICES = ['WMS', 'IRIS', 'WFS', 'WCS', 'WWW'];

@Component({
    selector: 'app-search-panel',
    templateUrl: './searchpanel.component.html',
    styleUrls: ['./searchpanel.component.scss']
})
export class SearchPanelComponent implements OnInit {
  showingSearchPanel = true;
  showingAdvancedOptions = false;
  queryText = '';
  searching = false;
  searchResults: LayerModel[] = null;
  // Options
  //exactMatch = false;
  allSearchField: SearchField = new SearchField('All', '', true);
  searchFields: SearchField[] = SEARCH_FIELDS;
  allOGCServices: SearchField = new SearchField('All', '', true);
  ogcServices: SearchField[] = [];
  // Pagination
  resultsPerPage: number = DEFAULT_RESULTS_PER_PAGE;
  pageList: number[] = [1];
  currentPage = 1;

  constructor(private searchService: SearchService, private advancedComponentService: AdvancedComponentService,
              private csMapService: CsMapService, private layerHandlerService: LayerHandlerService,
              private uiLayerModelService: UILayerModelService, private manageStateService: ManageStateService, private modalService: NgbModal) { }

  ngOnInit() {
    for (const service of OGC_SERVICES) {
      const field: SearchField = new SearchField(service, service, true);
      this.ogcServices.push(field);
    }
  }

  /*
  public wordMatchChange(event: any) {
    this.exactMatch = event.target.value;
  }
  */

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
   * Slice search results to match current pagination values
   * @returns sliced array of results adhering to current pagaination
   */
  public paginatedSearchResults(): any[] {
    const startPos = (this.currentPage - 1) * this.resultsPerPage;
    const endPos = startPos + this.resultsPerPage;
    return this.searchResults.slice(startPos, endPos);
  }

  /**
   * Advance results one page
   */
  public previousPage() {
    this.currentPage--;
  }

  /**
   * Go back one page in results
   */
  public nextPage() {
    this.currentPage++;
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
   * Search index using specified fields and search query
   */
   public search() {
    this.searching = true;
    this.searchResults = null;
    this.pageList = [];   // List of page numbers for pagination
    this.currentPage = 1;

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

    this.searchService.search(selectedSearchFields, textToQuery).subscribe(searchResponse => {
      this.layerHandlerService.getLayerModelsForIds(searchResponse).subscribe(layers => {
        this.searchResults = layers;
        for (let i = 1; i <= Math.ceil(this.searchResults.length / this.resultsPerPage); i++) {
          this.pageList.push(i);
        }
        this.searching = false;
      });
    }, error => {
      console.log(error);
      this.searching = false;
    });
  }

}

/**
 * Class to hold search option checkbox names/fields/checked status
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
