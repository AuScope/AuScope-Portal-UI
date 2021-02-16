import {Component} from '@angular/core';
import { CsClipboardService } from 'portal-core-ui';


@Component({
  selector: '[appFilterClipboard]',
  templateUrl: './clipboard.component.html'
})

export class ClipboardComponent {

  public isClipboardShown;

  constructor(private CsClipboardService: CsClipboardService) {
    this.isClipboardShown = false;
    this.CsClipboardService.clipboardBS.subscribe(clipboardStatus => {
      this.isClipboardShown = clipboardStatus;
    })

  }

  public toggleClipboard () {
    this.CsClipboardService.toggleClipboard();
  }
}
