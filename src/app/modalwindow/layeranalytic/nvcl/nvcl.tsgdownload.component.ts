import { LayerModel } from '../../../lib/portal-core-ui/model/data/layer.model';
import { Component, Input, AfterViewInit, OnInit, AfterContentChecked } from '@angular/core';
import { LayerAnalyticInterface } from '../layer.analytic.interface';
import { DownloadWfsService } from '../../../lib/portal-core-ui/service/wfs/download/download-wfs.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NVCLBoreholeAnalyticService } from './nvcl.boreholeanalytic.service';
import { TSGDownloadService } from './tsgdownload.service';
import { Download } from './tsgdownload';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Component({
    selector: 'app-nvcl-tsgdownload-component',
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
    providers: [NVCLBoreholeAnalyticService],
    standalone: false
})
export class NVCLTSGDownloadComponent implements AfterContentChecked, AfterViewInit, OnInit, LayerAnalyticInterface {
  @Input() layer: LayerModel;
  public tsgform;
  public ngSelectiveConfig = {};
  public total = 0;
  public completed = 0;
  public completePercentage: string;
  public tsgDownloadServiceMsg: string;
  public downloadMsg = "Download";
  public isDownloading = false;
  public urlsArray =[];
  public download1$: Observable<Download>;

  constructor(public activeModal: NgbActiveModal, private downloadWfsService: DownloadWfsService , private nvclBoreholeAnalyticService: NVCLBoreholeAnalyticService, private tsgDownloadService: TSGDownloadService,
    ) {
    this.tsgform = {};
    //this.tsgform.email = '';
    if (this.nvclBoreholeAnalyticService.hasSavedEmail()) {
      this.tsgform.email = this.nvclBoreholeAnalyticService.getUserEmail();
    }
    this.tsgform.ogcFilter = '';
    this.downloadMsg = "Download";
    this.isDownloading = false;
  }
  /**
   * Start to sync TSGFiles download one by one.
   * use downloadOneCompletBS message to sync the downloading progress one by one.
   * use download1$ to show the downloading progress.
   */
  public BulkDownloadTsgFiles() {
    const me = this;
    me.total = me.urlsArray.length;
    me.completed = 0;
    if (me.tsgDownloadService.downloadOneCompletBS) {
      me.tsgDownloadService.downloadOneCompletBS.unsubscribe();
      me.tsgDownloadService.downloadOneCompletBS = null;
    }
    me.tsgDownloadService.downloadOneCompletBS = new Subject<string>();
    me.tsgDownloadService.downloadOneCompletBS.subscribe(
      (message) => {
        if (message.startsWith('downloadOne')) {
          if(me.completed<me.total){
            const url = me.urlsArray[me.completed];
            const filename = url.substring(url.lastIndexOf('/')+1);
            me.download1$ = me.tsgDownloadService.download(url, filename).pipe(shareReplay(1));
            console.log('downloadOne:' + filename);
            me.download1$.subscribe(value => {
              if (value.state.startsWith('DONE')) {
                me.completed++;
                me.tsgDownloadService.downloadOneCompletBS.next('downloadOne:'+me.completed);
              }
            });
          } else {
            me.downloadWfsService.tsgDownloadBS.next('completed,completed');
            me.isDownloading = false;
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
    if (this.downloadWfsService.tsgDownloadBS){
      this.downloadWfsService.tsgDownloadBS.unsubscribe();
      this.downloadWfsService.tsgDownloadBS = null;
    }
    this.downloadWfsService.tsgDownloadBS = new Subject<string>();
    this.downloadWfsService.tsgDownloadBS.subscribe(
        (message) => {
          const progressData = message.split(',');
          if ('completed'.match(progressData[0])) {
            this.isDownloading = false;
            this.downloadMsg = "Download";
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

  public getCompletePercentage(): string{
    if (Math.floor(this.completed / this.total * 100) > 100) {
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
    this.downloadWfsService.tsgDownloadStartBS.next('start,' + this.tsgform.email);
    this.isDownloading = true;
    this.downloadMsg = "Downloading...";
    this.nvclBoreholeAnalyticService.setUserEmail(this.tsgform.email);
  }


}
