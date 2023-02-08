import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-logged-in',
  template: ``,
  styles: []
})
export class LoggedInComponent implements OnInit {

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Inform the auth service
    this.authService.onLoggedIn();
  }

}
