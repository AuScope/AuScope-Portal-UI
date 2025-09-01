import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RectangleEditorObservable } from '@auscope/angular-cesium';
import { CsMapService } from '../../lib/portal-core-ui/service/cesium-map/cs-map.service';
import { Bbox } from '../../lib/portal-core-ui/model/data/bbox.model';
import { UtilitiesService } from '../../lib/portal-core-ui/utility/utilities.service';
import { config } from '../../../environments/config';

/**
 * Service for keeping track of drawn bounds objects so they can be shared between layers,
 * primarily for downloading.
 */
@Injectable()
export class BoundsService {

  // Bounds on map as drawn by user
  private boundsObservable: RectangleEditorObservable;

  // Bounding box observable for user
  private _bbox: BehaviorSubject<Bbox> = new BehaviorSubject(null);
  public readonly bbox: Observable<Bbox> = this._bbox.asObservable();

  // Keep track of drawing in progress
  private _drawingStarted: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly drawingStarted: Observable<boolean> = this._drawingStarted.asObservable();

  constructor(private csMapService: CsMapService) {}

  /**
   * Draw a bounding box on the map, primarily for downloads
   */
  public drawBounds(layerId: string): void {
    setTimeout(() => this._drawingStarted.next(true), 0);
    this.boundsObservable = this.csMapService.drawBound();
    this.boundsObservable.subscribe((vector) => {
      this._drawingStarted.next(false);
      if (!vector.points) {
        // drawing hasn't started
        return;
      }
      if (vector.points.length < 2
        || vector.points[0].getPosition().x === vector.points[1].getPosition().x
        || vector.points[0].getPosition().y === vector.points[1].getPosition().y) {
        // drawing hasn't finished
        this._drawingStarted.next(true);
        return;
      }
      const points = vector.points;
      // calculate area from the 2 rectangle points
      const width = points[0].getPosition().x - points[1].getPosition().x;
      const length = points[0].getPosition().y - points[1].getPosition().y;
      const area = Math.abs(width * length);
      if (config.wcsSupportedLayer[layerId]) {
        // If 'downloadAreaMaxsize' is not set to Number.MAX_SAFE_INTEGER then download limits will apply
        const maxSize = config.wcsSupportedLayer[layerId].downloadAreaMaxSize;
        if (maxSize !== Number.MAX_SAFE_INTEGER && maxSize < area) {
          alert('The area size you have selected of ' + area + 'm2 exceed the limited size of ' +
            config.wcsSupportedLayer[layerId].downloadAreaMaxSize + 'm2. Due to the size of the dataset' +
            ' we have to limit the download area');
          this._bbox.next(null);
          return;
        }
      }
      // Reproject to EPSG:4326
      this._bbox.next(UtilitiesService.reprojectToWGS84(points));

      this._drawingStarted.next(false);
    });
  }

  /**
   * Clear the bounding box object from the map
   */
  clearBounds(): void {
    this._bbox.next(null);
    if (this.boundsObservable) {
      this.boundsObservable.dispose();
      this.boundsObservable = null;
    }
  }

}
