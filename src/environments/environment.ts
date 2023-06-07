// This file contains runtime environment settings for the local debugging profile.
// The build system defaults to this profile, but you can switch between
// profiles using the --configuration argument.

// To build with this profile run 'ng build' or just start the in memory server with 'ng serve'.

// Available build profiles and their environment files can be found in the angular configuration (angular.json).
// Note: environment files replace the default, they don't override.  So, any change in this file
// will almost always need an equivalent change in all the other environment files.

export const environment = {
  production: false,
  getCSWRecordEndP: 'getKnownLayers.do',
  //portalBaseUrl: 'http://localhost:8080/AuScope-Portal/',
  //portalBaseUrl: 'http://localhost:8080/api/',
  portalBaseUrl: 'https://au-portal-dev.it.csiro.au/api/',
  portalProxyUrl: '/api/',
  authBaseUrl: 'https://au-portal-dev.it.csiro.au/api/',
  hostUrl: 'http://localhost:4200',
  nVCLAnalyticalUrl: 'https://nvclanalytics.azurewebsites.net/NVCLAnalyticalServices/',
  googleAnalyticsKey: null,
  bingMapsKey: '',
  baseMapLayers: [
    { value: 'World_Imagery', viewValue: 'ESRI World Imagery', tooltip: 'ESRI World Imagery', layerType: 'ESRI' },
    { value: 'NatGeo_World_Map', viewValue: 'ESRI National Geographic Map', tooltip: 'ESRI National Geographic Map', layerType: 'ESRI' },
    { value: 'World_Street_Map', viewValue: 'ESRI Street Map', tooltip: 'ESRI Street Map', layerType: 'ESRI' },
    { value: 'OSM', viewValue: 'OpenStreetMap',
      tooltip: 'OpenStreetMap (OSM) is a collaborative project to create a free editable\n' +
               'map of the world.\nhttp://www.openstreetmap.org', layerType: 'OSM' },
    // Bing maps will only be available if the bingMapsKey property is set
    { value: 'Road', viewValue: 'Bing Roads', tooltip: 'Bing Maps Road', layerType: 'Bing' },
    { value: 'Aerial', viewValue: 'Bing Aerial', tooltip: 'Bing Maps Aerial', layerType: 'Bing' },
    { value: 'AerialWithLabels', viewValue: 'Bing Aerial With Labels', tooltip: 'Bing Maps Aerial with Labels', layerType: 'Bing' }
  ],
  grace: {
    hostUrl: 'https://insargrace.geoanalytics.csiro.au:/grace/grace'
  },
  urlNeedProxy: ['http://ogc-jdlc.curtin.edu.au:80',
                'https://geossdi.dmp.wa.gov.au',
                'https://geology.data.vic.gov.au',
                'http://geology.data.vic.gov.au',
                'http://geoserver.octopusdata.org']
}
