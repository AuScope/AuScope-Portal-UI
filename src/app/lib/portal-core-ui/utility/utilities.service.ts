import { OnlineResourceModel } from '../model/data/onlineresource.model';
import { Bbox } from '../model/data/bbox.model';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { ResourceType } from './constants.service';
import { LayerModel } from '../model/data/layer.model';

import proj4 from "proj4";
import epsg from "epsg-index/all.json";
import { EpsgEntry } from "../types/epsg";
declare function unescape(s: string): string;
declare let Cesium;

/**
 * Port over from old portal-core extjs for dealing with xml in wfs
 */
@Injectable()
export class UtilitiesService {

    // private property
    public static _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    /**
     * Test if the object is empty
     * @method isEmpty
     * @param obj - the object to test for emptiness
     * @return boolean - true if object is empty.
     */
    public static isEmpty(obj: any): boolean {
        if (obj instanceof Array || (typeof obj === 'string')) {
            return obj.length === 0;
        } else if (typeof obj === 'object') {
            return $.isEmptyObject(obj);
        } else {
            if (obj) {
                return false;
            } else {
                return true;
            }
        }
    }


    /**
     * Add characters (default space) to left hand side of a string
     * @method leftPad
     * @param str string
     * @param size desired final length of string
     * @param character character to pad out with
     * @return padded string
     */
    public static leftPad(str, size, character) {
        let result = String(str);
        character = character || ' ';
        while (result.length < size) {
            result = character + result;
        }
        return result;
    }


    /**
     * Retrieve the key of a object
     * @method getKey
     * @param obj - the object to query
     * @return string - the key of the object
     */
    public static getKey(options): string {
      return Object.keys(options)[0];
    }

    /**
     * Retrieve the first value of a object
     * @method getValue
     * @param obj - the object to query
     * @return string - the key of the object
     */
    public static getValue(options): string {
      for (const key in options) {
        return options[key];
      }
    }

    /**
     * Test if string s contains c
     * @method stringContains
     * @param s - the string to check
     * @param c - the string to match
     */
    public static stringContains(s: string, c: string): boolean {
            return s.indexOf(c) !== -1;
    }

    /**
     * Returns the parameter in a get url request
     * @method getUrlParameters
     * @param url - the get url string to break
     * @param options - splitArgs - {Boolean} Split comma delimited params into arrays? Default is true
     */
    public static getUrlParameters(url: string, options?: any): any {
        const localStringContain = function(s, c) {
            return s.indexOf(c) !== -1;
        };
        options = options || {};
        // if no url specified, take it from the location bar
        url = (url === null || url === undefined) ? window.location.href : url;

        // parse out parameters portion of url string
        let paramsString = '';
        if (localStringContain(url, '?')) {
            const start = url.indexOf('?') + 1;
            const end = localStringContain(url, '#') ?
                        url.indexOf('#') : url.length;
            paramsString = url.substring(start, end);
        }

        const parameters = {};
        const pairs = paramsString.split(/[&;]/);
        for (let i = 0, len = pairs.length; i < len; ++i) {
            const keyValue = pairs[i].split('=');
            if (keyValue[0]) {

                let key = keyValue[0];
                try {
                    key = decodeURIComponent(key);
                } catch (err) {
                    key = unescape(key);
                }

                let value: any = (keyValue[1] || '');

                try {
                    value = decodeURIComponent(value);
                } catch (err) {
                    value = unescape(value);
                }

                // follow OGC convention of comma delimited values
                if (options.splitArgs !== false) {
                    value = value.split(',');
                }

                // if there's only one value, do not return as array
                if (value.length === 1) {
                    value = value[0];
                }

                parameters[key] = value;
             }
         }
        return parameters;
    }

    /**
     * Simply append some parameters to a URL, taking care of the characters of the end of the URL
     * @method addUrlParameters
     * @param url - the url string
     * @param paramStr - parameter string of the form "param1=val1&param2=val2" ...
     */
    public static addUrlParameters(url: string, paramStr: string): string {
        const endChar = url.charAt(url.length - 1);
        if (endChar !== '?' && endChar !== '&') { return url + '?' + paramStr; }
        return url + paramStr;
    }

