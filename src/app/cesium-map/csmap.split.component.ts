import { Component, EventEmitter, Output } from '@angular/core';
import { CsMapService } from '@auscope/portal-core-ui';

/**
 * Split map widget
 */
@Component({
    selector: 'app-cs-map-split',
    templateUrl: './csmap.split.component.html',
    styleUrls: ['./csmap.split.component.scss'],
    standalone: false
})
export class CsMapSplitComponent {

  @Output() toggleEvent = new EventEmitter();

  constructor(private csMapService: CsMapService) {}

  public toggleShowMapSplit() {
    this.toggleEvent.emit();
  }

  public splitMapShown(): boolean {
    return this.csMapService.getSplitMapShown();
  }

}
