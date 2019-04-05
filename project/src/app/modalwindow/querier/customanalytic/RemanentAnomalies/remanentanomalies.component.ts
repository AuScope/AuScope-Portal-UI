import {LayerModel} from '../../../../portal-core-ui/model/data/layer.model';
import {OnlineResourceModel} from '../../../../portal-core-ui/model/data/onlineresource.model';
import {Component, Input, AfterViewInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {QuerierInfoModel} from '../../../../portal-core-ui/model/data/querierinfo.model';
import { UtilitiesService } from '../../../../portal-core-ui/utility/utilities.service';
import {RemanentAnomaliesService} from './remanentanomalies.service';


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

  constructor(public remanentAnomaliesService: RemanentAnomaliesService, public domSanitizer: DomSanitizer) {}


  ngAfterViewInit(): void {
    const docValue = this.doc.value;
    this.anomaliesId = docValue.getAttribute('gml:id').replace('anomaly.', '');
    this.baseUrl = UtilitiesService.getBaseUrl(this.onlineResource.url) + '/';
    this.hasModel = docValue.getElementsByTagName('RemAnom:modelCollection').length > 0;
    this.hasAnalyses = docValue.getElementsByTagName('RemAnom:analysisCollection').length > 0;

  }

}
