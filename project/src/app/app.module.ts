import { environment } from '../environments/environment';
import { config } from '../environments/config';
import { CatalogueSearchComponent } from './menupanel/cataloguesearch/cataloguesearch.component';
import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NouisliderModule } from 'ng2-nouislider';
import { CommonModule } from '@angular/common';

// Cesium icons
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { CsMapComponent } from './cesium-map/csmap.component';
import { OlMapPreviewComponent } from './menupanel/common/infopanel/openlayermappreview/olmap.preview.component';
import { LayerPanelComponent } from './menupanel/layerpanel/layerpanel.component';
import { CustomPanelComponent } from './menupanel/custompanel/custompanel.component';
import { ActiveLayersPanelComponent } from './menupanel/activelayers/activelayerspanel.component';
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
import { CsMapSplitComponent } from './cesium-map/csmap.split.component';
import { CsMapZoomComponent } from './cesium-map/csmap.zoom.component';
import { NgbdModalStatusReportComponent } from './toppanel/renderstatus/renderstatus.component';
import { CsMapClipboardComponent } from './cesium-map/csmap.clipboard.component';

import { AngularCesiumModule, AngularCesiumWidgetsModule } from 'angular-cesium';

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
import { DisclaimerModalComponent } from './modalwindow/disclaimer/disclaimer.modal.component';
import { PortalDetailsPanelComponent } from './menupanel/portal-details-panel/portal-details-panel.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MSCLComponent } from './modalwindow/querier/customanalytic/mscl/mscl.component';
import { MSCLAnalyticComponent } from './modalwindow/layeranalytic/mscl/mscl.analytic.component';

import { PlotlyViaCDNModule } from 'angular-plotly.js';
import { RectanglesEditorService } from 'angular-cesium';

// Using CDN module to avoid bug https://github.com/plotly/angular-plotly.js/issues/75
PlotlyViaCDNModule.plotlyVersion = '1.53.0';
PlotlyViaCDNModule.plotlyBundle = 'basic';


@NgModule({
  declarations: [
    CsMapComponent,
    OlMapPreviewComponent,
    LayerPanelComponent,
    CustomPanelComponent,
    ActiveLayersPanelComponent,
    CatalogueSearchComponent,
    FilterPanelComponent,
    DownloadPanelComponent,
    NgbdModalStatusReportComponent,
    CsMapClipboardComponent,
    InfoPanelComponent,
    NotificationComponent,
    InfoPanelSubComponent,
    CsMapSplitComponent,
    CsMapZoomComponent,
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
    DisclaimerModalComponent,
    PortalDetailsPanelComponent,
    MSCLComponent,
    MSCLAnalyticComponent
  ],
  providers: [RectanglesEditorService],
  imports: [
    PortalCoreModule.forRoot(environment, config),
    PortalCorePipesModule,
    ClipboardModule,
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
    CommonModule, PlotlyViaCDNModule,
    AngularCesiumModule.forRoot(),
    AngularCesiumWidgetsModule,
    MatTooltipModule
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
    CsMapComponent,
    LayerPanelComponent,
    CustomPanelComponent,
    ActiveLayersPanelComponent,
    NotificationComponent,
    // OlMapZoomComponent,
    PermanentLinkComponent,
    CatalogueSearchComponent,
    ClipboardComponent,
    // OlMapClipboardComponent,
    // OlmapBaselayerselectorComponent,
    PortalDetailsPanelComponent
  ]
})
export class AppModule { }
