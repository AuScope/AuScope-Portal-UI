import { RenderStatusService } from './renderstatus/render-status.service';
import { UtilitiesService } from '../../utility/utilities.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject} from 'rxjs';
import { EditActions, MapsManagerService, PolygonEditorObservable, PolygonEditUpdate, PolygonsEditorService,
         RectangleEditorObservable, RectanglesEditorService } from '@auscope/angular-cesium';
import { Camera, Cartesian2, Cartesian3, Color, ColorMaterialProperty, Ellipsoid, SceneMode, ScreenSpaceEventHandler,
         ScreenSpaceEventType, WebMercatorProjection } from 'cesium';
import { LayerModel } from '../../model/data/layer.model';
import { MapState } from '../../model/data/mapstate.model';

declare var Cesium;

/**
 * A wrapper around the cesium object for use in the portal.
 */
@Injectable()
export class CsMapObject {

  private groupLayer: {};
  private clickHandlerList: ((p: any) => void )[] = [];
  private ignoreMapClick = false;
  private polygonEditable$: PolygonEditorObservable;
  public isDrawingPolygonBS = new BehaviorSubject<boolean>(false);

  constructor(private renderStatusService: RenderStatusService, private rectangleEditor: RectanglesEditorService,
              private polygonsCesiumEditor: PolygonsEditorService, private mapsManagerService: MapsManagerService) {
    this.groupLayer = {};
  }

  /**
   * Process a map click event by calling click event handlers and passing in map click coordinates
   * 
   * @param p map click coordinates
   * @returns 
   */
  public processClick(p: number[]) {
     if (this.ignoreMapClick) {
       return;
     }
     for (const clickHandler of this.clickHandlerList) {
       clickHandler(p);
     }
  }

  /**
   * Register a click handler callback function which is called when there is a click event
   * @param clickHandler callback function, input parameter is the pixel coords that were clicked on
   */
  public registerClickHandler( clickHandler: (p: number[]) => void) {
    this.clickHandlerList.push(clickHandler);
  }

  /**
   * Returns [width, height] of canvas in pixels
   * 
   * @returns [width, height] of canvas
   */
  public getViewSize(): [number, number] {
    const viewer = this.mapsManagerService.getMap().getCesiumViewer();
    return [viewer.canvas.width, viewer.canvas.height];
  }

  /**
   * Get the current state of the map in an object containing the camera state and scene mode
   * 
   * @returns a MapState object
   */
   public getCurrentMapState(): MapState {
     const camera: Camera = this.mapsManagerService.getMap().getCameraService().getCamera();
     const sceneMode: SceneMode = this.mapsManagerService.getMap().getCesiumViewer().scene.mode;
     const mapState: MapState = {
      camera: { position: camera.position.clone(),
                direction: camera.direction.clone(),
                up: camera.up.clone()
              },
      scene: { mode: sceneMode }
     };
     return mapState;
    }


  /**
   * Given the state of the map in an object, resume the map in the given state
   * 
   * @param mapState The state of the map in simple JSON
   */
   public resumeMapState(mapState: any) {
     this.mapsManagerService.getMap().getCesiumViewer().scene.mode = mapState.scene.mode;
     const camera: Camera = this.mapsManagerService.getMap().getCameraService().getCamera();
     // Convert simple JSON map state to Cartesian3
     camera.up = new Cartesian3(mapState.camera.up.x, mapState.camera.up.y, mapState.camera.up.z);
     camera.position = new Cartesian3(mapState.camera.position.x, mapState.camera.position.y, mapState.camera.position.z);
     camera.direction = new Cartesian3(mapState.camera.direction.x, mapState.camera.direction.y, mapState.camera.direction.z);
   }

