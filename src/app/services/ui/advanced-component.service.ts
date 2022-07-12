import { ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef } from '@angular/core';
import { LayerModel } from '@auscope/portal-core-ui';
import { AdvancedMapComponent } from 'app/cesium-map/advanced/advanced-map.component';
import { AdvancedFilterComponent } from 'app/menupanel/common/filterpanel/advance/advanced-filter.component';
import { ref } from '../../../environments/ref';

/**
 * Service for adding and removing advanced map components
 */
@Injectable({ providedIn: 'root' })
export class AdvancedComponentService {

  private mapViewContainerRef: ViewContainerRef;
  private mapComponents: Map<string, ComponentRef<AdvancedMapComponent>[]> = new Map<string, ComponentRef<AdvancedMapComponent>[]>();

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  /**
   * Set the ViewContainerRef for map widgets
   *
   * @param viewContainerRef map widget ViewContainerRef
   */
   public setMapWidgetViewContainerRef(viewContainerRef: ViewContainerRef) {
    this.mapViewContainerRef = viewContainerRef;
  }

  /**
   * Add AdvancedMapComponents to map when associated layer is added
   *
   * @param layer the layer the component is associated with
   */
   public addAdvancedMapComponents(layer: LayerModel) {
    if (ref.advancedMapComponent && layer.id in ref.advancedMapComponent) {
      // Remove any existing components (addLayer may be called again to change style so removeLayer may not have been called)
      this.removeAdvancedMapComponents(layer.id);
      this.mapComponents.set(layer.id, []);
      for (const mapComponent of ref.advancedMapComponent[layer.id]) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory<AdvancedMapComponent>(mapComponent);
        const componentRef: ComponentRef<AdvancedMapComponent> = this.mapViewContainerRef.createComponent<AdvancedMapComponent>(componentFactory);
        componentRef.instance.layer = layer;
        const compArray = this.mapComponents.get(layer.id);
        compArray.push(componentRef);
        this.mapComponents.set(layer.id, compArray);
      }
    }
  }

  /**
   * Add advanced filter component to filter panel, usually on FilterPanel init
   *
   * @param layer layer to add
   * @param layerFilterPanelViewContainerRef the view container ref for the filter panel
   */
   public addAdvancedFilterComponents(layer: LayerModel, layerFilterPanelViewContainerRef: ViewContainerRef) {
    if (ref.advancedFilter && layer.id in ref.advancedFilter) {
      for (const advancedFilter of ref.advancedFilter[layer.id]) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory<AdvancedFilterComponent>(advancedFilter);
        const componentRef: ComponentRef<AdvancedFilterComponent> = layerFilterPanelViewContainerRef.createComponent<AdvancedFilterComponent>(componentFactory);
        componentRef.instance.layer = layer;
      }
    }
  }

  /**
   * Remove any advanced map components that are associated with the provided layer
   *
   * @param layerId the ID of the layer being removed from the map advanced component list
   */
  public removeAdvancedMapComponents(layerId: string) {
    if (this.mapComponents.has(layerId)) {
      for (const comp of this.mapComponents.get(layerId)) {
        comp.destroy();
      }
    }
    this.mapComponents.set(layerId, []);
  }

}
