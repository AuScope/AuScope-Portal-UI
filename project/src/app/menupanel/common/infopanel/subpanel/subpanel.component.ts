import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CSWRecordModel } from '../../../../portal-core-ui/model/data/cswrecord.model';
import { LayerModel } from '../../../../portal-core-ui/model/data/layer.model';
import { LegendService } from '../../../../portal-core-ui/service/wms/legend.service';
import { UtilitiesService } from '../../../../portal-core-ui/utility/utilities.service';



@Component({
    selector: 'info-sub-panel',
    templateUrl: './subpanel.component.html'
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
                                    let params = 'REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                                    + '&LAYER=' + onlineResources[j].name + '&LAYERS=' + onlineResources[j].name + '&SCALE=1000000';
                                    // If there is a style, then use it
                                    if (sldBody.length > 0) {
                                        params += '&SLD_BODY=' + sldBody + '&LEGEND_OPTIONS=forceLabels:on;minSymbolSize:16';
                                    }
                                    this.legendUrl = UtilitiesService.addUrlParameters(onlineResources[j].url, params);
                                }
                            }
                        }
                    });
                } else {
                    const onlineResources = this.cswRecord.onlineResources;
                    for (let j = 0; j < onlineResources.length; j++) {
                        if (onlineResources[j].type === 'WMS') {
                            const params = 'REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&HEIGHT=25&BGCOLOR=0xFFFFFF'
                            + '&LAYER=' + onlineResources[j].name + '&LAYERS=' + onlineResources[j].name + '&WIDTH=188&SCALE=1000000';
                            this.legendUrl = UtilitiesService.addUrlParameters(onlineResources[j].url, params);
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
                        this.wmsUrl = UtilitiesService.addUrlParameters(onlineResources[j].url, params);
                    }
                }
        }
    }

}
