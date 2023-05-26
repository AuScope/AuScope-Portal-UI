import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { environment } from '../environments/environment';
import { LoggedInComponent } from './menupanel/login/logged-in.component';
import { LoginComponent } from './menupanel/login/login.component';
import { PortalComponent } from './portal/portal.component';


const baseUrl = environment.portalBaseUrl.replace(/^\/|\/$/g, '');

/**
 * Application routes.
 * Add the following to a route to ensure only authenticated users can access:
 *    canActivate: [AuthGuard]
 */
const routes: Routes = [
  { path: '', pathMatch: 'full', component: PortalComponent },
  { path: 'index.htm', pathMatch: 'full', component: PortalComponent },  // redirect legacy states from index.htm
  { path: 'index.html', pathMatch: 'full', component: PortalComponent }, // redirect legacy states from index.html
  { path: 'login', component: LoginComponent },
  { path: 'login/loggedIn', component: LoggedInComponent },
  { path: baseUrl, redirectTo: '/', pathMatch: 'full' },
  { path: '**', redirectTo: '/' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
