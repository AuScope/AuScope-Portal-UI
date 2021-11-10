import { animate, style, transition, trigger } from '@angular/animations';
import { CsClipboardService, Polygon } from '@auscope/portal-core-ui';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cs-clipboard',
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-50px)' }),
        animate('150ms', style({ opacity: 1, transform: 'translateY(2px)' })),
      ]),
      transition(':leave', [
        animate('150ms', style({ opacity: 0, transform: 'translateY(-50px)' })),
      ]),
    ]),
  ],
  templateUrl: './csmap.clipboard.component.html',
  styleUrls: ['./csmap.clipboard.component.scss'],
})

export class CsMapClipboardComponent implements OnInit {
  buttonText = 'clipboard';
  polygonBBox: Polygon;
  bShowClipboard: boolean;
  public isFilterLayerShown: boolean;
  public isDrawingPolygon: boolean;
  
  constructor(private csClipboardService: CsClipboardService) {
    this.polygonBBox = null;
    this.isFilterLayerShown = false;
    this.csClipboardService.filterLayersBS.subscribe(filterLayerStatus => {
      this.isFilterLayerShown = filterLayerStatus;
    });
    this.csClipboardService.isDrawingPolygonBS.subscribe(drawingPolygon => {
      this.isDrawingPolygon = drawingPolygon;
    });
  }

  ngOnInit(): void {
    this.csClipboardService.clipboardBS.subscribe(
      (show) => {
        this.bShowClipboard = show;
    });

    this.csClipboardService.polygonsBS.subscribe(
      (polygonBBox) => {
        this.polygonBBox = polygonBBox;
    });
  }

  clearClipboard() {
    this.csClipboardService.clearClipboard();
  }

  public toggleFilterLayers() {
    this.csClipboardService.toggleFilterLayers();
  }

  /**
   * Draw a polygon layer to map
   *
   */
  public drawPolygon(): void {
    this.csClipboardService.drawPolygon();
  }

  getPolygonBBoxs(): string {
    return this.polygonBBox.coordinates;
  }

  toggleEditor() {
    this.csClipboardService.toggleClipboard();
  }

}
