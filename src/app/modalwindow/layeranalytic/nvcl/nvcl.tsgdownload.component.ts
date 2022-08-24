import { LayerModel } from '@auscope/portal-core-ui';
import { ManageStateService } from '@auscope/portal-core-ui';
import {
  Component,
  Input,
  AfterViewInit,
  OnInit
} from '@angular/core';
import { LayerAnalyticInterface } from '../layer.analytic.interface';
import { DownloadWfsService } from '@auscope/portal-core-ui';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NVCLBoreholeAnalyticService } from './nvcl.boreholeanalytic.service';

@Component({
  selector: 'nvcl-tsgdownload-component',
  templateUrl: './nvcl.tsgdownload.component.html',
  styles: [
    'input:invalid + span:after { content: \'✖\'; color: #f00; padding-left: 15px; }',
    'input:valid + span:after { content: \'✓\'; color: #26b72b; padding-left: 15px;}',
    'select:invalid + span:after { content: \'✖\'; color: #f00; padding-left: 15px; }',
    'select:valid + span:after { content: \'✓\'; color: #26b72b; padding-left: 15px;}'
  ],
  styleUrls: [
    '../../modalwindow.scss'
  ],
  providers: [NVCLBoreholeAnalyticService]
})
export class NVCLTSGDownloadComponent implements AfterViewInit, OnInit, LayerAnalyticInterface {
  @Input() layer: LayerModel;
  public tsgform;
  public ngSelectiveConfig = {};
  public total: number;
  public completed: number;
  public completePercentage: string;
  public tsgDownloadServiceMsg: string;
  public downloadMsg = "Download";
  public isDownloading = false;


  constructor( public activeModal: NgbActiveModal, private manageStateService: ManageStateService, private downloadWfsService: DownloadWfsService , private nvclBoreholeAnalyticService: NVCLBoreholeAnalyticService) {
    this.tsgform = {};
    //this.tsgform.email = '';
    if (this.nvclBoreholeAnalyticService.hasSavedEmail()) {
      this.tsgform.email = this.nvclBoreholeAnalyticService.getUserEmail();
    }
    this.tsgform.ogcFilter = '';
    this.total = 0;
    this.completed =0;
    this.downloadMsg = "Download";
    this.isDownloading = false;
  }

  /**
   * Reset download counters and subscribe to updates
   */
  ngAfterViewInit(): void {
    this.downloadWfsService.resetTSGDownloads();
    this.downloadWfsService.tsgDownloadBS.subscribe(
        (message) => {
          let progressData =  message.split(',');
          this.completed = parseInt(progressData[0]);
          this.total = parseInt(progressData[1]);
          if (this.completed != 0 && this.completed === this.total) {
            this.downloadMsg = "Completed";
          }
        }
    );

  }

  /**
   * Initialise UI
   */
  ngOnInit() {
    this.ngSelectiveConfig = {
      labelField: 'label',
      valueField: 'value',
      maxItems: 5
    };
  }

  public getCompletePercentage(): String{
    if (Math.floor(this.completed / this.total * 100) > 100) {
      // VT: This is a problem when user adds and immediately delete the layer which corrupts the listeners
      this.completePercentage = '100%';
    } else {
      this.completePercentage = Math.floor(this.completed / this.total * 100) + '%';
    }
    return this.completePercentage;
  }

  /**
   * Called when the "Download" button is hit
   */
  public onDownload() {
    this.downloadWfsService.tsgDownloadStartBS.next({start:true,email:this.tsgform.email});
    this.isDownloading = true;
    this.downloadMsg = "Downloading...";
    this.nvclBoreholeAnalyticService.setUserEmail(this.tsgform.email);
  }


}
