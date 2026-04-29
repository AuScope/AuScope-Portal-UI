import { Component, inject } from '@angular/core';
import { DisclaimerModalComponent } from '../../modalwindow/disclaimer/disclaimer.modal.component';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: '[app-portal-details-panel]',
    templateUrl: './portal-details-panel.component.html',
    styleUrls: ['./portal-details-panel.component.scss'],
    standalone: false
})
export class PortalDetailsPanelComponent {
  private dialog = inject(MatDialog);

  currentVersion : string = environment.appVersion;
  devSuffix: string = (environment.production!=true)? " Development version" : "";

  openDisclaimerModal(): void {
    this.dialog.open(DisclaimerModalComponent, {
      width: '600px'
    });
  }

}
