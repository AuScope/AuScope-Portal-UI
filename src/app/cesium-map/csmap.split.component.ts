import { Component, EventEmitter, Output } from '@angular/core';
import { CsMapService } from '../lib/portal-core-ui/service/cesium-map/cs-map.service';

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