    /**
     * Test if the object is a number
     * @method isNumber
     * @param obj - the object to test for numeric value
     * @retun boolean - true if obj is a number
     */
    public static isNumber(obj: any): boolean {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    }

    /**
     * Extract the domain from any url
     * e.g. 'https://abc.bca.org/api?id=whoami&name=blah' -> 'abc.bca.org'
     *
     * @method getUrlDomain
     * @param url to extract the domain
     */
    public static getUrlDomain(url: string): string {
        const a = document.createElement('a');
        a.href = url;
        return a.hostname;
    }

    /**
     * Remove parameters from URL
     * e.g. 'https://abc.bca.org/api?id=whoami&name=blah' -> 'https://abc.bca.org/api'
     *
     * @method rmParamURL
     * @param URL URL string
     * @returns truncated URL string
     */
    public static rmParamURL(url: string): string {
        const u = new URL(url);
        return u.origin + u.pathname;
    }

    /**
     * Get base from URL
     * e.g. "https://abc.bca.org/blagg?id=56&ty=78" -> "https://abc.bca.org"
     *
     * @param url
     */
    public static getBaseUrl(url): string {
        const splitUrl = url.split('://');
        return splitUrl[0] + '://' + splitUrl[1].slice(0, splitUrl[1].indexOf('/'));
    }

    /**
     * Based on the filter parameter, this is a utility to decide if we should skip this provider
     * @method filterProviderSkip
     * @param params - filter parameter
     * @param url - the url of the resource we are matching
     */
    public static filterProviderSkip(params: any, url: string): boolean {
        let containProviderFilter = false;
        let urlMatch = false;
        let idx;
        let domain;

        for (idx in params) {
            if (params[idx].type === 'OPTIONAL.PROVIDER') {
                containProviderFilter = true;
                for (domain in params[idx].value) {
                    if (params[idx].value[domain] && url.indexOf(domain) !== -1) {
                        urlMatch = true;
                    }
                }
            }
        }

        if (containProviderFilter && !urlMatch) {
            return true;
        } else {
            return false;
        }

    }

    /**
     * count the number of unique urls in onlineResources
     * @method uniqueCountOfResourceByUrl
     * @param onlineResources
     * @return unique count by url
     */
    public static uniqueCountOfResourceByUrl(onlineResources: { [key: string]: any; }): number {
        const unique = {};

        for (const key in onlineResources) {
           unique[onlineResources[key].url] = true;
        }

        return Object.keys(unique).length;
    }

    /**
     *  Public method for encoding
     *  Base64 encode / decode
     *  http://www.webtoolkit.info/
     *
     */
    public static encode_base64(input: string): string {
        let output = '';
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        let i = 0;

        input = this._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    }

    // public method for decoding
    public static decode_base64(input: string): string {
        let output = '';
        let chr1, chr2, chr3;
        let enc1, enc2, enc3, enc4;
        let i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = this._utf8_decode(output);

        return output;

    }

