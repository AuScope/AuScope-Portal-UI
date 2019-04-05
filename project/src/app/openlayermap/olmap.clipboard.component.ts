import { OlMapObject } from '../portal-core-ui/service/openlayermap/ol-map-object';
import { OlClipboardService, Polygon } from '../portal-core-ui/service/openlayermap/ol-clipboard.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ol-clipboard',
  templateUrl: './olmap.clipboard.component.html',
  styleUrls: ['./olmap.component.css']
})

export class OlMapClipboardComponent implements OnInit {
  buttonText = 'clipboard';
  polygonBBox: Polygon;
  bShowClipboard: Boolean;
  public isFilterLayerShown: Boolean;
  public isDrawingPolygon: boolean;
  constructor(private olMapObject: OlMapObject, private olClipboardService: OlClipboardService) {
    this.polygonBBox = null;
    this.isFilterLayerShown = false;
    this.isDrawingPolygon = false;
    this.olClipboardService.filterLayersBS.subscribe(filterLayerStatus => {
      this.isFilterLayerShown = filterLayerStatus;
    })

    this.olClipboardService.polygonsBS.subscribe(polygon => {
        this.isDrawingPolygon = false;
    })
  }

  ngOnInit(): void {
      this.olClipboardService.clipboardBS.subscribe(
        (show) => {
          this.bShowClipboard = show;
      });

      this.olClipboardService.polygonsBS.subscribe(
        (polygonBBox) => {
          this.polygonBBox = polygonBBox;
      });
    }
  clearClipboard() {
    this.olClipboardService.clearClipboard();
  }

  public toggleFilterLayers() {
    this.olClipboardService.toggleFilterLayers();
  }

  /**
   * Draw a polygon layer to map
   *
   */
  public drawPolygon(layer): void {
    this.isDrawingPolygon = true;
    this.olClipboardService.drawPolygon();
  }

  getPolygonBBoxs(): String {
    return this.polygonBBox.coordinates;
  }
}
