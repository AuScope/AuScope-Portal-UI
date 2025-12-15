import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../lib/portal-core-ui/model/data/onlineresource.model';
import { NVCLDatasetListComponent } from './customanalytic/nvcl/nvcl.datasetlist.component';
import { Component, Input, ViewChild, ViewContainerRef, ChangeDetectorRef, OnChanges } from '@angular/core';
import { ref } from '../../../environments/ref';
import { QuerierInfoModel } from '../../lib/portal-core-ui/model/data/querierinfo.model';
import { RemanentAnomaliesComponent } from './customanalytic/RemanentAnomalies/remanentanomalies.component';
import { TIMAComponent } from './customanalytic/tima/tima.component';
import { MSCLComponent } from './customanalytic/mscl/mscl.component';

@Component({
    selector: 'app-custom-analytic',
    template: `<div #dynamicContentAnalyticPlaceholder></div>`,
    standalone: false
})


export class DynamicAnalyticComponent implements OnChanges {
  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  @Input() doc: QuerierInfoModel;
  private _load: boolean;
  @ViewChild('dynamicContentAnalyticPlaceholder', { read: ViewContainerRef, static: true })
  dynamicAnalyticHost: ViewContainerRef;


  constructor(private changeDetectorRef: ChangeDetectorRef) { }

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
    const component = this.layer.id in ref.analytic? ref.analytic[this.layer.id]: MSCLComponent;
    const componentRef = viewContainerRef.createComponent(component);

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


    //this.changeDetectorRef.detectChanges();

  }

}
