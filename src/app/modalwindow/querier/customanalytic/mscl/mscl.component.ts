import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { LayerModel, OnlineResourceModel, QuerierInfoModel, SimpleXMLService, UtilitiesService } from '@auscope/portal-core-ui';
import { MSCLService } from '../../../layeranalytic/mscl/mscl.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MSCLAnalyticComponent } from '../../../layeranalytic/mscl/mscl.analytic.component';

@Component({
  selector: 'app-mscl',
  templateUrl: './mscl.component.html',
  styleUrls: ['./mscl.component.scss'],
  providers: [MSCLService]
})
export class MSCLComponent implements OnInit {

    @Input() layer: LayerModel;
    @Input() onlineResource: OnlineResourceModel;
    @Input() featureId: string;
    @Input() doc: QuerierInfoModel;

    public msclform: any; // Used to store form data
    // public selecMetricList: string[]; // List of metrics selected by user
    public metricPNameList: string[];  // List of all possible metrics
    public modalDisplayed = false; // Is modal dialogue displayed?
    public allTicked = false; // Are all tickboxes ticked?
    public showSelectMetricError: boolean; // Show error if no metrics chosen when Draw Graph is pressed

    private bsModalRef: BsModalRef;

    constructor(public msclService: MSCLService, private modalService: BsModalService, private changeDetectorRef: ChangeDetectorRef) {
        this.msclform = {};
        this.metricPNameList = [] 
    }

    ngOnInit() {
        // Initialise form data
        this.msclform.startDepth = 0;
        this.msclform.endDepth = 2000;
        this.msclform.bMetric = {};
        this.showSelectMetricError = false;
        // Extract the available metrics from the "datasetProperties" XML element in the WFS response
        // "datasetProperties" is a list of the metrics available in this borehole's dataset
        // The members of the list take the form of XML element names  e.g. p_wave_velocity
        const metrics = /<gsmlp:datasetProperties>[a-z_,]*<\/gsmlp:datasetProperties>/.exec(this.doc.raw).toString();
        // Remove tags at ends and convert to a list
        const metricList = metrics.substring(25, metrics.length - 26).split(",");
        this.metricPNameList = this.msclService.getMetricPNameList(metricList)
        for (const metric of this.metricPNameList) {
            this.msclform.bMetric[metric] = false;
        }
    }

    /**
     * Sets all tickboxes to be same as 'ALL' tickbox
     */
    public toggle_all_chkbox() {
        for (const metric of this.metricPNameList) {
            this.msclform.bMetric[metric] = this.allTicked;
        }
    }

    /**
     * Creates a modal dialogue which contains plots of MSCL data
     */
    public createGraphModal() {
        const selecMetricList: string[] = []; // List of metrics selected by user
        for (const metric of this.metricPNameList) {
            if (this.msclform.bMetric[metric]) {
                selecMetricList.push(metric);
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
                    'serviceUrl': this.onlineResource.url
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
