import { animate, style, transition, trigger } from '@angular/animations';
import { CsClipboardService, Polygon } from '@auscope/portal-core-ui';
import { Component, OnInit } from '@angular/core';
import { isNumber } from '@turf/helpers';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-cs-clipboard',
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-50px)' }),
        animate('150ms', style({ opacity: 1, transform: 'translateY(2px)' })),
      ]),
      transition(':leave', [
        animate('150ms', style({ opacity: 0, transform: 'translateY(-50px)' })),
      ]),
    ]),
  ],
  templateUrl: './csmap.clipboard.component.html',
  styleUrls: ['./csmap.clipboard.component.scss'],
})

export class CsMapClipboardComponent implements OnInit {
  buttonText = 'clipboard';
  polygonBBox: Polygon;
  bShowClipboard: boolean;
  public isFilterLayerShown: boolean;
  public isDrawingPolygon: boolean;
  kmlFileName = '';


  constructor(private csClipboardService: CsClipboardService) {
    this.polygonBBox = null;
    this.isFilterLayerShown = false;
    this.csClipboardService.filterLayersBS.subscribe(filterLayerStatus => {
      this.isFilterLayerShown = filterLayerStatus;
    });
    this.csClipboardService.isDrawingPolygonBS.subscribe(drawingPolygon => {
      this.isDrawingPolygon = drawingPolygon;
    });
  }

  ngOnInit(): void {
    this.csClipboardService.clipboardBS.subscribe(
      (show) => {
        this.bShowClipboard = show;
    });

    this.csClipboardService.polygonsBS.subscribe(
      (polygonBBox) => {
        this.polygonBBox = polygonBBox;
    });
  }
  
  onKmlFileSave(event) {
    const csvData = 'Name;Description;Address1;Address2;City;State/Province/Region;ZIP/PostalCode;Country\nFirst Address;This place is not real;aaaa;;bbbbb;ee;333333333;Italy\nSecond Place;;Via Roma 10;;Belluno;;;;;\n A Random Place in Venice;;Campiello del Spezier;;Venice;VE;30135;\n';

    if (this.polygonBBox === null) return;

    const coordsEPSG4326LngLat = this.csClipboardService.getCoordinates(this.polygonBBox.coordinates);
    // Lingbo: Need to swap from [Lng,Lat Lng,Lat] to [Lat,Lng Lat,Lng]
    let coordsListLngLat = [];
    let coordsListLatLng = [];
    const coordsList = coordsEPSG4326LngLat.split(' ');        

    for (let i = 0; i<coordsList.length; i++) {
      const coord = coordsList[i].split(',')
      const lng = parseFloat(coord[0]).toFixed(3);
      const lat = parseFloat(coord[1]).toFixed(3)
      if (isNumber(lng) && isNumber(lat)) {
        coordsListLngLat.push(lng);
        coordsListLngLat.push(lat);
        coordsListLatLng.push(lat.toString() + ',' + lng.toString())
      }
    } 
    const coordsEPSG4326LatLng = coordsListLatLng.join(' ');

    //console.log(coordsEPSG4326LatLng);
    //149.096503,-31.845448 149.821601,-31.124050 
    const kmlHeader = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>' + 
                      '<kml xmlns=\"http://www.opengis.net/kml/2.2\">' + 
                      '<Document><name>My document</name><description>Content</description>' +
                      '<Style id=\"markerstyle\"><IconStyle><Icon><href>http://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png</href></Icon></IconStyle></Style>' +
                      '<Placemark><name>NAME</name><description>YES</description><styleUrl>#Path</styleUrl>' +
                      '<Polygon><tessellate>1</tessellate><altitudeMode>clampToGround</altitudeMode><outerBoundaryIs><LinearRing><coordinates>';
    const kmlTail = '</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>';
    var blob = new Blob([kmlHeader,coordsEPSG4326LatLng,kmlTail], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "Ap-Polygon.kml");  
  }

  onKmlFileSelected(event) {

    const file:File = event.target.files[0];

    if (file) {
      this.csClipboardService.loadPolygonFromKML(file);
    }
  }

  clearClipboard() {
    this.csClipboardService.clearClipboard();
  }

  public toggleFilterLayers() {
    this.csClipboardService.toggleFilterLayers();
  }

  /**
   * Draw a polygon layer to map
   *
   */
  public drawPolygon(): void {
    this.csClipboardService.drawPolygon();
  }

  getPolygonBBoxs(): string {
    return this.polygonBBox.coordinates;
  }

  toggleEditor() {
    this.csClipboardService.toggleClipboard();
  }

}
