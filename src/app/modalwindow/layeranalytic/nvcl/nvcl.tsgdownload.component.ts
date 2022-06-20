import { environment } from '../../../../environments/environment';
import { LayerModel } from '@auscope/portal-core-ui';
import { ManageStateService } from '@auscope/portal-core-ui';
import { UtilitiesService } from '@auscope/portal-core-ui';
import {
  Component,
  Input,
  AfterViewInit,
  OnInit,
  ViewChild,
  EventEmitter,
  Output
} from '@angular/core';
import { LayerAnalyticInterface } from '../layer.analytic.interface';
import { NgForm } from '@angular/forms';
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

  constructor( public bsModalRef: BsModalRef, private manageStateService: ManageStateService, private downloadWfsService: DownloadWfsService ) {
    this.tsgform = {};
  }

  ngAfterViewInit(): void {
    this.downloadWfsService.tsgDownloadBS.subscribe(
        (message) => {
          let progressData =  message.split(',');
          this.completed = parseInt(progressData[0]);
          this.total = parseInt(progressData[1]);
        });
  }

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

  public onDownload() {
    this.downloadWfsService.tsgDownloadStartBS.next({start:true,email:this.tsgform.email});
  }


}
