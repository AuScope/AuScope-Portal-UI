import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CSWRecordModel, LayerModel, LayerStatusService } from '@auscope/portal-core-ui';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'info-panel',
    templateUrl: './infopanel.component.html',
    providers: [LayerStatusService],
    styleUrls: ['../../menupanel.scss', './infopanel.component.scss'],
    standalone: false
})

export class InfoPanelComponent {
    @Input() cswRecords: CSWRecordModel[];
    @Input() layer: LayerModel;
    @Input() expanded: boolean;
    @ViewChild('subPanelElement') subPanelElement: ElementRef;

    constructor(public activeModal: NgbActiveModal, public layerStatus: LayerStatusService) {
    }

}
