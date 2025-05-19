import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'ngbd-modal-status-report',
    templateUrl: './renderstatus.component.html',
    standalone: false
})


export class NgbdModalStatusReportComponent {


  public resourceMap = {};


  constructor(public bsModalRef: BsModalRef) {}


}
