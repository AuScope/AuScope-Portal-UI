// This file contains runtime environment settings for the local debugging profile.
// The build system defaults to this profile, but you can switch between
// profiles using the --configuration argument.

// To build with this profile run 'ng build' or just start the in memory server with 'ng serve'.

// Available build profiles and their environment files can be found in the angular configuration (angular.json).
// Note: environment files replace the default, they don't override.  So, any change in this file
// will almost always need an equivalent change in all the other environment files.

export const environment = {
  production: false,
  getCSWRecordUrl: 'getKnownLayers.do',
  getCustomLayers: 'getCustomLayers.do',
  //portalBaseUrl: 'http://localhost:8080/AuScope-Portal/', 
  portalBaseUrl: 'https://au-portal-dev.it.csiro.au/api/',
  hostUrl: 'http://localhost:4200/index.htm',
  nVCLAnalyticalUrl: 'https://aus-analytical.it.csiro.au/NVCLAnalyticalServices/',
  googleAnalyticsKey: null,
  bingMapsKey: '',
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
  ]
};
