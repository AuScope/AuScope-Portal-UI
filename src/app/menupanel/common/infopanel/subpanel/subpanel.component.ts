import { Component, Inject, Input, OnInit } from '@angular/core';
import { CSWRecordModel } from '../../../../lib/portal-core-ui/model/data/cswrecord.model';
import { LayerModel } from '../../../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../../../lib/portal-core-ui/model/data/onlineresource.model';
import { UtilitiesService } from '../../../../lib/portal-core-ui/utility/utilities.service';
import { FilterService, LayerTimes } from 'app/services/filter/filter.service';
import { environment } from 'environments/environment';
import { config } from 'environments/config';

@Component({
    selector: 'info-sub-panel',
    templateUrl: './subpanel.component.html',
    styleUrls: ['../../../menupanel.scss', './subpanel.component.scss'],
    standalone: false
})
export class InfoPanelSubComponent implements OnInit {
    @Input() cswRecord: CSWRecordModel;
    @Input() layer: LayerModel;
    @Input() expanded: boolean;

    // These store the URL of the WMS preview, outline of Australia and legend
    wmsUrl: string;
    outlineUrl: string;
    legendUrl: string;
    // Have preview/legend loaded
    wmsLoaded = false;
    legendLoaded = false;

    constructor(@Inject('env') private env, private filterService: FilterService) {}

    /**
     * Remove unwanted strings from metadata constraints fields
     * @param constraints string array of contraints
     * @return string constraints in string format
     */
    public selectConstraints(capabilityRecords, cswConstraints: string[]) {
        if (capabilityRecords && capabilityRecords.length > 0 && capabilityRecords[0].accessConstraints && capabilityRecords[0].accessConstraints.length > 0) {
            return this.cleanConstraints(capabilityRecords[0].accessConstraints);
        } else if (cswConstraints) {
            return this.cleanConstraints(cswConstraints);
        }
    }

    /**
     * Remove unwanted and empty strings from metadata constraints fields
     * @param constraints string array of constraints
     * @return string constraints in string format
     */
    public cleanConstraints(constraints: string[]) {
        let outStr = '';
        if (constraints) {
            for (const conStr of constraints) {
                if (conStr.indexOf('no conditions apply') < 0 &&
                    conStr.indexOf('#MD_RestrictionCode') < 0 && conStr.trim() !== "") {
                    outStr += conStr.trim() + ', ';
                }
            }
        }
        // Remove trailing comma
        return outStr.replace(/, $/, '');
    }

    /**
     * Is the OnlineResourceModel of a type that supports GetCapabilities?
     *
     * @param onlineResource the OnlineResourceModel
     * @returns true if OnlineResource is of type WMS, WFS, WCS or CSW
     */
    public isGetCapabilitiesType(onlineResource: OnlineResourceModel): boolean {
        return onlineResource.type === 'WMS' || onlineResource.type === 'WFS' || onlineResource.type === 'WCS' || onlineResource.type === 'CSW';
    }

    /** Removes proxy from URL for display purposes
     *
     * e.g. "http://localhost:8080/getViaProxy.do?url=https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/kml/bikeRide.kml"
     * get converted to "https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/kml/bikeRide.kml"
     *
     * @param url URL which may be prepended with a reference to the proxy
     * @returns URL without the proxy part
     */
    public removeProxy(url: string): string {
        return url.replace(/^.+getViaProxy\.do\?url=/, "");
    }

    /**
     * Create a WMS/WFS/WCS/CSW GetCapabilities URL from the provided OnlineResource
     *
     * @param onlineResource the OnlineResourceModel
     * @returns a WMS, WFS or WCS GetCapabilities URL as a string
     */
    public onlineResourceGetCapabilitiesUrl(onlineResource: OnlineResourceModel): string {
        // Determine base path, append mandatory service and request parameters
        const paramIndex = onlineResource.url.indexOf('?');
        let path = paramIndex !== -1 ? onlineResource.url.substring(0, onlineResource.url.indexOf('?')) : onlineResource.url;
        path += '?service=' + onlineResource.type + '&request=GetCapabilities';
        // Apend any other non-service or request parameters to path
        if (paramIndex !== -1 && onlineResource.url.length > paramIndex + 1) {
            const paramString = onlineResource.url.substring(paramIndex + 1, onlineResource.url.length);
            const paramArray = paramString.split('&');
            for (const keyValueString of paramArray) {
                const keyValue = keyValueString.split('=');
                if (keyValue.length === 2) {
                    if (keyValue[0].toLowerCase() !== 'service' && keyValue[0].toLowerCase() !== 'request') {
                        path += '&' + keyValue[0] + '=' + keyValue[1];
                    }
                }
            }
        }
        return path;
    }

