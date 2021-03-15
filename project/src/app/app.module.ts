import { environment } from '../environments/environment';
import { config } from '../environments/config';
import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NouisliderModule } from 'ng2-nouislider';
import { CommonModule } from '@angular/common';   
import { RouterModule, Routes } from '@angular/router';

// Components
import { OlMapComponent } from './openlayermap/olmap.component';
import { OlMapPreviewComponent } from './menupanel/common/infopanel/openlayermappreview/olmap.preview.component';
import { LayerPanelComponent } from './menupanel/layerpanel/layerpanel.component';
import { CustomPanelComponent } from './menupanel/custompanel/custompanel.component';
import { FilterPanelComponent } from './menupanel/common/filterpanel/filterpanel.component';
import { DownloadPanelComponent } from './menupanel/common/downloadpanel/downloadpanel.component';
import { CapdfAdvanceFilterComponent } from './menupanel/common/filterpanel/advance/capdf/capdf.advancefilter.component';
import { DynamicAdvancefilterComponent } from './menupanel/common/filterpanel/dynamic.advancefilter.component';
import { InfoPanelComponent } from './menupanel/common/infopanel/infopanel.component';
import { InfoPanelSubComponent } from './menupanel/common/infopanel/subpanel/subpanel.component';
import { PermanentLinkComponent } from './menupanel/permanentlink/permanentlink.component';
import { ClipboardComponent } from './menupanel/clipboard/clipboard.component';
import { CapdfAnalyticComponent } from './modalwindow/layeranalytic/capdf/capdf.analytic.component';
import { DynamicLayerAnalyticComponent } from './modalwindow/layeranalytic/dynamic.layer.analytic.component';
import { LayerAnalyticModalComponent } from './modalwindow/layeranalytic/layer.analytic.modal.component';
import { NVCLBoreholeAnalyticComponent } from './modalwindow/layeranalytic/nvcl/nvcl.boreholeanalytic.component';
import { RemanentAnomaliesComponent } from './modalwindow/querier/customanalytic/RemanentAnomalies/remanentanomalies.component';
import { DynamicAnalyticComponent } from './modalwindow/querier/dynamic.analytic.component';
import { NVCLDatasetListComponent, NVCLDatasetListDialogComponent } from './modalwindow/querier/customanalytic/nvcl/nvcl.datasetlist.component';
import { TIMAComponent } from './modalwindow/querier/customanalytic/tima/tima.component';
import { OlMapZoomComponent } from './openlayermap/olmap.zoom.component';
import { NgbdModalStatusReportComponent } from './toppanel/renderstatus/renderstatus.component';
import { OlMapClipboardComponent } from './openlayermap/olmap.clipboard.component';



import { NotificationComponent } from './toppanel/notification/notification.component';
import { QuerierModalComponent } from './modalwindow/querier/querier.modal.component';
import { ClipboardModule } from 'ngx-clipboard';


import { PortalCoreModule } from '@auscope/portal-core-ui';
import { PortalCorePipesModule } from '@auscope/portal-core-ui';

import { NgSelectModule } from '@ng-select/ng-select';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTreeModule } from '@angular/material/tree';
import { CdkTableModule } from '@angular/cdk/table';

import { StorageServiceModule } from 'ngx-webstorage-service';
import { OlmapBaselayerselectorComponent } from './openlayermap/olmap.baselayerselector/olmap.baselayerselector.component';
import { DisclaimerModalComponent } from './modalwindow/disclaimer/disclaimer.modal.component';
import { PortalDetailsPanelComponent } from './menupanel/portal-details-panel/portal-details-panel.component';

import {NgxChartsModule} from '@swimlane/ngx-charts';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MSCLComponent } from './modalwindow/querier/customanalytic/mscl/mscl.component';
import { MSCLAnalyticComponent } from './modalwindow/layeranalytic/mscl/mscl.analytic.component';


import { PlotlyViaCDNModule } from 'angular-plotly.js';

// Using CDN module to avoid bug https://github.com/plotly/angular-plotly.js/issues/75
PlotlyViaCDNModule.plotlyVersion = '1.53.0';
PlotlyViaCDNModule.plotlyBundle = 'basic';

// catalogue search
import { CatalogueSearchPanelComponent } from './menupanel/cataloguesearch/cataloguesearch.panel.component';
import { CatalogueSearchModalComponent } from './modalwindow/cataloguesearch/cataloguesearch.modal.component';
import { RecordModalComponent } from './modalwindow/cataloguesearch/record.modal.component';
import { CataloguesearchService } from './modalwindow/cataloguesearch/cataloguesearch.service';

@NgModule({
  declarations: [
    OlMapComponent,
    OlMapPreviewComponent,
    LayerPanelComponent,
    CustomPanelComponent,
    CatalogueSearchPanelComponent,
    FilterPanelComponent,
    DownloadPanelComponent,
    NgbdModalStatusReportComponent,
    OlMapClipboardComponent,
    InfoPanelComponent,
    NotificationComponent,
    InfoPanelSubComponent,
    OlMapZoomComponent,
    QuerierModalComponent,
    DynamicAnalyticComponent,
    NVCLDatasetListComponent,
    NVCLDatasetListDialogComponent,
    TIMAComponent,
    RemanentAnomaliesComponent,
    LayerAnalyticModalComponent,
    DynamicLayerAnalyticComponent,
    NVCLBoreholeAnalyticComponent,
    PermanentLinkComponent,
    ClipboardComponent,
    DynamicAdvancefilterComponent,
    CapdfAdvanceFilterComponent,
    CapdfAnalyticComponent,
    OlmapBaselayerselectorComponent,
    DisclaimerModalComponent,
    PortalDetailsPanelComponent,
    MSCLComponent,
    MSCLAnalyticComponent,
    CatalogueSearchModalComponent,
    RecordModalComponent
  ],
  providers: [CataloguesearchService],
  imports: [
    PortalCoreModule.forRoot(environment, config),
    PortalCorePipesModule,
    ClipboardModule,
    RouterModule.forRoot([]),
    ModalModule.forRoot(),
    NouisliderModule,
    NgSelectModule,
    CdkTableModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSliderModule,
    StorageServiceModule,
    NgxChartsModule,
    BrowserAnimationsModule,
    BsDropdownModule.forRoot(),
    CommonModule, PlotlyViaCDNModule
  ],
  entryComponents: [
    NgbdModalStatusReportComponent,
    QuerierModalComponent,
    NVCLDatasetListComponent,
    NVCLDatasetListDialogComponent,
    TIMAComponent,
    RemanentAnomaliesComponent,
    LayerAnalyticModalComponent,
    NVCLBoreholeAnalyticComponent,
    CapdfAdvanceFilterComponent,
    CapdfAnalyticComponent,
    DisclaimerModalComponent,
    MSCLComponent,
    MSCLAnalyticComponent
  ],
  bootstrap: [
    OlMapComponent,
    LayerPanelComponent,
    CustomPanelComponent,
    NotificationComponent,
    OlMapZoomComponent,
    PermanentLinkComponent,
    CatalogueSearchPanelComponent,
    ClipboardComponent,
    OlMapClipboardComponent,
    OlmapBaselayerselectorComponent,
    PortalDetailsPanelComponent
  ]
})
export class AppModule { }
