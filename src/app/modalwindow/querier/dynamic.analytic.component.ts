import { LayerModel } from '@auscope/portal-core-ui';
import { OnlineResourceModel } from '@auscope/portal-core-ui';
import { NVCLDatasetListComponent } from './customanalytic/nvcl/nvcl.datasetlist.component';
import { Component, Input, ViewChild, ViewContainerRef, ChangeDetectorRef } from '@angular/core';
import {ref} from '../../../environments/ref';
import { QuerierInfoModel } from '@auscope/portal-core-ui';
import { RemanentAnomaliesComponent } from './customanalytic/RemanentAnomalies/remanentanomalies.component';
import { TIMAComponent } from './customanalytic/tima/tima.component';
import { MSCLComponent } from './customanalytic/mscl/mscl.component';

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
  @ViewChild('dynamicContentAnalyticPlaceholder', { read: ViewContainerRef, static: true })
  dyanmicAnalyticHost: ViewContainerRef;


  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  @Input()
  set load(load: boolean) {
    this._load = load;
    if (this._load) {
      this.loadComponent();
    }
  }

  loadComponent() {

    const viewContainerRef = this.dyanmicAnalyticHost
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(ref.analytic[this.layer.id]);

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

    (<MSCLComponent>componentRef.instance).layer = this.layer;
    (<MSCLComponent>componentRef.instance).onlineResource = this.onlineResource;
    (<MSCLComponent>componentRef.instance).featureId = this.featureId;
    (<MSCLComponent>componentRef.instance).doc = this.doc;

    this.changeDetectorRef.detectChanges();


  }

}
