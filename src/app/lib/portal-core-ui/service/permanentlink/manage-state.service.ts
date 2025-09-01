import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { CsMapObject } from '../cesium-map/cs-map-object';
import { MapState } from '../../model/data/mapstate.model';

/**
 * A service class to assist maintaining the current state of the portal including
 * keeping track of the layers and its filter that have been added to the map
 * This also includes getting the current state of the map
 */
@Injectable(
  { providedIn: 'root' } // singleton service
)
export class ManageStateService {

  private state: any = {};
  private permLinkMode: boolean = false; // Is true if a permanent link has been employed

  // Layer requires expanding
  private layerToExpandBS: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  public readonly layerToExpand = this.layerToExpandBS.asObservable();

  constructor(private csMapObject: CsMapObject) {}

  /**
   * Is the map currently displaying a permanent link?
   *
   * @returns permanent link mode
   */
  public isPermLinkMode() {
    return this.permLinkMode;
  }

  /**
   * Set the permanent link mode
   *
   * @param mode permanent link mode
   */
  public setPermLinkMode(mode: boolean) {
    this.permLinkMode = mode;
  }

  /**
   * Update the state whenever a layer is added to the map
   * @param layerid the layer that have been added
   * @param filterCollection the associated filtercollection of the layer
   * @param optionalFilters any optional filters that have been selected
   */
  public addLayer(layerid: string, currentTime: Date, filterCollection: any, optionalFilters: any, advancedFilter: any) {
    if (!filterCollection && !advancedFilter) {
      this.state[layerid] = { filterCollection: {}, optionalFilters: [] };
    } else {
      this.state[layerid] = {
        filterCollection: filterCollection,
        optionalFilters: optionalFilters,
        advancedFilter: advancedFilter
      };
    }
    if (currentTime) {
      this.state[layerid].time = currentTime;
    }
    this.permLinkMode = false;
  }

  /**
   * When a layer is removed, update the state
   * @param layerid the id of the layer that have been removed
   */
  public removeLayer(layerid: string) {
    delete this.state[layerid];
    this.permLinkMode = false;
  }

  /**
   * Return the current state
   * @return return the state as a JSON object
   */
  public getState(): any {
    this.state.map = this.csMapObject.getCurrentMapState();
    return this.state;
  }

  /**
   * Get the state for an individual layer
   * @param layerId the ID of the layer
   * @returns the state of the request layer
   */
  public getLayerState(layerId: string) {
    if (this.state.hasOwnProperty(layerId)) {
      return this.state[layerId];
    }
    return {};
  }

  /**
   * Resume the state of the map given the map state
   * Used to employ permanent link state
   * @param mapState map state object
   */
  public resumeMapState(mapState: MapState) {
    this.permLinkMode = true;
    if (mapState) {
      this.csMapObject.resumeMapState(mapState);
    }
  }

}
