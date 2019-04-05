import { Component, OnInit } from '@angular/core';
import {OlMapObject} from '../../portal-core-ui/service/openlayermap/ol-map-object';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-olmap-baselayerselector',
  templateUrl: './olmap.baselayerselector.component.html'
})
export class OlmapBaselayerselectorComponent implements OnInit {
  public selectedLayer = 'OSM';
  baseMapLayers: any = [];
  constructor(public olMapObject: OlMapObject) {
   }

  ngOnInit() {
    this.baseMapLayers = environment.baseMapLayers;
  }

  public updateBaseMap(selected: string) {
    this.olMapObject.switchBaseMap(selected);
  }

}
