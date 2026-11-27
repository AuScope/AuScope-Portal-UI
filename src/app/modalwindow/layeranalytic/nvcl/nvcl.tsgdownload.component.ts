import { Component, AfterViewInit, OnInit, AfterContentChecked, inject, ChangeDetectorRef } from '@angular/core';
import { DownloadWfsService } from '../../../lib/portal-core-ui/service/wfs/download/download-wfs.service';
import { NVCLBoreholeAnalyticService } from './nvcl.boreholeanalytic.service';
import { TSGDownloadService } from './tsgdownload.service';
import { Download } from './tsgdownload';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-nvcl-tsgdownload-component',
    templateUrl: './nvcl.tsgdownload.component.html',
    styles: [`
        input:invalid + span:after { content: '✖'; color: #f00; padding-left: 15px; }
        input:valid + span:after { content: '✓'; color: #26b72b; padding-left: 15px; }
        select:invalid + span:after { content: '✖'; color: #f00; padding-left: 15px; }
        select:valid + span:after { content: '✓'; color: #26b72b; padding-left: 15px; }
    `],
    styleUrls: [
        '../../modalwindow.scss'
    ],
    providers: [NVCLBoreholeAnalyticService],
    standalone: false
})
export class NVCLTSGDownloadComponent implements AfterContentChecked, AfterViewInit, OnInit {  
  private downloadWfsService = inject(DownloadWfsService);
  private nvclBoreholeAnalyticService = inject(NVCLBoreholeAnalyticService);
  private tsgDownloadService = inject(TSGDownloadService);

  public data = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<NVCLTSGDownloadComponent>);
  public cdr = inject(ChangeDetectorRef);
  public tsgform: any;
  public ngSelectiveConfig = {};
  public total = 0;
  public completed = 0;
  public completePercentage!: string;
  public downloadMsg = "Send Download Links";
  public isDownloading = false;
  public urlsArray: any[] = [];
  public download1$!: Observable<Download>;
  public downloadCompleted = false;

  constructor() {
    this.tsgform = {};
    //this.tsgform.email = '';
    if (this.nvclBoreholeAnalyticService.hasSavedEmail()) {
      this.tsgform.email = this.nvclBoreholeAnalyticService.getUserEmail();
    }
    this.tsgform.ogcFilter = '';
    this.downloadMsg = "Send Download Links";
    this.isDownloading = false;
  }

  /**
   * Start to sync TSGFiles download one by one.
   * use downloadOneCompletBS message to sync the downloading progress one by one.
   * use download1$ to show the downloading progress.
   */
  public BulkDownloadTsgFiles() {
    console.log('BulkDownloadTsgFiles:urlsArray:' + this.urlsArray);
    const me = this;
    me.total = me.urlsArray.length;
    me.completed = 0;
    me.downloadCompleted = false;
    me.cdr.markForCheck();

    if (me.tsgDownloadService.downloadOneCompletBS) {
      me.tsgDownloadService.downloadOneCompletBS.unsubscribe();
      me.tsgDownloadService.downloadOneCompletBS = null;
    }
    me.tsgDownloadService.downloadOneCompletBS = new Subject<string>();
    me.tsgDownloadService.downloadOneCompletBS.subscribe(
      (message) => {
        if (message.startsWith('downloadOne')) {
          if (me.completed < me.total) {
            const url = me.urlsArray[me.completed];
            const filename = url.substring(url.lastIndexOf('/') + 1);
            me.download1$ = me.tsgDownloadService.download(url, filename).pipe(shareReplay(1));
            me.cdr.markForCheck();
            console.log('downloadOne:' + filename);
            me.download1$.subscribe(value => {
              if (value.state.startsWith('DONE')) {
                console.log('downloadOne completed:' + filename);
                me.completed++;
                me.cdr.markForCheck();
                me.tsgDownloadService.downloadOneCompletBS?.next('downloadOne:' + me.completed);
              }
            });
          } else {
            me.downloadWfsService.tsgDownloadBS?.next('completed,completed');
            me.isDownloading = false;
            me.downloadMsg = 'Download';
            me.downloadCompleted = me.total > 0;
            me.cdr.markForCheck();
          }
        }
      });
    me.tsgDownloadService.downloadOneCompletBS.next('downloadOne:0');
  }

  /**
   * Reset download counters and subscribe to updates
   */
  ngAfterViewInit(): void {
    this.downloadWfsService.resetTSGDownloads();
    if (this.downloadWfsService.tsgDownloadBS) {
      this.downloadWfsService.tsgDownloadBS.unsubscribe();
      this.downloadWfsService.tsgDownloadBS = null;
    }
    this.downloadWfsService.tsgDownloadBS = new Subject<string>();
    this.downloadWfsService.tsgDownloadBS.subscribe(
      (message) => {
        console.log("TSG Download message: " + message);
        const progressData = message.split(',');
        if ('completed'.match(progressData[0])) {
          this.isDownloading = false;
          this.downloadMsg = "Send Download Links";
          this.downloadCompleted = true;
          this.cdr.markForCheck();
        }
      }
    );
  }

  /**
   * Automatically update the param total to reflex on the UI.
   */
  ngAfterContentChecked(): void{
    if (this.urlsArray) {
      this.total = this.urlsArray.length;
    }
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

  public getCompletePercentage(): string {
    if (!this.total || this.total <= 0) {
      this.completePercentage = '0%';
      return this.completePercentage;
    }
    const pct = Math.min(100, Math.floor((this.completed / this.total) * 100));
    this.completePercentage = pct + '%';
    return this.completePercentage;
  }

  public onDownload() {
    this.downloadCompleted = false;
    this.downloadWfsService.tsgDownloadStartBS?.next('start,' + this.tsgform.email);
    this.isDownloading = true;
    this.downloadMsg = "Preparing...";
    this.nvclBoreholeAnalyticService.setUserEmail(this.tsgform.email);
    this.cdr.markForCheck();
  }

}
