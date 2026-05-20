import { Component, AfterViewInit, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilitiesService } from '../../../../lib/portal-core-ui/utility/utilities.service';
import { RemanentAnomaliesService } from './remanentanomalies.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
    templateUrl: './remanentanomalies.component.html',
    providers: [RemanentAnomaliesService],
    styleUrls: ['../../../modalwindow.scss'],
    standalone: false
})
export class RemanentAnomaliesComponent implements AfterViewInit {
  remanentAnomaliesService = inject(RemanentAnomaliesService);
  domSanitizer = inject(DomSanitizer);

  /*
   * Input data
   *   layer: LayerModel;
   *   onlineResource: OnlineResourceModel;
   *   featureId: string;
   *   doc: QuerierInfoModel;
  */
  public data = inject(MAT_DIALOG_DATA);

  public anomaliesId: number;
  public baseUrl: string;
  public hasModel: boolean;
  public hasAnalyses: boolean;


  ngAfterViewInit(): void {
    // the timeout fixes the - NG0100: ExpressionChangedAfterItHasBeenCheckedError error
    // data fetching is asynchronous anyway, you can postpone it to be called in next
    // macrotask (after ngAfterViewInit is finished) with a help of setTimeout with 0 time delay
    setTimeout(() => {
      const docValue = this.data.doc.value;
      this.anomaliesId = docValue.getAttribute('gml:id').replace('anomaly.', '');
      this.baseUrl = UtilitiesService.getBaseUrl(this.data.onlineResource.url) + '/';
      this.hasModel = docValue.getElementsByTagName('RemAnom:modelCollection').length > 0;
      this.hasAnalyses = docValue.getElementsByTagName('RemAnom:analysisCollection').length > 0;
    });
  }

}
