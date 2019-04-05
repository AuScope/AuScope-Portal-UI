// This file contains runtime environment settings for the prod (http://portal.it.csiro.au) profile.
// The build system defaults to the local profile which uses `environment.ts`, but you can switch between
// profiles using the --configuration argument.

// To us this prod profile run `ng build --configuration=prod`.

// Available build profiles and their environment files can be found in the angular configuration (angular.json).
// Note: environment files replace the default, they don't override.  So, any change in this file
// will almost always need an equivalent change in all the other environment files.


export const environment = {
  production: true,
  getCSWRecordUrl: 'getKnownLayers.do',
  getCustomLayers: 'getCustomLayers.do',
  portalBaseUrl: 'http://portal.auscope.org/api/',
  hostUrl: 'http://portal.auscope.org/index.htm',
  nVCLAnalyticalUrl: 'http://aus-analytical.it.csiro.au/NVCLAnalyticalServices/',
  googleAnalyticsKey: 'UA-33658784-1',
  baseMapLayers: [
    { value: 'OSM', viewValue: 'OpenStreetMap', layerType: 'OSM' }
  ]
};
