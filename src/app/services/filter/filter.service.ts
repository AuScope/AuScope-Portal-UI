import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GetCapsService, LayerHandlerService, LayerModel, UtilitiesService } from '@auscope/portal-core-ui';


/**
 * FilterPanels can appear in the search window as well as the sidebar, this
 * class ensures layer filters are synchronised.
 */
@Injectable()
export class FilterService {

    // Collection of filters (filterCollection) for a given layer
    private layerFilterCollections: Map<string, BehaviorSubject<any>> = new Map<string, BehaviorSubject<any>>();
    // Providers for a given layer
    private layerProviders: Map<string, BehaviorSubject<Array<Object>>> = new Map<string, BehaviorSubject<Array<Object>>>();
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
    public updateLayerFilterCollection(layerId: string, filterCollection: any) {
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
    public registerLayerProviders(layer: LayerModel): Observable<Array<Object>> {
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
            const layerProvidersBS: BehaviorSubject<Array<Object>> = new BehaviorSubject(layerProviders);
            this.layerProviders.set(layer.id, layerProvidersBS);
            return layerProvidersBS;
        }
        return existingLayerProviders;
    }

    private getCapabilityRecord(layer: LayerModel): LayerModel {
        let wmsEndpointUrl = null;
        let layerName = null;
        // Check if WMS capability record present
        if (layer.capabilityRecords && layer.capabilityRecords.length > 0) {
            return;
        }
        // Look for WMS endpoint in CSW records if not already found
        if (layer.cswRecords && layer.cswRecords.length > 0) {
            for (const cswRecord of layer.cswRecords) {
            if (cswRecord.onlineResources) {
                const resource = cswRecord.onlineResources.find(o => o.type.toLowerCase() === 'wms');
                if (resource) {
                wmsEndpointUrl = resource.url;
                layerName = resource.name;
                continue;
                }
            }
            }
        }

        // Query WMS GetCapabilities for timeExtent
        if (wmsEndpointUrl !== null && layerName !== null) {
            if (wmsEndpointUrl.indexOf('?') !== -1) {
            wmsEndpointUrl = wmsEndpointUrl.substring(0, wmsEndpointUrl.indexOf('?'));
            }
            this.getCapsService.getCaps(wmsEndpointUrl).subscribe(response => {
            if (response.data && response.data.capabilityRecords.length === 1) {
                layer.capabilityRecords = response.data.capabilityRecords;
            }
            });
        }
        return layer;
    }

    /**
     * Get layer times for a given layer
     *
     * @param layerId ID of th elayer
     * @returns LayerTimes as Observable
     */
    public getLayerTimes(layerId: string): BehaviorSubject<LayerTimes> {
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
        this.getLayerTimes(layerId).next(layerTimes);
    }

    /**
     * Get LayerTimes from CapabilityRecords or WMS for a given layer
     *
     * @param layer the layer
     * @param layerTimes the layer times
     */
    public updateLayerTimes(layer: LayerModel, layerTimes: LayerTimes) {
        const layerTimesBS: BehaviorSubject<LayerTimes> = this.layerTimes.get(layer.id);

        let wmsEndpointUrl = null;
        let layerName = null;

        // Check if WMS capability record present
        if (!(layer.capabilityRecords && layer.capabilityRecords.length > 0)) {
            layer = this.getCapabilityRecord(layer);
        }

        // Check if WMS capability record present and time extent set
        if (layer.capabilityRecords && layer.capabilityRecords.length > 0) {
            const layerCapRec = layer.capabilityRecords.find(c => c.serviceType.toLowerCase() === 'wms');
            if (layerCapRec && layerCapRec.layers.length > 0) {
                if (layerCapRec.layers[0].timeExtent) {
                    layerTimes.timeExtent = layerCapRec.layers[0].timeExtent;
                    layerTimes.currentTime = layerTimes.timeExtent[0];
                }
            }
        }
        // Look for WMS endpoint in CSW records if not already found
        if (!layerTimes.currentTime && layer.cswRecords && layer.cswRecords.length > 0) {
            for (const cswRecord of layer.cswRecords) {
            if (cswRecord.onlineResources) {
                const resource = cswRecord.onlineResources.find(o => o.type.toLowerCase() === 'wms');
                if (resource) {
                    wmsEndpointUrl = resource.url;
                    layerName = resource.name;
                    continue;
                }
            }
            }
        }
        // Query WMS GetCapabilities for timeExtent
        if (layerTimes.timeExtent.length === 0 && wmsEndpointUrl !== null && layerName !== null) {
            layerTimes.loadingTimeExtent = true;
            if (wmsEndpointUrl.indexOf('?') !== -1) {
            wmsEndpointUrl = wmsEndpointUrl.substring(0, wmsEndpointUrl.indexOf('?'));
            }
            this.getCapsService.getCaps(wmsEndpointUrl).subscribe(response => {
            if (response.data && response.data.capabilityRecords.length === 1 && response.data.capabilityRecords[0].layers.length > 0) {
                const responseLayers = response.data.capabilityRecords[0].layers.filter(l => l.name === layerName);
                if (responseLayers && responseLayers.length > 0 && responseLayers[0].timeExtent) {
                // Sort by date (newest first)
                layerTimes.timeExtent = responseLayers[0].timeExtent.sort((a, b) => {
                    return <any>new Date(b) - <any>new Date(a);
                });
                // Time may have already been set from retrieving state
                if (!layerTimes.currentTime) {
                    layerTimes.currentTime = layerTimes.timeExtent[0];
                }
                }
            }
            layerTimes.loadingTimeExtent = false;
            layerTimesBS.next(layerTimes);
            }, () => {
            layerTimes.loadingTimeExtent = false;
            layerTimesBS.next(layerTimes);
            });
        } else {
            layerTimes.loadingTimeExtent = false;
            layerTimesBS.next(layerTimes);
        }
    }
}

/**
 * Class for layer time information
 */
export class LayerTimes {
    timeExtent: Date[] = [];    // Array of dates representing time extent
    currentTime: Date;          // Current date within timeExtent
    loadingTimeExtent = false;  // Are the times being loaded
}
