import { throwError as observableThrowError, Observable, BehaviorSubject } from 'rxjs';

import { catchError, map, switchMap } from 'rxjs/operators';
import { CSWRecordModel } from '../../model/data/cswrecord.model';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

import { LayerModel} from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { ResourceType } from '../../utility/constants.service';
import { SplitDirection } from 'cesium';
import { GetCapsService } from '../wms/get-caps.service';


/**
 * Service class to handle jobs relating to getting csw records from the server
 */
@Injectable()
export class LayerHandlerService {

  private layerRecord$: BehaviorSubject<any> = new BehaviorSubject({});
  public readonly layerRecord: Observable<any> = this.layerRecord$.asObservable();

  constructor(private http: HttpClient, private getCapsService: GetCapsService, @Inject('env') private env) {
    this.layerRecord$.next({});
  }

  /**
   * Retrieve csw records from the service and organize them by group
   *
   * @returns a observable object that returns the list of csw record organized in groups
   */
  public getLayerRecord(): Observable<any> {
    return this.layerRecord.pipe(switchMap(records => {
      if (Object.keys(records).length > 0) {
        return this.layerRecord;
      } else {
        return this.http.get(this.env.portalBaseUrl + this.env.getCSWRecordEndP).pipe(
          map(response => {
            const newLayerRecord = {};
            const cswRecord = response['data'];
            cswRecord.forEach(function(item, i, ar) {
              if (newLayerRecord[item.group] === undefined) {
                newLayerRecord[item.group] = [];
              }
              // VT: attempted to cast the object into a typescript class however it doesn't seem like its possible
              // all examples points to casting from json to interface but not object to interface.
              item.expanded = false;
              item.hide = false;
              newLayerRecord[item.group].push(item);
            });
            this.layerRecord$.next(newLayerRecord);
            return this.layerRecord;
          }));
      }
    }));
  }

  /**
   * Retrieve LayerModels for the supplied list of IDs
   * @param layerIds array of layer IDs
   * @returns an Observable containing an array of LayerModels
   */
  public getLayerModelsForIds(layerIds: string[]): Observable<LayerModel[]> {
    const layersBS = new BehaviorSubject<LayerModel[]>(null);
    return this.layerRecord.pipe(switchMap(records => {
      const matchingLayers: LayerModel[] = [];
      for (const layerGroup in records) {
        if (layerGroup) {
          for (const layer of records[layerGroup]) {
            if (layerIds?.indexOf(layer.id) !== -1) {
              matchingLayers.push(layer);
            }
          }
        }
      }
      layersBS.next(matchingLayers);
      return layersBS.asObservable();
    }));
  }

  /**
   * Retrieve the CSW record located at the WMS serviceurl endpoint using an
   * OCG WMS GetCapabilities request
   *
   * @param serviceUrl WMS URL of service
   * @returns a layer with the retrieved cswrecord wrapped in a layer model.
   */
  public getCustomLayerRecord(serviceUrl: string): Observable<LayerModel[]> {
    // Send out a 'GetCapabilities' request
    const retVal = this.getCapsService.getCaps(serviceUrl, 'custom').pipe(
                        map((response: { data: { cswRecords: any, capabilityRecords: any }}) => {
      // Create a list of LayerModels using the 'GetCapabilities' response
      if (Object.keys(response).length === 0) {
        return;
      }
      const itemLayers: LayerModel[] = [];
      const cswRecord = response['data']['cswRecords'];
      if (cswRecord) {
        cswRecord.forEach(function (item, i, ar) {
            const itemLayer = new LayerModel();
            itemLayer.cswRecords = [item];
            itemLayer['expanded'] = false;
            itemLayer.id = item.id;
            itemLayer.description = item.description;
            itemLayer.hidden = false;
            itemLayer.layerMode = 'NA';
            // Custom layers have their own group
            itemLayer.group = 'Custom';
            itemLayer.name = item.name;
            itemLayer.splitDirection = SplitDirection.NONE;
            itemLayer.capabilityRecords = response['data']['capabilityRecords'];
            itemLayer.kmlDoc = {};
            // Custom layers to use default proxy and skip whitelist
            itemLayer.useDefaultProxy = true;
            itemLayer.useProxyWhitelist = false;
            itemLayers.push(itemLayer);
        });
      }
      return itemLayers;
    })
    , catchError(
      (error: HttpResponse<any>) => {
        return observableThrowError(error);
      },),);
    return retVal;
  }