  /**
   * Returns distance (EPSG4326 Degree) of one pixel in the current viewer
   * epsg4326 1.0 degree to 111km roughly
   */
  public getDistPerPixel(): any {
    const viewer = this.mapsManagerService.getMap().getCesiumViewer();
    const width = viewer.canvas.width;
    const height = viewer.canvas.height;
    const posWS = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(1, height), Cesium.Ellipsoid.WGS84);
    const posEN = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(width, 1 ), Cesium.Ellipsoid.WGS84);
    let distPerPixel = 0.01; // 1.11km
    if (posWS != null && posEN != null) {
      const cartographicWS = viewer.scene.globe.ellipsoid.cartesianToCartographic(posWS);
      const cartographicEN = viewer.scene.globe.ellipsoid.cartesianToCartographic(posEN);
      const latDiff = Math.abs(Cesium.Math.toDegrees(cartographicWS.latitude) - Cesium.Math.toDegrees(cartographicEN.latitude)) ;
      const lonDiff = Math.abs(Cesium.Math.toDegrees(cartographicWS.longitude) - Cesium.Math.toDegrees(cartographicEN.longitude)) ;
      const latPerPixel = latDiff / height;
      const lonPerPixel = lonDiff / width;
      distPerPixel = (latPerPixel > lonPerPixel) ? latPerPixel : lonPerPixel;
    }
    return distPerPixel;
  }

  /**
   * A bounding box of the view area in 3d Cartesian map coordinates
   * 
   * @returns [ minX, minY, maxX, maxY ] 
   */
  public getMapViewBounds(): any {
    const viewer = this.mapsManagerService.getMap().getCesiumViewer();
    const width = viewer.canvas.width;
    const height = viewer.canvas.height;
    const posWS = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(1, height), Cesium.Ellipsoid.WGS84);
    const posEN = viewer.camera.pickEllipsoid(new Cesium.Cartesian2(width, 1 ), Cesium.Ellipsoid.WGS84);

    if (posWS != null && posEN != null) {
      const cartographicWS = viewer.scene.globe.ellipsoid.cartesianToCartographic(posWS);
      const cartographicEN = viewer.scene.globe.ellipsoid.cartesianToCartographic(posEN);
      const wmp = new WebMercatorProjection();
      const p1 = wmp.project(cartographicWS);
      const p2 = wmp.project(cartographicEN);
      const bounds = [ p1.x, p1.y, p2.x, p2.y];
      return bounds;
    } else {
      return null;
    }
  }

  /**
   * Add a layer to the map. At the same time keep a reference map of the layers
   * @param layer: the layer to add to map
   * @param id the layer id is used
   */
  public addLayerById(layer: LayerModel, id: string): void {
    if (!this.groupLayer[id]) {
      this.groupLayer[id] = [];
    }
    // LJ:skip the polygon search for getFeatureInfo.
    if (layer.sldBody && layer.sldBody.indexOf('<ogc:Intersects>') >= 0)  {
      // RA: but retain the other filters
      const polygonFilter = UtilitiesService.getPolygonFilter(layer.sldBody);
      layer.sldBody = layer.sldBody.replace(polygonFilter, '');
    }
    this.groupLayer[id].push(layer);
  }

  /**
   * remove references to the layer by layer id.
   * @param id the layer id is used
   */
  public removeLayerById(id: string) {
      delete this.groupLayer[id];
      this.renderStatusService.resetLayer(id);
  }

  /**
   * Method for rendering a polygon shape (EPSG:4326 Lng lat format) on the map.
   * @param coordsArray [139,-33 141,-33 142,-36 139,-36 139,-33 lng,lat]
   */
  public renderPolygon(coordsArray: Number[]) {
    if (this.polygonEditable$) {
      this.clearPolygon();
    }
    const polygon = Cesium.Cartesian3.fromDegreesArray(coordsArray); // [-115.0, 37.0, -107.0, 33.0]);
    this.polygonEditable$ = this.polygonsCesiumEditor.edit(polygon);
    this.polygonEditable$.disable();
    this.isDrawingPolygonBS.next(false);

  }

  /**
   * Method for drawing a polygon shape on the map. e.g selecting a polygon bounding box on the map
   * @returns a observable object that triggers an event when the user complete the drawing
   */
  public drawPolygon(): BehaviorSubject<string> {
    this.ignoreMapClick = true;
    if (this.polygonEditable$) {
      this.clearPolygon();
    }
    const element = document.getElementsByTagName('canvas')[0];
    element.style.cursor = 'crosshair';
    this.isDrawingPolygonBS.next(true);
    // create accepts PolygonEditOptions object
    this.polygonEditable$ = this.polygonsCesiumEditor.create({
      pointProps: {
        color: Color.SKYBLUE .withAlpha(0.9),
        outlineColor: Color.BLACK.withAlpha(0.8),
        outlineWidth: 1,
        pixelSize: 13,
      },
      polygonProps: {
        material: new ColorMaterialProperty(Color.LIGHTSKYBLUE.withAlpha(0.05)),
        fill: true,
      },
      polylineProps: {
        material: () => new ColorMaterialProperty(Color.SKYBLUE.withAlpha(0.7)),
        width: 3,
      },
    });

    let coordString = '';

    const polygonStringBS = new BehaviorSubject<string>(coordString);
    this.polygonEditable$.subscribe((editUpdate: PolygonEditUpdate) => {
      if (editUpdate.editAction === EditActions.ADD_LAST_POINT) {
        element.style.cursor = 'default';
        const cartesian3 = this.polygonEditable$.getCurrentPoints()
          .map(p => p.getPosition());
        cartesian3.push(cartesian3[0]);
        const coords = cartesian3
            .map(cart => Ellipsoid.WGS84.cartesianToCartographic(cart as Cartesian3))
              .map(latLon => [latLon.latitude * 180 / Math.PI , latLon.longitude * 180 / Math.PI]);
        coordString = coords.join(' ');
        polygonStringBS.next(coordString);
        this.polygonEditable$.disable();
        this.isDrawingPolygonBS.next(false);
        this.ignoreMapClick = false;
       }
    });
    return polygonStringBS;
  }

  clearPolygon() {
    this.isDrawingPolygonBS.next(false);
    if (this.polygonEditable$) {
      this.polygonEditable$.dispose();
      this.polygonEditable$ = undefined;
    }
  }

 /**
  * Method for drawing a box on the map. e.g selecting a bounding box on the map
  * @returns a observable object that triggers an event when the user complete the drawing
  */
  public drawBox(): RectangleEditorObservable {
    return this.rectangleEditor.create();
  }

  /**
   * Are map clicks being ignored
   * @returns True if map clicks being ingored
   */
  public getIgnoreMapClick(): boolean {
    return this.ignoreMapClick;
  }

  /**
   * Get lon/lat of mouse click
   * @returns Point object representing lon/lat location of click
   */
  public getPointFromClick(): BehaviorSubject<Point> {
    this.ignoreMapClick = true;
    const element = document.getElementsByTagName('canvas')[0];
    element.style.cursor = 'crosshair';
    const handler = new ScreenSpaceEventHandler(this.mapsManagerService.getMap().getCesiumViewer().scene.canvas);
    const pointBS = new BehaviorSubject<Point>(null);
    handler.setInputAction(click => {
      const pixel = click.position;
      if (!pixel || !pixel.x || !pixel.y) {
        this.ignoreMapClick = false;
        return;
      }
      const mousePosition = new Cartesian2(pixel.x, pixel.y);
      const viewer = this.mapsManagerService.getMap().getCesiumViewer();
      const ellipsoid = viewer.scene.globe.ellipsoid;
      const cartesian = viewer.camera.pickEllipsoid(mousePosition, ellipsoid);
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      element.style.cursor = 'default';
      handler.destroy();
      const point: Point = {
        longitude: lon,
        latitude: lat
      };
      pointBS.next(point);
      this.ignoreMapClick = false;
    }, ScreenSpaceEventType.LEFT_CLICK);
    return pointBS;
  }

}

/**
 * Point (lon/lat) interface
 */
export interface Point {
  longitude: number;
  latitude: number;
}
