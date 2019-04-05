import {Component} from '@angular/core';
import { OlClipboardService } from '../../portal-core-ui/service/openlayermap/ol-clipboard.service';


@Component({
  selector: '[appFilterClipboard]',
  templateUrl: './clipboard.component.html'
})

export class ClipboardComponent {

  public isClipboardShown;

  constructor(private olClipboardService: OlClipboardService) {
    this.isClipboardShown = false;
    this.olClipboardService.clipboardBS.subscribe(clipboardStatus => {
      this.isClipboardShown = clipboardStatus;
    })

  }

  public toggleClipboard () {
    this.olClipboardService.toggleClipboard();
  }
}
