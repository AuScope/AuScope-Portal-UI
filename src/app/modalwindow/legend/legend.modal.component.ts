import { Component, inject, OnDestroy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LegendUiService } from '../../services/legend/legend-ui.service';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-legend-modal',
  templateUrl: './legend.modal.component.html',
  styleUrls: ['./legend.modal.component.scss'],
  standalone: false
})
export class LegendModalComponent implements OnDestroy {
  private dialogRef = inject<MatDialogRef<LegendModalComponent>>(MatDialogRef);
  private legendUiService = inject(LegendUiService);

  // Supplied parameters
  layerId: string; // ID of layer that legend belongs to
  legendTitle: string; // Title of legend
  legendRequestList: Observable<any>[]; // Array of Requests to try for legend

  // Local
  legendImage = signal<any | undefined>(undefined); // Legend image will be constructed from the supplied Blob (from legendRequestList)
  legendLoading = signal<boolean>(true); // True if legend is loading
  requestLegendFailed = signal<boolean>(false); // True if all legend requests failed
  private imageObjectUrl?: string;


  constructor() {
    const data = inject(MAT_DIALOG_DATA);

    this.layerId = data.layerId;
    this.legendTitle = data.legendTitle;
    this.legendRequestList = data.legendRequestList;
    this.retrieveLegend();
  }

  ngOnDestroy() {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
    }
  }

  /**
   * 
   * @param blob 
   * @returns 
   */
  private isLegendImage(blob: Blob | undefined): Promise<boolean> {
    if (!blob) {
      return Promise.resolve(false);
    }

    if (blob.type.includes('se_xml')) {
      return Promise.resolve(false);
    }

    // Many proxies return application/octet-stream for images so inspect the content
    return blob.slice(0, 100).text()
      .then(text => {
        return !(text.startsWith('<?xml') || text.includes('<WMS_Capabilities') || text.includes('<ServiceException'));
      })
      .catch(() => {
        // Could not read as text, likely real binary/image data
        return true;
      });
  }

  /**
   * Attempt to get images from all URLs in the legendRequestList
   */
  retrieveLegend() {
    if (!this.legendRequestList?.length) {
      return;
    }
    forkJoin(this.legendRequestList).subscribe(async result => {
      this.legendRequestList = [];
      for (const legendBlob of result) {
        if (await this.isLegendImage(legendBlob)) {
          this.createLegendImageFromLegendData(legendBlob!);
          return;
        }
      }
      this.requestLegendFailed.set(true);
      this.legendLoading.set(false);
    });
  }

  /**
   * Create a legend image from the image blob data
   *
   * @param legendData legend image data as a Blob
   */
  private createLegendImageFromLegendData(legendData: Blob) {
    if (this.imageObjectUrl) {
      URL.revokeObjectURL(this.imageObjectUrl);
    }
    this.imageObjectUrl = URL.createObjectURL(legendData);
    this.legendImage.set(this.imageObjectUrl);
    this.legendLoading.set(false);
  }

  /**
   * Close the legend dialog
   */
  public closeLegend() {
    this.legendUiService.removeLegend(this.layerId);
    this.dialogRef.close();
  }

}
