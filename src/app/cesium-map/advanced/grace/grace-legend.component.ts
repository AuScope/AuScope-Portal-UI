import { Component, OnInit } from '@angular/core';
import { GraceService } from '../../../services/wcustom/grace/grace.service';
import { AdvancedMapComponent } from '../advanced-map.component';
import { GraceStyleSettings } from '../../../modalwindow/querier/customanalytic/grace/grace-graph.models';

/**
 * GRACE legend advanced map component
 */
@Component({
    selector: 'app-grace-legend',
    templateUrl: './grace-legend.component.html',
    styleUrls: ['./grace-legend.component.scss']
})
export class GraceLegendComponent extends AdvancedMapComponent implements OnInit {

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
        this.graceService.currentGraceStyleSettingsBS.subscribe(graceStyleSettings => {
            this.graceStyleSettings = graceStyleSettings;
        });
    }

}
