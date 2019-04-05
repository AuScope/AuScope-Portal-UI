import { OnlineResourceModel } from '../model/data/onlineresource.model';
import { Injectable } from '@angular/core';
import {HttpParams} from '@angular/common/http';
import * as _ from 'lodash';
import * as $ from 'jquery';

declare function unescape(s: string): string;

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
        const localStringContain  = function(s, c) {
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
     * @method getUrlDomain
     * @param url to extract the domain
     */
    public static getUrlDomain(url: string): string {
        const a = document.createElement('a');
        a.href = url;
        return a.hostname;
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
                for (domain in params[idx].value ) {
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
        const unique =  {};

        for (const key in onlineResources) {
           unique[onlineResources[key].url] = true;
        }

        return Object.keys(unique).length;
    }



    /**
     *
     *  Base64 encode / decode
     *  http://www.webtoolkit.info/
     *
     **/



    // public method for encoding
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

        while ( i < utftext.length ) {

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
      return param;
    }

    /**
     * angular 4 have removed the ability to simply use a javascript object as a parameter. This is a workaround to parse the
     * filter object into a HttpParams
     * @param httpParam the httpParam to set the parameters
     */
    public static convertObjectToHttpParam(httpParam: HttpParams, paramObject: object): HttpParams {
      // https://github.com/angular/angular/pull/18490 (this is needed to parse object into parameter
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
      return httpParam;
    }

   public static getBaseUrl(url): string {
        const splitUrl = url.split('://');
        return splitUrl[0] + '://' + splitUrl[1].slice(0, splitUrl[1].indexOf('/'));
    }


  /**
     * check if the cswRecord has a entry in the list of failing nagios record
     * @param nagiosFailingHosts array of the list of host that is experiencing problem
     * @param cswRecord the csw we are matching for problem
     */
    public static isEndpointFailing(nagiosFailingHosts: string[], onlineResource: OnlineResourceModel): boolean {
      if (nagiosFailingHosts && nagiosFailingHosts.length > 0) {
        for (const nagiosFailingHost of nagiosFailingHosts) {
            if (onlineResource.url.indexOf(nagiosFailingHost) > -1) {
              return true;
            }
        }
      }
      return false;
    }

}
