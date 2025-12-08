import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { LayerHandlerService } from '../../lib/portal-core-ui/service/cswrecords/layer-handler.service';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { UtilitiesService } from '../../lib/portal-core-ui/utility/utilities.service';
import { GetCapsService } from '../../lib/portal-core-ui/service/wms/get-caps.service';
import { map } from 'rxjs/operators';
import { ResourceType } from 'app/lib/portal-core-ui/utility/constants.service';

/**
 * Class for layer time information
 */
export class LayerTimes {
    timeExtent: Date[] = []; // Array of dates representing time extent
    currentTime: Date; // Current date within timeExtent
    loadingTimeExtent = false; // Are the times being loaded
}

/**
 * FilterPanels can appear in the search window as well as the sidebar, this
 * class ensures layer filters are synchronised.
 */
@Injectable()
export class FilterService {

    // Collection of filters (filterCollection) for a given layer
    private layerFilterCollections: Map<string, BehaviorSubject<any>> = new Map<string, BehaviorSubject<any>>();
    // Providers for a given layer
    private layerProviders: Map<string, BehaviorSubject<Array<object>>> = new Map<string, BehaviorSubject<Array<object>>>();
    // Layer times retrieved from GetCaps
    private layerTimes: Map<string, BehaviorSubject<LayerTimes>> = new Map<string, BehaviorSubject<LayerTimes>>();


    constructor(private layerHandlerService: LayerHandlerService, private getCapsService: GetCapsService) {}

    /**
     * Register a filter collection for a layer
     *
     * @param layerId the ID of the layer
     * @param filterCollection the filter collection for the layer
     * @returns the existing filter collection as an Observable if one has already been registered,
     *          or a new filter collection otherwise
     */
    public registerLayerFilterCollection(layerId: string, filterCollection: any): Observable<any> {
        const existingFilterCollection = this.layerFilterCollections.get(layerId);
        if (!existingFilterCollection) {
            const filterCollectionBS: BehaviorSubject<any> = new BehaviorSubject(filterCollection);
            this.layerFilterCollections.set(layerId, filterCollectionBS);
            return filterCollectionBS;
        }
        return existingFilterCollection;
    }

    /**
     * Update a layer's filter collection
     *
     * @param layerId the ID of the layer
     * @param filterCollection the updated filter collection
     */
    public updateLayerFilterCollection(layerId: string, filterCollection: any): void {
        const existingFilterCollection = this.layerFilterCollections.get(layerId);
        if (existingFilterCollection) {
            this.layerFilterCollections.get(layerId).next(filterCollection);
        }
    }

    /**
     * Register layer providers for a layer
     *
     * @param layer the LayerModel
     * @returns the existing providers as an Observable array if they have already been registered,
     *          or a new providers array otherwise
     */
    public registerLayerProviders(layer: LayerModel): Observable<Array<object>> {
        const existingLayerProviders = this.layerProviders.get(layer.id);
        if (!existingLayerProviders) {
            const layerProviders = [];
            const cswRecords = layer.cswRecords;
            // Set up a map of contact orgs + URLs that belong to each
            const contactOrgsMap = {};
            for (const record of cswRecords) {
                const contactOrg = record.contactOrg;
                if (contactOrg !== null) {
                    const allOnlineResources = this.layerHandlerService.getOnlineResourcesFromCSW(record);
                    if (allOnlineResources.length > 0) {
                        contactOrgsMap[contactOrg] = UtilitiesService.getUrlDomain(allOnlineResources[0].url);
                    }
                }
            }
            // Set up a list of each unique contact org
            for (const key in contactOrgsMap) {
                layerProviders.push({
                    label: key,
                    value: contactOrgsMap[key]
                });
            }
            const layerProvidersBS: BehaviorSubject<Array<object>> = new BehaviorSubject(layerProviders);
            this.layerProviders.set(layer.id, layerProvidersBS);
            return layerProvidersBS;
        }
        return existingLayerProviders;
    }

    /**
     * Calls OGC WMS GetCapabilities request using cswRecord URL and returns response as Observable
     * @param layer layer model
     * @returns Observable<null> if no data, or Observable<{getCaps response, layer name}> if successful
     */
    private getCapabilityRecord(layer: LayerModel): Observable<{getCaps: any, layerName: string}> {
        const onlineResources = UtilitiesService.getLayerResources(layer, ResourceType.WMS);
        if (onlineResources.length > 0) {
            let wmsEndpointUrl = onlineResources[0].url;
            const layerName = onlineResources[0].name;

            // Query WMS GetCapabilities for timeExtent
            if (wmsEndpointUrl.indexOf('?') !== -1) {
                wmsEndpointUrl = wmsEndpointUrl.substring(0, wmsEndpointUrl.indexOf('?'));
            }
            // Use pipe() and map() to convert Observable<x> to Observable<{x, y}>
            return this.getCapsService.getCaps(wmsEndpointUrl).pipe(
                map(value => ({ getCaps: value, layerName: layerName }))
            );
        }
        return of(null);
    }

