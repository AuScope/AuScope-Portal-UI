import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../lib/portal-core-ui/model/data/onlineresource.model';
import { NVCLDatasetListComponent } from './customanalytic/nvcl/nvcl.datasetlist.component';
import { Component, Input, ViewChild, ViewContainerRef, ChangeDetectorRef, OnChanges, inject } from '@angular/core';
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
  private changeDetectorRef = inject(ChangeDetectorRef);

  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  @Input() doc: QuerierInfoModel;
  private _load: boolean;
  @ViewChild('dynamicContentAnalyticPlaceholder', { read: ViewContainerRef, static: true })
  dynamicAnalyticHost: ViewContainerRef;

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

    (<NVCLDatasetListComponent>componentRef.instance).data.layer = this.layer;
    (<NVCLDatasetListComponent>componentRef.instance).data.onlineResource = this.onlineResource;
    (<NVCLDatasetListComponent>componentRef.instance).data.featureId = this.featureId;

    (<TIMAComponent>componentRef.instance).data.layer = this.layer;
    (<TIMAComponent>componentRef.instance).data.onlineResource = this.onlineResource;
    (<TIMAComponent>componentRef.instance).data.featureId = this.featureId;
    (<TIMAComponent>componentRef.instance).data.doc = this.doc;

    (<RemanentAnomaliesComponent>componentRef.instance).data.layer = this.layer;
    (<RemanentAnomaliesComponent>componentRef.instance).data.onlineResource = this.onlineResource;
    (<RemanentAnomaliesComponent>componentRef.instance).data.featureId = this.featureId;
    (<RemanentAnomaliesComponent>componentRef.instance).data.doc = this.doc;

    (<MSCLComponent>componentRef.instance).data.layer = this.layer;
    (<MSCLComponent>componentRef.instance).data.onlineResource = this.onlineResource;
    (<MSCLComponent>componentRef.instance).data.featureId = this.featureId;
    (<MSCLComponent>componentRef.instance).data.doc = this.doc;


    //this.changeDetectorRef.detectChanges();

  }

}
