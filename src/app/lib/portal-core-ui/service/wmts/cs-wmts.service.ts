import { throwError as observableThrowError, Observable, Subscription } from 'rxjs';

import { catchError, map } from 'rxjs/operators';
import { Injectable, inject } from '@angular/core';
import { LayerModel } from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import { Constants, ResourceType } from '../../utility/constants.service';
import { UtilitiesService } from '../../utility/utilities.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { CQLService } from '../cql/cql.service';
import { MapsManagerService, AcMapComponent } from '@auscope/angular-cesium';
import { WebMapTileServiceImageryProvider, WebMapServiceImageryProvider, ImageryLayer, Resource, Rectangle, WebMercatorTilingScheme } from 'cesium';
import { LayerStatusService } from '../../utility/layerstatus.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';

import { TileProviderError } from 'cesium';
import { SldService } from '../style/wms/sld.service';

/**
 * Payload used when a WMTS tile reports an error
 */
export class WmtsErrorPayload {
  constructor(
    public cmWmtsService: CsWMTSService,
    public layer: LayerModel) { }

  /**
   * Logs an error to console if WMTS could not load on map
   * @param evt event
   */
  public errorEvent(evt) {
    console.error('WMTS Error: ', evt);
    const error: TileProviderError = evt;
    const rss: RenderStatusService = this.cmWmtsService.getRenderStatusService();
    rss.getStatusBSubject(this.layer).value.setErrorMessage(error.error.message);
  }
}

/**
 * WMTS service
 */
@Injectable()
export class CsWMTSService {
  private layerHandlerService = inject(LayerHandlerService);
  private http = inject(HttpClient);
  private renderStatusService = inject(RenderStatusService);
  private mapsManagerService = inject(MapsManagerService);
  private layerStatusService = inject(LayerStatusService);
  private deviceService = inject(DeviceDetectorService);
  private sldService = inject(SldService);
  private env = inject<any>('env' as any);
  private conf = inject<any>('conf' as any);

  private map: AcMapComponent;

  private tileLoadUnsubscribes: Map<string, any> = new Map<string, any>();
  // Keep track of any getSldBdy subscriptions that can continue to run and add layers after a layer is removed
  private sldSubscriptions: Map<string, Subscription[]> = new Map<string, Subscription[]>();

  constructor() {
    this.map = this.mapsManagerService.getMap();
  }

  public getRenderStatusService(): RenderStatusService {
    return this.renderStatusService;
  }

  /**
   * Check if the URL is too long
   */
  private wmtsUrlTooLong(sldBody: string, layer: LayerModel): boolean {
    return (
      encodeURIComponent(sldBody).length > Constants.WMSMAXURLGET ||
      this.conf.forceAddLayerViaProxy.includes(layer.id)
    );
  }

  /**
   * Simplified parameter builder for WMTS (does not support SLD_BODY)
   */
  private getWMTSparam(
    layer: LayerModel,
    onlineResource: OnlineResourceModel,
    param: any
  ): any {
    const params: any = {
      // for WMTS the layer name is passed separately
      STYLE: param && param.styles ? param.styles : '',
      FORMAT: 'image/png'
    };
    if (param) {
      if (param?.time instanceof Date) {
        params['time'] = param.time.toISOString();
      }
      if (param.optionalFilters) {
        const cql_str = CQLService.assembleQuery(param.optionalFilters);
        if (cql_str.length > 0) {
          params['cql_filter'] = cql_str;
        }
      }
    }
    return params;
  }

