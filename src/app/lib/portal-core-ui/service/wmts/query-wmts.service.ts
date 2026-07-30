import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { OnlineResourceModel } from "../../model/data/onlineresource.model";
import { Observable } from "rxjs";
import { Cartesian2, Cartesian3, GeographicProjection, Math, Rectangle, UrlTemplateImageryProvider, WebMapTileServiceImageryProvider, WebMercatorProjection } from "cesium";
import { WMTSFeatureInfoParams } from "../../model/wmts.model";
import { CsWMTSService } from "./cs-wmts.service";

@Injectable()
export class QueryWMTSService {

  private http = inject(HttpClient);
  private env = inject<any>('env' as any);
  private wmtsService = inject(CsWMTSService);

  /**
   * WMTS GetFeatureInfo request
   * @param onlineResource the WMTS online resource to query
   * @param tileMatrix the tile matrix of the tile to query
   * @returns feature info as a String (JSON or XML depending on infoFormat)
   */
  public getFeatureInfo(
    onlineResource: OnlineResourceModel,
    tileMatrix: string,
    tileRow: number,
    tileCol: number,
    i: number,
    j: number,
    format: string,
    level: number,
    infoFormat = 'application/json'
  ): Observable<string> {
    const formdata = new HttpParams()
      .set('serviceUrl', onlineResource.url)
      .set('layer', onlineResource.name)
      .set('style', onlineResource.wmts.wmtsStyle)
      .set('tileMatrixSet', onlineResource.wmts?.wmtsTileMatrixSet)
      .set('tileMatrix', tileMatrix)
      .set('tileRow', tileRow.toString())
      .set('tileCol', tileCol.toString())
      .set('format', format)
      .set('infoFormat', infoFormat)
      .set('i', i.toString())
      .set('j', j.toString())
      .set('level', level.toString());
    return this.http.post(this.env.portalBaseUrl + 'wmtsMarkerPopup.do', formdata.toString(),
      {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
        responseType: 'text'
      }
    );
  }

  /**
   * Get WMTS feature info parameters for a given mouse click on the map
   * @param viewer the Cesium viewer
   * @param mouseX the mouse X coordinate
   * @param mouseY the mouse Y coordinate
   * @param onlineResource the WMTS online resource to query
   * @returns the feature info parameters or undefined if no valid tile is found
   */
  public getWMTSFeatureInfoParams(viewer: any, mouseX: number, mouseY: number, onlineResource: OnlineResourceModel): WMTSFeatureInfoParams | undefined {
    const mousePosition = new Cartesian2(mouseX, mouseY);
    const clickCartesian = viewer.camera.pickEllipsoid(mousePosition, viewer.scene.globe.ellipsoid);
    if (!clickCartesian) {
      return undefined;
    }

    const scene = viewer.scene;
    const clickCartographic = scene.globe.ellipsoid.cartesianToCartographic(clickCartesian);
    const tilesToRender = scene.globe._surface._tilesToRender;

    let pickedTile;
    for (let idx = 0; !pickedTile && idx < tilesToRender.length; ++idx) {
      const tile = tilesToRender[idx];
      if (Rectangle.contains(tile.rectangle, clickCartographic)) {
        pickedTile = tile;
      }
    }
    if (!pickedTile) {
      return undefined;
    }

    const imageryTiles = pickedTile.data.imagery;
    for (let idx = imageryTiles.length - 1; idx >= 0; --idx) {
      const terrainImagery = imageryTiles[idx];
      const imagery = terrainImagery.readyImagery;
      if (!imagery) {
        continue;
      }

      const provider = imagery.imageryLayer.imageryProvider;
      const layerResource = this.wmtsService.getOnlineResourceForImageryLayer(imagery.imageryLayer);
      if (!layerResource) {
          continue;
      }
      if (layerResource.url !== onlineResource.url || layerResource.name !== onlineResource.name) {
          continue;
      }

      // WMTS providers only
      if (!(provider instanceof WebMapTileServiceImageryProvider || provider instanceof UrlTemplateImageryProvider)) {
        continue;
      }

      let projected: Cartesian3;
      if (provider.tilingScheme.projection instanceof GeographicProjection) {
          projected = new Cartesian3(Math.toDegrees(clickCartographic.longitude), Math.toDegrees(clickCartographic.latitude), 0);
      } else {
          const webMercator = new WebMercatorProjection();
          projected = webMercator.project(clickCartographic);
      }

      const rectangle = provider.tilingScheme.tileXYToNativeRectangle(imagery.x, imagery.y, imagery.level);
      const pixel = new Cartesian2();
      pixel.x = (provider.tileWidth * (projected.x - rectangle.west) / rectangle.width) | 0;
      pixel.y = (provider.tileHeight * (rectangle.north - projected.y) / rectangle.height) | 0;

      if (pixel.x < 0 || pixel.x >= provider.tileWidth || pixel.y < 0 || pixel.y >= provider.tileHeight) {
          continue;
      }

      return {
        format: onlineResource.wmts?.wmtsFormat || 'image/png',
        tileMatrix: onlineResource.wmts?.wmtsTileMatrixLabels?.[imagery.level] ?? imagery.level.toString(),
        tileRow: imagery.y,
        tileCol: imagery.x,
        i: pixel.x,
        j:pixel.y,
        level: imagery.level
      };
    }

    return undefined;
  }
}
