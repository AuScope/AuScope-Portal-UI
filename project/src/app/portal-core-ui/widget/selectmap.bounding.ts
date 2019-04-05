
import {map} from 'rxjs/operators';
import { Bbox } from '../model/data/bbox.model';
import { LayerModel } from '../model/data/layer.model';
import { OnlineResourceModel } from '../model/data/onlineresource.model';
import { LayerHandlerService } from '../service/cswrecords/layer-handler.service';
import { Constants } from '../utility/constants.service';
import { Component, ElementRef, AfterViewInit, ViewChild, Output, EventEmitter, Input, Inject } from '@angular/core';
import olMap from 'ol/map';
import olTile from 'ol/layer/tile';
import olOSM from 'ol/source/osm';
import olView from 'ol/view';
import olSourceVector from 'ol/source/vector';
import olLayerVector from 'ol/layer/vector';
import olDraw from 'ol/interaction/draw';
import olControl from 'ol/control';
import olProj from 'ol/proj';
import {BehaviorSubject,  Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import olTileWMS from 'ol/source/tilewms';

@Component({
  selector: 'app-map-bbox',
   template: `
    <div #mapselectboundingbox id="mapselectboundingbox" style="width: inherit;height: inherit;"></div>
    <button style="top: -32px;position: relative;" (click)="selectBbox()">
    <i class="fa fa-pencil-square-o fa-2x" aria-hidden="true"></i></button>`
})
export class SelectMapBoundingComponent implements AfterViewInit {

  @ViewChild('mapselectboundingbox') mapElement: ElementRef;
  public map;
  public vector;
  @Input() layer: LayerModel;
  @Input() defaultzoom: number;
  @Input() defaultlatlon: [number, number];
  @Output() selectedbbox: EventEmitter<any> = new EventEmitter<any>();

  constructor(private http: HttpClient, @Inject('env') private env, private layerHandlerService: LayerHandlerService) {

  }

  // After view init the map target can be set!
  ngAfterViewInit() {

    const osm_layer: any = new olTile({
      source: new olOSM()
    });
    this.map = new olMap({
      controls: olControl.defaults({
          attributionOptions: ({
            collapsible: false
          })
        }),
      layers: [osm_layer],
      view: new olView({
        center: this.defaultlatlon,
        zoom: this.defaultzoom
      })
    });

    this.map.setTarget(this.mapElement.nativeElement.id);

    const contrColl = this.map.getControls();

    for (const i = 0; i < contrColl.getLength(); ) {
      this.map.removeControl(contrColl.item(i));
    }

    this.addLayer();
  }

  public selectBbox() {
     this.drawBox().subscribe((vector) => {
      const features = vector.getSource().getFeatures();
      const me = this;
      // Go through this array and get coordinates of their geometry.
      features.forEach(function(feature) {
        const bbox = new Bbox();
        bbox.crs = 'EPSG:4326';
        const bbox4326 = feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326');
        bbox.eastBoundLongitude = bbox4326.getExtent()[2];
        bbox.westBoundLongitude = bbox4326.getExtent()[0];
        bbox.northBoundLatitude = bbox4326.getExtent()[3];
        bbox.southBoundLatitude = bbox4326.getExtent()[1];
        me.selectedbbox.emit(bbox);
      });

    });
  }

  public drawBox(): BehaviorSubject<olLayerVector> {

    if (this.vector) {
      this.map.removeLayer(this.vector);
    }

    const source = new olSourceVector({wrapX: false});

    this.vector = new olLayerVector({
      source: source
    });

    const vectorBS = new BehaviorSubject<olLayerVector>(this.vector);

    this.map.addLayer(this.vector);
    const draw = new olDraw({
      source: source,
      type: /** @type {ol.geom.GeometryType} */ ('Circle'),
      geometryFunction: olDraw.createBox()
    });
    const me = this;
    draw.on('drawend', function() {
       me.map.removeInteraction(draw);
      setTimeout(function() {
        vectorBS.next(me.vector);
      }, 500);
    });
    this.map.addInteraction(draw);
    return vectorBS;
  }

  private getSldBody(sldUrl: string, param?: any): Observable<any> {
    if (!sldUrl) {
       return Observable.create(observer => {
         observer.next(null);
         observer.complete();
       });
    }


    return this.http.get(this.env.portalBaseUrl + sldUrl, {
      responseType: 'text'
    }).pipe(map(response => {
      return response;
    }));
  }

  private addLayer() {
    const me = this;
    const wmsOnlineResources = this.layerHandlerService.getWMSResource(this.layer);

    for (const wmsOnlineResource of wmsOnlineResources) {

      this.getSldBody(this.layer.proxyStyleUrl).subscribe(response => {
        const me = this;
        const params = wmsOnlineResource.version.startsWith('1.3') ?
          this.getWMS1_3_0param(this.layer, wmsOnlineResource, response) :
          this.getWMS1_1param(this.layer, wmsOnlineResource, response);


        let wmsTile;

        let defaultExtent;

        const cswExtent = wmsOnlineResource.geographicElements[0];
        defaultExtent = olProj.transformExtent([cswExtent.westBoundLongitude, cswExtent.southBoundLatitude,
        cswExtent.eastBoundLongitude, cswExtent.northBoundLatitude], 'EPSG:4326', 'EPSG:3857');


        wmsTile = new olTile({
          extent: defaultExtent,
          source: new olTileWMS({
            url: wmsOnlineResource.url,
            params: params,
            serverType: 'geoserver',
            projection: 'EPSG:4326'
          })
        });

        this.map.addLayer(wmsTile);
      });

    }
  }

  /**
   * get wms 1.3.0 related parameter
   * @param layers the wms layer
   * @param sld_body associated sld_body
   */
  public getWMS1_3_0param(layer: LayerModel, onlineResource: OnlineResourceModel, sld_body?: string): any {
    const params = {
      // VT: if the parameter contains featureType, it mean we are targeting a different featureType e.g capdf layer
      'LAYERS':  onlineResource.name,
      'TILED': true,
      'DISPLAYOUTSIDEMAXEXTENT': true,
      'FORMAT': 'image/png',
      'TRANSPARENT': true,
      'VERSION': '1.3.0',
      'WIDTH': Constants.TILE_SIZE,
      'HEIGHT': Constants.TILE_SIZE
    };


    params['sld_body'] = sld_body;

    return params;

  }

  /**
   * get wms 1.1.0 related parameter
   * @param layers the wms layer
   * @param sld_body associated sld_body
   */
  public getWMS1_1param(layer: LayerModel, onlineResource: OnlineResourceModel, sld_body?: string): any {
    const params = {
      // VT: if the parameter contains featureType, it mean we are targeting a different featureType e.g capdf layer
      'LAYERS': onlineResource.name,
      'TILED': true,
      'DISPLAYOUTSIDEMAXEXTENT': true,
      'FORMAT': 'image/png',
      'TRANSPARENT': true,
      'VERSION': '1.1.1',
      'WIDTH': Constants.TILE_SIZE,
      'HEIGHT': Constants.TILE_SIZE
    };

      params['sld_body'] = sld_body;

    return params;

  }
}
