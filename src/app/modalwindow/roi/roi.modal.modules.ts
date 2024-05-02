import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ROIModalComponent } from './roi.modal.component';

@NgModule({
    imports: [
      CommonModule,
    ],
    declarations: [ ROIModalComponent ],
    exports: [ ROIModalComponent ]
  })

export class ROIModule { }