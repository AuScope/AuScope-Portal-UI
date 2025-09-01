import { environment } from '../environments/environment';
import { config } from '../environments/config';
import { NgModule } from '@angular/core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

// Cesium icons
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { AppComponent } from './app.component';
import { PortalComponent } from './portal/portal.component';
import { LoginMenuComponent } from './menupanel/login/login-menu.component';
import { LoginComponent } from './menupanel/login/login.component';
import { LoggedInComponent } from './menupanel/login/logged-in.component';
import { CsMapComponent } from './cesium-map/csmap.component';
import { CesiumMapPreviewComponent } from './menupanel/common/infopanel/cesiummappreview/cesium.preview.component';
import { BrowsePanelComponent } from './browsepanel/browsepanel.component';
import { CustomPanelComponent } from './menupanel/custompanel/custompanel.component';
import { ActiveLayersPanelComponent } from './menupanel/activelayers/activelayerspanel.component';
import { FilterPanelComponent } from './menupanel/common/filterpanel/filterpanel.component';
import { SearchPanelComponent } from './menupanel/search/searchpanel.component';
import { DownloadPanelComponent } from './menupanel/common/downloadpanel/downloadpanel.component';
import { InfoPanelComponent } from './menupanel/common/infopanel/infopanel.component';
import { InfoPanelSubComponent } from './menupanel/common/infopanel/subpanel/subpanel.component';
import { PermanentLinkComponent } from './menupanel/permanentlink/permanentlink.component';
import { ClipboardComponent } from './menupanel/clipboard/clipboard.component';
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




import { NgSelectModule } from '@ng-select/ng-select';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatTreeModule } from '@angular/material/tree';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';

import { DisclaimerModalComponent } from './modalwindow/disclaimer/disclaimer.modal.component';
import { PortalDetailsPanelComponent } from './menupanel/portal-details-panel/portal-details-panel.component';

// Portal Core UI Library
import { PortalCoreModule } from './lib/portal-core-ui/portal-core.module';
import { PortalCorePipesModule } from './lib/portal-core-ui/uiutilities/portal-core.pipes.module';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MSCLComponent } from './modalwindow/querier/customanalytic/mscl/mscl.component';
import { MSCLAnalyticComponent } from './modalwindow/layeranalytic/mscl/mscl.analytic.component';
import { MSCLService } from './modalwindow/layeranalytic/mscl/mscl.service';

import { HelpMenuComponent } from './toppanel/help-menu/help-menu.component';

import { GraceLegendComponent } from './cesium-map/advanced/grace/grace-legend.component';
import { GraceGraphModalComponent } from './modalwindow/querier/customanalytic/grace/grace-graph.modal.component';
import { GraceAdvancedFilterComponent } from './menupanel/common/filterpanel/advance/grace/grace-advanced-filter.component';

import { LegendModalComponent } from './modalwindow/legend/legend.modal.component';

import { PermanentLinksModalComponent } from './modalwindow/permanentlink/permanentlinks.modal.component';
import { CreatePermanentLinkModalComponent } from './modalwindow/permanentlink/create-permanentlink.modal.component';

import { AddRegistryModalComponent } from './modalwindow/registry/add-registry.modal.component';
import { ConfirmModalComponent } from './modalwindow/confirm/confirm.modal.component';

// Services
import { AuscopeApiService } from './services/api/auscope-api.service';
import { FilterService } from './services/filter/filter.service';
import { RectanglesEditorService } from '@auscope/angular-cesium';
import { AdvancedComponentService } from './services/ui/advanced-component.service';
import { SearchService } from './services/search/search.service';
import { BoundsService } from './services/bounds/bounds.service';
import { GraceService } from './services/wcustom/grace/grace.service';
import { LegendUiService } from './services/legend/legend-ui.service';
import { LayerManagerService } from './services/ui/layer-manager.service';

import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DataExplorerComponent } from './menupanel/data-explorer/data-explorer.component';
import { DataExplorerdRecordModule } from './menupanel/data-explorer-record/data-explorer-record.modules';
import { RecordModalComponent } from './menupanel/record-modal/record-modal.component';
import { NVCLService } from './modalwindow/querier/customanalytic/nvcl/nvcl.service';
import { NVCLTSGDownloadComponent } from './modalwindow/layeranalytic/nvcl/nvcl.tsgdownload.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxColorsModule } from 'ngx-colors';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { getSaver, SAVER } from './modalwindow/layeranalytic/nvcl/saver.provider';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Auth
import { UserStateService } from './services/user/user-state.service';
import { AuthGuard } from './services/auth/auth.guard';
import { AuthService } from './services/auth/auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthErrorHandlerInterceptor } from './interceptors/auth-error.interceptor';
import { ROIModule } from './modalwindow/roi/roi.modal.modules';
import { ToolbarComponent } from './menupanel/toolbar/toolbar.component';
import { DownloadAuScopeCatModalComponent } from './modalwindow/download-auscopecat/download-auscopecat.modal.component';

PlotlyModule.plotlyjs = PlotlyJS;


@NgModule({
    declarations: [
        AppComponent,
        PortalComponent,
        LoginComponent,
        LoggedInComponent,
        LoginMenuComponent,
        CsMapComponent,
        CesiumMapPreviewComponent,
        BrowsePanelComponent,
        CustomPanelComponent,
        ActiveLayersPanelComponent,
        FilterPanelComponent,
        SearchPanelComponent,
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
        NVCLTSGDownloadComponent,
        PermanentLinkComponent,
        ClipboardComponent,
        GraceAdvancedFilterComponent,
        GraceGraphModalComponent,
        GraceLegendComponent,
        DisclaimerModalComponent,
        PortalDetailsPanelComponent,
        MSCLComponent,
        MSCLAnalyticComponent,
        HelpMenuComponent,
        DataExplorerComponent,
        RecordModalComponent,
        LegendModalComponent,
        PermanentLinksModalComponent,
        CreatePermanentLinkModalComponent,
        AddRegistryModalComponent,
        ConfirmModalComponent,
        ToolbarComponent
    ],
    providers: [ AuscopeApiService, FilterService, RectanglesEditorService, AdvancedComponentService, SearchService,
                 NVCLService, MSCLService, BoundsService, GraceService, { provide: SAVER, useFactory: getSaver },
                 LegendUiService, UserStateService, LayerManagerService, AuthGuard, AuthService,
                 {
                    provide: HTTP_INTERCEPTORS,
                    useClass: AuthErrorHandlerInterceptor,
                    multi: true,
                 }
    ],
    imports: [
        PortalCoreModule.forRoot(environment, config),
        AppRoutingModule,
        PortalCorePipesModule,
        ClipboardModule,
        ModalModule.forRoot(),
        NgSelectModule,
        CdkTableModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatMenuModule,
        MatProgressBarModule,
        MatCardModule,
        MatRadioModule,
        MatSliderModule,
        MatTooltipModule,
        NgxChartsModule,
        NgxColorsModule,
        BrowserAnimationsModule,
        BsDropdownModule.forRoot(),
        CommonModule,
        PlotlyModule,
        DataExplorerdRecordModule,
        AngularCesiumModule.forRoot(),
        AngularCesiumWidgetsModule,
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        DragDropModule,
        ROIModule,
        DownloadAuScopeCatModalComponent
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule { }
