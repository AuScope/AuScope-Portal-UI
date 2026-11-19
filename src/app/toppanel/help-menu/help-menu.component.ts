import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DisclaimerModalComponent } from '../../modalwindow/disclaimer/disclaimer.modal.component';
import { environment } from '../../../environments/environment';

@Component({
    selector: '[app-help-menu]',
    templateUrl: './help-menu.component.html',
    styleUrls: ['./help-menu.component.scss'],
    standalone: false
})
export class HelpMenuComponent {

  private dialog = inject(MatDialog);

  currentVersion : string = environment.appVersion;
  devSuffix: string = (environment.production!=true)? " Development version" : "";

  openDisclaimerModal(): void {
    this.dialog.open(DisclaimerModalComponent, {
      width: '600px'
    });
  }

}
