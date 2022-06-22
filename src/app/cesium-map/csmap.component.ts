import { config } from '../../environments/config';
import { QuerierModalComponent } from '../modalwindow/querier/querier.modal.component';
import { AfterViewInit, Component, ElementRef, NgZone, ViewChild, ViewContainerRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ViewerConfiguration } from '@auscope/angular-cesium';
import { CsMapService, CSWRecordModel, GMLParserService, LayerModel, ManageStateService, QueryWFSService,
  QueryWMSService, SimpleXMLService, UtilitiesService, CsMapObject, ResourceType } from '@auscope/portal-core-ui';
import { Cartesian3, MapMode2D, Math, ScreenSpaceEventHandler, SceneMode, ScreenSpaceEventType, Rectangle, ImagerySplitDirection,
   Cartesian2, WebMapServiceImageryProvider, WebMercatorProjection, Cartographic, GeographicProjection } from 'cesium';
import { IrisQuerierHandler } from './custom-querier-handler/iris-querier-handler.service';
import { ToolbarComponentsService } from 'app/services/ui/toolbar-components.service';

declare var Cesium: any;

@Component({
  selector: 'app-cs-map',
  template: `
    <div #mapElement id="map" class="h-100 w-100" (mouseout)="mouseLongitude=undefined;mouseLatitude=undefined;">
      <ac-map>
          <rectangles-editor></rectangles-editor>
          <app-cs-map-zoom></app-cs-map-zoom>
          <app-cs-map-split (toggleEvent)="toggleShowMapSplit()"></app-cs-map-split>
          <app-cs-clipboard></app-cs-clipboard>
          <div #mapSlider id="mapSlider" *ngIf="getSplitMapShown()">
            <div class="slider-grabber">
              <div class="slider-grabber-inner"></div>
            </div>
          </div>
          <div class="mouse-coordinates" *ngIf="mouseLongitude !== undefined && mouseLatitude !== undefined">
              Longitude:&nbsp;{{ mouseLongitude }},&nbsp;Latitude:&nbsp;{{ mouseLatitude }}
          </div>
          <div class="toolbar" style="position:absolute;z-index:1;">
              <ng-template #toolbars></ng-template>
          </div>
      </ac-map>
    </div>
    `,
    providers: [ViewerConfiguration], // Don't forget to Provide it
    styleUrls: ['./csmap.component.scss']
  // The "#" (template reference variable) matters to access the map element with the ViewChild decorator!
})

export class CsMapComponent implements AfterViewInit {

  public static AUSTRALIA = Rectangle.fromDegrees(114.591, -45.837, 148.97, -5.73);

  // This is necessary to access the html element to set the map target (after view init)!
  @ViewChild('mapElement', { static: true }) mapElement: ElementRef;

  @ViewChild('mapSlider', { static: false }) mapSlider: ElementRef;

  // Map toolbars
  @ViewChild('toolbars', { static: true, read: ViewContainerRef }) mapToolbars: ViewContainerRef;

  name = 'Angular';
  cesiumLoaded = true;
  viewer: any;

  mouseLatitude: string;
  mouseLongitude: string;

  sliderMoveActive = false;

  private bsModalRef: BsModalRef;
  private modalDisplayed = false;

