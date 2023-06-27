
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Ion } from 'cesium';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ContextService, ContextConfig, CONTEXT_CONFIG } from "@csiro-geoanalytics/ng";

ContextService.load()
	.then(context => {
		/*
			each property of the context file is copied over to the environment object, replacing any that share the same name.
		*/
		Object.keys(context).forEach(key => environment[key]=context[key]);

		if (environment.production) {
			enableProdMode();
		  }
		  
		  if (environment.googleAnalyticsKey) {
			const gtagscript = document.createElement('script');
			gtagscript.src = 'https://www.googletagmanager.com/gtag/js?id=' + environment.googleAnalyticsKey;
			gtagscript.async = true;
			document.head.appendChild(gtagscript);
			const gtaginitscript = document.createElement('script');
			gtaginitscript.innerHTML = 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());gtag(\'config\', \'' +
			environment.googleAnalyticsKey + '\');';
			document.head.appendChild(gtaginitscript);
		  }

		return platformBrowserDynamic().bootstrapModule(AppModule)
	})
	.catch(err => console.error(err));



declare var require;

// This access token is taken from the "angular-cesium" website - you can replace it with your own one
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTY1NDYzYS01YzgxLTQ2MGUtODBiYy0zODRmY2MwOGY4MDIiLCJpZCI6MjA1LCJpYXQiOjE1MDQ3MjQ1Njh9.rKgXUKAfFiiSAm_b9T8bpsDVdj0YyZeqGxNpzLlhxpk';
window['CESIUM_BASE_URL'] = '/assets/cesium/';

/*
	To run the application under a different execution context provide a path to context
	configuration file into the ContextService.load() method below.  Or just accept the default ./contexts/context.json
*/


