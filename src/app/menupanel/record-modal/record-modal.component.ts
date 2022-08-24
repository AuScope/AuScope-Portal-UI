import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CSWRecordModel, LayerModel, LayerStatusService } from '@auscope/portal-core-ui';
import { CesiumMapPreviewComponent } from '../common/infopanel/cesiummappreview/cesium.preview.component';

@Component({
  selector: 'app-record-modal-content',
  templateUrl: './record-modal.component.html',
  providers: [LayerStatusService],
  styleUrls: ['./record-modal.component.scss']
})
export class RecordModalComponent implements OnInit {
  @Input() cswRecords: CSWRecordModel[];
  @Input() layer: LayerModel;
  @ViewChild(CesiumMapPreviewComponent, { static: true })
  private previewMap: CesiumMapPreviewComponent;

  featureArr: any = [];

  constructor(public layerStatus: LayerStatusService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    // Gather up BBOX coordinates to calculate the envelope
    for (const record of this.cswRecords) {
      const bbox = record.geographicElements[0];
      if (
        bbox !== undefined &&
        (bbox.westBoundLongitude !== 0 || bbox.northBoundLatitude !== 0 || bbox.eastBoundLongitude !== 0 || bbox.southBoundLatitude !== 0) &&
        (bbox.eastBoundLongitude !== 180 || bbox.westBoundLongitude !== -180 || bbox.northBoundLatitude !== 90 || bbox.southBoundLatitude !== -90)
      ) {
        const coords: number[] = [bbox.westBoundLongitude, bbox.southBoundLatitude, bbox.eastBoundLongitude, bbox.northBoundLatitude];
        this.previewMap.addBbox(record, coords);
      }
      if (this.cswRecords.length === 1) {
        record.expanded = true;
      }
    }
    this.previewMap.fitMap();
  }

  /**
   * Highlights a bounding box on the preview map
   * @param layerId id of layer
   */
  highlightOnPreviewMap(layerId: string): void {
    this.previewMap.setBBoxHighlight(layerId, true);
  }

  /**
   * Unhighlights a bounding box on the preview map
   * @param layerId id of layer
   */
  lowlightOnPreviewMap(layerId: string): void {
    this.previewMap.setBBoxHighlight(layerId, false);
  }

}