  /**
   * Removes WMTS layer from the map
   * @method rmLayer
   * @param layer the WMTS layer to remove from the map
   */
  public rmLayer(layer: LayerModel): void {
    // Cease any getSldBody subscriptions that may still be adding layers to the map
    for (const sub of this.sldSubscriptions[layer.id]) {
      sub.unsubscribe();
    }
    this.sldSubscriptions[layer.id] = [];
    // Unsubscribe from tile load listeners
    const wmtsOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.WMTS);
    for (const wmtsOnlineResource of wmtsOnlineResources) {
      if (this.tileLoadUnsubscribes[wmtsOnlineResource.url]) {
        this.tileLoadUnsubscribes[wmtsOnlineResource.url]();
        delete this.tileLoadUnsubscribes[wmtsOnlineResource.url];
      }
    }
    const viewer = this.map.getCesiumViewer();
    if (layer.csLayers) {
      for (const imgLayer of layer.csLayers) {
        viewer.imageryLayers.remove(imgLayer);
      }
    }
    layer.csLayers = [];
    this.renderStatusService.resetLayer(layer.id);
  }

  /**
   * Set layer opacity
   * @method setLayerOpacity
   * @param layer layer whose opacity is to be changed
   */
  public setLayerOpacity(layer: LayerModel, opacity: number) {
    for (const imgLayer of layer.csLayers) {
      imgLayer.alpha = opacity;
    }
  }

  /**
   * Add a WMTS layer to the map
   * @method addLayer
   * @param layer the WMTS layer to add to the map.
   * @param param request parameters
   */
  public addLayer(layer: LayerModel, param?: any): void {
    // Any running sldSubscriptions should have been stopped in rmLayer
    this.sldSubscriptions[layer.id] = [];
    if (!param) {
      param = {};
    }
    this.map = this.mapsManagerService.getMap();

    const wmtsOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.WMTS);

    for (const wmtsOnlineResource of wmtsOnlineResources) {
      if (UtilitiesService.filterProviderSkip(param.optionalFilters, wmtsOnlineResource.url)) {
        this.renderStatusService.skip(layer, wmtsOnlineResource);
        continue;
      }
      if (this.layerStatusService.isEndpointFailing(layer.id, wmtsOnlineResource)) {
        this.renderStatusService.addResource(layer, wmtsOnlineResource);
        this.renderStatusService.updateComplete(layer, wmtsOnlineResource, true);
        continue;
      }
      this.renderStatusService.register(layer, wmtsOnlineResource);
      this.renderStatusService.addResource(layer, wmtsOnlineResource);

      // Collate parameters for style request
      const collatedParam = UtilitiesService.collateParam(layer, wmtsOnlineResource, param);

      // For WMTS we don't fetch an SLD body, just build params and add layer
      const params = this.getWMTSparam(layer, wmtsOnlineResource, collatedParam);

      let lonlatextent;
      if (wmtsOnlineResource.geographicElements.length > 0) {
        const cswExtent = wmtsOnlineResource.geographicElements[0];

        const cswExtentPoly = bboxPolygon([cswExtent.westBoundLongitude, cswExtent.southBoundLatitude,
          cswExtent.eastBoundLongitude, cswExtent.northBoundLatitude]);
        const globalExtentPoly = bboxPolygon([-180, -90, 180, 90]);
        const intersectionPoly = intersect(cswExtentPoly, globalExtentPoly);
        lonlatextent = bbox(intersectionPoly);
      } else {
        // if extent isnt contained in the csw record then use global extent
        lonlatextent = [-180, -90, 180, 90];
      }

      // Perform add layer request
      layer.csLayers.push(this.addCesiumLayer(layer, wmtsOnlineResource, params, lonlatextent));
    }
  }

  /**
   * Calls CesiumJS to add WMTS layer to the map
   * @method addCesiumLayer
   * @param layer the WMTS layer to add to the map
   * @param wmsOnlineResource details of WMTS service
   * @param params the parameters built by getWMTSparam
   * @param lonlatextent longitude latitude extent of the layer as an array [west, south, east, north]
   * @returns ImageryLayer object for layer
   */
  private addCesiumLayer(layer, wmtsOnlineResource, params, lonlatextent): ImageryLayer {
    const browserInfo = this.deviceService.getDeviceInfo();
    const viewer = this.map.getCesiumViewer();
    const me = this;
    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WMTS)) {
      // WMTS tile loading callback function, numLeft = number of tiles left to load
      const tileLoading = (numLeft: number) => {
        if (numLeft === 0) {
          this.renderStatusService.updateComplete(layer, wmtsOnlineResource);
        }
      };
      this.tileLoadUnsubscribes[wmtsOnlineResource.url] = viewer.scene.globe.tileLoadProgressEvent.addEventListener(tileLoading);

      const url = UtilitiesService.rmParamURL(wmtsOnlineResource.url);
      let wmtsImagProv;

      // Create WMTS provider
      const wmtsOptions: any = {
        url: url,
        layer: wmtsOnlineResource.name,
        //tileMatrixSetID: wmtsOnlineResource.name,
        style: params.STYLE || '',
        format: params.FORMAT || 'image/png',
        rectangle: Rectangle.fromDegrees(lonlatextent[0], lonlatextent[1], lonlatextent[2], lonlatextent[3]),
        tilingScheme: new WebMercatorTilingScheme()
      };
      if (wmtsOnlineResource.tileMatrixSet) {
        wmtsOptions.tileMatrixSetID = wmtsOnlineResource.tileMatrixSet;
      } else {
        console.warn('WMTS resource missing tileMatrixSetID', wmtsOnlineResource.url);
      }

      try {
        wmtsImagProv = new WebMapTileServiceImageryProvider(wmtsOptions);
        // Check the provider before adding
        if (!wmtsImagProv.tilingScheme) {
          throw new Error('WMTS provider has no tilingScheme');
        }
      } catch (err) {
        console.error('Failed to create WMTS imagery provider, falling back to WMS', err, wmtsOptions);
        // Attempt WMS fallback
        const wmsParams = {
          LAYERS: wmtsOnlineResource.name,
          FORMAT: 'image/png',
          TRANSPARENT: true
        };
        wmtsImagProv = new (WebMapServiceImageryProvider as any)({
          url: url,
          layers: wmtsOnlineResource.name,
          parameters: wmsParams,
          rectangle: Rectangle.fromDegrees(lonlatextent[0], lonlatextent[1], lonlatextent[2], lonlatextent[3])
        });
      }

      const errorPayload = new WmtsErrorPayload(this, layer);
      wmtsImagProv.errorEvent.addEventListener((evt: any) => errorPayload.errorEvent(evt), errorPayload);
      return viewer.imageryLayers.addImageryProvider(wmtsImagProv);
    }
    return null;
  }
}
