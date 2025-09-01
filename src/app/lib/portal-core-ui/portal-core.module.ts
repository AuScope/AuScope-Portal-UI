import { NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

// Services
import { LayerHandlerService } from './service/cswrecords/layer-handler.service';
import { FilterPanelService } from './service/filterpanel/filterpanel-service';
import { CsMapObject } from './service/cesium-map/cs-map-object';
import { CsMapService } from './service/cesium-map/cs-map.service';
import { CsClipboardService } from './service/cesium-map/cs-clipboard.service';
import { RenderStatusService } from './service/cesium-map/renderstatus/render-status.service';
import { ManageStateService } from './service/permanentlink/manage-state.service';
import { DownloadWfsService } from './service/wfs/download/download-wfs.service';
import { CsWMSService } from './service/wms/cs-wms.service';
import { CsWFSService } from './service/wfs/cs-wfs.service';
import { CsIrisService } from './service/kml/cs-iris.service';
import { CsKMLService } from './service/kml/cs-kml.service';
import { CsVMFService } from './service/vmf/cs-vmf.service';
import { CsGeoJsonService } from './service/geojson/cs-geojson.service';
import { KMLDocService } from './service/kml/kml.service';
import { DownloadIrisService } from './service/kml/download-iris.service';
import { GMLParserService } from './utility/gmlparser.service';
import { LayerStatusService } from './utility/layerstatus.service';
import { LegendService } from './service/wms/legend.service';
import { NotificationService } from './service/toppanel/notification.service';
import { CsCSWService } from './service/wcsw/cs-csw.service';
import { DownloadWcsService } from './service/wcs/download/download-wcs.service';
import { CsWWWService } from './service/www/cs-www.service';
import { QueryWMSService} from './service/wms/query-wms.service';
import { QueryWFSService} from './service/wfs/query-wfs.service';
import { SldService } from './service/style/wms/sld.service';

// Directives
import { ImgLoadingDirective } from './uiutilities/imgloading.directive';
import { StopPropagationDirective } from './utility/utilities.directives';
import { PolygonsEditorService } from '@auscope/angular-cesium';

@NgModule({ declarations: [
        ImgLoadingDirective,
        StopPropagationDirective
    ],
    exports: [ImgLoadingDirective, StopPropagationDirective,
        BrowserModule, FormsModule], imports: [BrowserModule,
        FormsModule], providers: [LayerHandlerService,
        CsWMSService,
        CsIrisService,
        CsKMLService,
        CsVMFService,
        KMLDocService,
        CsGeoJsonService,
        CsMapObject,
        CsWFSService,
        CsWWWService,
        DownloadWfsService,
        DownloadWcsService,
        DownloadIrisService,
        GMLParserService,
        RenderStatusService,
        FilterPanelService,
        LegendService,
        ImgLoadingDirective,
        NotificationService,
        QueryWMSService,
        QueryWFSService,
        ManageStateService,
        LayerStatusService,
        CsCSWService,
        PolygonsEditorService,
        SldService, provideHttpClient(withInterceptorsFromDi())] })

export class PortalCoreModule {

static forRoot(env: any, conf: any): ModuleWithProviders<PortalCoreModule> {
    return {
      ngModule: PortalCoreModule,
      providers: [
        CsClipboardService,
        CsMapService,
        {provide: 'env', useValue: env},
        {provide: 'conf', useValue: conf}
      ],
    };
  }

  constructor(@Optional() @SkipSelf() parentModule: PortalCoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only');
    }
  }

}
