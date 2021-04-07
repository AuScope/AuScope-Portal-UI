import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

const baseUrl = environment.portalBaseUrl.replace(/^\/|\/$/g, '');

const routes: Routes = [
  { path: 'home', loadChildren: './openlayermap/olmap.module#OlMapModule' },
  { path: 'cataloguesearch', loadChildren: './menupanel/cataloguesearch/cataloguesearch.module#CatalogueSearchModule' },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: baseUrl, redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
