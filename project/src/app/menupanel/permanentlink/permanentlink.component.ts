import {ManageStateService} from '../../portal-core-ui/service/permanentlink/manage-state.service';
import { UtilitiesService } from '../../portal-core-ui/utility/utilities.service';
import { environment } from '../../../environments/environment';
import {Component} from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

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

  constructor(private http: HttpClient, private manageStateService: ManageStateService) {

  }

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
        // Shorten url by bitly
        let httpParams = new HttpParams();
        httpParams = httpParams.append('format', 'json');
        httpParams = httpParams.append('apiKey', 'R_c8a26bd1b5294388873f7d5adb79192b');
        httpParams = httpParams.append('login', 'lingbojiang');
        httpParams = httpParams.append('longUrl', me.permanentlink);
        const me_ = me;
        me.http.post('http://api.bitly.com/v3/shorten?', httpParams.toString(), {
          headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'), responseType: 'json'
        }).subscribe((response: any) => {
          console.log(response.data.url);
          if (response.status_txt === 'OK') {
            me_.permanentlink = response.data.url;
            me_.shorteningMode = false;
          }
        });
      });
    }
  }


}
