import { throwError as observableThrowError, Observable, Subscription } from 'rxjs';

import { catchError, map } from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { LayerModel } from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';

import { Constants, ResourceType } from '../../utility/constants.service';
import { UtilitiesService } from '../../utility/utilities.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { CQLService } from '../cql/cql.service';
import { MapsManagerService, AcMapComponent } from '@auscope/angular-cesium';
import { WebMapServiceImageryProvider, ImageryLayer, Resource, Rectangle } from 'cesium';
import { LayerStatusService } from '../../utility/layerstatus.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';

import * as when from 'when';
import TileProviderError from 'cesium/Source/Core/TileProviderError';
import { SldService } from '../style/wms/sld.service';

export class ErrorPayload {
  constructor(
    public cmWmsService: CsWMSService,
    public layer: LayerModel) { }

  /**
   * Logs an error to console if WMS could not load on map
   * @param evt event
   */
  public errorEvent(evt) {
    console.error('ERROR! evt = ', evt);
    const error: TileProviderError = evt;
    const rss: RenderStatusService = this.cmWmsService.getRenderStatusService();
    rss.getStatusBSubject(this.layer).value.setErrorMessage(error.error.message);
  }
}

/**
 * Use Cesium to add layer to map. This service class adds WMS layer to the map
 */
@Injectable()
export class CsWMSService {

  private map: AcMapComponent;

  private tileLoadUnsubscribes: Map<string, any> = new Map<string, any>();
  // Keep track of any getSldBdy subscriptions that can continue to run and add layers after a layer is removed
  private sldSubscriptions: Map<string, Subscription[]> = new Map<string, Subscription[]>();

  constructor(
    private layerHandlerService: LayerHandlerService,
    private http: HttpClient,
    private renderStatusService: RenderStatusService,
    private mapsManagerService: MapsManagerService,
    private layerStatusService: LayerStatusService,
    private deviceService: DeviceDetectorService,
    private sldService: SldService,
    @Inject('env') private env,
    @Inject('conf') private conf
  ) {
    this.map = this.mapsManagerService.getMap();
  }

  public getRenderStatusService(): RenderStatusService {
    return this.renderStatusService;
  }
  /**
   * A private helper used to check if the URL is too long
   */
  public wmsUrlTooLong(sldBody: string, layer: LayerModel): boolean {
    return (
      encodeURIComponent(sldBody).length > Constants.WMSMAXURLGET ||
      this.conf.forceAddLayerViaProxy.includes(layer.id)
    );
  }

  /**
   * Get WMS 1.3.0 related parameter
   * @param layer the WMS layer
   * @param onlineResource where the request will be sent
   * @param param request parameters
   * @param usePost true if parameters are very long and a POST request may be required
   * @param sld_body associated styling parameter sld_body
   */
  public getWMS1_3_0param(
    layer: LayerModel,
    onlineResource: OnlineResourceModel,
    param: any,
    usePost: boolean,
    sld_body?: string
  ): any {
    const params = {
      // VT: if the parameter contains featureType, it mean we are targeting a different featureType e.g capdf layer
      LAYERS:
        param && param.featureType ? param.featureType : onlineResource.name,
      TILED: true,
      DISPLAYOUTSIDEMAXEXTENT: true,
      FORMAT: 'image/png',
      TRANSPARENT: true,
      VERSION: '1.3.0',
      WIDTH: Constants.TILE_SIZE,
      HEIGHT: Constants.TILE_SIZE,
      STYLES: param && param.styles ? param.styles : '',
    };

    if (param) {
      // Add in time parameter, but only if required
      if (param.time) {
        params['time'] = param.time;
      }
      // Add in cql_filter parameter, if requested
      if (param.optionalFilters) {
        const cql_str = CQLService.assembleQuery(param.optionalFilters);
        if (cql_str.length > 0) {
          params['cql_filter'] = cql_str;
        }
      }
    }

    if (sld_body) {
      /* ArcGIS and POST requests cannot read base64 encoded styles */
      if (!UtilitiesService.layerIsArcGIS(layer) && !UtilitiesService.resourceIsArcGIS(onlineResource) &&
        this.wmsUrlTooLong(sld_body, layer) && !usePost) {
        params['sld_body'] = window.btoa(sld_body);
      } else {
        params['sld_body'] = sld_body;
      }
    } else {
      params['sldUrl'] = this.getSldUrl(layer, param);
    }
    return params;
  }

