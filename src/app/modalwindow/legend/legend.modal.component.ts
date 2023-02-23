import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LegendUiService } from 'app/services/legend/legend-ui.service';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'legend-modal',
  templateUrl: './legend.modal.component.html',
  styleUrls: ['./legend.modal.component.scss']
})
export class LegendModalComponent {

  // Supplied parameters
  layerId: string;          // ID of layer that legend belongs to
  legendTitle: string;      // Title of legend
  legendUrlList: string[];              // Array of URL strings to try for legend
  legendRequestList: Observable<any>[]; // Array of Requests to try for legend

  // Local
  legendUrl: string;    // URL string used for images (from legendUrlList)
  legendImage: any;     // Legend image will be constructed from the supplied Blob (from legendRequestList)
  legendLoaded = false; // True when legend has successfully loaded either via URL or Request
  legendError = false;  // URLs may throw an error if they fail to load


  constructor(private legendUiService: LegendUiService, private dialogRef: MatDialogRef<LegendModalComponent>, @Inject(MAT_DIALOG_DATA) data) {
    this.layerId = data.layerId;
    this.legendTitle = data.legendTitle;
    this.legendUrlList = data.legendUrlList;
    this.legendRequestList = data.legendRequestList;
    if (this.legendUrlList && this.legendUrlList.length > 0) {
      // Try the first URL if one has been provided
      this.legendUrl = this.legendUrlList.pop();
    } else if (this.legendRequestList && this.legendRequestList.length > 0) {
      // Run legend requests for all WMS (some may be down or not accept legend requests), use first success
      forkJoin(this.legendRequestList).subscribe(result => {
        for (const legendBlob of result) {
          if (legendBlob !== undefined) {
            this.createLegendImageFromLegendData(legendBlob);
            break;
          }
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
   * Called upon legendUrl image throwing an error, will pop URLs off the legendUrlList
   * until it succeeds or runs out
   */
  public legendUrlError() {
    this.legendError = false;
    if (this.legendUrlList.length > 0) {
      this.legendUrl = this.legendUrlList.pop();
    } else {
      this.legendError = true;
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
