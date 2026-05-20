import { Component, inject } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { ConfirmModalComponent } from '../confirm/confirm.modal.component';
import { CsClipboardService } from '../../lib/portal-core-ui/service/cesium-map/cs-clipboard.service';
import { UserStateService } from 'app/services/user/user-state.service';
import { User } from 'app/models/user.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';



/**
 * Modal component used to display a user's ROI lists
 */
@Component({
    selector: 'app-roi-form',
    templateUrl: './roi.modal.component.html',
    standalone: false
})
export class ROIModalComponent {
  csClipboardService = inject(CsClipboardService);
  userStateService = inject(UserStateService);
  private dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<ROIModalComponent>);

  public user: User;
  roiFormArray: UntypedFormArray;
  editingROI: number = -1; // Keep track of ROI being edited (-1 = none)
  /**
   * Delete a ROI from user's ROI lists
   * @param roi Polygon
   */
  public onDelete(roi:any) {
    const index = this.userStateService.roiList.indexOf(roi);
    this.userStateService.roiList.splice(index,1);
  }
  /**
   * Add a ROI to ClipboardService
   * @param roi Polygon
   */
  public onAddToPolyFilter(roi:any) {
    this.csClipboardService.loadPolygonFromROI(roi);
  }
  /**
   * Close the ROI component.
   * Save the ROI to storage.
   */
  public close() {
    if (this.editingROI !== -1 && this.roiFormArray.controls[this.editingROI].dirty) {
      const modalRef = this.dialog.open(ConfirmModalComponent, {
        width: '800px',
        maxWidth: '800px',
        data: {
            title: 'Unsaved Changes',
            modalContent: 'You have unsaved changes, do you wish to continue without saving?',
            cancelButtonText: 'Cancel',
            confirmButtonText: 'OK'
        }
      });
      modalRef.afterClosed().subscribe(result => {
        if (result && result === 'OK') {
         this.dialogRef.close();
        }
      });
    } else {
      // Save the ROI to storage.
      this.userStateService.saveROI();
      this.dialogRef.close();
    }
  }

}
