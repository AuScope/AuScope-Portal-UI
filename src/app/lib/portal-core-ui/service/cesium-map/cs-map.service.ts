import { CSWRecordModel } from '../../model/data/cswrecord.model';
import { Injectable, Inject } from '@angular/core';
import {BehaviorSubject, Subject } from 'rxjs';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import bboxPolygon from '@turf/bbox-polygon';
import { LayerModel } from '../../model/data/layer.model';
import { ManageStateService } from '../permanentlink/manage-state.service';
import { CsCSWService } from '../wcsw/cs-csw.service';
import { CsMapObject } from './cs-map-object';
import { CsWMSService } from '../wms/cs-wms.service';
import { ResourceType } from '../../utility/constants.service';
import { CsIrisService } from '../kml/cs-iris.service';
import { CsKMLService } from '../kml/cs-kml.service';
import { CsVMFService } from '../vmf/cs-vmf.service';
import { MapsManagerService, RectangleEditorObservable, EventRegistrationInput, CesiumEvent, EventResult } from '@auscope/angular-cesium';
import { Entity, ProviderViewModel, buildModuleUrl, OpenStreetMapImageryProvider, BingMapsStyle, BingMapsImageryProvider,
         ArcGisMapServerImageryProvider, Cartesian2, WebMercatorProjection,  SplitDirection, 
         Rectangle} from 'cesium';
import { UtilitiesService } from '../../utility/utilities.service';
import ImageryLayerCollection from 'cesium/Source/Scene/ImageryLayerCollection';
import { CsGeoJsonService } from '../geojson/cs-geojson.service';
declare var Cesium: any;

/**
 * Wrapper class to provide all things related to the drawing of polygons and bounding boxes in CesiumJS
 */
@Injectable()
export class CsMapService {

  // VT: a storage to keep track of the layers that have been added to the map. This is use to handle click events.
  private layerModelList: Array<LayerModel> = new Array<LayerModel>();
  private addLayerSubject: Subject<LayerModel>;

  private clickedLayerListBS = new BehaviorSubject<any>({});
  // Cesium map
  private map;

  // If the split map pane is visible or not
  private splitMapShown = false;

  constructor(private csWMSService: CsWMSService,
              private csMapObject: CsMapObject, private manageStateService: ManageStateService,
              private csCSWService: CsCSWService, private csIrisService: CsIrisService,
              private csKMLService: CsKMLService, private mapsManagerService: MapsManagerService,
              private csVMFService: CsVMFService, private csGeoJsonService: CsGeoJsonService,
              @Inject('env') private env, @Inject('conf') private conf)  {
    this.csMapObject.registerClickHandler(this.mapClickHandler.bind(this));
    this.addLayerSubject = new Subject<LayerModel>();
  }

  public init() {
    this.map = this.mapsManagerService.getMap();
    const eventRegistration: EventRegistrationInput = {
      event: CesiumEvent.LEFT_CLICK
    };
    const mapEventManager = this.mapsManagerService.getMap().getMapEventsManager();
    mapEventManager.register(eventRegistration).subscribe((result) => {
      this.mapClickHandler(result);
    });
  }

  /**
   * Fetches Cesium 'Viewer'
   */
  public getViewer() {
    return this.mapsManagerService.getMap().getCesiumViewer();
  }

  /**
   * get a observable subject that triggers an event whenever a map is clicked on
   * @returns the observable subject that returns the list of map layers that was clicked on in the format {clickedFeatureList,
   *         clickedLayerList, pixel,clickCoord}
   */
  public getClickedLayerListBS(): BehaviorSubject<any> {
    return this.clickedLayerListBS;
  }

  /**
   * Pick all Entities at the given position
   * @param windowPosition window position of mouse click event
   * @returns an Array of Cesium.Entity objects at specified position
   */
  public pickEntities(windowPosition: Cartesian2): Entity[] {
    const pickedPrimitives = this.getViewer().scene.drillPick(windowPosition);
    const result = [];
    const hash = {};
    for (const picked of pickedPrimitives) {
      const entity = Cesium.defaultValue(picked.id, picked.primitive.id);
      if (entity instanceof Cesium.Entity &&
          !Cesium.defined(hash[entity.id])) {
        result.push(entity);
        hash[entity.id] = true;
      }
    }
    return result;
  }

