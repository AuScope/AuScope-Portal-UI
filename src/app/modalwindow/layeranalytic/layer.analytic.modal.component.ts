
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
    selector: 'app-layer-modal-window',
    templateUrl: './layer.analytic.modal.component.html',
    standalone: false
})

export class LayerAnalyticModalComponent {
  dialogRef = inject(MatDialogRef<LayerAnalyticModalComponent>);
  data = inject(MAT_DIALOG_DATA);

  public analyticMap;

}
