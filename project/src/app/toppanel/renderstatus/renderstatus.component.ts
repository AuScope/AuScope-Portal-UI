import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'ngbd-modal-status-report',
  templateUrl: './renderstatus.component.html'

})


export class NgbdModalStatusReportComponent {


  public resourceMap: Object;


  constructor(public bsModalRef: BsModalRef) {}


}
