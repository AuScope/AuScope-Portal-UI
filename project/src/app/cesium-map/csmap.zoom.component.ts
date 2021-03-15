import { CsMapService } from '@auscope/portal-core-ui';
import { Component } from '@angular/core';




@Component({
  // TODO: Replace with cesium 
  selector: 'app-cs-map-zoom',
  template: `
    <button type="button" class="btn btn-sm btn-inverse active" id="map-theme-text" (click)='zoomClick()'>
      <i class="fa fa-search-plus fa-fw" aria-hidden="true"></i> {{buttonText}}</button>
    `,
  styleUrls: ['./csmap.component.css']
  // The "#" (template reference variable) matters to access the map element with the ViewChild decorator!
})

export class CsMapZoomComponent {

  buttonText = 'Magnify';

  constructor(private csMapService: CsMapService) {}

  /**
   * toggle on zoom to zoom into bbox
   */
  public zoomClick() {
    this.buttonText = 'Click on Map';
    this.csMapService.drawBound().subscribe((vector) => {
      const features = vector.getSource().getFeatures();
      const me = this;
      // Go through this array and get coordinates of their geometry.
      features.forEach(function(feature) {
        me.buttonText = 'Magnify';
        me.csMapService.fitView(feature.getGeometry().getExtent());
      });

    });
  }
}
