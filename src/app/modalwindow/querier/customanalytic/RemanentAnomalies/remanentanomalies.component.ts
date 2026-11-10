import { Component, inject, input, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilitiesService } from '../../../../lib/portal-core-ui/utility/utilities.service';
import { RemanentAnomaliesService } from './remanentanomalies.service';


@Component({
    templateUrl: './remanentanomalies.component.html',
    providers: [RemanentAnomaliesService],
    styleUrls: ['../../../modalwindow.scss'],
    standalone: false
})
export class RemanentAnomaliesComponent {
  remanentAnomaliesService = inject(RemanentAnomaliesService);
  domSanitizer = inject(DomSanitizer);

  /*
   * Input data
   *   layer: LayerModel;
   *   onlineResource: OnlineResourceModel;
   *   featureId: string;
   *   doc: QuerierInfoModel;
  */
  layer = input.required<any>();
  onlineResource = input.required<any>();
  featureId = input.required<string>();
  doc = input.required<any>();

  public anomaliesId = computed(() => {
    const docValue = this.doc().value;
    return parseInt(
      docValue.getAttribute('gml:id').replace('anomaly.', '')
    );
  });

  public baseUrl = computed(() =>
    UtilitiesService.getBaseUrl(this.onlineResource().url) + '/'
  );

  public hasModel = computed(() =>
    this.doc().value.getElementsByTagName('RemAnom:modelCollection').length > 0
  );

  public hasAnalyses = computed(() =>
    this.doc().value.getElementsByTagName('RemAnom:analysisCollection').length > 0
  );

}
