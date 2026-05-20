import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { MSCLService } from '../../../layeranalytic/mscl/mscl.service';
import { MSCLAnalyticComponent } from '../../../layeranalytic/mscl/mscl.analytic.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-mscl',
    templateUrl: './mscl.component.html',
    styleUrls: ['./mscl.component.scss'],
    providers: [MSCLService],
    standalone: false
})
export class MSCLComponent implements OnInit {
    msclService = inject(MSCLService);
    private changeDetectorRef = inject(ChangeDetectorRef);
    private dialog = inject(MatDialog);
    private dialogRef: MatDialogRef<MSCLAnalyticComponent>;
    /**
     * Input data:
     *   layer: LayerModel;
     *   onlineResource: OnlineResourceModel;
     *   featureId: string;
     *   doc: QuerierInfoModel;
     */
    public data = inject(MAT_DIALOG_DATA);

    public msclform: { startDepth: number, endDepth: number, bMetric: object, bGroup: object }; // Used to store form data

    public metricPNameList: string[]; // Printable list of all selectable metrics
    public metricGroupList: string[]; // List of selectable group names
    public modalDisplayed = false; // Is modal dialogue displayed?
    public allTicked = false; // Are all tickboxes ticked?
    public showSelectMetricError: boolean; // Show error if no metrics chosen when Draw Graph is pressed

    private usesGMLObs = false; // Response has values nested within GeoSciML observations

    constructor() {
        this.msclform = { startDepth: 0.0, endDepth: 2000.0, bMetric: {}, bGroup: {} };
        this.metricPNameList = [];
        this.metricGroupList = [];
    }

    ngOnInit() {
        // Initialise form data
        this.msclform.startDepth = 0;
        this.msclform.endDepth = 2000;
        this.msclform.bMetric = {};
        this.msclform.bGroup = {};
        this.showSelectMetricError = false;
        // Extract the available metrics from the "datasetProperties" XML element in the WFS response
        // "datasetProperties" is a list of the metrics available in this borehole's dataset
        // The members of the list take the form of XML element names  e.g. p_wave_velocity
        let metricList = [];
        // Find out if values are nested within GeoSciML observations
        this.usesGMLObs = this.msclService.usesGMLObs(this.data.doc.raw);
        if (this.usesGMLObs) {
            metricList = this.msclService.findMetricTypes(this.data.doc.raw);
        } else {
            const searchResult = /<gsmlp:datasetProperties>[a-z_,]*<\/gsmlp:datasetProperties>/.exec(this.data.doc.raw);
            if (searchResult) {
                const metricsStr = searchResult.toString();
                // Remove tags at ends and convert to a list
                metricList = metricsStr.substring(25, metricsStr.length - 26).split(",");
            }
        }
        this.metricPNameList = this.msclService.getMetricPNameList(metricList)

        // Given list of metrics, set up the data structures that support tickboxes
        for (const pName of this.metricPNameList) {
            this.msclform.bMetric[pName] = false;
            const group = this.msclService.pNameToGroup(pName);
            if (group !== '') {
                this.msclform.bGroup[group] = false;
                if (!this.metricGroupList.includes(group)) {
                    this.metricGroupList.push(group);
                }
            }
        }
    }

    /**
     * Sets all tickboxes to be same as 'ALL' tickbox
     */
    public toggle_all_chkbox() {
        for (const pName of this.metricPNameList) {
            this.msclform.bMetric[pName] = this.allTicked;
        }
        for (const group of this.metricGroupList) {
            this.msclform.bGroup[group] = this.allTicked;
        }
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Set all metric tickboxes within a group
     *
     * @param group group name
     */
    public toggle_grp_chkbox(group: string) {
        for (const pName of this.msclService.getInfoAttrsForGrp(group, 'pname')) {
            this.msclform.bMetric[pName] = this.msclform.bGroup[group];
        }
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Creates a modal dialogue which contains plots of MSCL data
     */
    public createGraphModal() {
        const selecMetricList: string[] = []; // List of metrics selected by user
        for (const pName of this.metricPNameList) {
            if (this.msclform.bMetric[pName]) {
                selecMetricList.push(pName);
            }
        }
        if (selecMetricList.length === 0) {
            this.showSelectMetricError = true;
        } else if (this.modalDisplayed === false) {
            this.showSelectMetricError = false;
            // Create the dialogue with relevant input parameters
            this.dialogRef = this.dialog.open(MSCLAnalyticComponent, {
                width: '1000px',
                maxWidth: '1000px',
                data: {
                    'startDepth': this.msclform.startDepth,
                    'endDepth': this.msclform.endDepth,
                    'metricList': selecMetricList,
                    'featureId': this.data.featureId,
                    'closeGraphModal': this.closeGraphModal.bind(this),
                    'serviceUrl': this.data.onlineResource.url,
                    'usesGMLObs': this.usesGMLObs,
                }
            });
            this.modalDisplayed = true;
        }
        this.changeDetectorRef.detectChanges();
    }

    /**
     * Closes the MSCL plot's modal dialogue
     */
    public closeGraphModal() {
        if (this.modalDisplayed) {
            this.dialogRef.close();
            this.modalDisplayed = false;
        }
    }
}
