import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermanentLinkComponent } from './permanentlink.component';
import { ClipboardModule } from 'ngx-clipboard';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ClipboardModule
  ],
  exports: [
    PermanentLinkComponent
  ],
  providers: [PermanentLinkComponent],
  declarations: [ PermanentLinkComponent ],
  bootstrap: [PermanentLinkComponent]
})
export class PermanentLinkModule { }
