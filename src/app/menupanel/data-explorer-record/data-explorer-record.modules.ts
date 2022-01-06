import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataExplorerRecordComponent } from './data-explorer-record.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule
  ],
  declarations: [ DataExplorerRecordComponent ],
  exports: [ DataExplorerRecordComponent ]
})
export class DataExplorerdRecordModule { }