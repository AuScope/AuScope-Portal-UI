import { Injectable } from '@angular/core';

declare var window: any;
declare var XPathResult: any;
/**
 * Constances
 */
@Injectable()
export class Constants {

     public static resourceType = {
        WMS: 'WMS',
        WFS: 'WFS',
        WCS: 'WCS',
        WWW: 'WWW',
        OPeNDAP : 'OPeNDAP',
        FTP : 'FTP',
        SOS : 'SOS',
        IRIS : 'IRIS',
        CSWService : 'CSWService',
        NCSS : 'NCSS',
        UNSUPPORTED : 'Unsupported',
        OTHERS: 'OTHERS'
    };

     public static WMSVersion = {
        '1.1.1': '1.1.1',
        '1.1.0': '1.1.0',
        '1.3.0': '1.3.0'
    };

     public static geometryType = {
        'POINT': 'POINT',
        'LINESTRING': 'LINESTRING',
        'POLYGON': 'POLYGON',
        'MULTIPOLYGON': 'MULTIPOLYGON'
    };


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


    // Centre of Australia in EPSG:3857
    public static CENTRE_COORD: [number, number] = [14793316.706200, -2974317.644633];
    public static paddlesList = [['http://maps.google.com/mapfiles/kml/paddle/blu-blank.png', 'blue'],
    ['http://maps.google.com/mapfiles/kml/paddle/blu-square.png', 'blue'],
    ['http://maps.google.com/mapfiles/kml/paddle/blu-circle.png', 'blue'],
    ['http://maps.google.com/mapfiles/kml/paddle/blu-diamond.png', 'blue'],
    ['http://maps.google.com/mapfiles/kml/paddle/grn-blank.png', 'green'],
    ['http://maps.google.com/mapfiles/kml/paddle/grn-diamond.png', 'green'],
    ['http://maps.google.com/mapfiles/kml/paddle/grn-circle.png', 'green'],
    ['http://maps.google.com/mapfiles/kml/paddle/ltblu-blank.png', '#7faaef'],
    ['http://maps.google.com/mapfiles/kml/paddle/ltblu-diamond.png', '#7faaef'],
    ['http://maps.google.com/mapfiles/kml/paddle/pink-blank.png', '#e248c9'],
    ['http://maps.google.com/mapfiles/kml/paddle/pink-square.png', '#e248c9'],
    ['http://maps.google.com/mapfiles/kml/paddle/purple-square.png', '#813ddb'],
    ['http://maps.google.com/mapfiles/kml/paddle/red-diamond.png', 'red'],
    ['http://maps.google.com/mapfiles/kml/paddle/red-stars.png', 'red'],
    ['http://maps.google.com/mapfiles/kml/paddle/wht-square.png', 'white'],
    ['http://maps.google.com/mapfiles/kml/paddle/ylw-blank.png', 'yellow'],
    ['http://maps.google.com/mapfiles/kml/paddle/ylw-diamond.png', 'yellow'],
    ['http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png', 'yellow'],
    ['http://maps.google.com/mapfiles/kml/paddle/orange-blank.png', 'orange'],
    ['http://maps.google.com/mapfiles/kml/paddle/purple-blank.png', 'purple'],
    ['http://maps.google.com/mapfiles/kml/paddle/purple-circle.png', 'purple']];
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
