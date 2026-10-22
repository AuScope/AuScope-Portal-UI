import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ContextService } from '@csiro-geoanalytics/ng';

// Add global to window, assigning the value of window itself.
// (Moved here from the former src/polyfills.ts, which Angular 22 no longer
// supports as a TypeScript polyfills entry.)
(window as any).global = window;

ContextService.load()
	.then(context => {
		/*
			each property of the context file is copied over to the environment object, replacing any that share the same name.
		*/
    Object.assign(environment, context as Partial<typeof environment>);


  if (environment.production) {
    enableProdMode();
  }

  platformBrowser().bootstrapModule(AppModule, {
    applicationProviders: [provideZoneChangeDetection()]
  })
.catch(err => console.error(err));
  })

// If required, Cesium access token can be set here
// Ion.defaultAccessToken =

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
window.CESIUM_BASE_URL = '/assets/cesium/';

/*
	To run the application under a different execution context provide a path to context
	configuration file into the ContextService.load() method below.  Or just accept the default ./contexts/context.json
*/
