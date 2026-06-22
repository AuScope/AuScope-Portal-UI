import { Component, inject } from '@angular/core';
import { CsClipboardService } from '../../lib/portal-core-ui/service/cesium-map/cs-clipboard.service';
import { CsMapService } from '../../lib/portal-core-ui/service/cesium-map/cs-map.service';


@Component({
    selector: '[app-filter-clipboard]',
    templateUrl: './clipboard.component.html',
    standalone: false
})

export class ClipboardComponent {
  private CsClipboardService = inject(CsClipboardService);
  private csMapService = inject(CsMapService);


  public isClipboardShown;

  constructor() {
    this.isClipboardShown = false;
    this.CsClipboardService.clipboardBS.subscribe(clipboardStatus => {
      this.isClipboardShown = clipboardStatus;
    });
  }

  public toggleClipboard () {
    this.CsClipboardService.toggleClipboard();
  }

  public getActiveLayerCount(): number {
    return this.csMapService.getLayerModelList().length;
  }

}
