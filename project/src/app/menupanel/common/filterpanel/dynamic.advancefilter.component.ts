
import { ref } from '../../../../environments/ref';
import { LayerModel } from '../../../portal-core-ui/model/data/layer.model';
import { CapdfAdvanceFilterComponent } from './advance/capdf/capdf.advancefilter.component';
import { Input, Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'app-advance-filter',
   template: `<div #dynamicAdvanceFilterPlaceholder></div>`
})


export class DynamicAdvancefilterComponent {
  @Input() _layer: LayerModel;
  @Output() advanceparam: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('dynamicAdvanceFilterPlaceholder', {read: ViewContainerRef})
  dyanmicAnalyticHost: ViewContainerRef;


  constructor(private componentFactoryResolver: ComponentFactoryResolver, private changeDetectorRef: ChangeDetectorRef) { }

   @Input()
  set layer(layer: LayerModel) {
    this._layer = layer;
    if (this._layer) {
      this.loadComponent();
    }
  }



  loadComponent() {

    if (!ref.advanceFilter[this._layer.id]) {
      return;
    }

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ref.advanceFilter[this._layer.id]);

    const viewContainerRef = this.dyanmicAnalyticHost
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);

    (<CapdfAdvanceFilterComponent>componentRef.instance).layer = this._layer;
    (<CapdfAdvanceFilterComponent>componentRef.instance).advanceparamBS.subscribe(response => {
      this.advanceparam.emit(response);
    })

    this.changeDetectorRef.detectChanges();


  }

}
