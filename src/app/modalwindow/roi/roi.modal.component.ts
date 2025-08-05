import { Component } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../confirm/confirm.modal.component';
import { CsClipboardService } from '@auscope/portal-core-ui';
import { UserStateService } from 'app/services/user/user-state.service';
import { User } from 'app/models/user.model';



/**
 * Modal component used to display a user's ROI lists
 */
@Component({
    selector: 'app-roi-form',
    templateUrl: './roi.modal.component.html',
    standalone: false
})


export class ROIModalComponent {
  public user: User;
  roiFormArray: UntypedFormArray;
  editingROI: number = -1; // Keep track of ROI being edited (-1 = none)
  constructor(public csClipboardService: CsClipboardService, public userStateService: UserStateService, private formBuilder: UntypedFormBuilder, private modalService: NgbModal, public activeModal: NgbActiveModal) {

  }
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
      const modalRef = this.modalService.open(ConfirmModalComponent, {
        size: 'lg',
        backdrop: false
      });
      modalRef.componentInstance.title = 'Unsaved Changes';
      modalRef.componentInstance.modalContent = 'You have unsaved changes, do you wish to continue without saving?';
      modalRef.componentInstance.cancelButtonText = 'Cancel';
      modalRef.componentInstance.confirmButtonText = 'OK';
      modalRef.result.then(result => {
        if (result && result === 'OK') {
         this.activeModal.close();
        }
      });
    } else {
      // Save the ROI to storage.
      this.userStateService.saveROI();
      this.activeModal.close();
    }
  }

}