  constructor(private csMapObject: CsMapObject, private csMapService: CsMapService, private modalService: BsModalService,
    private queryWFSService: QueryWFSService, private queryWMSService: QueryWMSService, private gmlParserService: GMLParserService,
    private manageStateService: ManageStateService, private toolbarComponentsService: ToolbarComponentsService,
    private viewerConf: ViewerConfiguration, private ngZone: NgZone) {

    const me = this;
    this.csMapService.getClickedLayerListBS().subscribe((mapClickInfo) => {
      me.handleLayerClick(mapClickInfo);
    });
    // viewerOptions will be passed the Cesium.Viewer constuctor
    this.viewerConf.viewerOptions = {
      selectionIndicator: false,
      timeline: false,
      infoBox: false,
      fullscreenButton: false,
      baseLayerPicker: true,
      imageryProviderViewModels: this.csMapService.createBaseMapLayers(),
      terrainProviderViewModels: [],
      animation: false,
      shouldAnimate: false,
      homeButton: false,
      geocoder: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      mapMode2D: MapMode2D.INFINITE_SCROLL,
    };
    // Will be called on viewer initialistion
    this.viewerConf.viewerModifier = (viewer: any) => {
      this.viewer = viewer;
      // Remove default double click zoom behaviour
      viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      const scene = viewer.scene;
      if (!scene.pickPositionSupported) {
          window.alert('This browser does not support pickPosition.');
      }
      const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((movement) => {
        this.csMapObject.processClick(movement);
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      // Keep track of lat/lon at mouse
      handler.setInputAction((movement) => {
        const ellipsoid = this.viewer.scene.globe.ellipsoid;
        const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        this.ngZone.run(() => {
          if (cartesian) {
            const cartographic = ellipsoid.cartesianToCartographic(cartesian);
            me.mouseLongitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);
            me.mouseLatitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);
            //const elev = viewer.scene.globe.getHeight(cartographic); // In case we need 3D
          } else {
            me.mouseLongitude = undefined;
            me.mouseLatitude = undefined;
          }
        });
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Look at Australia
      viewer.camera.setView({
        destination: CsMapComponent.AUSTRALIA
      });

      // This reduces the blockiness of the text fonts and other graphics
      this.viewer.resolutionScale = window.devicePixelRatio;

      // Zoom to Australia after 2D/3D/Columbus morph
      this.viewer.scene.morphComplete.addEventListener(() => {
        // IF this is a permanent link then suppress the flyto operation
        if (this.manageStateService.isPermLinkMode()) {
          // Only do this once, so user can set the SceneMode after applying perm link
          this.manageStateService.setPermLinkMode(false);
          return;
        }
        const pitch = this.viewer.camera._mode === SceneMode.COLUMBUS_VIEW ? Math.toRadians(-45.0) : Math.toRadians(-90.0);
        const orient = {
          heading : Math.toRadians(0.0),
          pitch : pitch,
          roll : 0.0
        }
        const SOUTH_OF_AUSTRALIA = Cartesian3.fromDegrees(133.7751, -60.0, 3000000.0);
        const destination = this.viewer.camera._mode === SceneMode.COLUMBUS_VIEW ? SOUTH_OF_AUSTRALIA : CsMapComponent.AUSTRALIA;
        // Timeout required for bug preventing flyTo immediately after morph
        setTimeout(() => {
          this.viewer.camera.flyTo({
            destination: destination,
            orientation: orient
          });
        }, 100);
      });
    };
  }

  getViewer() {
    return this.viewer;
  }

  ngAfterViewInit() {
    this.csMapService.init();

    // This code is used to display the map state stored in a permanent link
    const state = UtilitiesService.getUrlParameterByName('state');
    if (state) {
      const me = this;
      this.manageStateService.fetchStateFromDB(state).subscribe((layerStateObj: any) => {
        if (layerStateObj) {
          me.modalDisplayed = false;
          for (const layerKey in layerStateObj) {
            if (layerKey === 'map') {
              continue;
            }
            if (layerStateObj[layerKey] && layerStateObj[layerKey].hasOwnProperty('raw') && layerStateObj[layerKey].raw) {
              me.csMapService.getAddLayerSubject().subscribe((layer: LayerModel) => {
                setTimeout(() => {
                  if (layer.id === layerKey) {
                    const mapLayer = {
                      onlineResource: layerStateObj[layerKey].onlineResource,
                      layer: layer
                    }
                    me.setModal(layerKey, layerStateObj[layerKey].raw, mapLayer, null, layerStateObj[layerKey].gmlid);
                  }
                }, 0);
              })
            }
          }
        }
      });
    }

    // Set the map's ViewContainerRef for adding toolbars
    this.toolbarComponentsService.setMapWidgetViewContainerRef(this.mapToolbars);
  }

  /**
   * Calculates the map position, tile size and bounding box
   * @param mouseX x position on screen
   * @param mouseY y position in screen
   * @returns {x: y: width: height: bbox:} or undefined if could not calculate
   */
  public getParams(mouseX: number, mouseY: number): {x: number, y: number, width: number, height: number, bbox: number[], level: number} {

    // Convert mouse coords to X,Y,Z cartesian
    const mousePosition = new Cartesian2(mouseX, mouseY);
    const clickCartesian = this.viewer.camera.pickEllipsoid(mousePosition, this.viewer.scene.globe.ellipsoid);
    if (!clickCartesian) {
      return undefined;
    }

    // Convert Cartesian(X,Y,Z) => Cartographic(radians angle, radians angle, height)
    const scene = this.viewer.scene;
    const clickCartographic = scene.globe.ellipsoid.cartesianToCartographic(clickCartesian);

    // Find the terrain tile containing the picked location.
    const tilesToRender = scene.globe._surface._tilesToRender;
    let pickedTile;

    for (let textureIndex = 0; !pickedTile && textureIndex < tilesToRender.length; ++textureIndex) {
      const tile = tilesToRender[textureIndex];
      if (Rectangle.contains(tile.rectangle, clickCartographic)) {
        pickedTile = tile;
      }
    }

    if (!(pickedTile)) {
      return undefined;
    }

    // Convert tile corner coords to EPSG:3857 (metres)
    const p0 = new Cartographic(pickedTile.rectangle.west, pickedTile.rectangle.south, 0);
    const p1 = new Cartographic(pickedTile.rectangle.east, pickedTile.rectangle.north, 0);

    const wmp = new WebMercatorProjection();
    const p00 = wmp.project(p0);
    const p11 = wmp.project(p1);

    // Assemble bounding box
    const bbox = [parseFloat(p00.x.toFixed(0)), parseFloat(p00.y.toFixed(0)), parseFloat(p11.x.toFixed(0)), parseFloat(p11.y.toFixed(0))];

    // Pick against all attached imagery tiles containing the pickedLocation.
    const imageryTiles = pickedTile.data.imagery;

    for (let i = imageryTiles.length - 1; i >= 0; --i) {
      const terrainImagery = imageryTiles[i];
      const imagery = terrainImagery.readyImagery;
      if (!imagery) {
        continue;
      }
      const provider = imagery.imageryLayer.imageryProvider;
      if (!(provider instanceof WebMapServiceImageryProvider)) {
        continue;
      }
      if (!Rectangle.contains(imagery.rectangle, clickCartographic)) {
        continue;
      }

      // Convert radians to degrees
      const longitudeLatitudeProjectedScratch = new Cartesian3();
      if (provider.tilingScheme.projection instanceof GeographicProjection) {
        longitudeLatitudeProjectedScratch.x = Cesium.Math.toDegrees(clickCartographic.longitude);
        longitudeLatitudeProjectedScratch.y = Cesium.Math.toDegrees(clickCartographic.latitude);
      } else {
        console.error('error:csmap: Cannot project');
        continue
      }

      // Convert tile coords & level to native coordinates of tile's boundaries (north, south, east, west)
      const projected = longitudeLatitudeProjectedScratch;
      const rectangleScratch = new Rectangle();
      const rectangle = provider.tilingScheme.tileXYToNativeRectangle(imagery.x, imagery.y, imagery.level, rectangleScratch);

      // Convert the projected coords to a simple (x,y) on the surface of the tile
      const ijScratch = new Cartesian2();
      ijScratch.x = ((provider.tileWidth * (projected.x - rectangle.west)) / rectangle.width) | 0;
      ijScratch.y = ((provider.tileHeight * (rectangle.north - projected.y)) / rectangle.height) | 0;

      // Assemble params
      const width = imagery.imageryLayer.imageryProvider.tileWidth;
      const height = imagery.imageryLayer.imageryProvider.tileHeight;
      return { x: ijScratch.x, y: ijScratch.y, width: width, height: height, bbox: bbox, level: imagery.level};
    }
  }

  /**
   * Handles the map click event
   * @param mapClickInfo object with map click information
   */
  private handleLayerClick(mapClickInfo) {
    const me = this;

    if (this.csMapObject.getIgnoreMapClick()) {
      return;
    }
    if (UtilitiesService.isEmpty(mapClickInfo)) {
      return;
    }

    // Process lists of entities
    this.modalDisplayed = false;
    for (const entity of mapClickInfo.clickedEntityList) {
      // TODO: Ignore polygon filter entities here or in portal-core-ui
      const layer: LayerModel = this.csMapService.getLayerForEntity(entity);
      if (layer !== null) {
        // IRIS layers
        if (layer.cswRecords.find(c => c.onlineResources.find(o => o.type === ResourceType.IRIS))) {
          this.displayModal(mapClickInfo.clickCoord);
          const handler = new IrisQuerierHandler(layer, entity);
          this.setModalHTML(handler.getHTML(), layer.name, entity, this.bsModalRef);
        }
      }
      // TODO: Remove commented code, kept for yet to be re-implemented entity types
      /*
      if (entity.id_ && entity.id_.indexOf('geocoder') === 0) {
        continue;
      }
      // NB: This is just testing that the popup window does display
      this.displayModal(mapClickInfo.clickCoord);

      // VT: if it is a csw renderer layer, handling of the click is slightly different
      if (config.cswrenderer.includes(entity.layer.id) || CsCSWService.cswDiscoveryRendered.includes(entity.layer.id)) {
        this.setModalHTML(this.parseCSWtoHTML(entity.cswRecord), entity.cswRecord.name, entity, this.bsModalRef);
      }
      // Note: customQuerierHandler property currently removed from ref.ts
      else if (ref.customQuerierHandler[entity.layer.id]) {
          const handler = new ref.customQuerierHandler[entity.layer.id](entity);
          this.setModalHTML(handler.getHTML(entity), handler.getKey(entity), entity, this.bsModalRef);
      } else {       // VT: in a normal feature, yes we want to getfeatureinfo
        featureCount++;
        if (featureCount < 10) { // VT: if more than 10 feature, ignore the rest
          try {
            this.queryWFSService.getFeatureInfo(entity.onlineResource, entity.id_).subscribe(result => {
              this.setModal(result, entity);
            }, err => {
              this.bsModalRef.content.downloading = false;
              });
          } catch (error) {
           this.setModalHTML('<p> ' + error + '</p>',
            'Error Retrieving Data', entity, this.bsModalRef);
          }
        } else {
          this.setModalHTML('<p>Too many features to list, zoom in the map to get a more precise location</p>',
            '...', entity, this.bsModalRef);
          break;
        }
      }
      */
    }

    // Process list of layers clicked
    for (const maplayer of mapClickInfo.clickedLayerList) {
      for (const i of maplayer.clickCSWRecordsIndex ) {
        const cswRecord = maplayer.cswRecords[i];
        const onlineResource = cswRecord.onlineResources[0];
        if (onlineResource) {

          // Display CSW record info
          if (config.cswrenderer.includes(maplayer.id)) {
            me.displayModal(mapClickInfo.clickCoord);
            this.setModalHTML(this.parseCSWtoHTML(cswRecord), cswRecord.name, maplayer, this.bsModalRef);

          // Display WMS layer info
          } else {
            const params = this.getParams(maplayer.clickPixel[0], maplayer.clickPixel[1]);
            if (!params) {
              continue;
            }
            let sldBody = maplayer.sldBody;
            let postMethod = false;
            let infoFormat: string;
            if (sldBody) {
              postMethod = true;
            } else {
              sldBody = '';
            }

            // WMS 1.3.0 GetFeatureInfo requests will have had their lat,lng coords swapped to lng,lat
            if (maplayer.sldBody130) {
              sldBody = maplayer.sldBody130;
            }

            // Layer specific SLD_BODY, INFO_FORMAT and postMethod
            if (onlineResource.name.indexOf('ProvinceFullExtent') >= 0) {
              infoFormat = 'application/vnd.ogc.gml';
            } else {
              infoFormat = 'application/vnd.ogc.gml/3.1.1';
            }

            if (UtilitiesService.isArcGIS(onlineResource)) {
              infoFormat = 'text/xml';
              sldBody = '';
              postMethod = false;
            }

            // GSKY and some Loop3D layers require JSON response
            if (config.wmsGetFeatureJSON.indexOf(maplayer.id) !== -1) {
              infoFormat = 'application/json';
            }

            if (onlineResource.description.indexOf('EMAG2 - Total Magnetic Intensity') >= 0) {
              infoFormat = 'text/xml';
            }

            if (onlineResource.description.indexOf('Onshore Seismic Surveys') >= 0) {
              infoFormat = 'text/xml';
            }

            this.queryWMSService.getFeatureInfo(onlineResource, sldBody, infoFormat, postMethod,
              maplayer.clickCoord[0], maplayer.clickCoord[1], params.x, params.y, params.width, params.height, params.bbox).subscribe(
                result => {
                  const feature = {onlineResource: onlineResource, layer: maplayer};
                  // Display the modal, but only if there are features
                  const num_feats = me.setModal(maplayer.id, result, feature, mapClickInfo.clickCoord);

                  // If zoom level is too low and nothing is found then show zoom message
                  if (num_feats === 0 && params.level <= 3) {
                    me.displayModal(mapClickInfo.clickCoord);
                    me.bsModalRef.content.downloading = false;
                    me.bsModalRef.content.showZoomMsg = true;
                  }
                },
                err => {
                  me.bsModalRef.content.onDataChange();
                  me.bsModalRef.content.downloading = false;
                }
              );
          }
        }
      }
    }
  }


  /**
   * Convert CSW record to HTML for display
   * @param cswRecord CSW record to be converted
   * @returns HTML string
   */
  private parseCSWtoHTML(cswRecord: CSWRecordModel): string {
    let html =  '<div class="row"><div class="col-md-3">Source</div><div class="col-md-9"><a style="color: #000000" href="' + cswRecord.recordInfoUrl + '">Full Metadata and download</a></div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Title</div><div class="col-md-9">' + cswRecord.name + '</div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Abstract</div><div class="col-md-8"><div class="row" style="height: 100px;overflow-y: scroll;margin-left:0">' +
       cswRecord.description + '</div></div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Keywords</div><div class="col-md-9">' + cswRecord.descriptiveKeywords + '</div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Organization</div><div class="col-md-9">' + cswRecord.contactOrg + '</div></div><hr>';

    html +=  '<div class="row"><div class="col-md-3">Resource link</div><div class="col-md-9">';
    for (const onlineResource of cswRecord.onlineResources) {
      html += '<p><a style="color: #000000" href="' + onlineResource.url + '">' + (onlineResource.name ? onlineResource.name : 'Web resource link') + '</a></p>';
    }
    html += '</div></div>';

    return html;
  }


  /**
   * Display the querier modal on map click
   * @param clickCoord map click coordinates
   */
  private displayModal(clickCoord: {x: number, y: number, z: number}|null) {
    if (!this.modalDisplayed) {
      this.bsModalRef = this.modalService.show(QuerierModalComponent, {class: 'modal-lg'});
      this.modalDisplayed = true;
      this.bsModalRef.content.downloading = true;
      /*
      if (clickCoord) {
        const vector = this.csMapService.drawDot(clickCoord);
        this.modalService.onHide.subscribe(reason => {
          if (vector)  {
            this.csMapService.removeVector(vector);          }
        })
      }
      */
    }
  }


  /**
   * Hide the querier modal
   */
  private hideModal() {
    if (this.bsModalRef) {
      this.bsModalRef.hide();
    }
  }

  /**
   * Parse JSON response. This is used for responses from GSKY servers
   * but could be adapted for other servers at a later date
   * @param result response string to be processed
   * @param feature map feature object
   * @returns list of objects; for each object keys are: 'key'
   */
  private parseJSONResponse(result: string, feature: any): any[] {
    const treeCollections = [];
    try {
      // Parse result and check type
      const jsonObj = JSON.parse(result);
      const type = Object.prototype.toString.call(jsonObj);
      // Make sure it is an object or array and not 'null' or 'true' or 'false'
      if (type === '[object Object]' || type === '[object Array]') {
        if (jsonObj.type && jsonObj.type === 'FeatureCollection' && jsonObj.features) {
          for (const jsonFeature of jsonObj.features) {
            if (jsonFeature.properties && jsonFeature.properties.error) {
              // Remove GSKY error about 'Requested width/height is too large, max width:512, height:512'
              // NB: This can be removed once NCI improve the GSKY server so that there is a bigger limit on
              // WIDTH/HEIGHT parameter for the OGC WMS GetFeatureInfo request
              if (jsonFeature.properties.error) {
                delete jsonFeature.properties.error;
              }
            }
            // Type is always Feature, not useful
            if (jsonFeature.type) {
              delete jsonFeature.type;
            }
            // Convert coordinates to string (multiple levels of arrays made Loop3D coords unreadable)
            if (jsonFeature.geometry && jsonFeature.geometry.coordinates) {
              jsonFeature.geometry.coordinates = JSON.stringify(jsonFeature.geometry.coordinates);
            }
            // Create a JSON-based feature
            treeCollections.push({
              // Loop3D layers uniquely identified by id field not present in GSKY
              key: jsonFeature.id ? jsonFeature.id : feature.layer.name,
              layer: feature.layer,
              onlineResource: feature.onlineResource,
              value: jsonFeature,
              format: 'JSON'
            });
          }
        }
      }
    } catch (err) {
        return [];
    }
    return treeCollections;
  }


  /**
   * Set the modal dialog with the layers that have been clicked on
   * @param layerId the ID of the layer
   * @param result response string
   * @param feature map feature object
   * @param clickCoord map click coordinates
   * @param gmlid a optional filter to only display the gmlId specified
   */
  private setModal(layerId: string, result: string, feature: any, clickCoord: {x: number, y: number, z: number}|null, gmlid?: string) {
    let treeCollections = [];
    // Some layers return JSON
    if (config.wmsGetFeatureJSON.indexOf(layerId) !== -1) {
      treeCollections = this.parseJSONResponse(result, feature);
    } else {
      treeCollections = SimpleXMLService.parseTreeCollection(this.gmlParserService.getRootNode(result), feature);
    }
    let featureCount = 0;
    for (const treeCollection of treeCollections) {
      this.displayModal(clickCoord);
      if (gmlid && gmlid !== treeCollection.key) {
        continue;
      }
      featureCount++;
      if (featureCount >= 10) {
        this.setModalHTML('<p>Too many features to list, zoom in the map to get a more precise location</p>',
          '...', feature, this.bsModalRef);
        break;

      }
      treeCollection.raw = result;
      this.bsModalRef.content.docs.push(treeCollection);
      if (this.bsModalRef.content.uniqueLayerNames.indexOf(feature.layer.name) === -1) {
        this.bsModalRef.content.uniqueLayerNames.push(feature.layer.name);
      }
    }

    if (featureCount > 0) {
      this.bsModalRef.content.downloading = false;
      this.bsModalRef.content.onDataChange();
    }
    return featureCount;
  }


  /**
   * Set the modal dialog with an HTML message
   * @param html HTML response string
   * @param key label for the message
   * @param feature map feature object
   * @param bsModalRef modal dialog reference
   */
  private setModalHTML(html: string, key: any, layer: LayerModel, bsModalRef: BsModalRef) {
      bsModalRef.content.htmls.push({
        key: key,
        layer: layer,
        value: html
      });
      if (bsModalRef.content.uniqueLayerNames.indexOf(layer.name) === -1) {
        bsModalRef.content.uniqueLayerNames.push(layer.name)
      }
     this.bsModalRef.content.downloading = false;
     this.bsModalRef.content.onDataChange();
  }

  /**
   * Updates the imagerySplitPosition when the slider is moved
   * @param movement mouse event
   */
  private moveSlider = (movement) => {
    if (!this.sliderMoveActive) {
      return;
    }
    // New position is slider position + the relative mouse offset
    let newSliderPosition = this.mapSlider.nativeElement.offsetLeft + movement.endPosition.x;
    // Make sure we haven't gone too far left (slider < 0) or right (slider > map width - slider width)
    if (newSliderPosition < 0) {
      newSliderPosition = 0;
    } else if (newSliderPosition > (this.mapElement.nativeElement.offsetWidth - this.mapSlider.nativeElement.offsetWidth)) {
      newSliderPosition = this.mapElement.nativeElement.offsetWidth - this.mapSlider.nativeElement.offsetWidth;
    }
    const splitPosition = newSliderPosition / this.mapElement.nativeElement.offsetWidth;
    this.mapSlider.nativeElement.style.left = 100.0 * splitPosition + '%';
    this.viewer.scene.imagerySplitPosition = splitPosition;
  }

  /**
   * Split map toggled on/off
   * If on, sets imagerySplitPosition and adds handlers
   * If off, resets all active layer split directions to NONE
   */
  public toggleShowMapSplit() {
    this.csMapService.setSplitMapShown(!this.csMapService.getSplitMapShown());
    if (this.csMapService.getSplitMapShown()) {
        setTimeout(() => {
          this.viewer.scene.imagerySplitPosition = this.mapSlider.nativeElement.offsetLeft / this.mapElement.nativeElement.offsetWidth;
          const handler = new ScreenSpaceEventHandler(this.mapSlider.nativeElement);
          handler.setInputAction(() => {
            this.sliderMoveActive = true;
          }, ScreenSpaceEventType.LEFT_DOWN);
          handler.setInputAction(() => {
            this.sliderMoveActive = true;
          }, ScreenSpaceEventType.PINCH_START);
          handler.setInputAction(this.moveSlider, ScreenSpaceEventType.MOUSE_MOVE);
          handler.setInputAction(this.moveSlider, ScreenSpaceEventType.PINCH_MOVE);
          handler.setInputAction(() => {
            this.sliderMoveActive = false;
          }, ScreenSpaceEventType.LEFT_UP);
          handler.setInputAction(() => {
            this.sliderMoveActive = false;
          }, ScreenSpaceEventType.PINCH_END);
        }, 10);

    } else {
      const activeLayerKeys: string[] = Object.keys(this.csMapService.getLayerModelList());
      for(const layer of activeLayerKeys) {
        this.csMapService.setLayerSplitDirection(this.csMapService.getLayerModelList()[layer], ImagerySplitDirection.NONE);
      }
    }
  }

  /**
   * Get whether the map split is shown
   */
  public getSplitMapShown(): boolean {
    return this.csMapService.getSplitMapShown();
  }

}
