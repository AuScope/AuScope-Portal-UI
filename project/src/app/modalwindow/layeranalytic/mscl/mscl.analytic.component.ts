import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { MSCLService, Metric } from './mscl.service';
import { newPlot, relayout } from 'plotly.js-basic-dist-min';

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
        serviceUrl: string; // URL of MSCL service

        @ViewChild('graphing_area') private graphing_area: ElementRef;  // Area used to display plots

        public allMetricList: Metric[];  // List of all possible metrics

        /**
         Create this class and initialize all metric list
         @param msclService service used to retrieve MCSL data
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
                this.msclService.getMSCLDownload(this.serviceUrl, this.featureId, this.startDepth, this.endDepth, this.metricList).subscribe(valuesList => {
                    // Compile lists of X and Y values; plots are vertical, Y is common to all plots
                    const xLists: { Metric: number[] } | {} = {};
                    const yList: number[] = [];
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

                    // Create plots
                    const traceList = this.msclService.getGraphTraceList(this.metricList, xLists, yList);
                    const layout = this.msclService.getGraphLayout(this.metricList, xLists);
                    newPlot(element, traceList, layout, {responsive: true});

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
