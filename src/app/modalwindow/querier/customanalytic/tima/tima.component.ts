import { Component, AfterViewInit, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TIMAService } from './tima.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
    templateUrl: './tima.component.html',
    providers: [TIMAService],
    styleUrls: ['../../../modalwindow.scss'],
    standalone: false
})
export class TIMAComponent implements AfterViewInit {
  timaService = inject(TIMAService);
  domSanitizer = inject(DomSanitizer);

  /**
   * Input data
   *   layer: LayerModel;
   *   onlineResource: OnlineResourceModel;
   *   featureId: string;
   *   doc: QuerierInfoModel;
   */
  public data = inject(MAT_DIALOG_DATA);

  public imageUrl;
  public ClassificationActive = false;

  view: any[] = [959, 500];
  public ngxdata = [];

  colorScheme = {
    domain: ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8',
      '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
  };


  ngAfterViewInit(): void {
    // the timeout fixes the - NG0100: ExpressionChangedAfterItHasBeenCheckedError error
    // data fetching is asynchronous anyway, you can postpone it to be called in next
    // macrotask (after ngAfterViewInit is finished) with a help of setTimeout with 0 time delay
    setTimeout(() => {
      if (this.data.doc.value) {
        const docValue = this.data.doc.value;
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
    });
  }
}
