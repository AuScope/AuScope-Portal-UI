import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../lib/portal-core-ui/model/data/onlineresource.model';
import { Component, Input, ViewChild, ViewContainerRef, OnChanges, Type } from '@angular/core';
import { ref } from '../../../environments/ref';
import { QuerierInfoModel } from '../../lib/portal-core-ui/model/data/querierinfo.model';
import { MSCLComponent } from './customanalytic/mscl/mscl.component';

@Component({
  selector: 'app-custom-analytic',
  template: `<div #dynamicContentAnalyticPlaceholder></div>`,
  standalone: false
})


export class DynamicAnalyticComponent implements OnChanges {
  @Input() layer!: LayerModel;
  @Input() onlineResource!: OnlineResourceModel;
  @Input() featureId!: string;
  @Input() doc!: QuerierInfoModel;
  private _load!: boolean;
  @ViewChild('dynamicContentAnalyticPlaceholder', { read: ViewContainerRef, static: true })
  dynamicAnalyticHost!: ViewContainerRef;

  @Input()
  set load(load: boolean) {
    this._load = load;
    if (this._load) {
      this.loadComponent();
    }
  }


  ngOnChanges() {
    // Show Value from Parent
    if (this._load) {
      this.loadComponent();
    }
  }

  loadComponent() {

    const viewContainerRef = this.dynamicAnalyticHost
    viewContainerRef.clear();
    // Default to MSCLComponent
    const component = this.layer.id in ref.analytic ? ref.analytic[this.layer.id as keyof typeof ref.analytic] : MSCLComponent;
    const componentRef = viewContainerRef.createComponent(component as Type<any>);
    componentRef.setInput('layer', this.layer);
    componentRef.setInput('onlineResource', this.onlineResource);
    componentRef.setInput('featureId', this.featureId);
    componentRef.setInput('doc', this.doc);
  }

}
