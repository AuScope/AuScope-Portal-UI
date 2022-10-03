import { Component, OnInit } from '@angular/core';
import { CsMapService, LayerHandlerService, LayerModel, ManageStateService } from '@auscope/portal-core-ui';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SearchService } from 'app/services/search/search.service';
import { AdvancedComponentService } from 'app/services/ui/advanced-component.service';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';

const DEFAULT_RESULTS_PER_PAGE = 10;
const ALL_SEARCH_FIELDS = ['Name', 'Description', 'ID'];

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
  allSearchField: SearchField = new SearchField('All', true);
  searchFields: SearchField[] = [];
  // Pagination
  resultsPerPage: number = DEFAULT_RESULTS_PER_PAGE;
  pageList: number[] = [1];
  currentPage = 1;

  constructor(private searchService: SearchService, private advancedComponentService: AdvancedComponentService,
              private csMapService: CsMapService, private layerHandlerService: LayerHandlerService,
              private manageStateService: ManageStateService, private modalService: NgbModal) { }

  ngOnInit() {
    for (const searchField of ALL_SEARCH_FIELDS) {
      const field: SearchField = new SearchField(searchField, true);
      this.searchFields.push(field);
    }
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
    for (const field of this.searchFields.filter(f => f.checked === true)) {
      selectedSearchFields.push(field.name.toLowerCase());
    }

    this.searchService.search(selectedSearchFields, this.queryText).subscribe(searchResponse => {
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

  /**
   * Show/hide search panel
   * @param showSearch true to show search panel, false to hide
   */
  public showSearchPanel(showSearch: boolean) {
    this.showingSearchPanel = showSearch;
  }

  /**
   * Show/hide options panel
   * @param showOptions true to options panel, false to hide
   */
  public showAdvancedSearchOptions(showOptions: boolean) {
    this.showingAdvancedOptions = showOptions;
  }

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
   * Display layer warning information popup
   *
   * @param layer LayerModel of layer
   */
  public layerWarning(layer) {
  }

  /**
   * Add layer to map
   *
   * @param layer LayerModel of layer
   */
  public addLayer(layer: LayerModel) {
    // TODO: Do we need to apply clipboard like FilterPanel.addLayer(...) does?
   const param = {};

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

}

export class SearchField {
  name: string;
  checked: boolean;

  constructor(name: string, checked: boolean) {
    this.name = name;
    this.checked = checked;
  }
}
