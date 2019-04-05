import { LayerModel } from '../../portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../portal-core-ui/model/data/onlineresource.model';
import { NVCLDatasetListComponent } from './customanalytic/nvcl/nvcl.datasetlist.component';
import { Component, Input, ViewChild, ComponentFactoryResolver, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import {ref} from '../../../environments/ref';
import { QuerierInfoModel } from '../../portal-core-ui/model/data/querierinfo.model';
import { RemanentAnomaliesComponent } from './customanalytic/RemanentAnomalies/remanentanomalies.component';
import { TIMAComponent } from './customanalytic/tima/tima.component';

@Component({
  selector: 'app-custom-analytic',
   template: `<div #dynamicContentAnalyticPlaceholder></div>`
})


export class DynamicAnalyticComponent {
  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  @Input() doc: QuerierInfoModel;
  private _load: boolean;
  @ViewChild('dynamicContentAnalyticPlaceholder', {read: ViewContainerRef})
  dyanmicAnalyticHost: ViewContainerRef;


  constructor(private componentFactoryResolver: ComponentFactoryResolver, private changeDetectorRef: ChangeDetectorRef ) { }

  @Input()
  set load(load: boolean) {
    this._load = load;
    if (this._load) {
      this.loadComponent();
    }
  }

  loadComponent() {


    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(ref.analytic[this.layer.id]);

    const viewContainerRef = this.dyanmicAnalyticHost
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);

    (<NVCLDatasetListComponent>componentRef.instance).layer = this.layer;
    (<NVCLDatasetListComponent>componentRef.instance).onlineResource = this.onlineResource;
    (<NVCLDatasetListComponent>componentRef.instance).featureId = this.featureId;

    (<TIMAComponent>componentRef.instance).layer = this.layer;
    (<TIMAComponent>componentRef.instance).onlineResource = this.onlineResource;
    (<TIMAComponent>componentRef.instance).featureId = this.featureId;
    (<TIMAComponent>componentRef.instance).doc = this.doc;

    (<RemanentAnomaliesComponent>componentRef.instance).layer = this.layer;
    (<RemanentAnomaliesComponent>componentRef.instance).onlineResource = this.onlineResource;
    (<RemanentAnomaliesComponent>componentRef.instance).featureId = this.featureId;
    (<RemanentAnomaliesComponent>componentRef.instance).doc = this.doc;


    this.changeDetectorRef.detectChanges();


  }

}
