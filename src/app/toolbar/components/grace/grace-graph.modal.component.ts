import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CsMapObject } from '@auscope/portal-core-ui';
import { Subscription } from 'rxjs';
import { GraceService } from '../../../services/wcustom/grace/grace.service';
import { saveAs } from 'file-saver';
import { BsModalRef } from 'ngx-bootstrap/modal';

import * as Plotly from 'plotly.js-dist-min';

/**
 * Modal to display GRACE time series data.
 */
@Component({
    selector: 'app-grace-graph-modal-content',
    templateUrl: './grace-graph.modal.component.html',
    styleUrls: ['./grace-graph.modal.component.scss']
})
export class GraceGraphModalComponent implements AfterViewInit {

    QueryStatus = {
        querying: 0,
        loaded: 1,
        error: 2
    };

    showUncertainty = true;

    // Lat/Lon inputs or coordinate array of lat/lon for polys
    x: number;
    y: number;
    coords: any[];
    centroid: string;

    querySubscription: Subscription;
    queryStatus: number = this.QueryStatus.querying;

    queriedData: any = {};

    // Graph data
    public graph = {
        data: [{
            x: [],
            y: [],
            mode: 'lines+points',
            marker: {
                color: 'blue'
            },
            error_y: {},
            type: 'scatter'
        }],
        layout: {
            autosize: true,
            title: 'Equivalent Water Height (EWH)',
            xaxis: {
                title: 'Date'
            },
            yaxis: {
                title: 'Equivalent Water Height (m)'
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: true,   // client requested buttons always visible
            modeBarButtonsToAdd: [{
                name: 'Download JSON data',
                icon: Plotly.Icons.disk,
                click: function() {
                    this.downloadData();
                }.bind(this)
            }],
            modeBarButtonsToRemove: [
                'toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian'
            ]
        }
    };

    constructor(private graceService: GraceService, private csMapObject: CsMapObject, public modalRef: BsModalRef, private changeDetectorRef: ChangeDetectorRef) {}

    ngAfterViewInit() {
        // Cesium draw event is a bit slow, give dialog some time for content to be set
        setTimeout(() => {
            this.queryTimeSeries();
        }, 100)
    }

    /**
     * Convert centroid into string form for modal title
     * @param centroid centroid as (x,y)
     * @returns centroid in form 'x, y'
     */
    parseCentroid(centroid: string): string {
        const lon = Number(centroid.substring(centroid.indexOf('(') + 1, centroid.indexOf(' '))).toFixed(2);
        const lat = Number(centroid.substring(centroid.indexOf(' ') + 1, centroid.indexOf(')'))).toFixed(2);
        return lat + ', ' + lon;
    }

    /**
     * Quert time series from grace API
     */
    private queryTimeSeries() {
        if (this.querySubscription) {
            this.querySubscription.unsubscribe();
        }
        this.queryStatus = this.QueryStatus.querying;

        // Make call to GRACE service to get data for single parameter
        if (this.x !== undefined && this.y !== undefined) {
            this.querySubscription = this.graceService.getGraceTimeSeriesDataForPoint(this.x, this.y).subscribe(data => {
                if (data === null) {
                    this.queryStatus = this.QueryStatus.error;
                    this.changeDetectorRef.detectChanges();
                } else {
                    this.queriedData = data;
                    const centroid = this.parseCentroid(data.response.centroid);
                    const title = '<b>Equivalent Water Height (EWH)</b><br>' +
                        'Primary Mascon: ' + data.response.primary_mascon_id + ' (' + centroid + ')<br>' +
                        'Area: ' + (data.response.total_area / 1000000).toFixed(3) + 'km<sup>2</sup>';
                    this.plotGraph(title, data.response);
                    this.queryStatus = this.QueryStatus.loaded;
                }
            }, error => {
                this.queryStatus = this.QueryStatus.error;
                this.changeDetectorRef.detectChanges();
            });
        } else if (this.coords !== undefined && this.coords.length > 0) {
            // TODO: Remove hard-coding... will need to be a record keyword component
            this.querySubscription = this.graceService.getGraceTimeSeriesDataForPolygon(this.coords).subscribe(data => {
                if (data === null) {
                    this.queryStatus = this.QueryStatus.error;
                    this.changeDetectorRef.detectChanges();
                } else {
                    this.queriedData = data;
                    const title = '<b>Equivalent Water Height (EWH) for Region</b><br>' +
                        'Primary Mascons: ' + data.response.primary_mascons + '<br>' +
                        'Total Area: ' + (data.response.total_area / 1000000).toFixed(3) + 'km<sup>2</sup>';
                    this.plotGraph(title, data.response);
                    this.queryStatus = this.QueryStatus.loaded;
                    this.changeDetectorRef.detectChanges();
                }
            }, error => {
                this.queryStatus = this.QueryStatus.error;
                this.changeDetectorRef.detectChanges();
            });
        }
    }

    /**
     * Plot graph
     * @param title title of graph
     * @param data graph data
     */
    plotGraph(title: string, data: any) {
        let errorPlot = {};
        if (data.hasOwnProperty('error_y')) {
            errorPlot = {
                type: 'data',
                array: data.error_y,
                color: 'purple',
                visible: true
            };
        }

        this.graph.data = [{
            x: data.graph_x,
            y: data.graph_y,
            mode: 'lines+points',
            marker: {
                color: 'blue'
            },
            // TODO: Errors if needed
            error_y: errorPlot,
            type: 'scatter' }
        ];

        this.graph.layout = {
            autosize: true,
            title: title,
            xaxis: {
                title: 'Date'
            },
            yaxis: {
                title: 'Equivalent Water Height (m)'
            }
        };
    }

    /**
     * Download graph data to local device
     */
    public downloadData() {
        const blob = new Blob([JSON.stringify(this.queriedData)], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, 'mascon_data.json');
    }

    /**
     * Close and hide polygon
     */
    closeDialog() {
        if (this.querySubscription) {
            this.querySubscription.unsubscribe();
        }
        this.modalRef?.hide();
        this.csMapObject.clearPolygon();
    }

}
