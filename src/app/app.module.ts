import { environment } from '../environments/environment';
import { config } from '../environments/config';
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

import { AngularCesiumModule, AngularCesiumWidgetsModule } from '@auscope/angular-cesium';

import { QuerierModalComponent } from './modalwindow/querier/querier.modal.component';
import { ClipboardModule } from 'ngx-clipboard';

import { PortalCoreModule } from '@auscope/portal-core-ui';
import { PortalCorePipesModule } from '@auscope/portal-core-ui';

import { NgSelectModule } from '@ng-select/ng-select';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTreeModule } from '@angular/material/tree';
import { CdkTableModule } from '@angular/cdk/table';

import { DisclaimerModalComponent } from './modalwindow/disclaimer/disclaimer.modal.component';
import { PortalDetailsPanelComponent } from './menupanel/portal-details-panel/portal-details-panel.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MSCLComponent } from './modalwindow/querier/customanalytic/mscl/mscl.component';
import { MSCLAnalyticComponent } from './modalwindow/layeranalytic/mscl/mscl.analytic.component';

import { HelpMenuComponent } from './toppanel/help-menu/help-menu.component';

// Services
import { AuscopeApiService } from './services/api/auscope-api.service';
import { RectanglesEditorService } from '@auscope/angular-cesium';

import * as PlotlyJS from 'plotly.js-dist-min/plotly.min.js';
import { PlotlyModule } from 'angular-plotly.js';

// import { CatalogueSearchComponent } from './menupanel/cataloguesearch/cataloguesearch.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DataExplorerComponent } from './menupanel/data-explorer/data-explorer.component';
import { DataExplorerdRecordModule } from './menupanel/data-explorer-record/data-explorer-record.modules';
import { RecordModalComponent } from './menupanel/record-modal/record-modal.component';
import { ToolbarModule } from './toolbar/toolbar.module';
import { NVCLService } from './modalwindow/querier/customanalytic/nvcl/nvcl.service';


PlotlyModule.plotlyjs = PlotlyJS;


@NgModule({
    declarations: [
        CsMapComponent,
        OlMapPreviewComponent,
        LayerPanelComponent,
        CustomPanelComponent,
        ActiveLayersPanelComponent,
        // CatalogueSearchComponent,
        FilterPanelComponent,
        DownloadPanelComponent,
        NgbdModalStatusReportComponent,
        CsMapClipboardComponent,
        InfoPanelComponent,
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
        MSCLAnalyticComponent,
        HelpMenuComponent,
        DataExplorerComponent,
        RecordModalComponent
    ],
    providers: [AuscopeApiService, RectanglesEditorService,,NVCLService],
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
        MatMenuModule,
        MatSliderModule,
        NgxChartsModule,
        BrowserAnimationsModule,
        BsDropdownModule.forRoot(),
        CommonModule,
        PlotlyModule,
        DataExplorerdRecordModule,
        AngularCesiumModule.forRoot(),
        AngularCesiumWidgetsModule,
        MatTooltipModule,
        NgbModule,
        ToolbarModule
    ],
    bootstrap: [
        CsMapComponent,
        LayerPanelComponent,
        CustomPanelComponent,
        ActiveLayersPanelComponent,
        PermanentLinkComponent,
        // CatalogueSearchComponent,
        DataExplorerComponent,
        PortalDetailsPanelComponent,
        HelpMenuComponent
    ]
})
export class AppModule { }
