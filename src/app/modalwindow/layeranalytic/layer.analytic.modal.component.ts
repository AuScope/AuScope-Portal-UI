
import { Component, inject } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';



@Component({
    selector: 'app-layer-modal-window',
    templateUrl: './layer.analytic.modal.component.html',
    standalone: false
})

export class LayerAnalyticModalComponent {
  bsModalRef = inject(BsModalRef);

  public analyticMap;
  public layer: LayerModel;


}
