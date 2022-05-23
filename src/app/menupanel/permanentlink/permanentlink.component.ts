import {ManageStateService} from '@auscope/portal-core-ui';
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MapState } from '@auscope/portal-core-ui';

@Component({
  selector: '[appPermanentLink]',
  templateUrl: './permanentlink.component.html',
  styleUrls: ['../menupanel.scss']
})

export class PermanentLinkComponent {
  public permanentlink = "";
  public showPermanentLink = false;
  public shorteningMode = false;

  constructor(private manageStateService: ManageStateService) {

  }

  /**
   * Generate the permanent link
   */
  public generatePermanentLink() {
    if (this.showPermanentLink) {
      const mapState: MapState = this.manageStateService.getState();
      const uncompStateStr = JSON.stringify(mapState);
      const me = this;
      me.shorteningMode = true;
      this.manageStateService.saveStateToDB(uncompStateStr).subscribe((response: any) => {
        if (response.success === true) {
          me.permanentlink = environment.hostUrl + "?state=" + response.id;
        }
        me.shorteningMode = false;
      });
    }
  }


}
