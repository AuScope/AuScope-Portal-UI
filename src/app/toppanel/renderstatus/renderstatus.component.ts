import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-ngbd-modal-status-report',
    templateUrl: './renderstatus.component.html',
    standalone: false
})


export class NgbdModalStatusReportComponent {
  bsModalRef = inject(MatDialogRef<NgbdModalStatusReportComponent>);

  public resourceMap = {};

}
