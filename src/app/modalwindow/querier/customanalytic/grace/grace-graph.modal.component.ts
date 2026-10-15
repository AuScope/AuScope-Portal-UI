import { Component, AfterViewInit, inject, signal } from '@angular/core';
import { CsMapObject } from '../../../../lib/portal-core-ui/service/cesium-map/cs-map-object';
import { Subscription } from 'rxjs';
import { GraceService } from '../../../../services/wcustom/grace/grace.service';
import { saveAs } from 'file-saver';

import * as Plotly from 'plotly.js-dist-min';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * Modal to display GRACE time series data.
 */
@Component({
    selector: 'app-grace-graph-modal-content',
    templateUrl: './grace-graph.modal.component.html',
    styleUrls: ['./grace-graph.modal.component.scss'],
    standalone: false
})
export class GraceGraphModalComponent implements AfterViewInit {
    private graceService = inject(GraceService);
    private csMapObject = inject(CsMapObject);
    dialogRef = inject(MatDialogRef<GraceGraphModalComponent>);

    // Data will contain lat/lon (y and x) values for point location or
    // coordinate array of lat/lon (coords) and centroid (centroid) for polys
    data = inject(MAT_DIALOG_DATA);

    QueryStatus = {
        querying: 0,
        loaded: 1,
        error: 2
    };

    showUncertainty = true;
    querySubscription!: Subscription;
    queryStatus = signal<number>(this.QueryStatus.querying);
    queriedData = signal<any>({});

    // Graph data
    graph = signal({
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
            title: { text: 'Equivalent Water Height (EWH)' },
            xaxis: {
                title: { text: 'Date' }
            },
            yaxis: {
                title: { text: 'Equivalent Water Height (m)' }
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: true, // client requested buttons always visible
            modeBarButtonsToAdd: [{
                name: 'Download JSON data',
                icon: Plotly.Icons.disk,
                click: () => {
                    this.downloadData();
                }
            }],
            modeBarButtonsToRemove: [
                'toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian'
            ]
        }
    });

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
        this.queryStatus.set(this.QueryStatus.querying);

        // Make call to GRACE service to get data for single parameter
        if (this.data.x !== undefined && this.data.y !== undefined) {
            this.querySubscription = this.graceService.getGraceTimeSeriesDataForPoint(this.data.x, this.data.y).subscribe(data => {
                if (data === null) {
                    this.queryStatus.set(this.QueryStatus.error);
                } else {
                    this.queriedData.set(data);

                    let title = '<b>Equivalent Water Height (EWH)</b><br>Primary Mascon: ' + data.primary_mascon_id;
                    const responseCentroid = data.centroid;
                    if (responseCentroid) {
                      const centroid = this.parseCentroid(responseCentroid);
                      title += ' (' + centroid + ')<br>';
                    } else {
                      title += '<br>';
                    }
                    const totalArea = data.total_area;
                    if (totalArea) {
                      title += 'Area: ' + (totalArea / 1000000).toFixed(3) + 'km<sup>2</sup>';
                    }

                    this.plotGraph(title, data);
                    this.queryStatus.set(this.QueryStatus.loaded);
                }
            }, () => {
                this.queryStatus.set(this.QueryStatus.error);
            });
        } else if (this.data.coords !== undefined && this.data.coords.length > 0) {
            // TODO: Remove hard-coding... will need to be a record keyword component
            this.querySubscription = this.graceService.getGraceTimeSeriesDataForPolygon(this.data.coords).subscribe(data => {
                if (data === null) {
                    this.queryStatus.set(this.QueryStatus.error);
                } else {
                    this.queriedData.set(data);
                    let title = '<b>Equivalent Water Height (EWH) for Region</b><br>' +
                        'Primary Mascons: ' + data.primary_mascons;
                    const totalArea = data.total_area;
                    if (totalArea) {
                        title += '<br>Total Area: ' + (totalArea / 1000000).toFixed(3) + 'km<sup>2</sup>';
                    }
                    this.plotGraph(title, data);
                    this.queryStatus.set(this.QueryStatus.loaded);
                }
            }, () => {
                this.queryStatus.set(this.QueryStatus.error);
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

        this.graph.set({
            ...this.graph(),
            data: [{
              x: data.graph_x,
              y: data.graph_y,
              mode: 'lines+points',
              marker: {
                  color: 'blue'
              },
              // TODO: Errors if needed
              error_y: errorPlot,
              type: 'scatter' }
            ],
            layout: {
              autosize: true,
              title: { text: title },
              xaxis: {
                  title: { text: 'Date' }
              },
              yaxis: {
                  title: { text: 'Equivalent Water Height (m)' }
              }
            }
        });
    }

    /**
     * Download graph data to local device
     */
    public downloadData() {
        const blob = new Blob([JSON.stringify(this.queriedData)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'mascon_data.json');
    }

    /**
     * Close and hide polygon
     */
    closeDialog() {
        if (this.querySubscription) {
            this.querySubscription.unsubscribe();
        }
        this.dialogRef.close();
        this.csMapObject.clearPolygon();
    }

}
