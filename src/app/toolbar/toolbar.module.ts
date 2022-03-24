import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToolbarDirective } from './toolbar.directive';
import { ToolbarComponentsService } from '../services/ui/toolbar-components.service';
import { GraceGraphModalComponent } from './components/grace/grace-graph.modal.component';
import { GraceLegendComponent } from './components/grace/grace-legend.component';
import { GraceService } from '../services/wcustom/grace/grace.service';
import { GraceStyleService } from '../services/wcustom/grace/grace-style.service';
import { GraceToolbarComponent } from './components/grace/grace-toolbar.component';
import { NgxColorsModule } from 'ngx-colors';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';
import { CollapseModule } from 'ngx-bootstrap/collapse';

PlotlyModule.plotlyjs = PlotlyJS;


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    CollapseModule,
    NgxColorsModule,
    PlotlyModule
  ],
  declarations: [
      ToolbarDirective,
      GraceGraphModalComponent,
      GraceLegendComponent,
      GraceToolbarComponent
  ],
  entryComponents: [
    GraceGraphModalComponent, GraceLegendComponent, GraceToolbarComponent
  ],
  providers: [ ToolbarComponentsService, GraceService, GraceStyleService ]
})
export class ToolbarModule { }
