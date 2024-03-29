import { Component } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DisclaimerModalComponent } from '../../modalwindow/disclaimer/disclaimer.modal.component';

@Component({
  selector: '[appPortalDetailsPanel]',
  templateUrl: './portal-details-panel.component.html',
  styleUrls: ['./portal-details-panel.component.scss']
})
export class PortalDetailsPanelComponent {

  constructor(private modalService: BsModalService) { }

  OpenDisclaimerModal(): void {
    this.modalService.show(DisclaimerModalComponent);
  }

}