    /**
     * Get layer times behaviour subject for a given layer
     *
     * @param layerId ID of the layer
     * @returns LayerTimes as Observable
     */
    public getLayerTimesBS(layerId: string): BehaviorSubject<LayerTimes> {
        let layerTimesBS: BehaviorSubject<LayerTimes> = this.layerTimes.get(layerId);
        if (layerTimesBS) {
            return layerTimesBS;
        }
        const layerTimes: LayerTimes = new LayerTimes();
        layerTimesBS = new BehaviorSubject(layerTimes);
        this.layerTimes.set(layerId, layerTimesBS);
        return layerTimesBS;
    }

    /**
     * Set layer times for a given layer
     *
     * @param layerId ID of the layer
     * @param layerTimes layer times
     */
    public setLayerTimes(layerId: string, layerTimes: LayerTimes) {
        this.getLayerTimesBS(layerId).next(layerTimes);
    }

    /**
     * Extracts layerTimes from layer, sorts them
     * @param layer layer object that contains capability records
     * @param layerTimes layerTimes object
     * @param layerName OGC WMS layer name as found in GetCapabilities response
     * @returns layerTimes object
     */
    private extractLayerTimes(layer: LayerModel, layerTimes: LayerTimes, layerName: string): LayerTimes {
        // Check if WMS capability record present and time extent set
        const layerCapRec = layer.capabilityRecords.find(c => c.serviceType.toLowerCase() === 'wms');
        if (layerCapRec.layers?.length > 0) {
            const responseLayers = layerCapRec.layers.filter(l => l.name === layerName);
            if (responseLayers[0]?.timeExtent?.length > 0) {
                // Sort layer times: newest time is first, oldest time last
                const strDateArr = responseLayers[0].timeExtent.sort((a, b) => {
                        return <any>new Date(b) - <any>new Date(a);
                });
                layerTimes.timeExtent = []
                for (const timeExt of strDateArr) {
                    if (typeof timeExt === 'string') {
                        layerTimes.timeExtent.push(new Date(timeExt));
                    }
                }
                // Time may have already been set from retrieving state
                if (!layerTimes.currentTime) {
                    layerTimes.currentTime = layerTimes.timeExtent[0];
                }
            }
        }
        return layerTimes;
    }

    /**
     * Get LayerTimes from CapabilityRecords or WMS for a given layer
     *
     * @param layer the layer
     * @param layerTimes the layer times
     */
    public updateLayerTimes(layer: LayerModel, layerTimes: LayerTimes) {
        let layerTimesBS: BehaviorSubject<LayerTimes> = this.layerTimes.get(layer.id);
        if (!layerTimesBS) {
            const layerTimes: LayerTimes = new LayerTimes();
            layerTimesBS = new BehaviorSubject(layerTimes);
            this.layerTimes.set(layer.id, layerTimesBS);
        }

        // If WMS capability record not present
        if (!(layer.capabilityRecords?.length > 0)) {
            // Call WMS GetCapabilites using layer info
            layerTimes.loadingTimeExtent = true;
            // Notify subscribers that loading has started
            layerTimesBS.next(layerTimes);
            this.getCapabilityRecord(layer).subscribe(response => {
                if (response) {
                    if (response.getCaps.data?.capabilityRecords.length === 1) {
                        layer.capabilityRecords = response.getCaps.data.capabilityRecords;
                    }
                }
                // Extract layer times from GetCaps response
                if (layer.capabilityRecords?.length > 0) {
                    layerTimes = this.extractLayerTimes(layer, layerTimes, response.layerName);
                }
                layerTimes.loadingTimeExtent = false;
                layerTimesBS.next(layerTimes);
            }, () => { // If error still need to submit layerTimes
                layerTimes.loadingTimeExtent = false;
                layerTimesBS.next(layerTimes);
            });
        // Layer does have capability records
        } else {
            // Get OCG WMS layer name and extract layer times from GetCaps response
            const onlineResources = UtilitiesService.getLayerResources(layer, ResourceType.WMS);
            if (onlineResources.length > 0) {
                const layerName = onlineResources[0].name;
                if (layerName) {
                    layerTimes = this.extractLayerTimes(layer, layerTimes, layerName);
                }
            }
            layerTimes.loadingTimeExtent = false;
            layerTimesBS.next(layerTimes);
        }
    }
}


