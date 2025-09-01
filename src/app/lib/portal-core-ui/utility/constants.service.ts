import { Injectable } from '@angular/core';

declare var window: any;
declare var XPathResult: any;

export enum ResourceType {
  CSWService = "CSWService",
  FTP = "FTP",
  IRIS = "IRIS",
  KMZ = "KMZ",
  KML = "KML",
  NCSS = "NCSS",
  OPeNDAP = "OPeNDAP",
  OTHERS = 'OTHERS',
  SOS = "SOS",
  UNSUPPORTED = 'Unsupported',
  VMF = "VMF",
  WMS = "WMS",
  WFS = "WFS",
  WCS = "WCS",
  WWW = "WWW",
  GEOJSON = "GEOJSON"
}

export enum GeometryType {
  POINT = "POINT",
  LINESTRING = "LINESTRING",
  POLYGON = "POLYGON",
  MULTIPOLYGON = "MULTIPOLYGON"
};
  

/**
 * Constants
 */
// @dynamic
@Injectable()
export class Constants {

    public static analyticLoader = {
        'capdf-hydrogeochem' : 'views/analytic/capdf-hydrogeochem.htm',
        'pressuredb-borehole' : 'views/analytic/pressureDb.htm'
    };

    public static rendererLoader = {
        'nvcl-borehole': 'WFSService',
        'gsml-borehole': 'WFSService',
        'mineral-tenements' : 'WMSService'
    };

    public static XPATH_STRING_TYPE = (window.XPathResult ? XPathResult.STRING_TYPE : 0);

    public static XPATH_UNORDERED_NODE_ITERATOR_TYPE = (window.XPathResult ? XPathResult.UNORDERED_NODE_ITERATOR_TYPE : 1);

    public static smallScreenTest = '(max-width: 658px)';

    public static TILE_SIZE = 256;

    public static WMSMAXURLGET = 1850;

    // Map coordinates are in this projection system
    public static MAP_PROJ = 'EPSG:3857';

    // Centre of Australia in EPSG:3857
    public static CENTRE_COORD: [number, number] = [14793316.706200, -2974317.644633];

    public static PROXY_API = 'getViaProxy.do';

    public static paddlesList = [['https://maps.google.com/mapfiles/kml/paddle/blu-blank.png', 'blue'],
    ['https://maps.google.com/mapfiles/kml/paddle/blu-square.png', 'blue'],
    ['https://maps.google.com/mapfiles/kml/paddle/blu-circle.png', 'blue'],
    ['https://maps.google.com/mapfiles/kml/paddle/blu-diamond.png', 'blue'],
    ['https://maps.google.com/mapfiles/kml/paddle/grn-blank.png', 'green'],
    ['https://maps.google.com/mapfiles/kml/paddle/grn-diamond.png', 'green'],
    ['https://maps.google.com/mapfiles/kml/paddle/grn-circle.png', 'green'],
    ['https://maps.google.com/mapfiles/kml/paddle/ltblu-blank.png', '#7faaef'],
    ['https://maps.google.com/mapfiles/kml/paddle/ltblu-diamond.png', '#7faaef'],
    ['https://maps.google.com/mapfiles/kml/paddle/pink-blank.png', '#e248c9'],
    ['https://maps.google.com/mapfiles/kml/paddle/pink-square.png', '#e248c9'],
    ['https://maps.google.com/mapfiles/kml/paddle/purple-square.png', '#813ddb'],
    ['https://maps.google.com/mapfiles/kml/paddle/red-diamond.png', 'red'],
    ['https://maps.google.com/mapfiles/kml/paddle/red-stars.png', 'red'],
    ['https://maps.google.com/mapfiles/kml/paddle/wht-square.png', 'white'],
    ['https://maps.google.com/mapfiles/kml/paddle/ylw-blank.png', 'yellow'],
    ['https://maps.google.com/mapfiles/kml/paddle/ylw-diamond.png', 'yellow'],
    ['https://maps.google.com/mapfiles/kml/paddle/ylw-circle.png', 'yellow'],
    ['https://maps.google.com/mapfiles/kml/paddle/orange-blank.png', 'orange'],
    ['https://maps.google.com/mapfiles/kml/paddle/purple-blank.png', 'purple'],
    ['https://maps.google.com/mapfiles/kml/paddle/purple-circle.png', 'purple']];

    public static getRandomPaddle(): string {
      const random = Math.floor(Math.random() * Constants.paddlesList.length);
      return Constants.paddlesList[random][0];
    }

    public static getMatchingPolygonColor(iconUrl: string): string {
      for (const list of Constants.paddlesList) {
        if (iconUrl === list[0]) {
          return list[1];
        }
      }
      return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
    }
}