  /**
   * get wms 1.1.0 related parameter
   * @param layer the WMS layer
   * @param onlineResource where the request will be sent
   * @param param request parameters
   * @param usePost true if parameters are very long and a POST request may be required
   * @param sld_body associated styling parameter sld_body
   */
  public getWMS1_1param(
    layer: LayerModel,
    onlineResource: OnlineResourceModel,
    param: any,
    usePost: boolean,
    sld_body?: string
  ): any {
    const params = {
      // VT: if the parameter contains featureType, it mean we are targeting a different featureType e.g capdf layer
      LAYERS:
        param && param.featureType ? param.featureType : onlineResource.name,
      TILED: true,
      DISPLAYOUTSIDEMAXEXTENT: true,
      FORMAT: 'image/png',
      TRANSPARENT: true,
      VERSION: '1.1.1',
      WIDTH: Constants.TILE_SIZE,
      HEIGHT: Constants.TILE_SIZE
    };

    if (param) {
      // Add in time parameter, but only if required
      if (param.time) {
        params['time'] = param.time;
      }
      // Add in cql_filter parameter, if requested
      if (param.optionalFilters) {
        const cql_str = CQLService.assembleQuery(param.optionalFilters);
        if (cql_str.length > 0) {
          params['cql_filter'] = cql_str;
        }
      }
    }

    if (sld_body) {
      /* ArcGIS and POST requests cannot read base64 encoded styles */
      if (!UtilitiesService.layerIsArcGIS(layer) && !UtilitiesService.resourceIsArcGIS(onlineResource) &&
        this.wmsUrlTooLong(sld_body, layer) && !usePost) {
        params['sld_body'] = window.btoa(sld_body);
      } else {
        params['sld_body'] = sld_body;
      }
    } else {
      params['sldUrl'] = this.getSldUrl(layer, param);
    }
    return params;
  }

  /**
   * Get the NvclFilter from the URL
   * @param layer layer
   * @param param filter request parameters
   * @return a observable of the HTTP request
   */
  public getNvclFilter(layer: LayerModel, param?: any): Observable<any> {
    if (!param) {
      param = {};
    }
    const filterUrl = 'doNvclV2Filter.do';
    const usePost = this.wmsUrlTooLong(
      this.env.portalBaseUrl + filterUrl + param.toString(),
      layer
    );
    if (!filterUrl) {
      return Observable.create(observer => {
        observer.next(null);
        observer.complete();
      });
    }
    let httpParams = Object.getOwnPropertyNames(param).reduce(
      (p, key1) => p.set(key1, param[key1]),
      new HttpParams()
    );
    httpParams = UtilitiesService.convertObjectToHttpParam(httpParams, param);
    if (usePost) {
      return this.http
        .get(this.env.portalBaseUrl + '', {
          responseType: 'text',
          params: httpParams
        })
        .pipe(
          map(response => {
            return response;
          })
        );
    } else {
      return this.http
        .post(this.env.portalBaseUrl + filterUrl, httpParams.toString(), {
          headers: new HttpHeaders().set(
            'Content-Type',
            'application/x-www-form-urlencoded'
          ),
          responseType: 'text'
        })
        .pipe(
          map(response => {
            return response;
          }),
          catchError((error: HttpResponse<any>) => {
            return observableThrowError(error);
          })
        );
    }
  }

  /**
   * Get the WMS style URL if proxyStyleUrl is valid
   * @method getSldUrl
   * @param layer - the layer we would like to retrieve the SLD for if proxyStyleUrl is defined
   * @param param - OPTIONAL - parameter to be passed into retrieving the SLD.Used in capdf
   * @return url - getUrl to retrieve sld
   */
  private getSldUrl(
    layer: LayerModel,
    param?: any
  ) {
    if (layer.proxyStyleUrl) {
      let httpParams = Object.getOwnPropertyNames(param).reduce(
        (p, key1) => p.set(key1, param[key1]),
        new HttpParams()
      );
      httpParams = UtilitiesService.convertObjectToHttpParam(httpParams, param);
      return '/' + layer.proxyStyleUrl + '?' + httpParams.toString();
    }
    return null;
  }

