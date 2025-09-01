import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CsMapObject } from './cs-map-object';
import { GeometryType } from '../../utility/constants.service';
import { isNumber } from '@turf/helpers';
import { SimplifyAP } from 'simplify-ts';
import { MapsManagerService } from '@auscope/angular-cesium';
import { UtilitiesService } from '../../utility/utilities.service';

/**
 * A wrapper around the clipboard object for use in the portal.
 */
@Injectable()
export class CsClipboardService {
  public polygonBBox: Polygon;
  public polygonsBS: BehaviorSubject<Polygon>;

  private bShowClipboard: boolean = false;
  public clipboardBS = new BehaviorSubject<boolean>(this.bShowClipboard);

  private bFilterLayers: boolean = false;
  public filterLayersBS = new BehaviorSubject<boolean>(this.bFilterLayers);

  public isDrawingPolygonBS: BehaviorSubject<boolean>;

  constructor(private csMapObject: CsMapObject, private mapsManagerService: MapsManagerService) {
    this.polygonBBox = null;
    this.polygonsBS = new BehaviorSubject<Polygon>(this.polygonBBox);
    this.polygonsBS.next(this.polygonBBox);
    this.isDrawingPolygonBS = this.csMapObject.isDrawingPolygonBS;
  }

  public toggleClipboard(open?: boolean) {
    if (open !== undefined) {
      this.bShowClipboard = open;
    } else {
      this.bShowClipboard = !this.bShowClipboard;
    }

    this.clipboardBS.next(this.bShowClipboard);
    // if no clipboard, recover the all layers list.
    if (!this.bShowClipboard) {
      this.bFilterLayers = false ;
      this.filterLayersBS.next(this.bFilterLayers );
    }
  }

  /**
   * Toggle the polygon filter layers. Can be set using optional parameter.
   *
   * @param layersOn (optional) if supplied, set the filter layers to this value
   */
  public toggleFilterLayers(layersOn?: boolean) {
    if (layersOn) {
      this.bFilterLayers = layersOn;
    } else {
      this.bFilterLayers = !this.bFilterLayers;
    }
    this.filterLayersBS.next(this.bFilterLayers);
  }

  /**
   * LatLng2LngLat
   *
   * @param latLng -20.745706568942964,121.50013367990158 .....
   * @return lngLat 121.50013367990158,-20.745706568942964 .....
   */
  public LatLng2LngLat(latLng:string):string { //
    latLng = latLng.trim().replace(/\r?\n|\r/g, ' ');
    const latLngList = latLng.split(' ');
    let lngLatList = [];
    for (let i = 0; i<latLngList.length; i++) {
      const coord = latLngList[i].split(',');
      const lat = parseFloat(coord[0]).toFixed(3);
      const lng = parseFloat(coord[1]).toFixed(3);
      if (isNumber(lng) && isNumber(lat)) {
        lngLatList.push(lng.toString() + ',' + lat.toString());
      }
    }
    return lngLatList.join(' ');
  }

  /**
   * Method for extract a polygon coords string from geometry.
   * @param geometry string
   * @returns the string of a polygon string.
   */
  public getCoordinates(geometry: string): string {
    let coordString = '';
    const gmlCoordsTagPos = geometry.indexOf('<gml:coordinates');
    if (gmlCoordsTagPos !== -1) {
      const closingGmlCoordsTagPos = geometry.indexOf('>', gmlCoordsTagPos);
      coordString = geometry.substring(closingGmlCoordsTagPos + 1, geometry.indexOf('</gml:coordinates>'));
    }
    return coordString;
  }
  

  /**
   * swap coordinates for geometry.
   * @param geometry string
   * @returns swaped geometry.
   */
  public swapGeometry(geometry:string) : string {
    const coords = this.getCoordinates(geometry);
    const swappedCoords = this.LatLng2LngLat(coords);
    const swapedGeometry = this.getGeometry(swappedCoords);
    return swapedGeometry;
  }

  /**
   * Method for construct a polygon geometry.
   * @param coords string
   * @returns the string of a polygon geometry.
   */
  public getGeometry(coords: string): any {
    return '<gml:MultiPolygon srsName=\"urn:ogc:def:crs:EPSG::4326\">' +
            '<gml:polygonMember>' +
              '<gml:Polygon srsName=\"EPSG:4326\">' +
                '<gml:outerBoundaryIs>' +
                  '<gml:LinearRing>' +
                    '<gml:coordinates xmlns:gml=\"http://www.opengis.net/gml\" decimal=\".\" cs=\",\" ts=\" \">' +
                      coords +
                    '</gml:coordinates>' +
                  '</gml:LinearRing>' +
                '</gml:outerBoundaryIs>' +
              '</gml:Polygon>' +
            '</gml:polygonMember>' +
          '</gml:MultiPolygon>';
  }

  /**
   * Method for rendering a polygon on cesium map.
   * @param coordsArray array of coords
   * @returns void.
   */
  public renderPolygon(coordsArray: Number[]) {
    this.csMapObject.renderPolygon(coordsArray);
  }

  /**
   * Method for drawing a polygon on the map.
   * @returns the polygon coordinates string BS on which the polygon is drawn on.
   */
  public drawPolygon() {
    this.csMapObject.drawPolygon().subscribe((coords) => {
     let strToday=new Date(); 
     let dt= new Date(strToday).toISOString();
     let name = 'Polygon-' + dt.slice(0,dt.lastIndexOf('.'));
      const newPolygon = {
        name: name,
        srs: 'EPSG:4326',
        geometryType: GeometryType.POLYGON,
        coordinates: this.getGeometry(coords)
      };
      this.polygonBBox = newPolygon;
      this.polygonsBS.next(this.polygonBBox);
    });
  }

