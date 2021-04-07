import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OlMapHomeComponent } from './olmap.home.component';

const routes: Routes = [{ path: '', component: OlMapHomeComponent, data: {key: "home"} }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OlMapRoutingModule { }


