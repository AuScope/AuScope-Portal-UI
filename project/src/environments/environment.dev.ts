// This file contains runtime environment settings for the dev (http://au-portal-dev.it.csiro.au) profile.
// The build system defaults to the local profile which uses `environment.ts`, but you can switch between
// profiles using the --configuration argument.

// To us this dev profile run `ng build --configuration=audev`.

// Available build profiles and their environment files can be found in the angular configuration in `angular.json`.
// Note: environment files replace the default, they don't override.  So, any change in this file
// will almost always need an equivalent change in all the other environment files.


export const environment = {
  production: false,
  getCSWRecordUrl: 'getKnownLayers.do',
  getCustomLayers: 'getCustomLayers.do',
  portalBaseUrl: 'http://au-portal-dev.it.csiro.au/api/',
  hostUrl: 'http://au-portal-dev.it.csiro.au/portal/index.htm',
  nVCLAnalyticalUrl: 'http://aus-analytical.it.csiro.au/NVCLAnalyticalServices/',
  googleAnalyticsKey: 'UA-33658784-3',
  baseMapLayers: [
    { value: 'OSM', viewValue: 'OpenStreetMap', layerType: 'OSM' },
    { value: 'Road', viewValue: 'Bing Roads', layerType: 'Bing' },
    { value: 'Aerial', viewValue: 'Bing Aerial', layerType: 'Bing' },
    { value: 'AerialWithLabels', viewValue: 'Bing Aerial With Labels', layerType: 'Bing' },
    { value: 'World_Topo_Map', viewValue: 'ESRI World Topographic', layerType: 'ESRI' },
    { value: 'World_Imagery', viewValue: 'ESRI World Imagery', layerType: 'ESRI' },
    { value: 'Reference/World_Boundaries_and_Places', viewValue: 'ESRI World Imagery With Labels', layerType: 'ESRI' },
    { value: 'NatGeo_World_Map', viewValue: 'ESRI National Geographic Map', layerType: 'ESRI' },
    { value: 'World_Terrain_Base', viewValue: 'ESRI Terrain Base', layerType: 'ESRI' },
    { value: 'World_Street_Map', viewValue: 'ESRI Street Map', layerType: 'ESRI' },
    { value: 'Canvas/World_Dark_Gray_Base', viewValue: 'ESRI Dark Gray', layerType: 'ESRI' },
    { value: 'Canvas/World_Light_Gray_Base', viewValue: 'ESRI Light Gray', layerType: 'ESRI' },
    { value: 'h', viewValue: 'Google Road Names', layerType: 'Google' },
    { value: 'm', viewValue: 'Google Road Map', layerType: 'Google' },
    { value: 's', viewValue: 'Google Satellite', layerType: 'Google' },
    { value: 'y', viewValue: 'Google Satellite & Roads', layerType: 'Google' },
    { value: 't', viewValue: 'Google Terrain', layerType: 'Google' },
    { value: 'p', viewValue: 'Google Terrain & Roads', layerType: 'Google' },
    { value: 'r', viewValue: 'Google Road without Building', layerType: 'Google' }
  ]
};