  /**
   * Draw a polygon on map using a KML File
   *
   * @param file File object, contains KML polygon, assumes EPSG:4326
   */
  public loadPolygonFromKML(file: File) {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
          const kml = reader.result.toString();
          const coordsString = kml.substring(
            kml.indexOf("<coordinates>") + "<coordinates>".length,
            kml.lastIndexOf("</coordinates>")
          );
          const coordsEPSG4326LngLat = coordsString.trim().replace(/\r?\n|\r/g, ' ');
          const coordsList = coordsEPSG4326LngLat.split(' ');
          const coordsListLngLat = [];
          const coordsListLatLng = [];
          for (let i = 0; i<coordsList.length; i++) {
            const coord = coordsList[i].split(',');
            const lng = parseFloat(coord[0]).toFixed(3);
            const lat = parseFloat(coord[1]).toFixed(3);
            if (isNumber(lng) && isNumber(lat)) {
              coordsListLngLat.push(lng);
              coordsListLngLat.push(lat);
              coordsListLatLng.push(lat.toString() + ',' + lng.toString());
            }
          }
          this.renderPolygon(coordsListLngLat); //need to be [lng lat lng lat]
          const coordsEPSG4326LatLng = coordsListLatLng.join(' ');
          const newPolygon = {
            name: file.name,
            srs: 'EPSG:4326',
            geometryType: GeometryType.POLYGON,
            coordinates: this.getGeometry(coordsEPSG4326LatLng) //need to be 'lat,lng lat,lng...'
          };
          this.polygonBBox = newPolygon;
          this.polygonsBS.next(this.polygonBBox);
      };
      reader.readAsText(file);
    }
  }

  /**
   * Load a polygon on map from ROI
   *
   * @param roi roi polygon object, contains , assumes EPSG:4326
   */
  public loadPolygonFromROI(roi) {
    let coords = roi.coordinates;
    const coordsList = coords.split(' ');
    const coordsListLngLat = [];
    for (let i = 0; i < coordsList.length; i++) {
        const coord = coordsList[i].split(',');
        const lng = parseFloat(coord[1]).toFixed(3);
        const lat = parseFloat(coord[0]).toFixed(3);
        if (isNumber(lng) && isNumber(lat)) {
            coordsListLngLat.push(lng);
            coordsListLngLat.push(lat);
        }
    }
    this.renderPolygon(coordsListLngLat); //need to be [lng lat lng lat]
    this.polygonBBox = roi;
    this.polygonsBS.next(this.polygonBBox);
    return;
  }

  /**
   * Add a polygon to the clipboard, usually from a layer
   * @param newPolygon polygon object
   */
  public addPolygon(newPolygon: Polygon) {
    if (this.polygonBBox !== null && this.polygonBBox.name === newPolygon.name) {
      return;
    }

    const coordString = this.getCoordinates( newPolygon.coordinates);
    const coordsArray = coordString.split(' ');
    let coords4326ListLngLat = []; //for rendering
    let coords4326ListLatLng = []; //for polygon wms query
    if (newPolygon.srs === 'EPSG:3857') {
      for (const coords of coordsArray) {
        const lonLat = coords.split(',');
        // transform from 'EPSG:3857' to 'EPSG:4326' format
        const lonLatCoords = UtilitiesService.coordinates3857To4326(Number(lonLat[0]), Number(lonLat[1]));
        coords4326ListLngLat.push(lonLatCoords);
        coords4326ListLatLng.push([lonLatCoords[1], lonLatCoords[0]]);
      }
    } else if (newPolygon.srs === 'EPSG:4326') {
      for (const coords of coordsArray) {
        const lonLat = coords.split(',');
        const lng = parseFloat(lonLat[0]);
        const lat = parseFloat(lonLat[1]);
        if (isNumber(lng) && isNumber(lat)) { //some coord is Null
          coords4326ListLngLat.push([lng, lat]);
        }
      }
    } else {
      console.log('ERROR: addPolygon\'s layer are either EPSG3857 nor EPSG4326');
      return;
    }

    //Simplify process might reduce 90% points.
    const tolerance: number = 0.05;
    const highQuality: boolean = true;
    const simplifiedCoords4326 = SimplifyAP(coords4326ListLngLat, tolerance, highQuality);
    //
    coords4326ListLngLat = [];
    coords4326ListLatLng = [];
    for (let i = 0; i < simplifiedCoords4326.length; i++) {
      coords4326ListLngLat.push(simplifiedCoords4326[i][0]);
      coords4326ListLngLat.push(simplifiedCoords4326[i][1]);
      coords4326ListLatLng.push(simplifiedCoords4326[i][1].toString() + ',' + simplifiedCoords4326[i][0].toString());
    }

    // make newPolygon
    newPolygon.srs = 'EPSG:4326';
    newPolygon.geometryType = GeometryType.POLYGON;
    const coordsEPSG4326LatLng = coords4326ListLatLng.join(' ');
    newPolygon.coordinates = this.getGeometry(coordsEPSG4326LatLng); //need to be 'lat,lng lat,lng...';
    // save the newPolygon to polygonsBS
    this.polygonBBox = newPolygon;
    this.polygonsBS.next(this.polygonBBox);
    // show polygon on map
    this.renderPolygon(coords4326ListLngLat);
  }

  public removePolygon() {
    this.polygonsBS.next(this.polygonBBox);
  }

  public clearClipboard() {
    this.csMapObject.clearPolygon();
    this.polygonBBox = null;
    this.polygonsBS.next(this.polygonBBox);
  }

}

export interface Polygon {
  name: string;
  srs: string;
  geometryType: GeometryType;
  coordinates: string;
  raw?: string;
}
