import { Component } from '@angular/core';
import { UserStateService } from './services/user/user-state.service';
/**
 * Top level application component, holds the router outlet
 *
 * @export
 * @class AppComponent
 */
@Component({
    selector: 'app-component',
    templateUrl: './app.component.html',
    standalone: false
})

export class AppComponent {

  constructor(private userStateService: UserStateService) {
    this.userStateService.updateUser();
  }

}
