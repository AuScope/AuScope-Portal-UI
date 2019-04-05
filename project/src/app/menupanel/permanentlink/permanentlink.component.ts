import {ManageStateService} from '../../portal-core-ui/service/permanentlink/manage-state.service';
import { UtilitiesService } from '../../portal-core-ui/utility/utilities.service';
import { environment } from '../../../environments/environment';
import {Component} from '@angular/core';

declare var gapi: any;

@Component({
  selector: '[appPermanentLink]',
  templateUrl: './permanentlink.component.html',
  styleUrls: ['../menupanel.scss']
})

export class PermanentLinkComponent {

  public permanentlink = '';
  public textwww = 'fdsafdas';
  public showPermanentLink = false;
  public shorteningMode = false;

  constructor(private manageStateService: ManageStateService) {}
  /**
   * generate the permanent link
   */
  public generatePermanentLink() {
    if (this.showPermanentLink) {
      const uncompStateStr = JSON.stringify(this.manageStateService.getState());
      const me = this;
      this.manageStateService.getCompressedString(uncompStateStr, function(result) {

        // Encode state in base64 so it can be used in a URL
        const stateStr = UtilitiesService.encode_base64(String.fromCharCode.apply(String, result));
        me.permanentlink = environment.hostUrl + '?state=' + stateStr
        me.shorteningMode = true;
        gapi.client.setApiKey('AIzaSyAwkIjU4nCPyditqP31L-W_h96FPT-TpyY');
        gapi.client.load('urlshortener', 'v1', function() {
          const Url = me.permanentlink
          const request = gapi.client.urlshortener.url.insert({
            'resource': {
              'longUrl': Url
            }
          });
          request.execute(function(response) {
            if (response.id != null) {
              setTimeout(() => {
                me.permanentlink = response.id;
                me.shorteningMode = false;
              }, 0)
            }
          });
        });
      });
    }
  }


}