    // private method for UTF-8 encoding
    public static _utf8_encode(in_string: string): string {

        in_string = in_string.replace(/\r\n/g, '\n');
        let utftext = '';

        for (let n = 0; n < in_string.length; n++) {

            const c = in_string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    }

    // private method for UTF-8 decoding
    public static _utf8_decode(utftext: string): string {
        let string = '';
        let i = 0;
        let c = 0, c2 = 0, c3 = 0;
        const c1 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

    /**
     * @method getUrlParameterByName
     * @param name name of parameter
     * @param url optional URL to get parameter from, if not supplied uses the current page's URL
     * @return parameter value
     */
    public static getUrlParameterByName(name: string, url?: string): string {
      if (!url) {
        url = window.location.href;
      }
     return this.getUrlParameters(url)[name];
    }

    /**
     * This utility will collate the different type of filter into a single parameter object
     */
    public static collateParam(layer, onlineResource, parameter) {

      let param = _.cloneDeep(parameter);
      if (!param) {
        param = {};
      }
      if (UtilitiesService.isEmpty(param)) {
        return param;
      }
      // VT: hiddenParams- this is to append any fix parameter mainly for legacy reason in NVCL layer to set onlyHylogger to true
      if (layer.filterCollection) {
        let hiddenParams = [];
        if (layer.filterCollection.hiddenParams) {
          hiddenParams = layer.filterCollection.hiddenParams;
        }
        for (const idx in hiddenParams) {
          if (hiddenParams[idx].type === 'MANDATORY.UIHiddenResourceAttribute') {
            param[hiddenParams[idx].parameter] = onlineResource[hiddenParams[idx].attribute];
          } else {
            param[hiddenParams[idx].parameter] = hiddenParams[idx].value;
          }
        }

        // VT: mandatoryFilters
        let mandatoryFilters = [];
        if (layer.filterCollection.mandatoryFilters) {
          mandatoryFilters = layer.filterCollection.mandatoryFilters;
        }
        for (const idx in mandatoryFilters) {
          param[mandatoryFilters[idx].parameter] = mandatoryFilters[idx].value;
        }
      }

      for (let i = 0; i < param.optionalFilters.length; i++) {
        if (param.optionalFilters[i].TYPE === 'OPTIONAL.PROVIDER') {
          param.optionalFilters.splice(i, 1);
          break;
        }
      }

      // Set up time extents, if supplied and not already present
      if (!param.time && layer.capabilityRecords && layer.capabilityRecords.length > 0) {
          const capRec = layer.capabilityRecords[0];
          if (capRec.isWMS && capRec.layers.length > 0) {
              for (layer of capRec.layers) {
                  if (layer.name === onlineResource.name && layer.timeExtent && layer.timeExtent.length > 0) {
                      // NB: Only take the first value
                      param['time'] = layer.timeExtent[0];
                      break;
                  }
              }
          }
      }
      return param;
    }

    /**
     * angular 4 have removed the ability to simply use a javascript object as a parameter. This is a workaround to parse the
     * filter object into a HttpParams
     * @param httpParam the httpParam to set the parameters
     */
    public static convertObjectToHttpParam(httpParam: HttpParams, paramObject: object): HttpParams {
      // https://github.com/angular/angular/pull/18490 (this is needed to parse object into parameter
      if(paramObject && paramObject['optionalFilters']) {
        let first = true;
        for (let i = 0; i < paramObject['optionalFilters'].length; i++) {
          if (paramObject['optionalFilters'][i].type !== 'OPTIONAL.PROVIDER') {
            if (first) {
              httpParam = httpParam.set('optionalFilters', JSON.stringify(paramObject['optionalFilters'][i]));
              first = false;
            } else {
              httpParam = httpParam.append('optionalFilters', JSON.stringify(paramObject['optionalFilters'][i]));
            }
          }
        }
      }
      return httpParam;
    }

    /**
     * Returns true iff (if and only if) this is an ESRI ArcGIS server
     * @param onlineResource online resource record for service
     */
    public static resourceIsArcGIS(onlineResource: OnlineResourceModel): boolean {
        return ((onlineResource?.applicationProfile.indexOf('Esri:ArcGIS Server') > -1) ||
                        (onlineResource?.url.indexOf('arcgis') > -1));
    }

    /**
     * Check if a LayerModel has been defined as being an ESRI ArcGIS server
     * @param layer the LayerModel
     * @returns true if the LayerModel has an 'ESRI' serverType
     */
    public static layerIsArcGIS(layer: LayerModel): boolean {
        return layer.serverType?.toLowerCase() === 'esri';
    }

    /**
     * Returns a polygon filter out of a filter (usually in an SLD body).
     * @param filter The full filter
     */
    public static getPolygonFilter(filter: string) {
        return filter.slice(filter.indexOf('<ogc:Intersects>') , filter.indexOf('</ogc:Intersects>') + '</ogc:Intersects>'.length);
    }

    /**
     * Reproject cesium rectangle into EPSG:4326 bbox object.
     * @param points an array of 2 cartesian corner points forming the drawn rectangle (upper and lower)
     * @return reprojected bbox object
     */
    public static reprojectToWGS84(points: any) {
        const bbox = new Bbox();
        bbox.crs = 'EPSG:4326';
        const point1 = points[0].getPosition();
        const point2 = points[1].getPosition();

        // reproject to WGS84
        const reprojectedPoint1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(point1);
        const reprojectedPoint2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(point2);
        // convert radians to degrees
        if (reprojectedPoint1.longitude > reprojectedPoint2.longitude) {
            bbox.eastBoundLongitude = reprojectedPoint1.longitude * 180 / Math.PI;
            bbox.westBoundLongitude = reprojectedPoint2.longitude * 180 / Math.PI;
        } else {
            bbox.eastBoundLongitude = reprojectedPoint2.longitude * 180 / Math.PI;
            bbox.westBoundLongitude = reprojectedPoint1.longitude * 180 / Math.PI;
        }
        if (reprojectedPoint1.latitude > reprojectedPoint2.latitude) {
            bbox.northBoundLatitude = reprojectedPoint1.latitude * 180 / Math.PI;
            bbox.southBoundLatitude = reprojectedPoint2.latitude * 180 / Math.PI;
        } else {
            bbox.northBoundLatitude = reprojectedPoint2.latitude * 180 / Math.PI;
            bbox.southBoundLatitude = reprojectedPoint1.latitude * 180 / Math.PI;
        }
        return bbox;
    }

    /**
     * Return the browser type.
     */
    public static getBrowserName(): string {
        if ((navigator.userAgent.indexOf('Opera') || navigator.userAgent.indexOf('OPR')) !== -1) {
            return 'Opera';
        } else if (navigator.userAgent.indexOf('Chrome') !== -1){
            return 'Chrome';
        } else if (navigator.userAgent.indexOf('Safari') !== -1){
            return 'Safari';
        } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
             return 'Firefox';
        } else if (navigator.userAgent.indexOf('MSIE') !== -1){
          return 'IE';
        } else {
           return 'unknown';
        }
    }

    /**
     * Convert String to  Int Vector
     */
    public static stringToIntVector(strVal: string, seperator: string): number[]{
        const retVal = [];
        strVal.split(seperator).map(function(item) {
            retVal.push(parseInt(item, 10));
        });
        return retVal;
    }

    /**
     * Convert String to float Vector
     */
    public static stringToFloatVector(strVal: string, seperator: string): number[]{
        const retVal = [];
        strVal.split(seperator).map(function(item) {
            retVal.push(parseFloat(item));
        });
        return retVal;
    }

    /**
     * Sets parameter of URI query overriding existing value if set. The parameter name and value
     * are expected to be unescaped and may contain non ASCII characters.
     *
     * @param uri
     * @param key
     * @param value
     * @Return updated URL.
     */
    public static setUpdateParameter(uri: string, key: string, value: string):string {
        const re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        const separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
        }
        else {
            return uri + separator + key + "=" + value;
        }
    }

