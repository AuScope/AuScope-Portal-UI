import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CatalogueSearchComponent } from './cataloguesearch.component';

const routes: Routes = [{ path: '', component: CatalogueSearchComponent, data: {key: "cataloguesearch"} }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CatalogueSearchRoutingModule { }


