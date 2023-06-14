import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CsMapObject, CsMapService } from '@auscope/portal-core-ui';
import { GraceService } from 'app/services/wcustom/grace/grace.service';
import { GraceGraphModalComponent } from 'app/modalwindow/querier/customanalytic/grace/grace-graph.modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AdvancedFilterDirective } from '../advanced-filter.directive';
import { GraceStyleSettings } from 'app/modalwindow/querier/customanalytic/grace/grace-graph.models';

@Component({
    templateUrl: './grace-advanced-filter.component.html',
    styleUrls: ['./grace-advanced-filter.component.scss']
  })
  export class GraceAdvancedFilterComponent extends AdvancedFilterDirective implements OnInit {

    timeSeriesGraphModalRef?: BsModalRef;

    DECIMAL_REGEX = '^-?\\d*\.{0,1}\\d+$';
    styleGroup: UntypedFormGroup;


    constructor(@Inject(CsMapObject)private csMapObject: CsMapObject, @Inject(CsMapService)private csMapService: CsMapService,
                private graceService: GraceService, private formBuilder: UntypedFormBuilder, private modalService: BsModalService) {
        super();
    }

    ngOnInit() {
        // Construct form current GRACE style
        this.styleGroup = this.formBuilder.group({
            minColor: this.graceService.currentGraceStyleSettings.minColor,
            minValue: [this.graceService.currentGraceStyleSettings.minValue, [Validators.required, Validators.pattern(this.DECIMAL_REGEX)]],
            neutralColor: this.graceService.currentGraceStyleSettings.neutralColor,
            neutralValue: [this.graceService.currentGraceStyleSettings.neutralValue, [Validators.required, Validators.pattern(this.DECIMAL_REGEX)]],
            maxColor: this.graceService.currentGraceStyleSettings.maxColor,
            maxValue: [this.graceService.currentGraceStyleSettings.maxValue, [Validators.required, Validators.pattern(this.DECIMAL_REGEX)]],
            transparentNeutralColor: this.graceService.currentGraceStyleSettings.transparentNeutralColor
        });
    }

    /**
     * Update the StyleGroup with the current GRACE style
     */
    private updateStyleGroup() {
        const graceStyleSettings = this.graceService.currentGraceStyleSettings;
        this.styleGroup.controls['minColor'].setValue(graceStyleSettings.minColor);
        this.styleGroup.controls['neutralColor'].setValue(graceStyleSettings.neutralColor);
        this.styleGroup.controls['maxColor'].setValue(graceStyleSettings.maxColor);
        this.styleGroup.controls['minValue'].setValue(graceStyleSettings.minValue);
        this.styleGroup.controls['neutralValue'].setValue(graceStyleSettings.neutralValue);
        this.styleGroup.controls['maxValue'].setValue(graceStyleSettings.maxValue);
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
    setEditedStyleAsCurrent() {
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
     * Change detection for the edited GRACE style
     * @param editKey the key of the StyleGroup that was changed
     */
    editedStyleChanged(editKey: string) {
        const editVal = this.styleGroup.controls[editKey].value;
        this.graceService.updateEditedGraceStyleSettings(editKey, editVal)
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

    /**
     * Override the abstract method so we can grab params from the GraceService
     *
     * @returns current style settings
     */
    public getAdvancedParams(): GraceStyleSettings {
        this.graceService.setCurrentGraceStyleSettings(this.graceService.editedGraceStyleSettings);
        return this.graceService.currentGraceStyleSettings;
    }

    /**
     * Set advanced parameters, overrideen from superclass to allow setting GRACE styles on load
     *
     * @param params the GraceStyleSettings parameters
     */
    public setAdvancedParams(params: any) {
        this.graceService.setEditedGraceStyleSettings(params);
        this.graceService.setCurrentGraceStyleSettings(params);
        this.updateStyleGroup();
    }

    /**
     * GRACE layers require a custom SLD_BODY parameter
     *
     * @returns the SLD_BODY parameter
     */
    public getCallParams(): any {
        return {
            'sld_body': this.graceService.getGraceSld()
        }
    }

}
