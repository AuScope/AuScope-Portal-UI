import { ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';
import { ToolbarComponent, ToolbarType } from 'app/toolbar/toolbar.component';
import { ref } from '../../../environments/ref';

/**
 * Service for adding and removing filter panel and map toolbar components
 */
@Injectable({ providedIn: 'root' })
export class ToolbarComponentsService {

  private mapToolbarViewContainerRef: ViewContainerRef;
  private addedMapToolbars: Map<string, ComponentRef<ToolbarComponent>[]> = new Map<string, ComponentRef<ToolbarComponent>[]>();

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  /**
   * Set the ViewContainerRef for map widgets
   *
   * @param viewContainerRef map widget ViewContainerRef
   */
   public setMapWidgetViewContainerRef(viewContainerRef: ViewContainerRef) {
    this.mapToolbarViewContainerRef = viewContainerRef;
  }

  /**
   * Add toolbar component to filter panel, usually on FilterPanel init
   *
   * @param layer layer to add
   * @param layerFilterPanelViewContainerRef the view container ref for the filter panel
   */
  public addFilterPanelToolbarComponents(layer: LayerModel, layerFilterPanelViewContainerRef: ViewContainerRef) {
    if (ref.toolbar && layer.id in ref.toolbar) {
      for (const filterToolbar of ref.toolbar[layer.id].filter(t => t.type === ToolbarType.FilterPanel)) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory<ToolbarComponent>(filterToolbar.component);
        const componentRef: ComponentRef<ToolbarComponent> = layerFilterPanelViewContainerRef.createComponent<ToolbarComponent>(componentFactory);
        componentRef.instance.layer = layer;
      }
    }
  }

  /**
   * Add ToolbarComponent map toolbars, usually when layer is added to map
   *
   * @param layer the layer the toolbar is associated with
   */
   public addMapToolbarComponents(layer: LayerModel) {
    if (ref.toolbar && layer.id in ref.toolbar) {
      // Remove any existing components (addLayer may be called again to change style so removeLayer may not have been called)
      this.removeMapToolbarComponents(layer.id);
      this.addedMapToolbars.set(layer.id, []);
      for (const mapToolbar of ref.toolbar[layer.id].filter(t => t.type === ToolbarType.Map)) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory<ToolbarComponent>(mapToolbar.component);
        const componentRef: ComponentRef<ToolbarComponent> = this.mapToolbarViewContainerRef.createComponent<ToolbarComponent>(componentFactory);
        componentRef.instance.layer = layer;
        const compArray = this.addedMapToolbars.get(layer.id);
        compArray.push(componentRef);
        this.addedMapToolbars.set(layer.id, compArray);
      }
    }
  }

  /**
   * Remove any toolbar components that are associated with the provided layer
   *
   * @param layerId the ID of the layer being removed from the map toolbar list
   */
  public removeMapToolbarComponents(layerId: string) {
    if (this.addedMapToolbars.has(layerId)) {
      for (const comp of this.addedMapToolbars.get(layerId)) {
        comp.destroy();
      }
    }
    this.addedMapToolbars.set(layerId, []);
  }

}
