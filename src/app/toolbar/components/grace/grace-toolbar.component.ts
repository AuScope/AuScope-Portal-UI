import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CsMapObject, CsMapService } from '@auscope/portal-core-ui';
import { MapsManagerService } from 'angular-cesium';
import { GraceService } from 'app/services/wcustom/grace/grace.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToolbarComponent } from '../../toolbar.component';
import { GraceGraphModalComponent } from './grace-graph.modal.component';

declare var Cesium: any;


@Component({
    selector: 'app-grace-toolbar',
    templateUrl: './grace-toolbar.component.html',
    styleUrls: ['./grace-toolbar.component.scss']
})
export class GraceToolbarComponent extends ToolbarComponent implements OnInit {

  timeSeriesGraphModalRef?: BsModalRef;

  DECIMAL_REGEX = '^-?\\d*\.{0,1}\\d+$';
  styleGroup: FormGroup;


  constructor(@Inject(CsMapObject)private csMapObject: CsMapObject, @Inject(CsMapService)private csMapService: CsMapService,
              private graceService: GraceService, private formBuilder: FormBuilder, private modalService: BsModalService) {
      super();
  }

  ngOnInit() {
    // Construct form from current GRACE style
    this.graceService.editedGraceStyleSettings.subscribe(graceStyleSettings => {
      this.styleGroup = this.formBuilder.group({
          minColor: graceStyleSettings.minColor,
          minValue: [graceStyleSettings.minValue, [Validators.required, Validators.pattern(this.DECIMAL_REGEX)]],
          neutralColor: graceStyleSettings.neutralColor,
          neutralValue: [graceStyleSettings.neutralValue, [Validators.required, Validators.pattern(this.DECIMAL_REGEX)]],
          maxColor: graceStyleSettings.maxColor,
          maxValue: [graceStyleSettings.maxValue, [Validators.required, Validators.pattern(this.DECIMAL_REGEX)]],
          transparentNeutralColor: graceStyleSettings.transparentNeutralColor
      });
    });
  }

  /**
   * Allows the user to select a point on the map and retrieve the time series primary mascon information for it.
   */
  public selectGraceDataPoint() {
    this.csMapObject.getPointFromClick().subscribe(point => {
      if (point) {
        this.timeSeriesGraphModalRef = this.modalService.show(GraceGraphModalComponent, {class: 'modal-lg'});
        this.timeSeriesGraphModalRef.content.x = point.longitude;
        this.timeSeriesGraphModalRef.content.y = point.latitude;
      }
    });
  }

  /**
   * Allows the user to select draw a polygon on the map and retrieve the time series primary mascon information for it.
   */
  public selectGraceDataPolygon() {
    this.csMapObject.drawPolygon().subscribe(coords => {
      if (coords) {
        // grace-api is expecting an array of lon/lat coords, e.g. [[116.13,-22.25],[119.68,-22.05],[116.96,-23.19],[116.13,-22.25]]
        const coordList = [];
        const reversedCoordList = coords.split(' ');
        for (const c of reversedCoordList) {
          const singleCoord = c.split(',');
          coordList.push([parseFloat(singleCoord[1]), parseFloat(singleCoord[0])]);
        }
        this.timeSeriesGraphModalRef = this.modalService.show(GraceGraphModalComponent, {class: 'modal-lg'});
        this.timeSeriesGraphModalRef.content.coords = coordList;
        this.timeSeriesGraphModalRef.content.centroid = '(-45.0,144.0)';
        setTimeout(() => {
          this.csMapObject.clearPolygon();
        }, 500);
      }
    });
  }

  /**
   * Update the grace layer style with the current editor settings
   */
  setStyle() {
    this.graceService.setEditedGraceStyleSettings({
      minColor: this.styleGroup.value.minColor,
      minValue: this.styleGroup.value.minValue,
      neutralColor: this.styleGroup.value.neutralColor,
      neutralValue: this.styleGroup.value.neutralValue,
      maxColor: this.styleGroup.value.maxColor,
      maxValue: this.styleGroup.value.maxValue,
      transparentNeutralColor: this.styleGroup.value.transparentNeutralColor
    });
  }

  /**
   * Check valid style inputs
   * @returns is the style valid (only valid numbers for values)
   */
  isValidStyle(): boolean {
    return this.styleGroup.valid;
  }

  /**
   * Check if layer has been added
   * @returns True if layer added
   */
  layerAdded(): boolean {
    return this.csMapService.layerExists(this.layer.id);
  }

}