  /**
   * Make a custom KML layer record
   *
   * @param name Name of custom KML layer
   * @returns LayerModel object
   */
  public makeCustomKMLLayerRecord(name: string, url: string, kmlDoc: {}): LayerModel {
    const id = 'KML_' + name.substring(0, 10) + '_' + Math.floor(Math.random() * 10000).toString();
    const itemLayer = new LayerModel();
    const cswRec = this.makeCustomKMLCSWRec(name, id, url);
    itemLayer.cswRecords = [cswRec];
    itemLayer['expanded'] = false;
    itemLayer.id = id;
    itemLayer.description = 'Because this is a custom KML layer there is no more information to display';
    itemLayer.hidden = false;
    itemLayer.layerMode = 'NA';
    itemLayer.name = name;
    itemLayer.splitDirection = SplitDirection.NONE;
    itemLayer.capabilityRecords = {};
    itemLayer.kmlDoc = kmlDoc;
    return itemLayer;
  }
    /**
   * Make a custom GEOJSON layer record
   *
   * @param name Name of custom GEOJSON layer
   * @returns LayerModel object
   */
  public makeCustomGEOJSONLayerRecord(name: string, url: string, jsonDoc: {}): LayerModel {
    const id = 'GEOJSON_' + name;
    const itemLayer = new LayerModel();
    const cswRec = this.makeCustomJsonCSWRec(name, id, url);
    itemLayer.cswRecords = [cswRec];
    itemLayer['expanded'] = false;
    itemLayer.id = id;
    itemLayer.description = 'Because this is a custom GEOJSON layer there is no more information to display';
    itemLayer.hidden = false;
    itemLayer.layerMode = 'NA';
    itemLayer.name = name;
    itemLayer.splitDirection = SplitDirection.NONE;
    itemLayer.capabilityRecords = {};
    itemLayer.jsonDoc = jsonDoc;
    return itemLayer;
  }
    /**
   * Make a custom KMZ layer record
   *
   * @param name Name of custom KMZ layer
   * @returns LayerModel object
   */
    public makeCustomKMZLayerRecord(name: string, url: string, kmzDoc: {}): LayerModel {
      const id = 'KMZ_' + name.substring(0, 10) + '_' + Math.floor(Math.random() * 10000).toString();
      const itemLayer = new LayerModel();
      const cswRec = this.makeCustomKMZCSWRec(name, id, url);
      itemLayer.cswRecords = [cswRec];
      itemLayer['expanded'] = false;
      itemLayer.id = id;
      itemLayer.description = 'Because this is a custom KMZ layer there is no more information to display';
      itemLayer.hidden = false;
      itemLayer.layerMode = 'NA';
      itemLayer.name = name;
      itemLayer.splitDirection = SplitDirection.NONE;
      itemLayer.capabilityRecords = {};
      itemLayer.kmlDoc = kmzDoc;
      return itemLayer;
    }
  
  /**
   * Make a custom CSW Record with a KMZ layer inside
   * 
   * @param name name of KMZ layer
   * @param id KMZ layer id
   * @returns CSWRecordModel object
   */
  public makeCustomKMZCSWRec(name: string, id: string, url: string): CSWRecordModel {
    const cswRec = new CSWRecordModel();
    cswRec.adminArea = '';
    cswRec.childRecords = {};
    cswRec.constraints = '';
    cswRec.useLimitConstraints = '';
    cswRec.accessConstraints = '';
    cswRec.contactOrg = '';
    cswRec.funderOrg = '';
    cswRec.datasetURIs = {};
    cswRec.date = '';
    cswRec.description = '';
    cswRec.descriptiveKeywords = {};
    cswRec.geographicElements = {};
    cswRec.id = id;
    cswRec.name = name;
    cswRec.noCache = true;
    const ormRec = this.makeCustomOnlineResourceModel('KMZ', name, url);
    cswRec.onlineResources = [ormRec];
    cswRec.recordInfoUrl = '';
    cswRec.resourceProvider = '';
    cswRec.service = false;
    cswRec.expanded = false;
    return cswRec;
  }

