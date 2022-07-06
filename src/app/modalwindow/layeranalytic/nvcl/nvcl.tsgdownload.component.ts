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
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'nvcl-tsgdownload-component',
  templateUrl: './nvcl.tsgdownload.component.html',
  styleUrls: [
    '../../modalwindow.scss'
  ],
  providers: []
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


  constructor( public bsModalRef: BsModalRef, private manageStateService: ManageStateService, private downloadWfsService: DownloadWfsService ) {
    this.tsgform = {};
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
        });
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
    this.tsgform.email = '';
    this.tsgform.ogcFilter = '';
    this.total = 100;
    this.completed =0;
    this.downloadMsg = "Download";
    this.isDownloading = false;
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
  }


}
