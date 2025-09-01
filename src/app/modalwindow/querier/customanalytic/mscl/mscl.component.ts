import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { LayerModel } from '../../../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../../../lib/portal-core-ui/model/data/onlineresource.model';
import { QuerierInfoModel } from '../../../../lib/portal-core-ui/model/data/querierinfo.model';
import { MSCLService } from '../../../layeranalytic/mscl/mscl.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MSCLAnalyticComponent } from '../../../layeranalytic/mscl/mscl.analytic.component';

@Component({
    selector: 'app-mscl',
    templateUrl: './mscl.component.html',
    styleUrls: ['./mscl.component.scss'],
    providers: [MSCLService],
    standalone: false
})
export class MSCLComponent implements OnInit {

    @Input() layer: LayerModel;
    @Input() onlineResource: OnlineResourceModel;
    @Input() featureId: string;
    @Input() doc: QuerierInfoModel;

    public msclform: { startDepth: number, endDepth: number, bMetric: {}, bGroup: {} }; // Used to store form data
    // startDepth = start depth
    // endDepth = end depth
    // bMetric = metric tickbox, dict: key is printable name, val is boolean
    // bGroup = group metric tickbox, dict: key is printable name, val is boolean

    public metricPNameList: string[]; // Printable list of all selectable metrics
    public metricGroupList: string[]; // List of selectable group names
    public modalDisplayed = false; // Is modal dialogue displayed?
    public allTicked = false; // Are all tickboxes ticked?
    public showSelectMetricError: boolean; // Show error if no metrics chosen when Draw Graph is pressed

    private usesGMLObs = false; // Response has values nested within GeoSciML observations
    private bsModalRef: BsModalRef;

    constructor(public msclService: MSCLService, private modalService: BsModalService, private changeDetectorRef: ChangeDetectorRef) {
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
        this.usesGMLObs = this.msclService.usesGMLObs(this.doc.raw);
        if (this.usesGMLObs) {
            metricList = this.msclService.findMetricTypes(this.doc.raw);
        } else {
            const searchResult = /<gsmlp:datasetProperties>[a-z_,]*<\/gsmlp:datasetProperties>/.exec(this.doc.raw);
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
            this.bsModalRef = this.modalService.show(MSCLAnalyticComponent, {
                class: 'modal-xl',
                ignoreBackdropClick: true,
                keyboard: false,
                initialState: {
                    'startDepth': this.msclform.startDepth,
                    'endDepth': this.msclform.endDepth,
                    'metricList': selecMetricList,
                    'featureId': this.featureId,
                    'closeGraphModal': this.closeGraphModal.bind(this),
                    'serviceUrl': this.onlineResource.url,
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
            this.bsModalRef.hide();
            this.modalDisplayed = false;
        }
    }
}
