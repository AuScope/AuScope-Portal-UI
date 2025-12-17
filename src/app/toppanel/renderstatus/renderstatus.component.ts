import { Component, inject } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-ngbd-modal-status-report',
    templateUrl: './renderstatus.component.html',
    standalone: false
})


export class NgbdModalStatusReportComponent {
  bsModalRef = inject(BsModalRef);



  public resourceMap = {};


}