  /**
   * Make a custom CSW Record with a KML layer inside
   * 
   * @param name name of KML layer
   * @param id KML layer id
   * @returns CSWRecordModel object
   */
  public makeCustomKMLCSWRec(name: string, id: string, url: string): CSWRecordModel {
    const cswRec = new CSWRecordModel();
    cswRec.adminArea = '';
    cswRec.childRecords = {};
    cswRec.constraints = '';
    cswRec.useLimitConstraints = '';
    cswRec.accessConstraints = '';
    cswRec.contactOrg = '';
    cswRec.funderOrg = '';
    cswRec.datasetURIs = {};
    cswRec.date = '';
    cswRec.description = '';
    cswRec.descriptiveKeywords = {};
    cswRec.geographicElements = {};
    cswRec.id = id;
    cswRec.name = name;
    cswRec.noCache = true;
    const ormRec = this.makeCustomOnlineResourceModel('KML', name, url);
    cswRec.onlineResources = [ormRec];
    cswRec.recordInfoUrl = '';
    cswRec.resourceProvider = '';
    cswRec.service = false;
    cswRec.expanded = false;
    return cswRec;
  }
  /**
   * Make a custom CSW Record with a GEOJSON layer inside
   * 
   * @param name name of GEOJSON layer
   * @param id GEOJSON layer id
   * @returns CSWRecordModel object
   */
  public makeCustomJsonCSWRec(name: string, id: string, url: string): CSWRecordModel {
    const cswRec = new CSWRecordModel();
    cswRec.adminArea = '';
    cswRec.childRecords = {};
    cswRec.constraints = '';
    cswRec.useLimitConstraints = '';
    cswRec.accessConstraints = '';
    cswRec.contactOrg = '';
    cswRec.funderOrg = '';
    cswRec.datasetURIs = {};
    cswRec.date = '';
    cswRec.description = '';
    cswRec.descriptiveKeywords = {};
    cswRec.geographicElements = {};
    cswRec.id = id;
    cswRec.name = name;
    cswRec.noCache = true;
    const ormRec = this.makeCustomOnlineResourceModel('GEOJSON', name, url);
    cswRec.onlineResources = [ormRec];
    cswRec.recordInfoUrl = '';
    cswRec.resourceProvider = '';
    cswRec.service = false;
    cswRec.expanded = false;
    return cswRec;
  }
  /**
   * Make a custom placeholder OnlineResourceModel
   * @param type layer type (e.g. 'KML', 'WMS' ...)
   * @param name name of layer
   * @returns OnlineResourceModel object
   */
  public makeCustomOnlineResourceModel(type: string, name: string, url: string): OnlineResourceModel {
    const ormRec = new OnlineResourceModel();
    ormRec.applicationProfile = '';
    ormRec.description = '';
    ormRec.name = name;
    ormRec.type = type;
    ormRec.url = url;
    ormRec.version = '';
    ormRec.geographicElements = {};
    ormRec.protocolRequest = '';
    return ormRec;
  }

  /**
   * Check if layer contains resources of a certain kind (WMS, WFS, IRIS ...)
   * @param layer the layer to query for resource types
   * @param resourceType resource type
   * @return true if resource type exists in layer
   */
  public contains(layer: LayerModel, resourceType: ResourceType): boolean {
    const cswRecords: CSWRecordModel[] = layer.cswRecords;
    for (const cswRecord of cswRecords) {
      for (const onlineResource of cswRecord.onlineResources) {
        if (onlineResource.type === resourceType) {
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
    return layer.cswRecords;
  }

 /**
  * Search and retrieve only wms records
  * @param layer the layer to query for wms records
  */
  public getWMSResource(layer: LayerModel): OnlineResourceModel[] {
       return this.getOnlineResources(layer, ResourceType.WMS);
  }

   /**
    * Search and retrieve only WCS records
    * @param layer the layer to query for wms records
    */
  public getWCSResource(layer: LayerModel): OnlineResourceModel[] {
       return this.getOnlineResources(layer, ResourceType.WCS);
  }

  /**
   * Search and retrieve only wfs records
   * @param layer the layer to query for wfs records
   */
  public getWFSResource(layer: LayerModel): OnlineResourceModel[] {
    return this.getOnlineResources(layer, ResourceType.WFS);
  }

  /**
   * Extract resources based on the type. If type is not defined, return all the resource
   * @method getOnlineResources
   * @param layer - the layer we would like to extract onlineResource from
   * @param resourceType - OPTIONAL a enum of the resource type. The ENUM constant is defined on app.js
   * @return resources - an array of the resource. empty array if none is found
   */
  public getOnlineResources(layer: LayerModel, resourceType?: ResourceType): OnlineResourceModel[] {
    const cswRecords: CSWRecordModel[] = layer.cswRecords;
    const onlineResourceResult = [];
    const uniqueURLSet = new Set<string>();
    for (const cswRecord of cswRecords) {
      for (const onlineResource of cswRecord.onlineResources) {
        // VT: We really just wanted the extent in the cswRecord so that map rendering library only loads what is in the extent.
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
  public getOnlineResourcesFromCSW(cswRecord: CSWRecordModel, resourceType?: ResourceType): OnlineResourceModel[] {

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
