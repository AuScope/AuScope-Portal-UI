import { Component, ViewChild, ElementRef, inject } from '@angular/core';
import { LayerStatusService } from '../../../lib/portal-core-ui/utility/layerstatus.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
    selector: 'app-info-panel',
    templateUrl: './infopanel.component.html',
    providers: [LayerStatusService],
    styleUrls: ['../../menupanel.scss', './infopanel.component.scss'],
    standalone: false
})

export class InfoPanelComponent {
    dialogRef = inject(MatDialogRef<InfoPanelComponent>);
    /**
     * Input data:
     *   cswRecords: CSWRecordModel[];
      *  layer: LayerModel;
      *  expanded: boolean;
      *  showRecordAddButton = true;
     */
    data = inject(MAT_DIALOG_DATA);
    layerStatus = inject(LayerStatusService);

    @ViewChild('subPanelElement') subPanelElement: ElementRef;

}
