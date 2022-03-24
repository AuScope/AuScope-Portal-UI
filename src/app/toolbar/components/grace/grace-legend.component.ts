import { Component, OnInit } from '@angular/core';
import { GraceService } from '../../../services/wcustom/grace/grace.service';
import { GraceStyleSettings } from './grace-graph.models';
import { ToolbarComponent } from '../../toolbar.component';

/**
 * GRACE legend map toolbar component
 */
@Component({
    selector: 'app-grace-legend',
    templateUrl: './grace-legend.component.html',
    styleUrls: ['./grace-legend.component.scss']
})
export class GraceLegendComponent extends ToolbarComponent implements OnInit {

    graceStyleSettings: GraceStyleSettings;

    constructor(private graceService: GraceService) {
        super();
    }

    ngOnInit() {
        this.graceStyleSettings = {
            minColor: '#ff0000',
            minValue: -1,
            neutralColor: '#ffffff',
            neutralValue: 0,
            maxColor: '#0000ff',
            maxValue: 1,
            transparentNeutralColor: false
        };
        this.graceService.currentGraceStyleSettings.subscribe(graceStyleSettintgs => {
            this.graceStyleSettings = graceStyleSettintgs;
        });
    }
}
