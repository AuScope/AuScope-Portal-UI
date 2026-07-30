import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ROIModalComponent } from './roi.modal.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    imports: [
      CommonModule,
      MatDialogModule
    ],
    declarations: [ ROIModalComponent ],
    exports: [ ROIModalComponent ]
  })

export class ROIModule { }
