import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderModule } from '../../shared/modules/page-header/page-header.module';
import { CatalogueSearchRoutingModule } from './cataloguesearch-routing.module';
import { CatalogueSearchComponent } from './cataloguesearch.component';
import { CataloguesearchService } from './cataloguesearch.service';
import { NgbCollapseModule, NgbModalModule, NgbTypeaheadModule, NgbNavModule, NgbActiveModal, NgbAccordionModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { AngularSplitModule } from 'angular-split';
import { OlMapModule } from '../../openlayermap/olmap.module';


@NgModule({
  imports: [
    AngularSplitModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderModule,
    CatalogueSearchRoutingModule,
    CalendarModule,
    TableModule,    // Note: PrimeNG v6.0.0 needs this for TreeTable to display correctly
    TreeTableModule,
    DropdownModule,
    SliderModule,
    OlMapModule,
    NgbAccordionModule,
    NgbCollapseModule,
    NgbDropdownModule,
    NgbModalModule,
    NgbTypeaheadModule,
    NgbNavModule
  ],
  providers: [NgbActiveModal, CataloguesearchService],
  declarations: [ CatalogueSearchComponent ]
})
export class CatalogueSearchModule { }
