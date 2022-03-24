// This file contains runtime environment settings for the prod (http://portal.it.csiro.au) profile.
// The build system defaults to the local profile which uses `environment.ts`, but you can switch between
// profiles using the --configuration argument.

// To us this prod profile run `ng build --configuration=prod`.

// Available build profiles and their environment files can be found in the angular configuration (angular.json).
// Note: environment files replace the default, they don't override.  So, any change in this file
// will almost always need an equivalent change in all the other environment files.


export const environment = {
  production: true,
  getCSWRecordEndP: 'getKnownLayers.do',
  portalBaseUrl: 'http://portal.auscope.org.au/api/',
  hostUrl: 'http://portal.auscope.org.au/index.htm',
  nVCLAnalyticalUrl: 'https://aus-analytical.it.csiro.au/NVCLAnalyticalServices/',
  googleAnalyticsKey: null,
  bingMapsKey: 'Bing_Maps_Key',
  baseMapLayers: [
    { value: 'World_Imagery', viewValue: 'ESRI World Imagery', tooltip: 'ESRI World Imagery', layerType: 'ESRI' },
    { value: 'NatGeo_World_Map', viewValue: 'ESRI National Geographic Map', tooltip: 'ESRI National Geographic Map', layerType: 'ESRI' },
    { value: 'World_Street_Map', viewValue: 'ESRI Street Map', tooltip: 'ESRI Street Map', layerType: 'ESRI' },
    { value: 'OSM', viewValue: 'OpenStreetMap',
      tooltip: 'OpenStreetMap (OSM) is a collaborative project to create a free editable\n' +
               'map of the world.\nhttp://www.openstreetmap.org', layerType: 'OSM' },
    { value: 'Road', viewValue: 'Bing Roads', tooltip: 'Bing Maps Road', layerType: 'Bing' },
    { value: 'Aerial', viewValue: 'Bing Aerial', tooltip: 'Bing Maps Aerial', layerType: 'Bing' },
    { value: 'AerialWithLabels', viewValue: 'Bing Aerial With Labels', tooltip: 'Bing Maps Aerial with Labels', layerType: 'Bing' },
    { value: 'Natural_Earth_II', viewValue: 'Natural Earth II',
      tooltip: 'Natural Earth II, darkened for contrast.\nhttp://www.naturalearthdata.com/', layerType: 'NEII' },
  ],
  grace: {
    hostUrl: 'https://insargrace.geoanalytics.csiro.au:/grace/grace'
  }
};
