
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ContextService } from "@csiro-geoanalytics/ng";

ContextService.load()
	.then(context => {
		/*
			each property of the context file is copied over to the environment object, replacing any that share the same name.
		*/
		Object.keys(context).forEach(key => environment[key]=context[key]);

		if (environment.production) {
			enableProdMode();
		  }

		  if (environment.rudderStackWriteKey && environment.rudderStackDataPlaneUrl) {
			import('@rudderstack/analytics-js').then((module: any) => {
			  // Create RudderAnalytics instance
			  const rudderanalytics = new module.RudderAnalytics();

			  // Attach to window for global access
			  window['rudderanalytics'] = rudderanalytics;

			  // Initialize RudderStack with load method
			  rudderanalytics.load(
				environment.rudderStackWriteKey,
				environment.rudderStackDataPlaneUrl,
				{
				  logLevel: environment.production ? 'ERROR' : 'DEBUG',
				  configUrl: 'https://api.rudderstack.com'
				}
			  );

			  // Track initial page view
			  rudderanalytics.page();
			}).catch(err => {
			  console.error('Failed to load RudderStack:', err);
			});
		  }

		return platformBrowserDynamic().bootstrapModule(AppModule)
	})
	.catch(err => console.error(err));



// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let require;

// If required, Cesium access token can be set here
// Ion.defaultAccessToken =

window['CESIUM_BASE_URL'] = '/assets/cesium/';

/*
	To run the application under a different execution context provide a path to context
	configuration file into the ContextService.load() method below.  Or just accept the default ./contexts/context.json
*/


