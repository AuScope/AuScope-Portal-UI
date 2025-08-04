import { Component, EventEmitter, Output } from '@angular/core';


/**
 * Right aligned map buttons.
 * Note: This does not include the base layer picker or the view chooser, these are hard coded into Cesium's toolbar.
 * Eventually this can be made callpsible, but will need to merge the 2 Cesium buttons outlined above.
 */
@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    standalone: false
})
export class ToolbarComponent {

  @Output() splitToggleEvent = new EventEmitter();

  public toggleToolbar() {
    this.splitToggleEvent.emit(true);
  }

  /**
   * Split map toggled on/off
   * If on, sets imagerySplitPosition and adds handlers
   * If off, resets all active layer split directions to NONE
   */
  public toggleShowMapSplit() {
    this.splitToggleEvent.emit();
  }

}
