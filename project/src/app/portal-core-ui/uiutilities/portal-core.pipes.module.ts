import { NgModule} from '@angular/core';
// Utilities
import {KeysPipe, QuerierFeatureSearchPipe, TrustResourceUrlPipe, TrustResourceHtmlPipe} from './pipes';

@NgModule({
    declarations: [KeysPipe, QuerierFeatureSearchPipe, TrustResourceUrlPipe, TrustResourceHtmlPipe],
    exports: [KeysPipe, QuerierFeatureSearchPipe, TrustResourceUrlPipe, TrustResourceHtmlPipe],
    providers: []
})
export class PortalCorePipesModule { }
