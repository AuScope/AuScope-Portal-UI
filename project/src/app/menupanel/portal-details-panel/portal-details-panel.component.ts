import { Component, OnInit } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DisclaimerModalComponent } from '../../modalwindow/disclaimer/disclaimer.modal.component';

@Component({
  selector: '[appPortalDetailsPanel]',
  templateUrl: './portal-details-panel.component.html',
  styleUrls: ['./portal-details-panel.component.css']
})
export class PortalDetailsPanelComponent implements OnInit {

  constructor(private modalService: BsModalService) { }

  ngOnInit() {
  }

  OpenDisclaimerModal(): void {
    this.modalService.show(DisclaimerModalComponent);
  }

}
