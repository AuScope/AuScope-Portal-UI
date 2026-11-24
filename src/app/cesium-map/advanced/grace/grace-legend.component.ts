import { Component, OnInit, effect, inject } from '@angular/core';
import { GraceService } from '../../../services/wcustom/grace/grace.service';
import { AdvancedMapComponent } from '../advanced-map.component';
import { GraceStyleSettings } from '../../../modalwindow/querier/customanalytic/grace/grace-graph.models';

/**
 * GRACE legend advanced map component
 */
@Component({
  selector: 'app-grace-legend',
  templateUrl: './grace-legend.component.html',
  styleUrls: ['./grace-legend.component.scss'],
  standalone: false
})
export class GraceLegendComponent extends AdvancedMapComponent implements OnInit {
  private graceService = inject(GraceService);
  graceStyleSettings!: GraceStyleSettings;

  constructor() {
    super();
    effect(() => {
      this.graceStyleSettings = this.graceService.currentGraceStyleSettings();
    });
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
  }

}
