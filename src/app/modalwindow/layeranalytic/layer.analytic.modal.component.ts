
import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { LayerModel } from '@auscope/portal-core-ui';



@Component({
    selector: 'app-layer-modal-window',
    templateUrl: './layer.analytic.modal.component.html',
    standalone: false
})

export class LayerAnalyticModalComponent {
  public analyticMap;
  public layer: LayerModel;


  constructor(public bsModalRef: BsModalRef) {

  }


}
