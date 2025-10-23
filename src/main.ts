import { enableProdMode } from '@angular/core';
import { platformBrowser } from "@angular/platform-browser";
import { Ion } from 'cesium';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ContextService } from "@csiro-geoanalytics/ng";
import * as Sentry from "@sentry/angular";

import packagejson from "../package.json";

// Sentry set up.
if (environment.sentry && environment.sentry?.dsn)
{
	const integrations = [
		// Default integrations.
		Sentry.consoleLoggingIntegration({ levels: [ "warn", "error", "assert", "debug", "trace" ] }),
	];
	if (environment.sentry?.tracing)
		integrations.push(Sentry.browserTracingIntegration());
	if (environment.sentry?.replays)
	{
		integrations.push(Sentry.replayIntegration({
			minReplayDuration: environment.sentry?.replays?.minReplayDuration ?? 5000, // Default: 5000ms.
			maskAllText: environment.sentry?.replays?.maskAllText ?? true,
			maskAllInputs: environment.sentry?.replays?.maskAllInputs ?? true,
			blockAllMedia: environment.sentry?.replays?.blockAllMedia ?? true,
			networkDetailAllowUrls: [
				window.location.origin,
				"^https://(?:portal.auscope.org.au|auportal-dev.geoanalytics.group)/api/.+$"
			],
			networkRequestHeaders: [
				"Cache-Control",
				"Content-Encoding",
			],
			networkResponseHeaders: [ "Referrer-Policy" ],
		}));
	}

	Sentry.init({
		// Environment.
		dsn: environment.sentry.dsn,
		release: `${ packagejson.name }@${ environment.appVersion }`,
		environment:
			environment.appVersion.startsWith("0.0.0-dev")
				? "development"
				: (environment.production ? "production" : "staging")
		,

		// Settings.
		enableLogs: true,
		sendDefaultPii: true,

		// Integrations.
		integrations,
		...environment.sentry?.tracing,
		...environment.sentry?.replays,
	});
}

// Application bootstrapping.
Sentry.startSpan(
	{
		name: "bootstrap-angular-application",
		op: "ui.angular.bootstrap",
	},
	async () =>
	{
		await ContextService.load()
      .then(context => {
        /*
          each property of the context file is copied over to the environment object, replacing any that share the same name.
        */
        Object.keys(context).forEach(key => environment[key] = context[key]);

        if (environment.production)
          enableProdMode();

        if (environment.googleAnalyticsKey)
        {
          const gtagscript = document.createElement('script');
          gtagscript.src = 'https://www.googletagmanager.com/gtag/js?id=' + environment.googleAnalyticsKey;
          gtagscript.async = true;
          document.head.appendChild(gtagscript);
          const gtaginitscript = document.createElement('script');
          gtaginitscript.innerHTML = 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());gtag(\'config\', \'' +
          environment.googleAnalyticsKey + '\');';
          document.head.appendChild(gtaginitscript);
        }

        return platformBrowser()
          .bootstrapModule(AppModule)
          // Don't double log errors as Sentry SDK does that automatically.
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .catch(() => {})
        ;
      })
    ;
	},
)
.catch(() => console.error);

// This access token is taken from the "angular-cesium" website - you can replace it with your own one
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTY1NDYzYS01YzgxLTQ2MGUtODBiYy0zODRmY2MwOGY4MDIiLCJpZCI6MjA1LCJpYXQiOjE1MDQ3MjQ1Njh9.rKgXUKAfFiiSAm_b9T8bpsDVdj0YyZeqGxNpzLlhxpk';
window['CESIUM_BASE_URL'] = '/assets/cesium/';

/*
	To run the application under a different execution context provide a path to context
	configuration file into the ContextService.load() method below.  Or just accept the default ./contexts/context.json
*/