    ngOnInit(): void {
        // Update layer times for this layer if required
        if (config.queryGetCapabilitiesTimes.indexOf(this.layer.id) > -1) {
            this.filterService.updateLayerTimes(this.layer, new LayerTimes());
        }

        // We subscribe to the layer times even though it may not be required, but if it is we'll update
        // the WMS urls after the times have been loaded
        this.filterService.getLayerTimesBS(this.layer.id).subscribe(layerTimes => {
            const wmsOnlineResource = this.cswRecord.onlineResources.find(r => r.type.toLowerCase() === 'wms');
            if (wmsOnlineResource) {
               const params = 'SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png'
                    + '&LAYER=' + wmsOnlineResource.name + '&LAYERS=' + wmsOnlineResource.name
                    + '&LEGEND_OPTIONS=forceLabels:on;minSymbolSize:16';
                this.legendUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(wmsOnlineResource.url), params);
            } else if (this.layer.legendImg && this.layer.legendImg !== '') {
                this.legendUrl = this.env.portalBaseUrl + 'legend/' + this.layer.legendImg;
            }

            // Gather up BBOX coordinates to calculate the centre and envelope. Use a copy of coords so they don't stay modified for the main map
            const bbox = { ...this.cswRecord.geographicElements[0] };

            // Make sure that the view is only of Australia
            // On most maps if we use world-wide bounds it will make the Australian features too small
            if (bbox.westBoundLongitude < 100) {
                bbox.westBoundLongitude = 100;
            }
            if (bbox.eastBoundLongitude > 160) {
                bbox.eastBoundLongitude = 160;
            }
            if (bbox.southBoundLatitude < -50) {
                bbox.southBoundLatitude = -50;
            }
            if (bbox.northBoundLatitude > -5) {
                bbox.northBoundLatitude = -5;
            }

            // Gather up lists of information URLs
            if (wmsOnlineResource) {
                let params = 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&LAYERS='
                    + encodeURIComponent(wmsOnlineResource.name) + '&SRS=EPSG:4326&BBOX=' + bbox.westBoundLongitude + ',' + bbox.southBoundLatitude
                    + ',' + bbox.eastBoundLongitude + ',' + bbox.northBoundLatitude
                    + '&WIDTH=400&HEIGHT=400';

                // Add default time if present
                if (layerTimes?.currentTime) {
                    params += '&TIME=' + layerTimes.currentTime;
                }

                this.wmsUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(wmsOnlineResource.url), params);
                this.outlineUrl = "https://research-community.geoanalytics.csiro.au/geoserver/auscope/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&LAYERS=auscope%3AStates-and-Territories&TRANSPARENT=TRUE&SRS=EPSG:4326&FORMAT=image%2Fpng&BBOX="+
                                + bbox.westBoundLongitude + ',' + bbox.southBoundLatitude
                                + ',' + bbox.eastBoundLongitude + ',' + bbox.northBoundLatitude + "&WIDTH=400&HEIGHT=400";
            }
        });
    }

    /**
     * WMS or Legend image has finished loading
     * @param event the image load event
     */
    public onImgLoad(event: Event) {
        if ((event.target as HTMLImageElement).id === 'wmsImg' && !this.wmsLoaded) {
            this.wmsLoaded = true;
        } else if ((event.target as HTMLImageElement).id === 'legendImg' && !this.legendLoaded) {
            this.legendLoaded = true;
        }
    }

    /**
     * On first preview image error update the URL to use the proxy.
     * If the proxy also fails, remove the preview image element.
     *
     * @param event the error event
     */
    public onPreviewImgError(event: Event) {
        if (this.wmsUrl && this.wmsUrl.indexOf('getViaProxy.do') == -1) {
            this.wmsUrl = environment.portalBaseUrl + 'getViaProxy.do?usewhitelist=false&usepostafterproxy=true&url=' + this.wmsUrl;
            (event.target as HTMLImageElement).src = this.wmsUrl;
        } else {
            (event.target as HTMLImageElement).parentElement.style.display = 'none';
        }
    }

    /**
     * On first legend image error update the URL to use the proxy.
     * If the proxy also fails, remove the legend image element.
     *
     * @param event the error event
     */
    public onLegendImgError(event: Event) {
        if (this.legendUrl && this.legendUrl.indexOf('getViaProxy.do') == -1) {
            this.legendUrl = environment.portalBaseUrl + 'getViaProxy.do?usewhitelist=false&usepostafterproxy=true&url=' + this.legendUrl;
            (event.target as HTMLImageElement).src = this.legendUrl;
        } else {
            (event.target as HTMLImageElement).parentElement.parentElement.style.display = 'none';
        }
    }

}
