import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { OlMapComponent } from './olmap.component';
import { OlMapHomeComponent } from './olmap.home.component';
import { OlMapZoomComponent } from './olmap.zoom.component';
import { OlMapClipboardComponent } from './olmap.clipboard.component';
import { NgbAccordionModule, NgbDropdownModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { OlmapBaselayerselectorComponent } from './olmap.baselayerselector/olmap.baselayerselector.component';
import { OlMapRoutingModule } from './olmap-routing.module';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SliderModule } from 'primeng/slider';


@NgModule({
  imports: [
    CommonModule,
    NgbAccordionModule,
    NgbCollapseModule,
    NgbDropdownModule,
    ReactiveFormsModule,
    FormsModule,
    RadioButtonModule,
    SliderModule,
    OlMapRoutingModule
  ],
  declarations: [ OlMapComponent, OlMapZoomComponent, OlmapBaselayerselectorComponent, OlMapClipboardComponent, OlMapHomeComponent ],
  bootstrap: [ OlMapComponent, OlMapZoomComponent, OlmapBaselayerselectorComponent, OlMapClipboardComponent, OlMapHomeComponent ],
  exports: [ OlMapComponent, OlMapZoomComponent, OlmapBaselayerselectorComponent, OlMapClipboardComponent, OlMapHomeComponent ]
})
export class OlMapModule { }