  /**
   * Convert an EPSG:3857 coordinate to EPSG:4326
   *
   * @param long3857 longitude of EPSG:3857 coordinate
   * @param lat3857 latitude of EPSG:3857 coordinate
   * @returns an array [longitude, latitude] EPSG:4326
   */
   public static coordinates3857To4326(long3857: number, lat3857: number): number[] {
    const e = 2.7182818284;
    const X = 20037508.34;
    const long4326 = (long3857 * 180) / X;
    let lat4326 = lat3857 / (X / 180);
    const exponent = (Math.PI / 180) * lat4326;
    lat4326 = Math.atan(e ** exponent);
    lat4326 = lat4326 / (Math.PI / 360);
    lat4326 = lat4326 - 90;
    return [long4326, lat4326];
  }

  /**
   * Remove non-digit characters and return the number from EPSG string
   * e.g. "EPSG:3107" returns 3107
   * @param epsgCode
   * @returns EPSG number or null
   */
  private static getEPSGNum(epsgCode: string): number|null {
    const match = epsgCode.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}


  /**
   * Convert bbox coordinates to a desired CRS
   *
   * @param bbox bounding box
   * @param crs desired coord ref system e.g. 'EPSG:12345'
   * @returns Bbox
   */
  public static coordConvBbox(bbox: Bbox, crs: string): Bbox {
    // Create Proj object for Bbox CRS
    const fromProj = proj4.Proj(bbox.crs);
    // Register 'crs' Proj4 string with 'proj4', use EPSG:4326 as a fallback
    const epsgNum = UtilitiesService.getEPSGNum(crs) || 4326;
    const entry: EpsgEntry = epsg[epsgNum];
    if (entry) {
      proj4.defs(crs, entry.proj4);
    } else {
      crs = 'EPSG:4326';
    }
    // Create Proj object for 'crs'
    const toProj = proj4.Proj(crs);
    // Convert east+north & south+west coords
    const en = proj4.transform(fromProj, toProj, [bbox.eastBoundLongitude, bbox.northBoundLatitude], false);
    const sw = proj4.transform(fromProj, toProj, [bbox.westBoundLongitude, bbox.southBoundLatitude], false);
    // Create new Bbox and return it
    const bboxOut: Bbox = new Bbox();
    bboxOut.eastBoundLongitude = en.x;
    bboxOut.northBoundLatitude = en.y;
    bboxOut.southBoundLatitude = sw.y;
    bboxOut.westBoundLongitude = sw.x;
    bboxOut.crs = crs;
    return bboxOut;
  }

