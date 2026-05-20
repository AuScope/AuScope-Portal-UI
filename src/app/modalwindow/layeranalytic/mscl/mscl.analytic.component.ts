import { Component, OnInit, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, inject } from '@angular/core';
import { MSCLService } from './mscl.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-mscl.analytic',
    templateUrl: './mscl.analytic.component.html',
    styleUrls: ['./mscl.analytic.component.scss'],
    providers: [MSCLService],
    standalone: false
})
export class MSCLAnalyticComponent implements OnInit {
    msclService = inject(MSCLService);
    private renderer = inject(Renderer2);
    private changeDetectorRef = inject(ChangeDetectorRef);
    /**
     * Data inserted at modal dialogue creation point
     *   startDepth: number; // Start depth for plotting
     *   endDepth: number; // End depth for plotting
     *   featureId: string; // Identifier of the borehole
     *   metricList: string[]; // List of metric enums to plot
     *   closeGraphModal: () => null; // Function to call when the modal dialogue must be closed
     *   usesGMLObs: boolean; // Response has values nested within GeoSciML observations
     *   serviceUrl: string; // URL of MSCL service
    */
    data = inject(MAT_DIALOG_DATA);
    processingData = false;

    @ViewChild('error_display', { static: true }) public error_display: ElementRef; // Area used to display error messages

    public graphInput = {
        data: {},
        layout: {},
        options: {
            displaylogo: false
        }
    };

    /**
     * Draws the plots
     */
    ngOnInit() {
        const error_display = this.error_display.nativeElement;
        // Fetch data from MSCL service
        this.processingData = true;
        this.msclService.getMSCLDownload(
          this.data.serviceUrl,
          this.data.featureId,
          this.data.startDepth,
          this.data.endDepth,
          this.data.usesGMLObs,
          this.data.metricList).subscribe(valuesList => {
            // Check response
            if (valuesList == null || !(Symbol.iterator in Object(valuesList))) {
                this.processingData = false;
                console.error('Error retrieving MSCL data - bad response from service');
                this.createModalMessage(error_display, 'Error retrieving MSCL data - bad response from service');
                return;
            }

            // Compile lists of X and Y values; plots are vertical, Y is common to all plots
            const xLists: object = {};
            const yList: number[] = [];
            for (const metricEnum of this.data.metricList) {
                xLists[metricEnum] = [];
            }
            for (const values of valuesList) {
                for (const metricEnum of this.data.metricList) {
                    const featName = this.msclService.getMetricInfoAttr(metricEnum, 'feat_elem');
                    if (this.data.usesGMLObs) {
                        xLists[metricEnum].push(values[featName.replace(/_/g, ' ')]);
                    } else {
                        xLists[metricEnum].push(values[featName]);
                    }
                }
                yList.push(values.depth);
            }

            // Create plots - Angular will auto update plots when the inputs change
            const traceList = this.msclService.getGraphTraceList(this.data.metricList, xLists, yList);
            const layout = this.msclService.getGraphLayout(this.data.metricList, xLists);

            // Update graph
            this.graphInput.layout = layout;
            this.graphInput.data = traceList;
            this.processingData = false;
            this.changeDetectorRef.detectChanges();
        }, error => {
            this.processingData = false;
            console.error('Error retrieving MSCL data:', error);
            this.createModalMessage(error_display, 'Error retrieving MSCL data');
        });
    }

    /**
     * Insert a message into modal dialogue in place of a graph. Used for error conditions.
     *
     * @param element: reference to <div> where message will appear
     * @param message: message string
     */
    private createModalMessage(element: ElementRef, message: string) {
        const d2 = this.renderer.createElement('div');
        const text = this.renderer.createText(message);
        this.renderer.setStyle(element, 'color', 'red');
        this.renderer.setStyle(element, 'font-size', 'large');
        this.renderer.appendChild(d2, text);
        this.renderer.appendChild(element, d2);
    }
}
