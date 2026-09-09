import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { Component, Input, ViewChild, ViewContainerRef, ChangeDetectorRef, inject } from '@angular/core';
import { ref } from '../../../environments/ref';
import { LayerAnalyticInterface } from './layer.analytic.interface';

@Component({
    selector: 'app-dynamic-layer-analytic',
    template: `<div #dynamicLayerContentAnalyticPlaceholder></div>`,
    standalone: false
})
export class DynamicLayerAnalyticComponent {
  private changeDetectorRef = inject(ChangeDetectorRef);

  private _layer!: LayerModel;
  @ViewChild('dynamicLayerContentAnalyticPlaceholder', { read: ViewContainerRef, static: true })
  dynamicAnalyticHost!: ViewContainerRef;


  @Input()
  set layer(layer: LayerModel) {
    this._layer = layer;
    if (this._layer) {
      this.loadComponent();
    }
  }

  /**
   * dyanmically load component based on the configuration in the ref file
   */
  loadComponent() {
    const component = ref.layeranalytic[this._layer.id as keyof typeof ref.layeranalytic];
    const viewContainerRef = this.dynamicAnalyticHost;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(component);
    (<LayerAnalyticInterface>componentRef.instance).layer = this._layer;
    this.changeDetectorRef.detectChanges();
  }

}