  /**
   * Find whether a layer contains any online resources of a particular type
   *
   * @param layer the layer
   * @param resourceType the resource type (e.g. 'WMS', 'WFS' etc.)
   * @returns true if a layer contains a resource of type resourceType, false otherwise
   */
  public static layerContainsResourceType(layer: LayerModel, resourceType: ResourceType): boolean {
    if (layer.cswRecords?.length > 0) {
      for (const record of layer.cswRecords) {
        if (record.onlineResources?.length > 0) {
          if (record.onlineResources.find(r => r.type === resourceType)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Get a list of current map supported OnlineResource types
   *
   * @returns a list of supported OnlineResource types as strings
   */
  public static getSupportedOnlineResourceTypes(): ResourceType[] {
    return [ResourceType.WMS, ResourceType.IRIS, ResourceType.KML, ResourceType.KMZ, ResourceType.VMF,ResourceType.GEOJSON];
  }

  /**
   * Check is a layer has a supported OnlineResource type
   *
   * @param layer the LayerModel
   * @returns true if the layer contains an OnlineResource of one of the supported types, false otherwise
   */
  public static getLayerHasSupportedOnlineResourceType(layer: LayerModel): boolean {
    for (const resourceType of this.getSupportedOnlineResourceTypes()) {
      if (UtilitiesService.layerContainsResourceType(layer, resourceType)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a layer is supported to be added to the map
   *
   * @param layer layer to be added to map
   * @returns true if layer is supported, false otherwise
   */
  public static isMapSupportedLayer(layer: LayerModel): boolean {
    // Addable if one of supported resource types
    if (this.getLayerHasSupportedOnlineResourceType(layer)) {
        return true;
    }
    // Addable if layer's CSWRecords have at least one bbox geographic element
    if (UtilitiesService.layerContainsBboxGeographicElement(layer)) {
      return true;
    }
    return false;
  }

  /**
   * Find whether a layer contains a valid bbox geographic element
   *
   * @param layer the LayerModel
   * @returns true if a layer's CSWRecord(s) contains at least one valid bbox geographic element
   */
  public static layerContainsBboxGeographicElement(layer: LayerModel): boolean {
    if (layer.cswRecords?.length > 0) {
      for (const record of layer.cswRecords) {
        if (record.geographicElements?.length > 0) {
          for (const geoElement of record.geographicElements) {
            if (geoElement.type && geoElement.type === 'bbox' &&
                geoElement.northBoundLatitude && geoElement.eastBoundLongitude &&
                geoElement.southBoundLatitude && geoElement.westBoundLongitude) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Retrieve all resources of a given type for a given layer
   *
   * @param layer the layer
   * @param resourceType the type of online resource (e.g. 'WMS', 'WFS' etc.)
   * @returns an array of OnlineResourceModels that are of type resourceType
   */
  public static getLayerResources(layer: LayerModel, resourceType: ResourceType): OnlineResourceModel[] {
    let resources: OnlineResourceModel[] = [];
    if (layer.cswRecords && layer.cswRecords.length > 0) {
      for (const record of layer.cswRecords) {
        if (record.onlineResources && record.onlineResources.length > 0) {
            resources = resources.concat(record.onlineResources.filter(r => r.type === resourceType));
        }
      }
    }
    return resources;
  }

}
