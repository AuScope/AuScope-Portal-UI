import { Component } from '@angular/core';
import { LayerHandlerService, LayerModel } from '@auscope/portal-core-ui';
import { SearchService } from 'app/services/search/search.service';

const DEFAULT_RESULTS_PER_PAGE = 10;

@Component({
    selector: 'app-search-panel',
    templateUrl: './searchpanel.component.html',
    styleUrls: ['./searchpanel.component.scss']
})
export class SearchPanelComponent {

  showingSearchPanel = true;
  showingAdvancedOptions = false;
  queryText = '';
  searching = false;
  searchResults: LayerModel[] = null;
  resultsPerPage: number = DEFAULT_RESULTS_PER_PAGE;
  pageList: number[] = [1];
  currentPage = 1;

  constructor(private searchService: SearchService, private layerHandlerService: LayerHandlerService) { }

  /**
   * Search index using specified fields and search query
   */
  public search() {
    this.searching = true;
    this.searchResults = null;
    this.pageList = [];   // List of page numbers for pagination
    this.currentPage = 1;

    // TODO: Checkboxes, or if hard-coded put an array somewhere
    const searchFields = ['name', 'description', 'id'];
    this.searchService.search(searchFields, this.queryText).subscribe(searchResponse => {
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

}
