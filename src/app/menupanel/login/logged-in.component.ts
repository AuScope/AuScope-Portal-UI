import { Component, OnInit, inject } from '@angular/core';

import { AuthService } from '../../services/auth/auth.service';

@Component({
    selector: 'app-logged-in',
    template: ``,
    styles: [],
    standalone: false
})
export class LoggedInComponent implements OnInit {
  private authService = inject(AuthService);


  ngOnInit() {
    // Inform the auth service
    this.authService.onLoggedIn();
  }

}
