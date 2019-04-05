import {Injectable, Inject} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import olProj from 'ol/proj';
import { OlMapObject } from './ol-map-object';
import olLayerVector from 'ol/layer/vector';
import { Constants } from '../../../portal-core-ui/utility/constants.service';

/**
 * A wrapper around the clipboard object for use in the portal.
 */
@Injectable()
export class OlClipboardService {
  private polygonBBox: Polygon;
  public polygonsBS: BehaviorSubject<Polygon>;

  public vectorOnMap: olLayerVector;

  private bShowClipboard: Boolean = false;
  public clipboardBS = new BehaviorSubject<Boolean>(this.bShowClipboard);

  private bFilterLayers: Boolean = false;
  public filterLayersBS = new BehaviorSubject<Boolean>(this.bFilterLayers);

  constructor(private olMapObject: OlMapObject) {
    this.vectorOnMap = null;
    this.polygonBBox = null;
    this.polygonsBS = new BehaviorSubject<Polygon>(this.polygonBBox);
    this.polygonsBS.next(this.polygonBBox);
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

  public toggleFilterLayers() {
    this.bFilterLayers = !this.bFilterLayers ;
    this.filterLayersBS.next(this.bFilterLayers );
  }
  public getGeometry(coords: String): any {
    const geometry = '<gml:MultiPolygon srsName=\"urn:ogc:def:crs:EPSG::3857\">' +
    '<gml:polygonMember>' +
    '<gml:Polygon srsName=\"EPSG:3857\">' +
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
    return geometry;
  }
  /**
  * Method for drawing a polygon on the map.
  * @returns the polygon coordinates string BS on which the polygon is drawn on.
  */
  public drawPolygon() {
    this.olMapObject.drawPolygon().subscribe(
        (vector) => {
          const coords = vector.get('polygonString');
          if ( coords ) {
            const newPolygon = {name: 'manual-' + Math.floor(Math.random() * 1000), srs: 'EPSG:3857',
                geometryType: Constants.geometryType.POLYGON, coordinates: this.getGeometry(coords), olvector: vector};
            this.polygonBBox = newPolygon;
            this.polygonsBS.next(this.polygonBBox);
            if (this.vectorOnMap) {
              this.olMapObject.removeVector(this.vectorOnMap);
            }
            this.vectorOnMap = vector;
          }
      });
  }
  public renderPolygon() {
    if (this.vectorOnMap) {
      this.olMapObject.removeVector(this.vectorOnMap);
    }
    if (this.polygonBBox) {
      this.olMapObject.renderPolygon(this.polygonBBox).subscribe(
        (vector) => {
          this.vectorOnMap = vector;
        });
    }
  }

  public addPolygon(newPolygon: Polygon) {
    if (this.polygonBBox !== null && this.polygonBBox.name === newPolygon.name) {
      return;
    }
    if (newPolygon.geometryType !== Constants.geometryType.MULTIPOLYGON) {
      const coordsArray = newPolygon.coordinates.split(' ');
      const coords = [];
      // transform from 'EPSG:4326'to 'EPSG:3857' format
      for (let i = 0; i < coordsArray.length; i += 2) {
        const point = olProj.transform([parseFloat(coordsArray[i]), parseFloat(coordsArray[i + 1])], newPolygon.srs , 'EPSG:3857');
        coords.push({'x': point[0], 'y': point[1]});
      }
      newPolygon.srs = 'EPSG:3857';
      // make newPolygon
      const newPolygonString = coords.join(' ');
      newPolygon.coordinates = newPolygonString;
    }
    // save the newPolygon to polygonsBS
    this.polygonBBox = newPolygon;
    this.polygonsBS.next(this.polygonBBox);
    // show polygon on map
    this.renderPolygon();

  }

  public removePolygon() {
    this.polygonsBS.next(this.polygonBBox);
  }

  public clearClipboard() {
    this.polygonBBox = null;
    this.polygonsBS.next(this.polygonBBox);
    if (this.vectorOnMap) {
      this.olMapObject.removeVector(this.vectorOnMap);
    }
    this.vectorOnMap = null;
  }
}

export interface Polygon {
  name: string,
  srs: string,
  geometryType: string,
  coordinates: string,
  raw?: string,
  olvector?: olLayerVector
}
