import { Component, Output, Inject, EventEmitter } from '@angular/core';
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

  // Displays custom layers for KML file in sidebar
  fileLayerGroups: LayerGroups = { 'Results': [] };

  bsModalRef: BsModalRef;
  @Output() expanded: EventEmitter<any> = new EventEmitter();

  constructor(private layerHandlerService: LayerHandlerService, private renderStatusService: RenderStatusService,
    private modalService: BsModalService, private uiLayerModelService: UILayerModelService,
    public activeModalService: NgbModal, private kmlService: KMLDocService, 
    @Inject('env') private env) {
    this.loading = false;
    this.statusMsg = 'Enter your OGC WMS service endpoint</br>e.g. "https://server.gov.au/service/wms"</br>or KML URL and hit <i class="fa fa-search"></i>.';
  }

  public selectTabPanel(layerId: string, panelType: string) {
    this.uiLayerModelService.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
  }

  /**
   * Search list of available WMS layers given an OGC WMS URL or a KML URL 
   */
  public search() {
    // Clear the status message
    this.statusMsg = '';

    // Clear the results from the previous search, start the loading spinner
    this.urlLayerGroups = { 'Results': [] };
    this.loading = true;

    // Check for empty URL
    if (this.searchUrl == undefined) {
      this.loading = false;
      this.statusMsg = '<div class="text-danger">Please input the URL you want to search!</div>';
      return;
    }

    // Trim all whitespace, line terminators, quotes, back quotes and double quotes from ends of URL
    const leftTrimRe = /^[\s"'`]+/gms;
    const rightTrimRe = /[\s"'`]+$/gms;
    const searchUrl = this.searchUrl.replace(leftTrimRe, '').replace(rightTrimRe, '');

    // If KML URL ...
    if (searchUrl.toLowerCase().endsWith('.kml')) {
      // Create up a special map layer for the KML document
      let url;
      try {
        url = new URL(searchUrl);
      } catch (error) {
        this.statusMsg = '<div class="text-danger">URL could not be parsed:' + error + '</div>';
        return;
      }
      // Extract a layer name from URL
      const layerName = url.pathname.split('/').pop();
      // Use the proxy
      const proxyUrl = this.env.portalBaseUrl + "getViaProxy.do?usewhitelist=false&url=" + searchUrl;
      // Make a layer model object
      const layerRec: LayerModel = this.layerHandlerService.makeCustomKMLLayerRecord(layerName, proxyUrl, null);
      // Configure layers so it can be added to map
      const uiLayerModel = new UILayerModel(layerRec.id, this.renderStatusService.getStatusBSubject(layerRec));
      this.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
      // Make the layer group listing visible in the UI
      this.urlLayerGroups['Results'].unshift(layerRec);
      this.loading = false;

    } else {
      // If OGC WMS Service ...
      // Send an OGC WMS 'GetCapabilities' request
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

          console.log('Unclean string: ' + kmlStr);

          // Remove unwanted characters and inject proxy for embedded URLs
          kmlStr = this.kmlService.cleanKML(kmlStr);

          console.log('CLEAN KML FILE: ' + kmlStr);

          const parser = new DOMParser();
          const kmlDoc = parser.parseFromString(kmlStr, "text/xml");
          // Create up a special map layer for the KML document 
          const layerRec: LayerModel = this.layerHandlerService.makeCustomKMLLayerRecord(file.name, "", kmlDoc);
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
