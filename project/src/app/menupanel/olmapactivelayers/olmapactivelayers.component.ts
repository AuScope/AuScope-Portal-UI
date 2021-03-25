import { Component} from '@angular/core';
import { OlMapService ,LayerModel} from '@auscope/portal-core-ui';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: '[app-olmapactivelayers]',
  templateUrl: './olmapactivelayers.component.html',
  styleUrls: ['../menupanel.scss']
})


export class OlmapactivelayersComponent {

  opacityStatus=new Map();
  
  constructor(private olMapService: OlMapService) {}

  /**
   * Get active layers
  */
  public getActiveLayers(): LayerModel[] {

    const layers: LayerModel[] = [];
    const keys = Object.keys(this.olMapService.getLayerModelList());
    for (let i = 0; i < keys.length; i++) {
        let currentLayer = this.olMapService.getLayerModelList()[keys[i]];
        layers.push(currentLayer);
    }
    this.updateOpacityStatue(layers);
    
    return layers;
  }

  /**
   * Update the opacity status 
   *
   * @param layers list of active layers
   */
  updateOpacityStatue(layers){
    for (var i = 0; i < layers.length; i++) {
      if (!this.opacityStatus.has(layers[i].id)) 
        this.opacityStatus.set(layers[i].id, {show:false , opacity:100});
    }
  }

  /**
   * Remove the layer 
   *
   * @layerId layerId ID of LayerModel
   */
  removelayer(layerId): void {
    let layerModelList=this.olMapService.getLayerModelList()
    if (layerModelList.hasOwnProperty(layerId)) {
      this.olMapService.removeLayer(layerModelList[layerId]);
    }
  }

  /**
   * Layer opacity slider change event
  */
  layerOpacityChange(event: MatSliderChange, layerId: string) {
    this.olMapService.setLayerOpacity(layerId, (event.value / 100));
  }


  /**
   * Toggle to display the opacity widget
   * @layerId layerId ID of LayerModel
  */
  toggleOpacity(layerId){
    if (this.opacityStatus.has(layerId)) 
      this.opacityStatus.get(layerId).show=!this.opacityStatus.get(layerId).show;
  }

}
 
