import { UtilitiesService } from '../../utility/utilities.service';
import { OlMapObject } from '../openlayermap/ol-map-object';
import {Injectable} from '@angular/core';
import * as _ from 'lodash';

declare var LZMA: any;
/**
 * A service class to assist maintaining the current state of the portal including
 * keeping track of the layers and its filter that have been added to the map
 * This also includes getting the current state of the ol map, its zoom and center.
 */
@Injectable()
export class ManageStateService {

  private state: any = {};
  private compressedLink: string;
  private unCompressedStringCache: any;


  constructor(private olMapObject: OlMapObject) {
  }

  /**
   * update the state whenever a layer is added to the map
   * @param layerid the layer that have been added
   * @param filterCollection the associated filtercollection of the layer
   * @param optionalFilters any optional filters that have been selected
   */
  public addLayer(layerid: string, filterCollection: any, optionalFilters: any) {
    if (!filterCollection) {
      this.state[layerid] = {};
      return;
    }
    const clonedFilterCollection = _.cloneDeep(filterCollection);
    clonedFilterCollection['optionalFilters'] = [];
    this.state[layerid] = {
      filterCollection: filterCollection,
      optionalFilters: optionalFilters
    };
  }

  /**
   * Generate a one off state. This is used in NVCL borehole analytic where we want to generate a perm link to a artifically generated layer and filter
   * @param layerid the layer that have been added
   * @param filterCollection the associated filtercollection of the layer
   * @param optionalFilters any optional filters that have been selected
   */
  public generateOneOffState(layerid: string, filterCollection: any, optionalFilters: any) {
    filterCollection['optionalFilters'] = [];
    const state = {};
    state[layerid] = {
      filterCollection: filterCollection,
      optionalFilters: optionalFilters
    };
    return state;
  }

  /**
   * when a layer is remove, update the state
   * @param layerid the id of the layer that have been removed
   */
  public removeLayer(layerid: string) {
    this.state[layerid] = null;
  }

  /**
   * return the current state
   * @return return the state in the format layerid:{filterCollection,optionalFilters,map{zoom, center}}
   */
  public getState(): any {
    this.state.map = this.olMapObject.getCurrentMapState();
    return this.state;
  }

  /**
   * keep track of the link that have been generated.
   */
  public setLink(compressed: string) {
    this.compressedLink = compressed;
  }

  /**
   * Compress a string
   * @param toBeCompressed the string to be compressed
   * @param callback a callback after compression
   */
  public getCompressedString(toBeCompressed: string, callback): void {
    LZMA.compress(toBeCompressed, 9, callback);
  }

  /**
   * resume the state of the map given the map state
   */
  public resumeMapState(mapState) {
    if (mapState) {
      this.olMapObject.resumeMapState(mapState);
    }
  }

  /**
   * Return a uncompressed string given a compressed input
   * @param toBeUnCompressed the string to be uncompressed
   * @param callback a callback after completion
   */
  public getUnCompressedString(toBeUnCompressed: string, callback): void {
    if (!toBeUnCompressed) {
      callback(null);
      return;
    }

    if (!UtilitiesService.isEmpty(this.unCompressedStringCache)) {
      callback(this.unCompressedStringCache);
      return;
    }

    const stateStr = UtilitiesService.decode_base64(toBeUnCompressed);
    const compressedByteArray = [];
    for (let i = 0; i < stateStr.length; i++) {
      compressedByteArray.push(stateStr.charCodeAt(i));
    }
    const me = this;
    LZMA.decompress(compressedByteArray, function(result) {
      me.unCompressedStringCache = result;
      callback(result);
    });
  }

}
