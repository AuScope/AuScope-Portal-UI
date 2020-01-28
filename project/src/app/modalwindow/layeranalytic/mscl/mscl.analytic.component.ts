import { Component, OnInit, Input, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { MSCLService, Metric } from './mscl.service';
import { newPlot, Data } from 'plotly.js';

@Component({
  selector: 'app-mscl.analytic',
  templateUrl: './mscl.analytic.component.html',
  styleUrls: ['./mscl.analytic.component.scss'],
  providers: [MSCLService]
})
export class MSCLAnalyticComponent implements OnInit {

        // Data inserted at modal dialogue creation point
        startDepth: number; // Start depth for plotting
        endDepth: number;  // End depth for plotting
        featureId: string;  // Identifier of the borehole
        metricList: Metric[];  // List of metrics to plot
        closeGraphModal: () => null;  // Function to call when the modal dialogue must be closed

        @ViewChild('graphing_area') private graphing_area: ElementRef;  // Area used to display plots

        public allMetricList: Metric[];  // List of all possible metrics

        /**
         Create this class and initialize all metric list
         @param mcslService service used to retrieve MCSL data
         */
        constructor(public msclService: MSCLService, private renderer: Renderer2) {
            this.allMetricList = this.msclService.getMetricList();
        }

        /**
         Draws the plots
         */
        ngOnInit() {
            const element = this.graphing_area.nativeElement;

            // If we have metrics
            if (this.metricList.length > 0) {

                // Fetch data from MSCL service
                this.msclService.getMSCLDownload('http://meiproc.earthsci.unimelb.edu.au:80/geoserver/ows', this.featureId,
                                                 this.startDepth, this.endDepth, this.metricList).subscribe(valuesList => {
                    // Compile lists of X and Y values; plots are vertical, Y is common to all plots
                    const xLists = {};
                    const yList = [];
                    for (const metricEnum of this.metricList) {
                        xLists[metricEnum] = [];
                    }
                    for (const values of valuesList) {
                        for (const metricEnum of this.metricList) {
                            const valMetric = this.msclService.fromMetric(metricEnum);
                            xLists[metricEnum].push(values[valMetric]);
                        }
                        yList.push(values.depth);
                    }
                    const traceList: Data[] = [];
                    let metricNum = 1;
                    for (const metric of this.metricList) {
                        const trace: Data = {
                            x: xLists[metric],
                            y: yList,
                            xaxis: 'x' + metricNum.toString(),
                            yaxis: 'y' + metricNum.toString(),
                            type: 'scatter',
                            showlegend: false,
                            name: metric,
                            hoverinfo: 'x+y+name'
                        };
                        traceList.push(trace);
                        metricNum++;
                    }
                    // Create plots
                    const layout = this.msclService.getMetricGraphLayout(this.metricList);
                    newPlot(element, traceList, layout);

                }, error => {
                    console.error('Error retrieving MSCL data:', error);
                    this.createModalMessage(element, 'Error retrieving MSCL data');
                });

            // If we don't have any metrics display a message
            } else {
                    this.createModalMessage(element, 'Please select at least one metric');
            }
        }

        /**
         Insert a message into modal dialogue in place of a graph. Used for error conditions.
         */
        private createModalMessage(element: ElementRef, message: string) {
            const d2 = this.renderer.createElement('div');
            const text = this.renderer.createText(message);
            this.renderer.appendChild(d2, text);
            this.renderer.appendChild(element, d2);
        }
}
