import { NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {HttpModule} from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';




// Services
import { LayerHandlerService } from './service/cswrecords/layer-handler.service';
import { FilterPanelService } from './service/filterpanel/filterpanel-service';
import { OlMapObject } from './service/openlayermap/ol-map-object';
import { OlMapService } from './service/openlayermap/ol-map.service';
import { OlClipboardService } from './service/openlayermap/ol-clipboard.service';
import { RenderStatusService } from './service/openlayermap/renderstatus/render-status.service';
import { ManageStateService } from './service/permanentlink/manage-state.service';
import { DownloadWfsService } from './service/wfs/download/download-wfs.service';
import { OlWMSService } from './service/wms/ol-wms.service';
import { OlWFSService } from './service/wfs/ol-wfs.service';
import { GMLParserService } from './utility/gmlparser.service';
import { LegendService } from './service/wms/legend.service';
import { NotificationService } from './service/toppanel/notification.service';
import { OlCSWService } from './service/wcsw/ol-csw.service';
import { DownloadWcsService } from './service/wcs/download/download-wcs.service';
import { QueryWMSService} from './service/wms/query-wms.service';
import { QueryWFSService} from './service/wfs/query-wfs.service';



// Directives
import { ImgLoadingDirective } from './uiutilities/imgloading.directive';
import { StopPropagationDirective } from './utility/utilities.directives';
import { SelectMapBoundingComponent } from './widget/selectmap.bounding';

@NgModule({
  declarations: [
    ImgLoadingDirective,
    StopPropagationDirective,
    SelectMapBoundingComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  exports: [ImgLoadingDirective, StopPropagationDirective,
    HttpClientModule, BrowserModule, FormsModule, HttpModule, SelectMapBoundingComponent],
  providers: [LayerHandlerService,
    OlWMSService,
    OlMapObject,
    OlWFSService,
    DownloadWfsService,
    DownloadWcsService,
    GMLParserService,
    RenderStatusService,
    FilterPanelService,
    LegendService,
    ImgLoadingDirective,
    NotificationService,
    QueryWMSService,
    QueryWFSService,
    ManageStateService,
    OlCSWService
  ]
})

export class PortalCoreModule {

  static forRoot(env: any, conf: any): ModuleWithProviders {
    return {
      ngModule: PortalCoreModule,
      providers: [
        OlClipboardService,
        OlMapService,
        {provide: 'env', useValue: env},
        {provide: 'conf', useValue: conf}
      ],
    };
  }

  constructor (@Optional() @SkipSelf() parentModule: PortalCoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only');
    }
  }



}
