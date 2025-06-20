import { Component } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DisclaimerModalComponent } from '../../modalwindow/disclaimer/disclaimer.modal.component';
import { environment } from '../../../environments/environment';

@Component({
    selector: '[appPortalDetailsPanel]',
    templateUrl: './portal-details-panel.component.html',
    styleUrls: ['./portal-details-panel.component.scss'],
    standalone: false
})
export class PortalDetailsPanelComponent {
  currentVersion : string = environment.appVersion;
  devSuffix: string = (environment.production!=true)? " Development version" : "";

  constructor(private modalService: BsModalService) { }

  OpenDisclaimerModal(): void {
    this.modalService.show(DisclaimerModalComponent);
  }

}
