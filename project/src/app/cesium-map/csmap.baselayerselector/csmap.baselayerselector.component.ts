import { Component, OnInit } from '@angular/core';
import {CsMapObject} from 'portal-core-ui';
import { environment } from '../../../environments/environment';

// TODO: Convert to a cesium component

@Component({
  selector: 'app-csmap-baselayerselector',
  templateUrl: './csmap.baselayerselector.component.html',
  styleUrls: ['./csmap.baselayerselector.component.css']

})
export class CsMapBaseLayerSelectorComponent implements OnInit {
  
  public selectedLayer = 'OSM';
  baseMapLayers: any = [];
  constructor(public csMapObject: CsMapObject) {
   }

  ngOnInit() {
    this.baseMapLayers = environment.baseMapLayers;
  }

  public updateBaseMap(selected: string) {
    // this.olMapObject.switchBaseMap(selected);
  }

}
