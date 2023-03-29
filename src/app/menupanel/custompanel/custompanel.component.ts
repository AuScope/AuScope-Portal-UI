import { Component, Output, EventEmitter } from '@angular/core';
import { LayerHandlerService, LayerModel, RenderStatusService, KMLDocService } from '@auscope/portal-core-ui';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

type LayerGroups = { 'Results': LayerModel[] };

@Component({
    selector: '[appCustomPanel]',
    templateUrl: './custompanel.component.html',
    styleUrls: ['../menupanel.scss']
})


export class CustomPanelComponent {

  // URL that the user types in
  searchUrl: string;

  // UI loading spinner
  loading: boolean;

  // Used to display info and error messages
  statusMsg: string;

  // Displays custom layers for URLs in sidebar
  urlLayerGroups: LayerGroups = { 'Results': [] };

  // Displays custom layers for KML/KMZ file in sidebar
  fileLayerGroups: LayerGroups = { 'Results': [] };

  bsModalRef: BsModalRef;
  @Output() expanded: EventEmitter<any> = new EventEmitter();

  constructor(private layerHandlerService: LayerHandlerService, private renderStatusService: RenderStatusService,
    private modalService: BsModalService, private uiLayerModelService: UILayerModelService,
    public activeModalService: NgbModal, private kmlService: KMLDocService) {
    this.loading = false;
    this.statusMsg = 'Enter your OGC WMS service endpoint or KML/KMZ URL and hit <i class="fa fa-search"></i>';
  }

  public selectTabPanel(layerId: string, panelType: string) {
    this.uiLayerModelService.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
  }

  /**
   * Search list of available WMS layers given an OGC WMS URL or a KML/KMZ URL 
   */
  public search() {
    this.statusMsg = '';
    this.loading = true;
    if (this.searchUrl == undefined) {
      this.loading = false;
      this.statusMsg = '<div class="text-danger">Please input the URL you want to search!</div>';
      return;
    }
    // Trim whitespace from ends
    const searchUrl = this.searchUrl.trim();
    // If KML or KMZ URL
    if (searchUrl.toLowerCase().endsWith('.kml')|| searchUrl.toLowerCase().endsWith('.kmz')) {
      // Create up a special map layer for the KML document
      let url;
      try {
        url = new URL(searchUrl);
      } catch (error) {
        this.statusMsg = '<div class="text-danger">URL could not be parsed:' + error + '</div>';
        return;
      }
      const layerName = url.pathname.split('/').pop();
      const layerRec: LayerModel = this.layerHandlerService.makeCustomKMLLayerRecord(layerName, searchUrl);
      // Configure layers so it can be added to map
      const uiLayerModel = new UILayerModel(layerRec.id, this.renderStatusService.getStatusBSubject(layerRec));
      this.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
      // Make the layer group listing visible in the UI
      this.urlLayerGroups['Results'].unshift(layerRec);
      
    } else {
      // OGC WMS Service
      this.layerHandlerService.getCustomLayerRecord(searchUrl).subscribe(layerRecs => {
        this.loading = false;
        if (layerRecs != null) {
          if (layerRecs.length === 0) {
            this.statusMsg = '<div class="text-danger">No valid layers could be found for this endpoint.</div>';
          } else {
            // Evaluate the layers and if found set up loadable map layers
            for (const layerRec of layerRecs) {
              // Make the layer group listing visible in the UI
              this.urlLayerGroups['Results'].unshift(layerRec);
              // Configure layers so they can be added to map
              const uiLayerModel = new UILayerModel(layerRec.id, this.renderStatusService.getStatusBSubject(layerRec));
              this.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
            }
          }
        } else {
          this.statusMsg = '<div class="text-danger">No viable OGC WMS found on the service endpoint. Kindly check your URL again.</div>';
        }
      });
    }
  }

  /**
   * Open the modal that displays the status of the render
   * 
   * @param uiLayerModel ui layer model object whose status will be displayed
   */
  public openStatusReport(uiLayerModel: UILayerModel) {
    this.bsModalRef = this.modalService.show(NgbdModalStatusReportComponent, {class: 'modal-lg'});
    uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
      this.bsModalRef.content.resourceMap = value.resourceMap;
    });
  }

  /**
   * This gets called after a file has been selected for upload
   * 
   * @param event Javascript file selection event object
   */
  public onKmlFileSelected(event) {
    const me = this;
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      // When file has been read this function is called
      reader.onload = () => {
          let kmlStr = reader.result.toString();
          // Remove unwanted characters and inject proxy for embedded URLs
          kmlStr = this.kmlService.cleanKML(kmlStr);
          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(kmlStr, "text/xml");
          // Create up a special map layer for the KML document 
          const layerRec: LayerModel = this.layerHandlerService.makeCustomKMLLayerRecord(file.name, kmlDoc);
          const uiLayerModel = new UILayerModel(layerRec.id, this.renderStatusService.getStatusBSubject(layerRec));
          this.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
          // Make the layer group listing visible in the UI
          me.fileLayerGroups['Results'].unshift(layerRec);
      };
      // Initiate reading the KML file
      reader.readAsText(file);
    }
  }
}
