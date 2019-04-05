import { environment } from '../../../../environments/environment';
import { saveAs} from 'file-saver/FileSaver';
import { LayerModel } from '../../../portal-core-ui/model/data/layer.model';
import { ManageStateService } from '../../../portal-core-ui/service/permanentlink/manage-state.service';
import { UtilitiesService } from '../../../portal-core-ui/utility/utilities.service';
import { NVCLBoreholeAnalyticService } from './nvcl.boreholeanalytic.service';
import { Component, Input, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { LayerAnalyticInterface} from '../layer.analytic.interface';
import { NgForm } from '@angular/forms';

@Component({
  templateUrl: './nvcl.boreholeanalytic.component.html',
  styles: ['input:invalid + span:after { content: \'✖\'; color: #f00; padding-left: 15px; }',
           'input:valid + span:after { content: \'✓\'; color: #26b72b; padding-left: 15px;}',
           'select:invalid + span:after { content: \'✖\'; color: #f00; padding-left: 15px; }',
           'select:valid + span:after { content: \'✓\'; color: #26b72b; padding-left: 15px;}'],
  styleUrls: ['./nvcl.boreholeanalytic.component.css', '../../modalwindow.scss'],
  providers : [NVCLBoreholeAnalyticService]
})
export class NVCLBoreholeAnalyticComponent implements AfterViewInit, OnInit, LayerAnalyticInterface  {
  @ViewChild('f') signupForm: NgForm;  @Input() layer: LayerModel;
  public nvclform;
  public algorithms;
  public selectedAlgorithm;
  public classifications;
  public isExistingAlgorithm = true;
  public bPublished = true;

  public ngSelectiveConfig = {};
  public ngSelectiveOptions = [];
  public currentStatus = [];
  public tSGAlgorithmNames = [];
  // VT: object to keep track of the tabpanel
  public UItabpanel = {
    algorithm: true,
    checkprocess: false
  };

  constructor(public nvclBoreholeAnalyticService: NVCLBoreholeAnalyticService, private manageStateService: ManageStateService) {
    this.nvclform = {};
  }

  ngAfterViewInit(): void {
    this.nvclBoreholeAnalyticService.getNVCLAlgorithms().subscribe(results => {
      this.algorithms = results;
      if (this.nvclBoreholeAnalyticService.hasSavedEmail()) {
        this.nvclform.email = this.nvclBoreholeAnalyticService.getUserEmail();
      }
    });
    this.nvclBoreholeAnalyticService.getTSGAlgorithmList().subscribe(results => {
      this.tSGAlgorithmNames = results;
    });
  }

  ngOnInit() {
    this.ngSelectiveConfig = {
      labelField: 'label',
      valueField: 'value',
      maxItems: 5
    }
    this.nvclform.startDepth = 0;
    this.nvclform.endDepth = 9999;
    this.nvclform.operator = 'gt';
    this.nvclform.value = 5;
    this.nvclform.units = 'count';
    this.nvclform.span = 1;
  }


  /**
   * Change the algorithm  and retrieve the associate version
   */
  public changeAlgorithm() {

    this.nvclform.algorithmOutputIds = [];
    this.nvclform.logName = null;
    this.ngSelectiveOptions  = [];
    this.nvclform.classifications = null;

    if (this.selectedAlgorithm === 'nsa') {
      return;
    }

    this.nvclform.algorithmOutputIds = [];

    for (const versionlist of this.selectedAlgorithm.versions) {
      this.ngSelectiveOptions.push({
        label: versionlist.version,
        value: versionlist.algorithmOutputId,
        code: versionlist
      });
      this.nvclform.algorithmOutputIds.push(versionlist.algorithmOutputId);
    }
    this.onVersionChange(this.nvclform.algorithmOutputIds);

  }

  /**
   * change the algorithm and get the associated algorithm
   */
  public changeTSGAlgorithm() {
    this.nvclBoreholeAnalyticService.getTSGAlgorithm(this.nvclform.tsgAlgName).subscribe(response => {
      this.nvclform.tsgAlgorithm = response;
    })
  }

  /**
   * on version change retrieve the associated classification
   */
  public onVersionChange($event) {
    const algorithmOutputIds = $event;
    if (algorithmOutputIds.length <= 0) {
      return;
    }
    this.nvclBoreholeAnalyticService.getNVCLClassifications(algorithmOutputIds).subscribe(classifications => {
      this.classifications = classifications
    })
  }

  public onSubmit() {
    if (this.isExistingAlgorithm) {
      this.nvclform.algorithm = this.selectedAlgorithm.algorithmId;
      this.nvclBoreholeAnalyticService.submitSF0NVCLProcessingJob(this.nvclform, this.layer).subscribe(response => {
        if (response === true) {
          alert('Job have been successfully submitted. The results will be send to your email');
          this.nvclBoreholeAnalyticService.setUserEmail( this.nvclform.email );
        }
      })
    } else {
      this.nvclBoreholeAnalyticService.submitSF0NVCLProcessingTsgJob(this.nvclform, this.layer).subscribe(response => {
        if (response === true) {
          alert('Job have been successfully submitted. The results will be send to your email');
          this.nvclBoreholeAnalyticService.setUserEmail( this.nvclform.email );
        }
      })
    }

  }

  public checkStatus() {
    this.nvclBoreholeAnalyticService.checkNVCLProcessingJob(this.nvclform.email).subscribe(response => {
      const me = this;
      me.currentStatus = response;

      me.nvclBoreholeAnalyticService.setUserEmail( me.nvclform.email);
      for (const i in me.currentStatus) {
        me.nvclBoreholeAnalyticService.getNVCLJobPublishStatus(me.currentStatus[i].jobId).subscribe(response => {
          me.currentStatus[i].published = (response === 'true' ? true : false);
        })
      }

    });
  }
  public ChangePublish(status: any) {
    const jobId = status.jobId;
    const published = status.published;
    status.published = !published;
    this.nvclBoreholeAnalyticService.publishNvclJob(jobId, !published).subscribe(response => {
      // console.log('jobid=' + jobId + ' publishStatus=' + response);
    })
  }
  public download(jobId: string) {
    this.nvclBoreholeAnalyticService.downloadNVCLProcessingResults(jobId).subscribe(response => {
      const blob = new Blob([response], {type: 'application/zip'});
      saveAs(blob, 'download.zip');
      this.nvclBoreholeAnalyticService.setUserEmail( this.nvclform.email );
    })
  }

  public downloadData(jobId: string) {
    this.nvclBoreholeAnalyticService.downloadTsgJobData(jobId).subscribe(response => {
      const blob = new Blob([response], {type: 'application/zip'});
      saveAs(blob, 'nvclAnalytical-' + jobId + '.zip');
    })
  }

  public viewOnMap(jobId: string) {
    if (window.confirm('This action will link you to an external url. Please ensure you have grant access to allow pop up from this domain.')) {
      this.layer.filterCollection.mandatoryFilters[0].value = jobId;
      const state = this.manageStateService.generateOneOffState(this.layer.id, this.layer.filterCollection, []);
      const uncompStateStr = JSON.stringify(state);
      const me = this;
      this.manageStateService.getCompressedString(uncompStateStr, function(result) {

        // Encode state in base64 so it can be used in a URL
        const stateStr = UtilitiesService.encode_base64(String.fromCharCode.apply(String, result));
        window.open(environment.hostUrl + '?state=' + stateStr);
      });
    }
  }


}
