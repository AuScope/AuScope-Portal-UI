import { CsClipboardService, Polygon } from '@auscope/portal-core-ui';
import { Component, OnInit } from '@angular/core';

// TODO: Convert to cesium

@Component({
  selector: 'app-cs-clipboard',
  templateUrl: './csmap.clipboard.component.html',
  styleUrls: ['./csmap.component.scss'],
})

export class CsMapClipboardComponent implements OnInit {
  buttonText = 'clipboard';
  polygonBBox: Polygon;
  bShowClipboard: Boolean;
  public isFilterLayerShown: Boolean;
  public isDrawingPolygon: boolean;
  constructor(private CsClipboardService: CsClipboardService) {
    this.polygonBBox = null;
    this.isFilterLayerShown = false;
    this.isDrawingPolygon = false;
    this.CsClipboardService.filterLayersBS.subscribe(filterLayerStatus => {
      this.isFilterLayerShown = filterLayerStatus;
    })

    this.CsClipboardService.polygonsBS.subscribe(polygon => {
        this.isDrawingPolygon = false;
    })
  }

  ngOnInit(): void {
      this.CsClipboardService.clipboardBS.subscribe(
        (show) => {
          this.bShowClipboard = show;
      });

      this.CsClipboardService.polygonsBS.subscribe(
        (polygonBBox) => {
          this.polygonBBox = polygonBBox;
      });
    }
  clearClipboard() {
    this.CsClipboardService.clearClipboard();
  }

  public toggleFilterLayers() {
    this.CsClipboardService.toggleFilterLayers();
  }

  /**
   * Draw a polygon layer to map
   *
   */
  public drawPolygon(): void {
    this.isDrawingPolygon = true;
    this.CsClipboardService.drawPolygon();
  }

  getPolygonBBoxs(): String {
    return this.polygonBBox.coordinates;
  }
}
