import { Component, Output, Inject, EventEmitter } from '@angular/core';
import { LayerHandlerService, LayerModel, RenderStatusService, KMLDocService, ResourceType,
         Constants } from '@auscope/portal-core-ui';
import { NgbdModalStatusReportComponent } from '../../toppanel/renderstatus/renderstatus.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as JSZip from 'jszip';
import { HttpClient } from '@angular/common/http';
import { throwError as observableThrowError, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

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

  constructor(private http: HttpClient,
              private layerHandlerService: LayerHandlerService,
              private renderStatusService: RenderStatusService,
              private modalService: BsModalService,
              private uiLayerModelService: UILayerModelService,
              public activeModalService: NgbModal,
              private kmlService: KMLDocService,
              @Inject('env') private env
  ) {
    this.loading = false;
    this.statusMsg = 'Enter your OGC WMS service endpoint</br>e.g. "https://server.gov.au/service/wms"</br>or KML/KMZ URL and hit <i class="fa fa-search"></i>.';
  }

  /**
   * Makes a filter or download tab panel visible
   * 
   * @param layerId layer id string
   * @param panelType panel type string, either 'filterpanel' or 'downloadpanel'
   */
  public selectTabPanel(layerId: string, panelType: string) {
    this.uiLayerModelService.getUILayerModel(layerId).tabpanel.setPanelOpen(panelType);
  }

  /**
   * From a given URL get the google document - KML or KMZ 
   */
  private getGoogleMapDoc(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'blob' }).pipe(map((docBlob) => {
      //saveAs(docBlob, "original_blob.kmz");
      return docBlob;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
    ));
  }

  /**
   * Search list of available WMS layers given an OGC WMS URL, or try to load a KML/KMZ URL 
   */
  public search() {
    // Clear the status message
    this.statusMsg = '';

    // Clear the results from the previous search, start the loading spinner
    //this.urlLayerGroups = { 'Results': [] }; // don't clear the results
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
    let searchUrl = this.searchUrl.replace(leftTrimRe, '').replace(rightTrimRe, '');

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
      const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + searchUrl;

      this.getGoogleMapDoc(proxyUrl).subscribe(response => {
        let kml = response;

        const reader = new FileReader();

        // This fires after the blob has been read/loaded.
        reader.addEventListener('loadend', (e) => {
          var kmlTxt = e.target.result;

          // Remove unwanted characters and inject proxy for embedded URLs
          let kmlStr = this.kmlService.cleanKML(kmlTxt.toString());

          const parser = new DOMParser();
          let kmlDoc = parser.parseFromString(kmlStr, "text/xml");
          kmlDoc = this.parseExtendedData(kmlDoc);

          this.setupLayer(this, layerName, kmlDoc, proxyUrl, ResourceType.KML, "URL");

          this.loading = false;
        });

        // Start reading the blob as text.
        reader.readAsText(kml);

      });


    } else {
      // If KMZ URL ...
      if (searchUrl.toLowerCase().endsWith('.kmz')) {
        // Create up a special map layer for the KMZ document
        // basically unzip and add files to a new zip,
        // if the file is kml add in the proxy and parse the metadata
        // then add the new zip as a blob to a custom kmz layer

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
        const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + searchUrl;

        // Add KMZ to map
        this.getGoogleMapDoc(proxyUrl).subscribe(response => {

          let kmz = response;

          const reader = new FileReader();

          // This fires after the blob has been read/loaded.
          reader.addEventListener('loadend', (e) => {
            var kmzTxt = e.target.result;

            let getDom = xml => (new DOMParser()).parseFromString(xml, "text/xml")

            const getExtension = fileName => fileName.split(".").pop().toLowerCase();

            // unzip the kmz and iterate through the files
            var zipKMZ = new JSZip(); // reassemble the kmz (files) in this object
            let getKmzDom = (kmzDoc) => {
              var zip = new JSZip()
              return zip.loadAsync(kmzDoc)
                .then(zip => {
                  let kmlDom = null
                  zip.forEach((relPath, file) => {

                    if (getExtension(relPath) === "kml") {
                      kmlDom = file.async("string").then(x => {

                        // Remove unwanted characters and inject proxy for embedded URLs
                        let kmlStr = this.kmlService.cleanKMZ(x);

                        const parser = new DOMParser();
                        let kmlDoc = parser.parseFromString(kmlStr, "text/xml");

                        // setup metadata in a format that cesium expects
                        kmlDoc = this.parseExtendedData(kmlDoc);

                        // add the processed kml file into the zip
                        const serializer = new XMLSerializer();
                        const xmlStr = serializer.serializeToString(kmlDoc);
                        // Remove unwanted characters and inject proxy for embedded URLs
                        //let kmlStr = this.kmlService.cleanKML(xmlStr);
                        //zipKMZ.file(relPath, kmlStr);
                        zipKMZ.file(relPath, xmlStr);
                      })

                    } else {
                      // add the file (non kml) into the zip
                      file.async("blob").then(x => {
                        zipKMZ.file(relPath, x);
                      });
                    }
                    //})
                  })

                  return kmlDom || Promise.reject("No kmz file found")

                }).catch(function (err) {
                  return console.log("ERROR [unzipping kmz]: " + err.msg + JSON.stringify(err));
                })
            };

            getKmzDom(kmzTxt).then(kmzDom => {

              let me = this;

              // add the re-zipped and processed (proxy, metadata) kmz blob
              zipKMZ.generateAsync({ type: "blob" }).then(function (kmzBlob) {
                // uncomment the following to save the kmz as a file
                //saveAs(kmzBlob, "zipKMZ.kmz");

                me.setupLayer(me, layerName, kmzBlob, proxyUrl, ResourceType.KMZ, "URL");

                me.loading = false;
              });

            })

          });

          // Start reading the blob as binary.
          reader.readAsBinaryString(kmz);
        });

      } else {
        // If OGC WMS Service ...
        // Send an OGC WMS 'GetCapabilities' request
        searchUrl = decodeURIComponent(searchUrl);
        if (searchUrl.indexOf('?') > 0){
          searchUrl = searchUrl.substring(0,searchUrl.indexOf('?'));
          this.searchUrl = searchUrl;
        }
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
  }

  /**
   * Open the modal that displays the status of the render
   * 
   * @param uiLayerModel ui layer model object whose status will be displayed
   */
  public openStatusReport(uiLayerModel: UILayerModel) {
    this.bsModalRef = this.modalService.show(NgbdModalStatusReportComponent, { class: 'modal-lg' });
    uiLayerModel.statusMap.getStatusBSubject().subscribe((value) => {
      this.bsModalRef.content.resourceMap = value.resourceMap;
    });
  }

  /**
   * adds support so that kmlFeatureDatasupport will display a features attributes when they 
   * are encoded as ExtendedData.SchemaData.SimpleData
   * 
   * converts kmlDoc from this format to ExtendedData.Data
   * 
   * @param Document kml document
   */
  public parseExtendedData(kmlDoc: Document) {
    let placemarks = kmlDoc.querySelectorAll("Placemark");
    if (placemarks) {
      placemarks.forEach(placemark => {

        let extendedData = placemark.querySelector("ExtendedData");
        if (extendedData) {
          let schemaData = extendedData.querySelector("SchemaData");
          if (schemaData) {

            extendedData.removeChild(schemaData);
            let simpleData = schemaData.querySelectorAll("SimpleData");
            simpleData.forEach(data => {
              let att = data.getAttribute('name');
              let value = data.textContent;

              var newData = kmlDoc.createElement("Data");
              newData.setAttribute("name", att);
              var newValue = kmlDoc.createElement("value");
              newValue.textContent = value;
              newData.appendChild(newValue);
              extendedData.appendChild(newData);
            })
          }
        }
      });
    }

    return kmlDoc;
  }

  /**
   * updates the kml string in terms of injecting proxy and
   * setting up metadata (if required) for cesium
   * 
   * @param kmlTxt kml string
   */
  public updateKML(kmlTxt: any): string {

    let kmlDom = null;

    let getDom = xml => (new DOMParser()).parseFromString(xml, "text/xml")


    // Remove unwanted characters and inject proxy for embedded URLs
    let kmlStr = this.kmlService.cleanKMZ(kmlTxt);

    kmlDom = getDom(kmlStr);

    // setup metadata in a format that cesium expects
    kmlDom = this.parseExtendedData(kmlDom);

    // add the processed kml file into the zip
    const serializer = new XMLSerializer();
    const xmlStr = serializer.serializeToString(kmlDom);

    return xmlStr;
  }


  /**
   * This gets called after a file has been selected for upload
   * 
   * @param sourceType URL or File
   */
  public setupLayer(me: this, name: string, kmzData: any, proxyUrl: string, docType: ResourceType, sourceType: string) {

    let layerRec: LayerModel= null;
    // Make a layer model object
    if (docType == ResourceType.KMZ) {
      layerRec  = me.layerHandlerService.makeCustomKMZLayerRecord(name, proxyUrl, kmzData);
    } else {
      layerRec = me.layerHandlerService.makeCustomKMLLayerRecord(name, proxyUrl, kmzData);
    }
    // Configure layers so it can be added to map
    const uiLayerModel = new UILayerModel(layerRec.id, me.renderStatusService.getStatusBSubject(layerRec));
    me.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
    // Make the layer group listing visible in the UI
    if (sourceType == "URL") {
      me.urlLayerGroups['Results'].unshift(layerRec);
    } else {
      me.fileLayerGroups['Results'].unshift(layerRec);
    }
  }


  /**
   * This gets called after a file has been selected for upload
   * 
   * @param event Javascript file selection event object
   */
  public onKmlFileSelected(event) {
    const getExtension = fileName => fileName.split(".").pop().toLowerCase()
    const me = this;
    const file: File = event.target.files[0];
    if (file) {
      if (getExtension(file.name) === "kmz") {
        this.loading = true; // start spinner
        let getDom = xml => (new DOMParser()).parseFromString(xml, "text/xml")

        // unzip the kmz and iterate through the files
        var zipKMZ = new JSZip(); // reassemble the kmz (files) in this object
        let getKmlDom = (kmzFile) => {
          var zip = new JSZip()
          return zip.loadAsync(kmzFile)
            .then(zip => {

              let kmlDom = null
              zip.forEach((relPath, file) => {

                if (getExtension(relPath) === "kml") {
                  kmlDom = file.async("string").then(kmlTxt => {

                    const xmlStr = this.updateKML(kmlTxt);

                    zipKMZ.file(relPath, xmlStr);
                  })

                } else {
                  // add the file (non kml) into the zip
                  file.async("blob").then(x => {
                    zipKMZ.file(relPath, x);
                  });
                }
                //})
              })

              return kmlDom || Promise.reject("No kmz file found")

            }).catch(function (err) {
              return console.log("ERROR [unzipping kml]: " + err.msg + JSON.stringify(err));
            });
        }

        getKmlDom(file).then(() => {
          // uncomment the following lines will write (download) the unzipped kml to the file kmStr2.kml
          //let kmlStr2 = new XMLSerializer().serializeToString(kmlDom)
          //var blob5 = new Blob([kmlStr2], { type: 'text/xml' })
          //saveAs(blob5, "kmlStr2.kml");

          let me = this;

          // add the re-zipped and processed (proxy, metadata) kmz blob
          zipKMZ.generateAsync({ type: "blob" }).then(function (kmzBlob) {
            //saveAs(kmzBlob, "zipKMZ.kmz");

            me.setupLayer(me, file.name, kmzBlob, "", ResourceType.KMZ, "FILE");

            me.loading = false;
          });

        })
      } else {
        const reader = new FileReader();
        // When file has been read this function is called
        reader.onload = () => {

          let kmlStr = reader.result.toString();

          // Remove unwanted characters and inject proxy for embedded URLs
          kmlStr = this.kmlService.cleanKML(kmlStr);
          const parser = new DOMParser();
          let kmlDoc = parser.parseFromString(kmlStr, "text/xml");
          kmlDoc = this.parseExtendedData(kmlDoc);

          this.setupLayer(this, file.name, kmlDoc, "", ResourceType.KML, "FILE");
        };
        // Initiate reading the KML file
        reader.readAsText(file);
      }
    }
  }
}
