import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/**
 * Reusable confirmation dialog class
 */
@Component({
    selector: 'app-confirm-modal',
    templateUrl: './confirm.modal.component.html',
    styleUrls: ['./confirm.modal.component.scss'],
    standalone: false
})
export class ConfirmModalComponent {
  dialogRef = inject(MatDialogRef<ConfirmModalComponent>);
  /**
   * Input data:
   *   title: string;
   *   modalContent: string;
   *   confirmButtonText: string;
  *    cancelButtonText: string;
   */
  data = inject(MAT_DIALOG_DATA);

}
