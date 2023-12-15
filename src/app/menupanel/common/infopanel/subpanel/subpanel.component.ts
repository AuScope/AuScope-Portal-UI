import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CSWRecordModel, LayerModel, OnlineResourceModel, UtilitiesService } from '@auscope/portal-core-ui';


@Component({
    selector: 'info-sub-panel',
    templateUrl: './subpanel.component.html',
    styleUrls: ['../../../menupanel.scss']
})
export class InfoPanelSubComponent implements OnChanges {
    @Input() cswRecord: CSWRecordModel;
    @Input() layer: LayerModel;
    @Input() expanded: boolean;

    // These store the URL of the WMS preview and legend
    wmsUrl: any;
    legendUrl: any;

    constructor(@Inject('env') private env) {}

    /**
     * Remove unwanted strings from metadata constraints fields
     * @param constraints string array of contraints
     * @return string constraints in string format
     */
    public selectConstraints(capabilityRecords, cswConstraints: string[]) {
        if (capabilityRecords && capabilityRecords.length > 0 && capabilityRecords[0].accessConstraints && capabilityRecords[0].accessConstraints.length > 0) {
            return this.cleanConstraints(capabilityRecords[0].accessConstraints);
        } else {
            return this.cleanConstraints(cswConstraints);
        }
    }

    /**
     * Remove unwanted and empty strings from metadata constraints fields
     * @param constraints string array of contraints
     * @return string constraints in string format
     */
    public cleanConstraints(constraints: string[]) {
        let outStr = '';
        for (const conStr of constraints) {
            if (conStr.indexOf('no conditions apply') < 0 &&
                conStr.indexOf('#MD_RestrictionCode') < 0 && conStr.trim() !== "") {
                outStr += conStr.trim() + ', ';
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

    /**
     * Gets called by Angular framework upon any changes
     * @param changes object which holds the changes
     */
    ngOnChanges(changes: SimpleChanges) {
        // If this subpanel becomes expanded, then load up the legend and preview map
        if (changes.expanded.currentValue === true && !changes.expanded.previousValue) {
            const me = this;
            const wmsOnlineResource = this.cswRecord.onlineResources.find(r => r.type.toLowerCase() === 'wms');
            if (wmsOnlineResource) {
                const params = 'SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                    + '&LAYER=' + wmsOnlineResource.name + '&LAYERS=' + wmsOnlineResource.name + '&WIDTH=188&SCALE=1000000'
                    + '&LEGEND_OPTIONS=forceLabels:on;minSymbolSize:16';
                this.legendUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(wmsOnlineResource.url), params);
            } else if (this.layer.legendImg && this.layer.legendImg !== '') {
                this.legendUrl = this.env.portalBaseUrl + 'legend/' + this.layer.legendImg;
            }
            // Gather up BBOX coordinates to calculate the centre and envelope
            const bbox = this.cswRecord.geographicElements[0];
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
                if (this.layer.group == 'ASTER Maps') {
                    params += '&TIME=' + this.layer['capabilityRecords'][0]['layers'][0]['timeExtent'][0];
                }
                this.wmsUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(wmsOnlineResource.url), params);
            }
        }
    }
    public onImgError(event: Event) {
        // (event.target as HTMLImageElement).style.display = 'none';
        (event.target as HTMLImageElement).parentElement.style.display = 'none';
    }

}