  /**
   * Gets called when a map click event is recognised
   * @param pixel coordinates of clicked on pixel (units: pixels)
   */
  public mapClickHandler(eventResult: EventResult) {
    try {
      // Filter out drag event
      if (!eventResult.movement ||
          Math.abs(eventResult.movement.startPosition.x - eventResult.movement.endPosition.x) > 2 ||
          Math.abs(eventResult.movement.startPosition.y - eventResult.movement.endPosition.y) > 2) {
        return;
      }
      const pixel = eventResult.movement.startPosition;
      if (!pixel || !pixel.x || !pixel.y) {
        return;
      }
      const mousePosition = new Cartesian2(pixel.x, pixel.y);
      const viewer = this.map.getCesiumViewer();
      const ellipsoid = viewer.scene.globe.ellipsoid;
      const cartesian = viewer.camera.pickEllipsoid(mousePosition, ellipsoid);
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      let lon = Cesium.Math.toDegrees(cartographic.longitude);
      let lat = Cesium.Math.toDegrees(cartographic.latitude);
      if (!Number(lat) || !Number(lon)) {
        return;
      }

      lon = Number.parseFloat(lon).toFixed(5);
      lat = Number.parseFloat(lat).toFixed(5);
      const clickCoord = new WebMercatorProjection().project(cartographic);
      // Create a GeoJSON point
      const clickPoint = point([lon, lat]);
      // Compile a list of clicked on layers
      const clickedLayerList: LayerModel[] = [];

      // tslint:disable-next-line:forin
      for (const layerModel of this.layerModelList) {
        if (!UtilitiesService.layerContainsResourceType(layerModel, ResourceType.WMS) &&
            !UtilitiesService.layerContainsResourceType(layerModel, ResourceType.WWW) &&
            !UtilitiesService.layerContainsBboxGeographicElement(layerModel)) {
          continue;
        }
        const cswRecords = layerModel.cswRecords;
        layerModel.clickCSWRecordsIndex = [];
        for (let i = 0; i < cswRecords.length; i++) {
          let bboxes = [];
          // Look for 'geographicElements' in 'onlineResource's
          if (cswRecords[i].onlineResources.length > 0 && 
              cswRecords[i].onlineResources[0].hasOwnProperty('geographicElements') &&
              cswRecords[i].onlineResources[0].geographicElements.length > 0) {
            // Only take the first one, assuming all the onlineresoures have the same bbox
            bboxes = cswRecords[i].onlineResources[0].geographicElements;
          // Look for 'geographicElements' in the cswRecord
          } else if (cswRecords[i].hasOwnProperty('geographicElements') && cswRecords[i].geographicElements.length > 0) {
            bboxes = cswRecords[i].geographicElements;
          }
          if (!bboxes || bboxes.length == 0) {
            console.error("Cannot process map click: geographic elements missing from layer metadata - " + cswRecords[i].name);
            continue;
          }

          // 'margin' is used to expand the bbox slightly to make it easy to select features on the boundary
          const margin = 0.05;
          for (const bbox of bboxes) {
            const poly = bboxPolygon([bbox.westBoundLongitude - margin, bbox.southBoundLatitude - margin,
                                    bbox.eastBoundLongitude + margin, bbox.northBoundLatitude + margin]);
            if (booleanPointInPolygon(clickPoint, poly)) {
              // Add to list of clicked layers
              layerModel.clickPixel = [pixel.x, pixel.y];
              layerModel.clickCoord = [lon, lat];
              layerModel.clickCSWRecordsIndex.push(i);
              break;
            }
          }
        }
        if (layerModel.clickCSWRecordsIndex.length > 0) {
          clickedLayerList.push(layerModel);
        }
      }

      // Compile a list of clicked on entities
      const clickedEntityList: any[] = [];
      const pickedEntities: any[] = this.pickEntities(mousePosition);
      for (const entity of pickedEntities) {
        // TODO: Filter out polygon filter?
        clickedEntityList.push(entity);
      }
      if (clickedEntityList.length || clickedLayerList.length) {
        this.clickedLayerListBS.next({
          clickedEntityList,
          clickedLayerList,
          pixel,
          clickCoord
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a list of current map supported OnlineResource types.
   * Excludes config CSW renderer list.
   * @returns a list of supported OnlineResource types as strings
   */
  public getSupportedOnlineResourceTypes(): ResourceType[] {
    return [ResourceType.WMS, ResourceType.IRIS, ResourceType.KML, ResourceType.KMZ, ResourceType.VMF, ResourceType.GEOJSON];
  }

  /**
   * Check if a layer is supported to be added to the map
   * @param layer layer to be added to map
   * @returns true if layer is supported, false otherwise
   */
  public isMapSupportedLayer(layer: LayerModel): boolean {
    if (this.conf.cswrenderer && this.conf.cswrenderer.includes(layer.id)) {
      return true;
    }
    for (const resourceType of this.getSupportedOnlineResourceTypes()) {
      if (UtilitiesService.layerContainsResourceType(layer, resourceType)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Updates this service's layer models with new filter values so they can be displayed
   * 
   * @param layerId id string of layer
   * @param optionalFilters list of optional filters to be enabled
   */
  public updateFilterDisplay(layerId: string, optionalFilters) {
    const layer = this.getLayerModel(layerId);
    if (layer?.filterCollection) {
      // Optional filters
      for (const layerFilt of layer.filterCollection.optionalFilters) {
        for (const optFilt of optionalFilters) {
          if (layerFilt.label === optFilt.label) {
            // Set value of filter
            layerFilt.value = optFilt.value;
            // Set 'added' to 'true' so that this filter is displayed in filter panel component
            layerFilt.added = true;
          }
        }
      }
    }
  }
  
  /**
   * Add a layer to the map. Calls other 'addLayer' functions according to the resource type
   * e.g. WMS, CSW, KML ...
   * 
   * @param layer the layer to add to the map
   */
  public addLayer(layer: LayerModel, param: any): void {
    layer.initialLoad = true;
    // initiate csLayers to prevent undefined errors
    if (!layer.csLayers) {
      layer.csLayers = [];
    }
    // Remove layer if already present
    if (this.layerExists(layer.id)) {
      this.removeLayer(layer);
    }
    // Add layer depending on type
    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WMS)) {
      // Add a WMS layer to map
      this.csWMSService.addLayer(layer, param);
      this.cacheLayerModelList(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.IRIS)) {
      // Add an IRIS layer
      this.csIrisService.addLayer(layer, param);
      this.cacheLayerModelList(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.VMF)) {
      // Add a GeoJSON layer to map
      this.csVMFService.addLayer(layer, param);
      this.cacheLayerModelList(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.KMZ)) {
      // Add a KMZ layer to map
      this.csKMLService.addLayer(layer, param);
      this.cacheLayerModelList(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.KML)) {
      // Add a KML layer to map
      this.csKMLService.addLayer(layer, param);
      this.cacheLayerModelList(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.GEOJSON)) {
      // Add a GeoJson layer to map
      this.csGeoJsonService.addLayer(layer, param);
      this.cacheLayerModelList(layer);
    } 
    // Stu: be sure to leave whole blocks commented out until implemented or records with these resources will
    //      fire before hitting the catch-all CSW element below which should always remain the last in the chain
    /*
    else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WFS)) {
      // Add a WFS layer to map
      // FIXME this.csWFSService.addLayer(layer, param);
      // FIXME this.layerModelList[layer.id] = layer;
      // TODO: Add to getSupportedOnlineResourceTypes() when supported
    }
    */
    /*
    else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WWW)) {
      // Add a WWW layer to map
      // FIXME this.csWWWService.addLayer(layer, param);
      // FIXME this.layerModelList[layer.id] = layer;
      // TODO: Add to getSupportedOnlineResourceTypes() when supported
    }
    */
    else if(UtilitiesService.layerContainsBboxGeographicElement(layer)) {
      this.csCSWService.addLayer(layer);
      this.cacheLayerModelList(layer);
    } else {
      throw new Error('No Suitable service found');
    }

    // Zoom to initialBBox if one has been set
    if (layer["geojson"]) {
      if (layer["geojson"]["bbox"]) {
        let lon1 = 0, lon2 = 0, lat1 = 0, lat2 = 0
        const bbox = layer["geojson"]["bbox"];
        let i = 0;
        for (const coord of bbox) {
          if (i == 0) {
            lon1 = parseFloat(coord[0]);
            lat1 = parseFloat(coord[1]);
          } else {
            lon2 = parseFloat(coord[0]);
            lat2 = parseFloat(coord[1]);
          }
          i = i + 1;
        }
        const bboxDataset = Rectangle.fromDegrees(lon1, lat1, lon2, lat2);
        this.map.getCameraService().cameraFlyTo({ destination: bboxDataset });
      }
    }

  }

  /**
   * Add new layer to layer model list
   * @param layer layer
   */
  private cacheLayerModelList(layer: LayerModel) {
    const existingLayerIndex = this.layerModelList.findIndex(l => l.id === layer.id);
    if (existingLayerIndex === -1) {
      this.layerModelList.push(layer);
    } else {
      this.layerModelList[existingLayerIndex] = layer;
    }
    this.addLayerSubject.next(layer);
  }

   /**
    *  In the event we have custom layer that is handled outside olMapService, we will want to register that layer here so that
    *  it can be handled by the clicked event handler.
    *  this is to support custom layer renderer such as iris that uses kml
    */
   public appendToLayerModelList(layer) {
     this.cacheLayerModelList(layer);
   }

  /**
   * Add layer to the map. taking a short cut by wrapping the csw in a layerModel
   * @param layer the layer to add to the map
   */
  public addCSWRecord(cswRecord: CSWRecordModel): void {
    const itemLayer = new LayerModel();
    itemLayer.cswRecords = [cswRecord];
    itemLayer['expanded'] = false;
    itemLayer.id = cswRecord.id;
    itemLayer.description = cswRecord.description;
    itemLayer.hidden = false;
    itemLayer.layerMode = 'NA';
    itemLayer.name = cswRecord.name;
    itemLayer.splitDirection = SplitDirection.NONE;
    try {
      this.addLayer(itemLayer, {});
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove layer from map
   * @param layer the layer to remove from the map
   */
  public removeLayer(layer: LayerModel): void {
    this.csMapObject.removeLayerById(layer.id);
    this.manageStateService.removeLayer(layer.id);
    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WMS)) {
      this.csWMSService.rmLayer(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.IRIS)) {
      this.csIrisService.rmLayer(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.VMF)) {
      this.csVMFService.rmLayer(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.KML)) {
      this.csKMLService.rmLayer(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.KMZ)) {
      this.csKMLService.rmLayer(layer);
    } else if (UtilitiesService.layerContainsResourceType(layer, ResourceType.GEOJSON)) {
      this.csGeoJsonService.rmLayer(layer);
    } else if (UtilitiesService.layerContainsBboxGeographicElement(layer)) {
      this.csCSWService.rmLayer(layer);
    } else {
      this.csWMSService.rmLayer(layer);
    }
    this.layerModelList = this.layerModelList.filter(l => l.id !== layer.id);
  }

  /**
   * Remove a layer by its ID
   * @param layerId the layer ID
   */
  removeLayerById(layerId: string) {
    const layer = this.layerModelList.find(l => l.id === layerId);
    if (layer) {
      this.removeLayer(layer);
    }
  }

  /**
   * Retrieve the layer model given an id string
   * @param layerId layer's id string
   */
  public getLayerModel(layerId: string): LayerModel {
    return this.layerModelList.find(layer => layer.id === layerId);
  }

  /**
   * Check if the layer denoted by layerId has been added to the map
   * @param layerId the ID of the layer to check for
   */
  public layerExists(layerId: string): boolean {
    return (this.layerModelList.find(layer => layer.id === layerId) !== undefined);
  }

  /**
   * Find which layer (if any) contains the given Cesium.Entity
   * @param entity the Cesium.Entity
   * @returns the LayerModel containing the Cesium
   */
  public getLayerForEntity(entity: Entity): LayerModel {
    for (const layer of this.layerModelList) {
      for (const csLayer of layer.csLayers) {
          if (csLayer.entities && csLayer.entities.values.indexOf(entity) !== -1) {
              return layer;
          }
      }
    }
    return null;
  }

  /**
   * Set the opacity of a layer
   * @param layerId the ID of the layer to change opacity
   * @param opacity the value of opacity between 0.0 and 1.0
   */
  public setLayerOpacity(layer: LayerModel, opacity: number) {
    if (this.layerExists(layer.id)) {
      if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WMS)) {
        this.csWMSService.setLayerOpacity(layer, opacity);
      } else if (UtilitiesService.layerContainsBboxGeographicElement(layer)) {
        this.csCSWService.setLayerOpacity(layer, opacity);
      }
    }
  }

  /**
   * Test whether a layer supports opacity, currently we only support WMS and
   * anything added as a CSW bbox
   *
   * @param layer the layer
   * @returns true if a layer supports opacity, false otherwise
   */
  public layerHasOpacity(layer: LayerModel): boolean {
    if (this.layerExists(layer.id)) {
      if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WMS) || 
          UtilitiesService.layerContainsBboxGeographicElement(layer)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieve the active layer list
   */
  public getLayerModelList(): Array<LayerModel> {
    return this.layerModelList;
  }

  public getAddLayerSubject(): Subject<LayerModel> {
    return this.addLayerSubject;
  }

  /**
   * Fit the map to the extent that is provided
   * @param extent An array of numbers representing an extent: [minx, miny, maxx, maxy]
   */
  public fitView(extent: [number, number, number, number]): void {
    const northWest = UtilitiesService.coordinates3857To4326(extent[0], extent[1]);
    const northEast = UtilitiesService.coordinates3857To4326(extent[2], extent[1]);
    const southEast = UtilitiesService.coordinates3857To4326(extent[2], extent[3]);
    const southWest = UtilitiesService.coordinates3857To4326(extent[0], extent[3]);
    const extentPoly = this.getViewer().entities.add({
      polygon : {
        hierarchy : Cesium.Cartesian3.fromDegreesArray([
          northWest[0], northWest[1],
          northEast[0], northEast[1],
          southEast[0], southEast[1],
          southWest[0], southWest[1]
        ]),
        height : 0,
        material : new Cesium.Color(128, 128, 128, 0.25),
        outline : true,
        outlineColor : Cesium.Color.BLACK
      }
    });
    // Leave the highlight for 2 seconds after zooming, then remove
    this.getViewer().zoomTo(extentPoly).then(() => {
      setTimeout(() => {
        this.getViewer().entities.remove(extentPoly);
      }, 2000);
    });
  }

  /**
   * Zoom the map in one level
   */
  public zoomMapIn(): void {
    // FIXME this.csMapObject.zoomIn();
  }

  /**
   * Zoom the map out one level
   */
  public zoomMapOut(): void {
    // FIXME this.csMapObject.zoomOut();
  }

  /**
   * DrawBound
   * @returns a observable object that triggers an event when the user have completed the task
   */
  public drawBound(): RectangleEditorObservable {
    return this.csMapObject.drawBox();
  }

  /**
   * Create a list of base maps from the environment file
   */
  public createBaseMapLayers(): any[] {
    const baseMapLayers: any[] = [];
    for (const layer of this.env.baseMapLayers) {
      if (layer.layerType === 'OSM') {
        baseMapLayers.push(
          new ProviderViewModel({
            name: layer.viewValue,
            iconUrl: buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
            tooltip: layer.tooltip,
            creationFunction() {
              return new OpenStreetMapImageryProvider({
                url: 'https://tile.openstreetmap.org/',
              });
            },
          })
        );
      } else if (layer.layerType === 'Bing' && this.env.hasOwnProperty('bingMapsKey') &&
                 this.env.bingMapsKey.trim() && this.env.bingMapsKey !== 'Bing_Maps_Key') {
        let bingMapsStyle = BingMapsStyle.AERIAL;
        let bingMapsIcon = '';
        switch (layer.value) {
          case 'Aerial':
            bingMapsStyle = BingMapsStyle.AERIAL;
            bingMapsIcon = 'bingAerial.png';
            break;
          case 'AerialWithLabels':
            bingMapsStyle = BingMapsStyle.AERIAL_WITH_LABELS;
            bingMapsIcon = 'bingAerialLabels.png';
            break;
          case 'Road':
          default:
            bingMapsStyle = BingMapsStyle.ROAD;
            bingMapsIcon = 'bingRoads.png';
            break;
        }
        baseMapLayers.push(
          new ProviderViewModel({
            name: layer.viewValue,
            iconUrl: buildModuleUrl('Widgets/Images/ImageryProviders/' + bingMapsIcon),
            tooltip: layer.tooltip,
            creationFunction() {
              return new BingMapsImageryProvider({
                url: 'https://dev.virtualearth.net',
                key: this.env.bingMapsKey,
                mapStyle: bingMapsStyle,
                // defaultAlpha: 1.0,
              });
            },
          })
        );
      } else if (layer.layerType === 'ESRI') {
        const esriUrl =
          'https://services.arcgisonline.com/ArcGIS/rest/services/' + layer.value + '/MapServer';
        let esriIcon = '';
        switch (layer.value) {
          case 'World_Imagery':
            esriIcon = 'esriWorldImagery.png';
            break;
          case 'NatGeo_World_Map':
            esriIcon = 'esriNationalGeographic.png';
            break;
          case 'World_Street_Map':
            esriIcon = 'esriWorldStreetMap.png';
            break;
          // No provided icon
          case 'World_Terrain_Base':
            esriIcon = 'esriWorldTerrainBase.png';
            break;
          case 'World_Topo_Map':
            esriIcon = 'esriWorldTopoMap.png';
            break;
          // Only shows internal borders
          case 'Reference/World_Boundaries_and_Places':
            esriIcon = 'esriWorldBoundariesAndPlaces.png';
            break;
          case 'Canvas/World_Dark_Gray_Base':
            esriIcon = 'esriWorldDarkGrayBase.png';
            break;
          case 'Canvas/World_Light_Gray_Base':
            esriIcon = 'esriWorldLightGrayBase.png';
            break;
        }
        baseMapLayers.push(
          new ProviderViewModel({
            name: layer.viewValue,
            iconUrl: buildModuleUrl('Widgets/Images/ImageryProviders/' + esriIcon),
            tooltip: layer.tooltip,
            creationFunction() {
              return new ArcGisMapServerImageryProvider({
                url: esriUrl,
              });
            },
          })
        );
      }
    }
    return baseMapLayers;
  }

  /**
   * Set the direction of the split pane that the specified layer is to appear in
   * @param layer the layer to appear in the left, right or both split panes
   * @param splitDirection the direction the layer is to appear in (ImageryLayerSplitDirection.[LEFT|RIGHT|NONE])
   */
  public setLayerSplitDirection(layer: LayerModel, splitDirection: SplitDirection) {
    layer.splitDirection = splitDirection;
    const viewer = this.map.getCesiumViewer();
    for (const cesiumLayer of layer.csLayers) {
      const layerIndex = viewer.imageryLayers.indexOf(cesiumLayer);
      const imageryLayer = viewer.imageryLayers.get(layerIndex);
      if (imageryLayer !== undefined) {
        imageryLayer.splitDirection = splitDirection;
      }
    }
  }

  /**
   * Is the map split shown?
   */
  public getSplitMapShown(): boolean {
    return this.splitMapShown;
  }

  /**
   * Set whether the map split is shown
   * @param splitMapShown set the map split shown to this value
   */
  public setSplitMapShown(splitMapShown: boolean) {
    this.splitMapShown = splitMapShown;
  }

  /**
   * Retrieve the index of the layer within the layerModelList. That is, the list of top-level layers,
   * not the csLayers that comprise a top-level layer.
   * @param layerId the ID of the layer
   * @returns th eindex of the layer within the layerModelList, or -1 if the layer cannot be found
   */
  public getLayerIndex(layerId: string): number {
    return this.layerModelList.indexOf(this.layerModelList.find(l => l.id === layerId));
  }

  /**
   * Get a list of array inices for a LayerModel's csLayers within the Viewer's ImageryLayerCollection
   * @param layer the layer
   * @returns an array of integers representing the indices of the various csLayers in the ImageryLayerCollection
   */
  private getCsLayerPositionsForLayer(layer: LayerModel): number[] {
    const layerIndices: number[] = [];
    if (layer) {
      const imageryCollection: ImageryLayerCollection = this.getViewer().imageryLayers;
      for (const csLayer of layer.csLayers) {
        const idx = imageryCollection.indexOf(csLayer);
        if (idx !== -1) {
          layerIndices.push(idx);
        }
      }
      // Not sure if sorting is necessary, but will ensure top and bottom positions are easily identifiable
      layerIndices.sort((a, b) => {
        return a - b;
      });
    }
    return layerIndices;
  }

  /**
   * Move layer a layer to specific position in the layersModelList
   *
   * @param fromIndex from index within the layersModelList. Note that this may contain multiple imagery layers (LayerModel.csLayers).
   * @param toIndex to index within the layersModelList. Note that this may contain multiple imagery layers (LayerModel.csLayers).
   */
  public moveLayer(fromIndex: number, toIndex: number) {
    const fromLayer = this.layerModelList[fromIndex];
    const toLayer = this.layerModelList[toIndex];
    // Move layer in layerModelList
    this.layerModelList.splice(toIndex, 0, this.layerModelList.splice(fromIndex, 1)[0]);
    // Move Cesium layers
    const fromCesiumLayerIndices: number[] = this.getCsLayerPositionsForLayer(fromLayer);
    const toCesiumLayerIndices: number[] = this.getCsLayerPositionsForLayer(toLayer);
    const imageryCollection: ImageryLayerCollection = this.getViewer().imageryLayers;
    // If fromIndex greater, lower the layer, else raise
    if (fromIndex > toIndex) {
      const layerPositionsToMove = fromCesiumLayerIndices[0] - toCesiumLayerIndices[0];
      for (const i of fromCesiumLayerIndices) {
        const layerToMove = imageryCollection.get(i);
        for (let j = 0; j < layerPositionsToMove; j++) {
          imageryCollection.lower(layerToMove);
        }
      }
    } else {
      const layerPositionsToMove = toCesiumLayerIndices[toCesiumLayerIndices.length - 1] -
                                   fromCesiumLayerIndices[fromCesiumLayerIndices.length - 1];
      for (let i = fromCesiumLayerIndices.length - 1; i >= 0; i--) {
        const layerToMove = imageryCollection.get(fromCesiumLayerIndices[i]);
        for (let j = 0; j < layerPositionsToMove; j++) {
          imageryCollection.raise(layerToMove);
        }
      }
    }
  }

  /**
   * Set the current base map layer by name
   *
   * @param baseMapLayer the name of the base map layer
   */
  public setBaseMapLayer(baseMapLayer: string) {
    const basemap = this.getViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(ipvm => ipvm.name === baseMapLayer);
    if (basemap) {
      this.getViewer().baseLayerPicker.viewModel.selectedImagery = basemap;
    }
  }

}