  /**
   * Removes wms layer from the map
   * @method rmLayer
   * @param layer the WMS layer to remove from the map.
   */
  public rmLayer(layer: LayerModel): void {
    // Cease any getSldBody subscriptions that may still be adding layers to the map
    for (const sub of this.sldSubscriptions[layer.id]) {
      sub.unsubscribe();
    }
    this.sldSubscriptions[layer.id] = [];
    // Unsubscribe from tile load listeners
    const wmsOnlineResources = this.layerHandlerService.getWMSResource(layer);
    for (const wmsOnlineResource of wmsOnlineResources) {
      if (this.tileLoadUnsubscribes[wmsOnlineResource.url]) {
        this.tileLoadUnsubscribes[wmsOnlineResource.url]();
        delete this.tileLoadUnsubscribes[wmsOnlineResource.url];
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
   * Reverse any SLD_BODY coordinates (i.e. lat,lng becomes lng,lat) for the GetFeatureInfo request if present
   * @param sldBody the SLD_BODY whose coordinates (if present) will be reversed
   * @returns the new SLD_BODY with reversed coordinates
   */
  private reverseSldBodyPolygonFilterCoordinates(sldBody: string) {
    let newSldBody = sldBody;
    const coordsOpenTag = '<gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\" \">';
    const coordsOpenTagIndex = sldBody.indexOf(coordsOpenTag);
    if (coordsOpenTagIndex !== -1) {
      const coordsCloseTag = '</gml:coordinates>';
      const coords = sldBody.substring(sldBody.indexOf(coordsOpenTag) + coordsOpenTag.length, sldBody.indexOf(coordsCloseTag));
      const coordsArray = coords.split(' ');
      const newCoordsArray = [];
      for (const c of coordsArray) {
        const newCoord = c.substring(c.indexOf(',') + 1, c.length) + ',' + c.substring(0, c.indexOf(','));
        newCoordsArray.push(newCoord);
      }
      while (newSldBody.indexOf(coords) >= 0) {
        newSldBody = newSldBody.replace(coords, newCoordsArray.join(' '));
      }
    }
    return newSldBody;
  }

  /**
   * Add a WMS layer to the map
   * @method addLayer
   * @param layer the WMS layer to add to the map.
   * @param param request parameters
   */
  public addLayer(layer: LayerModel, param?: any): void {
    // Any running sldSubscriptions should have been stopped in rmLayer
    this.sldSubscriptions[layer.id] = [];
    if (!param) {
      param = {};
    }
    this.map = this.mapsManagerService.getMap();

    const wmsOnlineResources = this.layerHandlerService.getWMSResource(layer);

    for (const wmsOnlineResource of wmsOnlineResources) {
      if (UtilitiesService.filterProviderSkip(param.optionalFilters, wmsOnlineResource.url)) {
        this.renderStatusService.skip(layer, wmsOnlineResource);
        continue;
      }
      if (this.layerStatusService.isEndpointFailing(layer.id, wmsOnlineResource)) {
        this.renderStatusService.addResource(layer, wmsOnlineResource);
        this.renderStatusService.updateComplete(layer, wmsOnlineResource, true);
        continue;
      }
      this.renderStatusService.register(layer, wmsOnlineResource);
      this.renderStatusService.addResource(layer, wmsOnlineResource);
      // Collate parameters for style request
      const collatedParam = UtilitiesService.collateParam(layer, wmsOnlineResource, param);
      // Set 'usePost' if style request parameters are too long
      const usePost = this.wmsUrlTooLong(this.env.portalBaseUrl + layer.proxyStyleUrl + collatedParam.toString(), layer);
      // Perform request for style data, store subscription so we can cancel if user removes layer
      this.sldSubscriptions[layer.id].push(
        this.sldService.getSldBody(layer.proxyStyleUrl, usePost, wmsOnlineResource, collatedParam, layer.id).subscribe(sldBody => {
          const longResp = this.wmsUrlTooLong(sldBody, layer);
          // Create parameters for add layer request
          const params = wmsOnlineResource.version.startsWith('1.3')
            ? this.getWMS1_3_0param(layer, wmsOnlineResource, collatedParam, longResp, sldBody)
            : this.getWMS1_1param(layer, wmsOnlineResource, collatedParam, longResp, sldBody);

          let lonlatextent;
          if (wmsOnlineResource.geographicElements.length > 0) {
            const cswExtent = wmsOnlineResource.geographicElements[0];

            const cswExtentPoly = bboxPolygon([cswExtent.westBoundLongitude, cswExtent.southBoundLatitude,
            cswExtent.eastBoundLongitude, cswExtent.northBoundLatitude]);
            const globalExtentPoly = bboxPolygon([-180, -90, 180, 90]);
            const intersectionPoly = intersect(cswExtentPoly, globalExtentPoly);
            lonlatextent = bbox(intersectionPoly);
          } else {
            // if extent isnt contained in the csw record then use global extent
            lonlatextent = [-180, -90, 180, 90];
            // the current view extent cannot be used as the bounds for the layer because the user could zoom out
            // after adding the layer to the map.
          }

          // Perform add layer request
          layer.csLayers.push(this.addCesiumLayer(layer, wmsOnlineResource, params, longResp, lonlatextent));
          layer.sldBody = sldBody;

          // For 1.3.0 GetFeatureInfo requests need lat,lng swapped to lng,lat if polygon filter present
          if (wmsOnlineResource.version === '1.3.0' && collatedParam.optionalFilters.find(f => f.type === 'OPTIONAL.POLYGONBBOX')) {
            layer.sldBody130 = this.reverseSldBodyPolygonFilterCoordinates(sldBody);
          }
        }));
    }
  }

  /**
   * Calls CesiumJS to add WMS layer to the map
   * @method addCesiumLayer
   * @param layer the WMS layer to add to the map.
   * @param wmsOnlineResource details of WMS service
   * @param usePost whether to use a POST request
   * @param lonlatextent longitude latitude extent of the layer as an array [west,south,east,north]
   * @returns the new CesiumJS ImageryLayer object
   */
  private addCesiumLayer(layer, wmsOnlineResource, params, usePost: boolean, lonlatextent): ImageryLayer {
    const browserInfo = this.deviceService.getDeviceInfo();
    const viewer = this.map.getCesiumViewer();
    const me = this;
    if (UtilitiesService.layerContainsResourceType(layer, ResourceType.WMS)) {
      // WMS tile loading callback function, numLeft = number of tiles left to load
      const tileLoading = (numLeft: number) => {
        if (numLeft === 0) {
          // When there are no more tiles to load it is complete
          this.renderStatusService.updateComplete(layer, wmsOnlineResource);
        }
      };
      // Register tile loading callback function
      this.tileLoadUnsubscribes[wmsOnlineResource.url] = viewer.scene.globe.tileLoadProgressEvent.addEventListener(tileLoading);

      const url = UtilitiesService.rmParamURL(wmsOnlineResource.url);
      let wmsImagProv;

      // Set up WMS service
      // If it is ArcGIS do not use proxy as ArcGIS does not work with POST requests
      if (UtilitiesService.layerIsArcGIS(layer) || UtilitiesService.resourceIsArcGIS(wmsOnlineResource) || (!usePost && !layer.useDefaultProxy)) {
        // NB: ArcGisMapServerImageryProvider does not allow additional parameters for ArcGIS, i.e. no styling
        // So we use a normal GET request & WebMapServiceImageryProvider instead
        wmsImagProv = new WebMapServiceImageryProvider({
          url: url,
          layers: wmsOnlineResource.name,
          parameters: params,
          rectangle: Rectangle.fromDegrees(lonlatextent[0], lonlatextent[1], lonlatextent[2], lonlatextent[3])
        });
      } else {
        // Keep old function call
        let oldCreateImage = (Resource as any)._Implementations.createImage;

        // Overwrite CesiumJS 'createImage' function to allow us to do 'POST' requests via a proxy
        // If there is a 'usepost' parameter in the URL, then 'POST' via proxy else uses standard 'GET'
        // TODO: Implement a Resource constructor parameter instead of 'usepost'
        (Resource as any)._Implementations.createImage = function (request, crossOrigin, deferred, flipY, preferImageBitmap) {
          const jURL = new URL(request.url);
          // If there's no 'usepost' parameter then call the old 'createImage' method which uses 'GET'
          if (!jURL.searchParams.has('usepost')) {
            return oldCreateImage(request, crossOrigin, deferred, flipY, preferImageBitmap);
          }
          // Initiate loading WMS tiles via POST & a proxy
          (Resource as any).supportsImageBitmapOptions()
            .then(function (supportsImageBitmap) {
              const responseType = "blob";
              const method = "POST";
              const xhrDeferred = when.defer();
              // Assemble parameters into a form for 'POST' request
              const postForm = new FormData();
              postForm.append('service', 'WMS');
              jURL.searchParams.forEach(function (val, key) {
                if (key === 'url') {
                  postForm.append('url', val.split('?')[0] + '?service=WMS');
                  const kvp = val.split('?')[1];
                  if (kvp) {
                    me.paramSubst(kvp.split('=')[0], kvp.split('=')[1], postForm);
                  }
                } else {
                  me.paramSubst(key, val, postForm);
                }
              });

              const newURL = jURL.origin + jURL.pathname;
              // Initiate request
              const xhr = (Resource as any)._Implementations.loadWithXhr(
                newURL,
                responseType,
                method,
                postForm,
                undefined,
                xhrDeferred,
                undefined,
                undefined,
                undefined
              );

              if (xhr && xhr.abort) {
                request.cancelFunction = function () {
                  xhr.abort();
                };
              }
              return xhrDeferred.promise.then(function (blob) {
                if (!blob) {
                  deferred.reject(
                    new Error("Successfully retrieved " + url + " but it contained no content.")
                  );
                  return;
                }
                // 'createImageBitmap' was not fully supported in older versions of Firefox (ESR & version <= 92.0) and Safari
                // due to bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1367251
                if (browserInfo.browser === 'Firefox' && parseFloat(browserInfo.browser_version) <= 92.0) {
                  return createImageBitmap(blob);
                } else {
                  return (Resource as any).createImageBitmapFromBlob(blob, {
                    flipY: flipY,
                    premultiplyAlpha: false,
                    skipColorSpaceConversion: false
                  });
                }
              }).then(deferred.resolve);
            }).catch(deferred.reject);
        };
        /* End of 'createImage' overwrite */

        // Create a resource which uses our custom proxy
        const proxyUrl = me.env.portalBaseUrl + Constants.PROXY_API + '?usewhitelist=' + (layer.useProxyWhitelist ? 'true' : 'false') + '&url=';
        const res = new Resource({ url: url, proxy: new MyDefaultProxy(proxyUrl) });

        // Force Resource to use 'POST' and our proxy
        params['usepost'] = true;
        wmsImagProv = new WebMapServiceImageryProvider({
          url: res,
          layers: wmsOnlineResource.name,
          parameters: params,
          rectangle: Rectangle.fromDegrees(lonlatextent[0], lonlatextent[1], lonlatextent[2], lonlatextent[3])
        });
      }
      const errorPayload = new ErrorPayload(this, layer);

      wmsImagProv.errorEvent.addEventListener(errorPayload.errorEvent, errorPayload);
      return viewer.imageryLayers.addImageryProvider(wmsImagProv);
    }
    return null;
  }

  /**
   * Function to add parameters to FormData object
   * some parameters are converted to something that geoserver WMS can understand
   * @method paramSubst
   * @param key parameter key
   * @param val parameter value
   * @param postForm a FormData object to add key,val pairs to
   */
  private paramSubst(key: string, val: string, postForm: FormData) {
    if (key === 'sld_body') {
      postForm.append('sldBody', val);
    } else if (key !== 'usepost') {
      postForm.append(key, val);
    }
  }

}

// Substitute our own proxy class to replace Cesium's 'Proxy' class
// so that the parameters are not uuencoded
class MyDefaultProxy {
  proxy: string;
  constructor(proxy) {
    this.proxy = proxy;
  }
  getURL: (any) => any;
}
MyDefaultProxy.prototype.getURL = function (resource) {
  const prefix = this.proxy.indexOf('?') === -1 ? '?' : '';
  return this.proxy + prefix + resource;
};

