import { Component, Output, Inject, EventEmitter, inject } from '@angular/core';
import { LayerHandlerService } from '../../lib/portal-core-ui/service/cswrecords/layer-handler.service';
import { ResourceType } from '../../lib/portal-core-ui/utility/constants.service';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { RenderStatusService } from '../../lib/portal-core-ui/service/cesium-map/renderstatus/render-status.service';
import { KMLDocService } from '../../lib/portal-core-ui/service/kml/kml.service';
import { Constants } from '../../lib/portal-core-ui/utility/constants.service';
import { CsMapService } from '../../lib/portal-core-ui/service/cesium-map/cs-map.service';
import { UILayerModel } from '../common/model/ui/uilayer.model';
import { UILayerModelService } from 'app/services/ui/uilayer-model.service';
import * as JSZip from 'jszip';
import { HttpClient } from '@angular/common/http';
import { throwError as observableThrowError, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { LayerManagerService } from 'app/services/ui/layer-manager.service';
import { SidebarService } from 'app/portal/sidebar.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InfoPanelComponent } from '../common/infopanel/infopanel.component';


@Component({
    selector: '[app-custom-panel]',
    templateUrl: './custompanel.component.html',
    styleUrls: ['../menupanel.scss', './custompanel.component.scss'],
    standalone: false
})
export class CustomPanelComponent {
  private http = inject(HttpClient);
  private layerHandlerService = inject(LayerHandlerService);
  private layerManagerService = inject(LayerManagerService);
  private renderStatusService = inject(RenderStatusService);
  private uiLayerModelService = inject(UILayerModelService);
  private kmlService = inject(KMLDocService);
  private sidebarService = inject(SidebarService);
  private csMapService = inject(CsMapService);
  public activeModalService = inject(NgbModal);

  // URL that the user types in
  searchUrl: string;

  // UI loading spinner
  loading: boolean;

  // Used to display info and error messages
  statusMsg: string;

  // Displays custom layers for URLs in sidebar
  urlLayers: LayerModel[] = [];

  // Displays custom layers for KML file in sidebar
  fileLayers: LayerModel[] = [];

  @Output() expanded: EventEmitter<any> = new EventEmitter();

  constructor(@Inject('env') private env) {
    this.loading = false;
    this.statusMsg = 'Enter your OGC WMS service endpoint</br>e.g. "https://server.gov.au/service/wms"</br>or KML/KMZ/GeoJSON URL and hit <i class="fa fa-search"></i>.';
  }

  /**
   * Get the UILayerModel for the layer
   * @param layerId ID of layer
   * @returns UILayerModel for layer
   */
  public getUILayerModel(layerId: string): UILayerModel {
    return this.uiLayerModelService.getUILayerModel(layerId);
  }

  /**
   * From a given URL get the remote blob - KML, KMZ or GeoJSON
   */
  private getRemoteBlob(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'blob' }).pipe(map((docBlob) => {
      return docBlob;
    }), catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      }
    ));
  }

  /**
   * Load a KML file
   * @param searchUrl the URL of the KML file
   */
  private loadKMLFile(searchUrl: string): void {
    // Create up a special map layer for the KML document
    let url: URL;
    try {
      url = new URL(searchUrl);
    } catch (err) {
      this.statusMsg = '<div class="text-danger">URL could not be parsed:' + (err?.message || err) + '</div>';
      return;
    }
    // Extract a layer name from URL
    const layerName = url.pathname.split('/').pop();
    // Use the proxy
    const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + searchUrl;

    this.getRemoteBlob(proxyUrl).subscribe({
      next: (response) => {
        const kml = response;

        const reader = new FileReader();

        // This fires after the blob has been read/loaded.
        reader.addEventListener('loadend', (e) => {
          const kmlTxt = e.target.result;

          // Remove unwanted characters and inject proxy for embedded URLs
          const kmlStr = this.kmlService.cleanKML(String(kmlTxt));

          const parser = new DOMParser();
          let kmlDoc = parser.parseFromString(kmlStr, "text/xml");
          kmlDoc = this.parseExtendedData(kmlDoc);

          this.setupLayer(this, layerName, kmlDoc, proxyUrl, ResourceType.KML, "URL");

          this.loading = false;
        });

        // Start reading the blob as text.
        reader.readAsText(kml);
      },
      error: err => {
        console.error('Failed to retrieve KML', err);
        this.statusMsg = '<div class="text-danger">Failed to retrieve KML: ' + (err?.message || err) + '</div>';
        this.loading = false;
      }
    });
  }

  /**
   * Load a KMZ file
   * @param searchUrl the URL of the KMZ file
   */
  private loadKMZFile(searchUrl: string): void {
    // Create up a special map layer for the KMZ document
    // basically unzip and add files to a new zip,
    // if the file is kml add in the proxy and parse the metadata
    // then add the new zip as a blob to a custom kmz layer
    let url: URL;
    try {
      url = new URL(searchUrl);
    } catch (err) {
      this.statusMsg = '<div class="text-danger">URL could not be parsed:' + (err?.message || err) + '</div>';
      return;
    }
    // Extract a layer name from URL
    const layerName = url.pathname.split('/').pop();
    // Use the proxy
    const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + searchUrl;

    // Add KMZ to map
    this.getRemoteBlob(proxyUrl).subscribe(response => {

      const kmz = response;
      const reader = new FileReader();

      // This fires after the blob has been read/loaded.
      reader.addEventListener('loadend', (e) => {
        const kmzTxt = e.target.result;
        const getExtension = fileName => fileName.split(".").pop().toLowerCase();

        // unzip the kmz and iterate through the files
        const zipKMZ = new JSZip(); // reassemble the kmz (files) in this object
        const getKmzDom = (kmzDoc) => {
          const zip = new JSZip()
          return zip.loadAsync(kmzDoc)
            .then(zip => {
              let kmlDom = null
              zip.forEach((relPath, file) => {

                if (getExtension(relPath) === "kml") {
                  kmlDom = file.async("string").then(x => {

                    // Remove unwanted characters and inject proxy for embedded URLs
                    const kmlStr = this.kmlService.cleanKMZ(x);

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
                  });
                } else {
                  // add the file (non kml) into the zip
                  file.async("blob").then(x => {
                    zipKMZ.file(relPath, x);
                  }).catch(err => {
                    console.log("Failed to add KMZ file to ZIP", err);
                  });
                }
              })
              return kmlDom || Promise.reject("No kmz file found")
            }).catch((err) => {
              return console.log("ERROR [unzipping kmz]: " + err.msg + JSON.stringify(err));
            })
        };

        getKmzDom(kmzTxt).then(() => {
          // add the re-zipped and processed (proxy, metadata) kmz blob
          zipKMZ.generateAsync({ type: "blob" }).then((kmzBlob) => {
            // uncomment the following to save the kmz as a file
            //saveAs(kmzBlob, "zipKMZ.kmz");
            this.setupLayer(this, layerName, kmzBlob, proxyUrl, ResourceType.KMZ, "URL");
            this.loading = false;
          }).catch(err => {
            console.log("Failed to generate KML blob", err);
          })
        }).catch(err => {
          console.log("Failed to retrieve KMZ", err);
        });
      });

      // Start reading the blob as binary.
      reader.readAsBinaryString(kmz);
    });
  }

  /**
   * Load a GeoJSON file
   * @param searchUrl the URL of the GeoJSON file
   */
  private loadGeoJSONFile(searchUrl: string): void {
    let url: URL;
    try {
      url = new URL(searchUrl);
    } catch (err) {
      this.statusMsg = '<div class="text-danger">URL could not be parsed:' + (err?.message || err) + '</div>';
      return;
    }

    const layerName = url.pathname.split('/').pop();
    const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + searchUrl;

    this.loading = true;

    this.getRemoteBlob(proxyUrl).subscribe({
      next: (response) => {
        const blob = response as Blob;
        const reader = new FileReader();

        reader.addEventListener('loadend', (e: any) => {
          try {
            const jsonTxt = String(e.target.result);
            const parsed = JSON.parse(jsonTxt);

            // Basic validation: must be an object and have type or features
            if (!parsed || typeof parsed !== 'object' || (!parsed.type && !parsed.features)) {
              this.statusMsg = '<div class="text-danger">The file is not a valid GeoJSON document.</div>';
              this.loading = false;
              return;
            }

            // Pass the string so downstream code that expects text can handle it,
            // or pass the object if your layer handler accepts it. Here we pass the string.
            this.setupLayer(this, layerName || 'geojson', jsonTxt, proxyUrl, ResourceType.GEOJSON, "URL");
            this.loading = false;
          } catch (err) {
            this.statusMsg = '<div class="text-danger">Failed to parse GeoJSON: ' + (err?.message || err) + '</div>';
            this.loading = false;
          }
        });

        reader.readAsText(blob);
      },
      error: (err) => {
        this.statusMsg = '<div class="text-danger">Failed to retrieve GeoJSON: ' + (err?.message || err) + '</div>';
        this.loading = false;
      }
    });
  }

  /**
   * Load an OGC WMS service
   * @param searchUrl the URL of the WMS service
   */
  private loadWMSService(searchUrl: string): void {
    // If OGC WMS Service ...
    // Send an OGC WMS 'GetCapabilities' request
    searchUrl = decodeURIComponent(searchUrl);
    if (searchUrl.indexOf('?') > 0) {
      searchUrl = searchUrl.substring(0, searchUrl.indexOf('?'));
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
            this.urlLayers.unshift(layerRec);

            // Configure layers so they can be added to map
            const uiLayerModel = new UILayerModel(layerRec.id, 100, this.renderStatusService.getStatusBSubject(layerRec));
            this.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
          }
        }
      } else {
        this.statusMsg = '<div class="text-danger">No viable OGC WMS found on the service endpoint. Kindly check your URL again.</div>';
      }
    }, () => {
      this.statusMsg = '<div class="text-danger">No viable OGC WMS found on the service endpoint. Kindly check your URL again.</div>';
      this.loading = false;
    });
  }

  /**
   * Search list of available WMS layers given an OGC WMS URL, or try to load a KML/KMZ URL
   */
  public search() {
    // Clear the status message
    this.statusMsg = '';

    // Clear the results from the previous search, start the loading spinner
    this.urlLayers = [];
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

    // Determine what file/service we're dealing with
    if (searchUrl.toLowerCase().endsWith('.kml')) {
      // KML URL
      this.loadKMLFile(searchUrl);
    }
    else if (searchUrl.toLowerCase().endsWith('.kmz')) {
      // KMZ URL
      this.loadKMZFile(searchUrl);
    } else if (searchUrl.toLowerCase().endsWith('.geojson') || searchUrl.toLowerCase().endsWith('.json')) {
      this.loadGeoJSONFile(searchUrl);
    } else {
      // OGC WMS Service URL
      this.loadWMSService(searchUrl);
    }
  }

  /**
   * Catch ENTER key event in KML input to trigger search
   * @param event KeyEvent
   */
  public onKeyUp(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      this.search();
    }
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
    const placemarks = kmlDoc.querySelectorAll("Placemark");
    if (placemarks) {
      placemarks.forEach(placemark => {

        const extendedData = placemark.querySelector("ExtendedData");
        if (extendedData) {
          const schemaData = extendedData.querySelector("SchemaData");
          if (schemaData) {

            extendedData.removeChild(schemaData);
            const simpleData = schemaData.querySelectorAll("SimpleData");
            simpleData.forEach(data => {
              const att = data.getAttribute('name');
              const value = data.textContent;

              const newData = kmlDoc.createElement("Data");
              newData.setAttribute("name", att);
              const newValue = kmlDoc.createElement("value");
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
    const getDom = xml => (new DOMParser()).parseFromString(xml, "text/xml")

    // Remove unwanted characters and inject proxy for embedded URLs
    const kmlStr = this.kmlService.cleanKMZ(kmlTxt);

    kmlDom = getDom(kmlStr);

    // setup metadata in a format that cesium expects
    kmlDom = this.parseExtendedData(kmlDom);

    // add the processed kml file into the zip
    const serializer = new XMLSerializer();
    const xmlStr = serializer.serializeToString(kmlDom);

    return xmlStr;
  }

  /**
   * Check if a list of file or URL records already contain a record denoted by its name and URL
   *
   * @param recordsList the list of records (file or url)
   * @param name the name of the layer
   * @param url the URL of the layer
   * @returns true if the layer is found within recordsList, false otherwise
   */
  private recordsListContainsRecord(recordsList: any, name: string, url: string): boolean {
    if (recordsList.findIndex(x => x.cswRecords[0].name === name && x.cswRecords[0].onlineResources[0].url === url) != -1) {
      return true;
    }
    return false;
  }

  /**
   * This gets called after a file has been selected for upload
   *
   * @param sourceType URL or File
   */
  public setupLayer(me: this, name: string, sourceData: any, proxyUrl: string, docType: ResourceType, sourceType: string) {
    let layerRec: LayerModel= null;
    // Make a layer model object
    if (docType == ResourceType.GEOJSON) {
      layerRec = me.layerHandlerService.makeCustomGEOJSONLayerRecord(name, proxyUrl, sourceData);
      layerRec.group = 'geojson-layer';
    } else if (docType == ResourceType.KMZ) {
      layerRec = me.layerHandlerService.makeCustomKMZLayerRecord(name, proxyUrl, sourceData);
      layerRec.group = 'kmz-layer';
    } else {
      layerRec = me.layerHandlerService.makeCustomKMLLayerRecord(name, proxyUrl, sourceData);
      layerRec.group = 'kml-layer';
    }
    // Configure layers so it can be added to map
    const uiLayerModel = new UILayerModel(layerRec.id, 100, me.renderStatusService.getStatusBSubject(layerRec));
    this.uiLayerModelService.setUILayerModel(layerRec.id, uiLayerModel);
    // Make the layer group listing visible in the UI
    if (sourceType == "URL" && !this.recordsListContainsRecord(me.urlLayers, name, proxyUrl)) {
      me.urlLayers.unshift(layerRec);
    } else if (!this.recordsListContainsRecord(me.fileLayers, name, proxyUrl)) {
      me.fileLayers.unshift(layerRec);
    }
  }

  /**
   * This gets called after a file has been selected for upload
   *
   * @param event Javascript file selection event object
   */
  public onFileSelected(event) {
    const getExtension = fileName => fileName.split(".").pop().toLowerCase()
    const file: File = event.target.files[0];
    if (file) {
      if (getExtension(file.name) === "geojson") {
        const reader = new FileReader();
        // When file has been read this function is called
        reader.onload = () => {
          const jsonStr = String(reader.result);
          this.setupLayer(this, file.name, jsonStr, "", ResourceType.GEOJSON, "FILE");
        };
        // Initiate reading the GEOJSON file
        reader.readAsText(file);
      } else if (getExtension(file.name) === "kmz") {
        this.loading = true; // start spinner

        // unzip the kmz and iterate through the files
        const zipKMZ = new JSZip(); // reassemble the kmz (files) in this object
        const getKmlDom = (kmzFile) => {
          const zip = new JSZip()
          return zip.loadAsync(kmzFile)
            .then(zip => {
              let kmlDom = null
              zip.forEach((relPath, file) => {

                if (getExtension(relPath) === "kml") {
                  kmlDom = file.async("string").then(kmlTxt => {
                    const xmlStr = this.updateKML(kmlTxt);
                    zipKMZ.file(relPath, xmlStr);
                  });
                } else {
                  // add the file (non kml) into the zip
                  file.async("blob").then(x => {
                    zipKMZ.file(relPath, x);
                  }).catch(err => {
                    console.log("Failed to add KMZ file to ZIP", err);
                    this.loading = false;
                  });
                }
              })
              return kmlDom || Promise.reject("No kmz file found")
            }).catch((err) => {
              this.loading = false;
              return console.log("ERROR [unzipping kml]: " + err.msg + JSON.stringify(err));
            });
        }

        getKmlDom(file).then(() => {
          // uncomment the following lines will write (download) the unzipped kml to the file kmStr2.kml
          //let kmlStr2 = new XMLSerializer().serializeToString(kmlDom)
          //var blob5 = new Blob([kmlStr2], { type: 'text/xml' })
          //saveAs(blob5, "kmlStr2.kml");

          // add the re-zipped and processed (proxy, metadata) kmz blob
          zipKMZ.generateAsync({ type: "blob" }).then((kmzBlob) => {
            //saveAs(kmzBlob, "zipKMZ.kmz");
            this.setupLayer(this, file.name, kmzBlob, "", ResourceType.KMZ, "FILE");
            this.loading = false;
          }).catch(err => {
            console.log("Failed to generate KML blob", err);
            this.loading = false;
          });
        }).catch(err => {
          console.log("Failed to retrieve KMZ", err);
          this.loading = false;
        });
      } else {
        const reader = new FileReader();
        // When file has been read this function is called
        reader.onload = () => {
          let kmlStr = String(reader.result);

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

  /**
   * Add a KML layer to the map
   *
   * @param layer the KML LayerModel
   */
  public addLayer(layer: LayerModel) {
    this.layerManagerService.addLayer(layer, [], null, null);
    this.sidebarService.setOpenState(true);
  }

  /**
   * Remove a KML layer from the map.
   *
   * @param layer the KML LayerModel
   */
  public removeLayer(layer: LayerModel) {
    this.layerManagerService.removeLayer(layer);
    if (this.csMapService.getLayerModelList()?.length === 0) {
      this.sidebarService.setOpenState(false);
    }
  }

  /**
   * Display layer information in modal
   *
   * @param layer the LayerModel
   */
  public displayRecordInfo(layer: LayerModel) {
    if (layer) {
      const modelRef = this.activeModalService.open(InfoPanelComponent, {
        size: "lg",
        backdrop: false
      });
      modelRef.componentInstance.cswRecords = layer.cswRecords;
      modelRef.componentInstance.layer = layer;
    }
  }

}
