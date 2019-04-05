import { LayerModel } from '../../../../portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../../../portal-core-ui/model/data/onlineresource.model';
import { Component, Input, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { QuerierInfoModel } from '../../../../portal-core-ui/model/data/querierinfo.model';
import { TIMAService } from './tima.service';


@Component({
  templateUrl: './tima.component.html',
  providers: [TIMAService],
  styleUrls: ['../../../modalwindow.scss']
})
export class TIMAComponent implements AfterViewInit {

  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  @Input() doc: QuerierInfoModel;

  public imageUrl;
  public ClassificationActive = false;

  view: any[] = [959, 500];
  public ngxdata = [];

  colorScheme = {
    domain: ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8',
      '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
  };

  constructor(public timaService: TIMAService, public domSanitizer: DomSanitizer) { }


  ngAfterViewInit(): void {
    const docValue = this.doc.value;
    this.imageUrl = docValue.getElementsByTagName('tima:image_url')[0].textContent;
    const mineralInfo = JSON.parse(docValue.getElementsByTagName('tima:mineral_information_json')[0].textContent);
    this.ngxdata = [];
    for (const mineral_name in mineralInfo) {
      const mineral_pixel_count = mineralInfo[mineral_name]['mineral_pixel_count'];
      this.ngxdata.push({ name: mineral_name, value: mineral_pixel_count });
    }
    this.ngxdata.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

  }

}
