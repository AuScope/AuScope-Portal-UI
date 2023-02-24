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
  legendUrl: string;            // URL string used for images (from legendUrlList)
  legendImage: any;             // Legend image will be constructed from the supplied Blob (from legendRequestList)
  legendLoading = true;         // True if legend is loading, false otherwise
  urlLegendFailed = false;      // True if we've given up trying to load legends from the URL list
  requestLegendFailed = false;  // True if we've given up trying to load legends from the request list


  constructor(private legendUiService: LegendUiService, private dialogRef: MatDialogRef<LegendModalComponent>, @Inject(MAT_DIALOG_DATA) data) {
    this.layerId = data.layerId;
    this.legendTitle = data.legendTitle;
    this.legendUrlList = data.legendUrlList;
    this.legendRequestList = data.legendRequestList;
    this.retrieveLegend();
  }

  /**
   * Retrieve legend. First we try the URLs in the legendUrlList, failures will recurse. Failing that,
   * we try POST requests from the legendRequestList which will all be fired at once and the first success
   * used.
   */
  retrieveLegend() {
    if (this.legendUrlList && this.legendUrlList.length > 0) {
      // Try a URL from the URL list if one is available
      this.legendUrl = this.legendUrlList.pop();
    } else if (this.legendRequestList && this.legendRequestList.length > 0) {
      this.urlLegendFailed = true;
      // Run legend requests for all WMS (some may be down or not accept legend requests), use first success
      forkJoin(this.legendRequestList).subscribe(result => {
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
    } else {
      this.urlLegendFailed = true;
      this.requestLegendFailed = true;
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
