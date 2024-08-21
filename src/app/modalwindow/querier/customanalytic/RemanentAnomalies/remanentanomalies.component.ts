import { LayerModel } from '@auscope/portal-core-ui';
import { OnlineResourceModel } from '@auscope/portal-core-ui';
import { Component, Input, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { QuerierInfoModel } from '@auscope/portal-core-ui';
import { UtilitiesService } from '@auscope/portal-core-ui';
import { RemanentAnomaliesService } from './remanentanomalies.service';


@Component({
  templateUrl: './remanentanomalies.component.html',
  providers: [RemanentAnomaliesService],
  styleUrls: ['../../../modalwindow.scss']
})
export class RemanentAnomaliesComponent implements AfterViewInit {

  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  @Input() doc: QuerierInfoModel;

  public anomaliesId: number;
  public baseUrl: string;
  public hasModel: boolean;
  public hasAnalyses: boolean;

  constructor(public remanentAnomaliesService: RemanentAnomaliesService, public domSanitizer: DomSanitizer) { }


  ngAfterViewInit(): void {
    // the timeout fixes the - NG0100: ExpressionChangedAfterItHasBeenCheckedError error
    // data fetching is asynchronous anyway, you can postpone it to be called in next 
    // macrotask (after ngAfterViewInit is finished) with a help of setTimeout with 0 time delay
    setTimeout(() => {
      const docValue = this.doc.value;
      this.anomaliesId = docValue.getAttribute('gml:id').replace('anomaly.', '');
      this.baseUrl = UtilitiesService.getBaseUrl(this.onlineResource.url) + '/';
      this.hasModel = docValue.getElementsByTagName('RemAnom:modelCollection').length > 0;
      this.hasAnalyses = docValue.getElementsByTagName('RemAnom:analysisCollection').length > 0;
    });
  }

}
