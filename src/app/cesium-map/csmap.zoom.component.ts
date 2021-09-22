import { Component, ViewEncapsulation } from '@angular/core';
import { CameraService, CesiumService, ZoomToRectangleService } from 'angular-cesium';
import { CsMapComponent } from './csmap.component';

@Component({
  selector: 'app-cs-map-zoom',
  templateUrl: './csmap.zoom.component.html', 
  styleUrls: ['./csmap.zoom.component.scss'],
  encapsulation: ViewEncapsulation.None // NB: Styles are not encapsulated.
                                        // This adds the style to global styles 
})
export class CsMapZoomComponent {
  // amount to zoom in/out by. 10x the default camera zoom
  zoomAmount = 1000000;

  constructor(
    private cameraService: CameraService,
    private cesiumService: CesiumService,
    private zoomToRectangleService: ZoomToRectangleService,
  ) {
    this.zoomToRectangleService.init(cesiumService, cameraService);
  }

  /**
   * Toggle on zoom to zoom into bbox
   */
  public zoomToRectangle() {
    this.zoomToRectangleService.activate();
  }
  
  /**
   * Tell the camera to go back to original map position.
   */
  public goHome() {
    this.cameraService.cameraFlyTo({destination: CsMapComponent.AUSTRALIA});
  }
  
  /**
   * Tell the camera to zoom in.
   */
  public zoomIn() {
    this.cameraService.zoomIn(this.zoomAmount);
  }
  
  /**
   * Tell the cmaera to zoom out.
   */
  public zoomOut() {
    this.cameraService.zoomOut(this.zoomAmount);
  }
}
