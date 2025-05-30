import { LayerModel } from '@auscope/portal-core-ui';
import { Component, Input, ViewChild, ComponentFactoryResolver, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import {ref} from '../../../environments/ref';
import { LayerAnalyticInterface } from './layer.analytic.interface';

@Component({
    selector: 'app-dynamic-layer-analytic',
    template: `<div #dynamicLayerContentAnalyticPlaceholder></div>`,
    standalone: false
})


export class DynamicLayerAnalyticComponent {
  private _layer: LayerModel;
  @ViewChild('dynamicLayerContentAnalyticPlaceholder', { read: ViewContainerRef, static: true })
  dynamicAnalyticHost: ViewContainerRef;


  constructor(private componentFactoryResolver: ComponentFactoryResolver, private changeDetectorRef: ChangeDetectorRef ) { }


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


    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ref.layeranalytic[this._layer.id]);

    const viewContainerRef = this.dynamicAnalyticHost
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);

    (<LayerAnalyticInterface>componentRef.instance).layer = this._layer;



    this.changeDetectorRef.detectChanges();

  }

}
