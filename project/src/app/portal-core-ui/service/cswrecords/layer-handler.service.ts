
import {of as observableOf,  Observable } from 'rxjs';

import {map} from 'rxjs/operators';
import { CSWRecordModel } from '../../model/data/cswrecord.model';
import { Injectable, Inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';

import {LayerModel} from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { Constants } from '../../utility/constants.service';

/**
 * Service class to handle jobs relating to getting csw records from the server
 *
 */
@Injectable()
export class LayerHandlerService {

  private layerRecord;
  private getCSWUrl;

  constructor(private http: HttpClient, @Inject('env') private env) {
    this.layerRecord = [];

  }

  /**
   * Retrieve csw records from the service and organize them by group
   * @returns a observable object that returns the list of csw record organized in groups
   */
  public getLayerRecord(): Observable<any> {
    const me = this;
    if (this.layerRecord.length > 0) {
        return observableOf(this.layerRecord);
    } else {
      return this.http.get(this.env.portalBaseUrl + this.env.getCSWRecordUrl).pipe(
        map(response => {
            const cswRecord = response['data'];
            cswRecord.forEach(function(item, i, ar) {
              if (me.layerRecord[item.group] === undefined) {
                me.layerRecord[item.group] = [];
              }
              // VT: attempted to cast the object into a typescript class however it doesn't seem like its possible
              // all examples points to casting from json to interface but not object to interface.
              item.expanded = false;
              item.hide = false;
              me.layerRecord[item.group].push(item);
            });
            return me.layerRecord;
        }));
    }
  }

  /**
   * Retrive the  csw record located at the wms  serviceurl endpoint.
   * @Return a layer with the retrieved cswrecord wraped in a layer model.
   */
  public getCustomLayerRecord(serviceUrl: string): Observable<any> {
    const me = this;
    const httpParams = new HttpParams().set('serviceUrl', serviceUrl);

    return this.http.get(this.env.portalBaseUrl + this.env.getCustomLayers, {
      params: httpParams
    }).pipe(map(response => {
      if (response['success'] === false) {
        return null;
      }
      const cswRecord = response['data'];
      const itemLayers = [];
      itemLayers['Results'] = [];
      cswRecord.forEach(function(item, i, ar) {
        const itemLayer = new LayerModel();
        itemLayer.cswRecords = [item];
        itemLayer['expanded'] = false;
        itemLayer.id = item.id;
        itemLayer.description = item.description;
        itemLayer.hidden = false;
        itemLayer.layerMode = 'NA';
        itemLayer.name = item.name;
        itemLayers['Results'].push(itemLayer);
      });
      return itemLayers;
    }));
  }


  /**
   * Check if layer contains wms records
   * @param layer the layer to query for wms records
   * @return true if wms resource exists
   */
  public containsWMS(layer: LayerModel): boolean {
     const cswRecords: CSWRecordModel[] = layer.cswRecords;
      for (const cswRecord of cswRecords) {
         for (const onlineResource of cswRecord.onlineResources) {
           if (onlineResource.type === 'WMS') {
             return true;
           }
         }
      }
      return false;
  }

  /**
   * Retrieve the CSW record associated with this layer
   * @param layer the layer to query for wms records
   * @return CSW record all the csw records
   */
  public getCSWRecord(layer: LayerModel): CSWRecordModel[] {
    const cswRecords: CSWRecordModel[] = layer.cswRecords;
    return cswRecords;
  }

 /**
   * Search and retrieve only wms records
   * @param layer the layer to query for wms records
   */
  public getWMSResource (layer: LayerModel): OnlineResourceModel[] {
       return this.getOnlineResources(layer, Constants.resourceType.WMS);
  }

   /**
   * Search and retrieve only WCS records
   * @param layer the layer to query for wms records
   */
  public getWCSResource (layer: LayerModel): OnlineResourceModel[] {
       return this.getOnlineResources(layer, Constants.resourceType.WCS);
  }

  /**
   * Check if layer contains wfs records
   * @param layer the layer to query for wfs records
   * @return true if wfs resource exists
   */
  public containsWFS(layer: LayerModel): boolean {
     const cswRecords: CSWRecordModel[] = layer.cswRecords;
      for (const cswRecord of cswRecords) {
         for (const onlineResource of cswRecord.onlineResources) {
           if (onlineResource.type === Constants.resourceType.WFS) {
             return true;
           }
         }
      }
      return false;
  }

   /**
   * Check if layer contains wcs records
   * @param layer the layer to query for wcs records
   * @return true if wcs resource exists
   */
  public containsWCS(layer: LayerModel): boolean {
     const cswRecords: CSWRecordModel[] = layer.cswRecords;
      for (const cswRecord of cswRecords) {
         for (const onlineResource of cswRecord.onlineResources) {
           if (onlineResource.type === Constants.resourceType.WCS) {
             return true;
           }
         }
      }
      return false;
  }

  /**
   * Search and retrieve only wfs records
   * @param layer the layer to query for wfs records
   */
  public getWFSResource (layer: LayerModel): OnlineResourceModel[] {
    return this.getOnlineResources(layer, Constants.resourceType.WFS);
  }

  /**
    * Extract resources based on the type. If type is not defined, return all the resource
    * @method getOnlineResources
    * @param layer - the layer we would like to extract onlineResource from
    * @param resourceType - OPTIONAL a enum of the resource type. The ENUM constant is defined on app.js
    * @return resources - an array of the resource. empty array if none is found
    */
  public getOnlineResources(layer: LayerModel, resourceType?: string): OnlineResourceModel[] {
    const cswRecords: CSWRecordModel[] = layer.cswRecords;
    const onlineResourceResult = [];
    const uniqueURLSet = new Set<string>();
    for (const cswRecord of cswRecords) {
      for (const onlineResource of cswRecord.onlineResources) {
        // VT: We really just wanted the extent in the cswRecord so that ol only load whats is in the extent.
        onlineResource.geographicElements = cswRecord.geographicElements;
        if (resourceType && onlineResource.type === resourceType) {
          if (!uniqueURLSet.has(onlineResource.url)) {
            onlineResourceResult.push(onlineResource);
            uniqueURLSet.add(onlineResource.url);
          }
        } else if (!resourceType) {
          if (!uniqueURLSet.has(onlineResource.url)) {
            onlineResourceResult.push(onlineResource);
            uniqueURLSet.add(onlineResource.url);
          }
        }
      }
    }
    return onlineResourceResult;
  }

  /**
    * Extract resources based on the type. If type is not defined, return all the resource
    * @method getOnlineResources
    * @param layer - the layer we would like to extract onlineResource from
    * @param resourceType - OPTIONAL a enum of the resource type. The ENUM constant is defined on app.js
    * @return resources - an array of the resource. empty array if none is found
    */
  public getOnlineResourcesFromCSW(cswRecord: CSWRecordModel, resourceType?: string): OnlineResourceModel[] {

    const onlineResourceResult = [];
    const uniqueURLSet = new Set<string>();

      for (const onlineResource of cswRecord.onlineResources) {
        if (resourceType && onlineResource.type === resourceType) {
          if (!uniqueURLSet.has(onlineResource.url)) {
            onlineResourceResult.push(onlineResource);
            uniqueURLSet.add(onlineResource.url);
          }
        } else if (!resourceType) {
          if (!uniqueURLSet.has(onlineResource.url)) {
            onlineResourceResult.push(onlineResource);
            uniqueURLSet.add(onlineResource.url);
          }
        }
      }

    return onlineResourceResult;
  }



}
