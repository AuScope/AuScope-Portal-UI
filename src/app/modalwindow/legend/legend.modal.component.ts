import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LegendUiService } from 'app/services/legend/legend-ui.service';
import { forkJoin, Observable } from 'rxjs';

@Component({
    selector: 'app-legend-modal',
    templateUrl: './legend.modal.component.html',
    styleUrls: ['./legend.modal.component.scss'],
    standalone: false
})
export class LegendModalComponent {
  private dialogRef = inject<MatDialogRef<LegendModalComponent>>(MatDialogRef);


  private legendUiService = inject(LegendUiService);

  // Supplied parameters
  layerId: string; // ID of layer that legend belongs to
  legendTitle: string; // Title of legend
  legendRequestList: Observable<any>[]; // Array of Requests to try for legend

  // Local
  legendImage: any; // Legend image will be constructed from the supplied Blob (from legendRequestList)
  legendLoading = true; // True if legend is loading
  requestLegendFailed = false; // True if all legend requests failed


  constructor() {
    const data = inject(MAT_DIALOG_DATA);

    this.layerId = data.layerId;
    this.legendTitle = data.legendTitle;
    this.legendRequestList = data.legendRequestList;
    this.retrieveLegend();
  }

  /**
   * Attempt to get images from all URLs in the legendRequestList
   */
  retrieveLegend() {
    if (this.legendRequestList && this.legendRequestList.length > 0) {
      // Run legend requests for all WMS (some may be down or not accepting legend requests), use first success
      forkJoin(this.legendRequestList).subscribe(result => {
        this.legendRequestList = [];
        let requestSuccess = false;
        for (const legendBlob of result) {
          if (legendBlob !== undefined) {
            this.createLegendImageFromLegendData(legendBlob);
            requestSuccess = true;
            this.legendLoading = false;
            break;
          }
        }
        if (!requestSuccess) {
          this.requestLegendFailed = true;
          this.legendLoading = false;
        }
      });
    }
  }

  /**
   * Create a legend image from the image blob data
   *
   * @param legendData legend image data as a Blob
   */
  private createLegendImageFromLegendData(legendData: Blob) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
       this.legendImage = reader.result;
    }, false);
    if (legendData) {
      reader.readAsDataURL(legendData);
    }
  }

  /**
   * Close the legend dialog
   */
  public closeLegend() {
    this.legendUiService.removeLegend(this.layerId);
    this.dialogRef.close();
  }

}
