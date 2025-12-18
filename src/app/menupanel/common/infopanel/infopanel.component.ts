import { Component, Input, ViewChild, ElementRef, inject } from '@angular/core';
import { CSWRecordModel } from '../../../lib/portal-core-ui/model/data/cswrecord.model';
import { LayerModel } from '../../../lib/portal-core-ui/model/data/layer.model';
import { LayerStatusService } from '../../../lib/portal-core-ui/utility/layerstatus.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'app-info-panel',
    templateUrl: './infopanel.component.html',
    providers: [LayerStatusService],
    styleUrls: ['../../menupanel.scss', './infopanel.component.scss'],
    standalone: false
})

export class InfoPanelComponent {
    activeModal = inject(NgbActiveModal);
    layerStatus = inject(LayerStatusService);

    @Input() cswRecords: CSWRecordModel[];
    @Input() layer: LayerModel;
    @Input() expanded: boolean;
    @ViewChild('subPanelElement') subPanelElement: ElementRef;

}
