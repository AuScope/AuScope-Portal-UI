import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CSWRecordModel } from '@auscope/portal-core-ui';
import { LayerModel } from '@auscope/portal-core-ui';
import { LegendService } from '@auscope/portal-core-ui';
import { UtilitiesService } from '@auscope/portal-core-ui';



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

    constructor(public legendService: LegendService) {
    }

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

        let outStr = "";
        for (const conStr of constraints) {
            if (conStr.indexOf("no conditions apply") < 0 && 
                conStr.indexOf("#MD_RestrictionCode") < 0 && conStr.trim() != "") {
                outStr += conStr.trim() + ", ";
            }
        }
        // Remove trailing comma
        return outStr.replace(/, $/, "");
    }

    /**
     * Gets called by Angular framework upon any changes
     * @param changes object which holds the changes
     */
    ngOnChanges(changes: SimpleChanges) {
        // If this subpanel becomes expanded, then load up the legend and preview map
        if (changes.expanded.currentValue === true && !changes.expanded.previousValue) {
            const me = this;
            if (this.layer.proxyStyleUrl && this.layer.proxyStyleUrl.length > 0) {
                this.legendService.getLegendStyle(this.layer.proxyStyleUrl).subscribe(
                    response => {
                        if (response) {
                            const sldBody = encodeURIComponent(response);
                            // Gather up lists of legend URLs
                            const onlineResources = me.cswRecord.onlineResources;
                            for (let j = 0; j < onlineResources.length; j++) {
                                if (onlineResources[j].type === 'WMS') {
                                    let params = 'SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                                        + '&LAYER=' + onlineResources[j].name + '&LAYERS=' + onlineResources[j].name + '&SCALE=1000000';
                                    // If there is a style, then use it
                                    if (sldBody.length > 0) {
                                        params += '&SLD_BODY=' + sldBody + '&LEGEND_OPTIONS=forceLabels:on;minSymbolSize:16';
                                    }
                                    this.legendUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(onlineResources[j].url), params);
                                }
                            }
                        }
                    });
            } else {
                const onlineResources = this.cswRecord.onlineResources;
                for (let j = 0; j < onlineResources.length; j++) {
                    if (onlineResources[j].type === 'WMS') {
                        const params = 'SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                            + '&LAYER=' + onlineResources[j].name + '&LAYERS=' + onlineResources[j].name + '&WIDTH=188&SCALE=1000000';
                        this.legendUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(onlineResources[j].url), params);
                    }
                }
            }

            // Gather up BBOX coordinates to calculate the centre and envelope
            const bbox = this.cswRecord.geographicElements[0];

            // Gather up lists of information URLs
            const onlineResources = this.cswRecord.onlineResources;
            for (let j = 0; j < onlineResources.length; j++) {
                if (onlineResources[j].type === 'WMS') {
                    const params = 'SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&STYLES=&FORMAT=image/png&BGCOLOR=0xFFFFFF&TRANSPARENT=TRUE&LAYERS='
                        + encodeURIComponent(onlineResources[j].name) + '&SRS=EPSG:4326&BBOX=' + bbox.westBoundLongitude + ',' + bbox.southBoundLatitude
                        + ',' + bbox.eastBoundLongitude + ',' + bbox.northBoundLatitude
                        + '&WIDTH=400&HEIGHT=400';
                    this.wmsUrl = UtilitiesService.addUrlParameters(UtilitiesService.rmParamURL(onlineResources[j].url), params);
                }
            }
        }
    }

}
