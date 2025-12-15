import { LayerModel } from '../../../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../../../lib/portal-core-ui/model/data/onlineresource.model';
import { Component, Input, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { QuerierInfoModel } from '../../../../lib/portal-core-ui/model/data/querierinfo.model';
import { UtilitiesService } from '../../../../lib/portal-core-ui/utility/utilities.service';
import { RemanentAnomaliesService } from './remanentanomalies.service';


@Component({
    templateUrl: './remanentanomalies.component.html',
    providers: [RemanentAnomaliesService],
    styleUrls: ['../../../modalwindow.scss'],
    standalone: false
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
