// This file contains runtime environment settings for the local debugging profile.
// The build system defaults to this profile, but you can switch between
// profiles using the --configuration argument.

// To build with this profile run 'ng build' or just start the in memory server with 'ng serve'.

// Available build profiles and their environment files can be found in the angular configuration (angular.json).
// Note: environment files replace the default, they don't override.  So, any change in this file
// will almost always need an equivalent change in all the other environment files.

import { isDevMode } from "@angular/core";
import { random } from "lodash";
import packagejson from '../../package.json';


export const environment = {
  production: false,
  getCSWRecordEndP: 'getKnownLayers.do',
  portalBaseUrl: 'https://auportal-dev.geoanalytics.group/api/',
  portalProxyUrl: '/api/',
  authBaseUrl: 'https://auportal-dev.geoanalytics.group/api/',
  hostUrl: 'http://localhost:4200',
  nVCLAnalyticalUrl: 'https://nvclanalytics.azurewebsites.net/NVCLAnalyticalServices/',
  googleAnalyticsKey: null,
  bingMapsKey: '',
  baseMapLayers: [
    { value: 'World_Imagery', viewValue: 'ESRI World Imagery', tooltip: 'ESRI World Imagery', layerType: 'ESRI' },
    { value: 'NatGeo_World_Map', viewValue: 'ESRI National Geographic Map', tooltip: 'ESRI National Geographic Map', layerType: 'ESRI' },
    { value: 'World_Street_Map', viewValue: 'ESRI Street Map', tooltip: 'ESRI Street Map', layerType: 'ESRI' },
    // OSM does not work with Chrome and Edge (See AUS-4296)
    //{ value: 'OSM', viewValue: 'OpenStreetMap', tooltip: 'OpenStreetMap (OSM) is a collaborative project to create a free editable\n' +
    //          'map of the world.\nhttp://www.openstreetmap.org', layerType: 'OSM' },
    // Bing maps will only be available if the bingMapsKey property is set
    { value: 'Road', viewValue: 'Bing Roads', tooltip: 'Bing Maps Road', layerType: 'Bing' },
    { value: 'Aerial', viewValue: 'Bing Aerial', tooltip: 'Bing Maps Aerial', layerType: 'Bing' },
    { value: 'AerialWithLabels', viewValue: 'Bing Aerial With Labels', tooltip: 'Bing Maps Aerial with Labels', layerType: 'Bing' }
  ],
  grace: {
    hostUrl: 'https://insargrace.geoanalytics.csiro.au:/grace/grace'
  },
  urlNeedProxy: [
    'http://ogc-jdlc.curtin.edu.au:80',
    'https://geossdi.dmp.wa.gov.au',
    'https://geology.data.vic.gov.au',
    'http://geology.data.vic.gov.au',
    'http://geoserver.octopusdata.org'
  ],

  appVersion: isDevMode() ? `0.0.0-dev+${ random(9999) }` : packagejson.version,

  // Sentry configuration.
  sentry: {
    dsn: "https://e4c14bee42771399619e105ffc2c574d@o4510231275700224.ingest.us.sentry.io/4510231765254144",
    enableUserErrorReporting: true,
		tracing: {
			tracesSampleRate: 1.0,
			tracePropagationTargets: [ "http://localhost:4200/*", "https://auportal-dev.geoanalytics.group/api/*" ],
		},
		replays: {
			replaysSessionSampleRate: 1,
			replaysOnErrorSampleRate: .1,
			minReplayDuration: 10000,
			maskAllText: false,
			maskAllInputs: false,
			blockAllMedia: false,
		},
	},
}
