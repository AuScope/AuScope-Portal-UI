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

  openAuScope() {
    window.open("https://www.auscope.org.au/");
  }

  openUserGuide() {
    window.open("https://github.com/AuScope/AuScope-Portal-UI/raw/master/docs/AuScopeUserGuide.pdf");
  }

  openEmail() {
    window.open("mailto:cg-admin@csiro.au?Subject=Auscope-portal");
  }

  openCitation() {
    window.open("http://hdl.handle.net/102.100.100/483116?index=1");
  }

  openAuScopeCat() {
    window.open("https://auscope.github.io/AuScope-Cat");
  }

  openAppStore() {
    window.open("https://avre.auscope.org/");
  }

}
