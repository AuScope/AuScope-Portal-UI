import { Injectable, inject } from '@angular/core';
import { MapsManagerService, AcMapComponent } from '@auscope/angular-cesium';
import {
  WebMapTileServiceImageryProvider,
  ImageryLayer,
  Rectangle,
  Credit,
  UrlTemplateImageryProvider
} from 'cesium';

import { LayerModel } from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { LayerStatusService } from '../../utility/layerstatus.service';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';

@Injectable()
export class CsWMTSService {

  private layerHandlerService = inject(LayerHandlerService);
  private mapsManagerService = inject(MapsManagerService);
  private renderStatusService = inject(RenderStatusService);
  private layerStatusService = inject(LayerStatusService);

  private map: AcMapComponent;
  private imageryLayerOnlineResources = new Map<ImageryLayer, OnlineResourceModel>();

  constructor() {
    this.map = this.mapsManagerService.getMap();
  }

  /**
   * Remove WMTS layer
   */
  public rmLayer(layer: LayerModel): void {
    const viewer = this.map.getCesiumViewer();

    if (layer.csLayers) {
      for (const imageryLayer of layer.csLayers) {
        this.imageryLayerOnlineResources.delete(imageryLayer);
        viewer.imageryLayers.remove(imageryLayer);
      }
    }

    layer.csLayers = [];
    this.renderStatusService.resetLayer(layer.id);
  }

  /**
   * Add WMTS layer to map
   */
  public addLayer(layer: LayerModel): void {
    this.map = this.mapsManagerService.getMap();
    const wmtsResources = this.layerHandlerService.getWMTSResource(layer);

    for (const resource of wmtsResources) {
      if (this.layerStatusService.isEndpointFailing(layer.id, resource)) {
        this.renderStatusService.addResource(layer, resource);
        this.renderStatusService.updateComplete(layer, resource, true);
        continue;
      }

      this.renderStatusService.register(layer, resource);
      this.renderStatusService.addResource(layer, resource);

      let lonlatextent;
      if (resource.geographicElements?.length > 0) {

        const cswExtent = resource.geographicElements[0];

        const cswExtentPoly = bboxPolygon([
          cswExtent.westBoundLongitude,
          cswExtent.southBoundLatitude,
          cswExtent.eastBoundLongitude,
          cswExtent.northBoundLatitude
        ]);

        const globalExtentPoly = bboxPolygon([-180, -90, 180, 90]);
        const intersectionPoly = intersect(cswExtentPoly, globalExtentPoly);

        lonlatextent = bbox(intersectionPoly);

      } else {
        lonlatextent = [-180, -90, 180, 90];
      }

      let imageryLayer: ImageryLayer;
      if (resource?.wmts?.wmtsAccessMethod === 'REST') {
        imageryLayer = this.addCesiumTemplateLayer(layer, resource, lonlatextent);
      } else {
        imageryLayer = this.addCesiumLayer(layer, resource, lonlatextent);
      }

      if (!layer.csLayers) {
        layer.csLayers = [];
      }

      layer.csLayers.push(imageryLayer);

      this.renderStatusService.updateComplete(layer, resource);
    }
  }

  /**
   * Add WMTS layer to map
   */
  private addCesiumLayer(layer: LayerModel, onlineResource: OnlineResourceModel, lonlatextent): ImageryLayer {
    const viewer = this.map.getCesiumViewer();
    const cleanUrl = onlineResource.url.split('?')[0];
    const provider = new WebMapTileServiceImageryProvider({
      url: cleanUrl,
      layer: onlineResource.name,
      style: onlineResource.wmts?.wmtsStyle || 'default',
      format: onlineResource.wmts?.wmtsFormat || 'image/png',
      tileMatrixSetID: onlineResource.wmts?.wmtsTileMatrixSet || 'EPSG:3857',
      //tileMatrixLabels: Array.from({ length: 21 }, (_, i) => `EPSG:3857:${i}`),
      tileMatrixLabels: onlineResource.wmts?.wmtsTileMatrixLabels,
      rectangle: Rectangle.fromDegrees(
        lonlatextent[0],
        lonlatextent[1],
        lonlatextent[2],
        lonlatextent[3]
      ),
      credit: new Credit(layer.name || '')
    });

    const imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
    this.imageryLayerOnlineResources.set(imageryLayer, onlineResource);

    return imageryLayer;
  }

  /**
   * Works only when WMTS TileMatrix identifiers map directly to Cesium zoom levels.
   */
  private addCesiumTemplateLayer(layer: LayerModel, onlineResource: OnlineResourceModel, lonlatextent: number[]): ImageryLayer {
    const viewer = this.map.getCesiumViewer();

    console.log(
      'WMTS labels',
      onlineResource.wmts?.wmtsTileMatrixLabels
    );
    console.log(
      'WMTS matrix set',
      onlineResource.wmts?.wmtsTileMatrixSet
    );

    const tileTemplate = onlineResource.wmts?.wmtsTileTemplate;

    if (!tileTemplate) {
      throw new Error(`WMTS layer ${onlineResource.name} has no tile template`);
    }

    const url: string =
      tileTemplate
        .replace('{style}', onlineResource.wmts?.wmtsStyle ?? '')
        .replace(
          '{TileMatrixSet}',
          onlineResource.wmts?.wmtsTileMatrixSet ?? ''
        )
        .replace('{TileCol}', '{x}')
        .replace('{TileRow}', '{y}');

    const provider = new UrlTemplateImageryProvider({
      url,
      rectangle: Rectangle.fromDegrees(
        lonlatextent[0],
        lonlatextent[1],
        lonlatextent[2],
        lonlatextent[3]
      ),
      credit: new Credit(layer.name || ''),
      customTags: {
        TileMatrix: (
          _provider: unknown,
          _x: number,
          _y: number,
          level: number
        ): string => {

          return (onlineResource.wmts?.wmtsTileMatrixLabels?.[level] ?? level.toString());
        }
      }
    });

    const imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
    this.imageryLayerOnlineResources.set(imageryLayer, onlineResource);

    return imageryLayer;
  }

  public setLayerOpacity(layer: LayerModel, opacity: number) {
    for (const imgLayer of layer.csLayers) {
      imgLayer.alpha = opacity;
    }
  }

  public getOnlineResourceForImageryLayer(imageryLayer: ImageryLayer): OnlineResourceModel {
    return this.imageryLayerOnlineResources.get(imageryLayer);
  }
}