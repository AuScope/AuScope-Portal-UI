import { CsMapService, CSWRecordModel } from '@auscope/portal-core-ui';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ViewerConfiguration } from '@auscope/angular-cesium';
import { CsMapComponent } from 'app/cesium-map/csmap.component';
import { Cartesian3, Color, ColorMaterialProperty, MapMode2D, PolygonHierarchy, Viewer } from 'cesium';


@Component({
    selector: 'app-cesium-preview-map',
    template: `
    <ac-map>
        <div id="previewMapElement" #previewMapElement></div>
    </ac-map>
    `,
    providers: [ViewerConfiguration],
    standalone: false
})
export class CesiumMapPreviewComponent {

    @ViewChild('previewMapElement', { static: true }) mapElement: ElementRef;
    viewer: Viewer;

    BBOX_HIGHLIGHT_COLOUR = new ColorMaterialProperty(Color.YELLOW.withAlpha(0.25));
    BBOX_STANDARD_COLOUR = new ColorMaterialProperty(Color.BLUE.withAlpha(0.25));
    POINT_OFFSET_AMOUNT = 0.01;

    // 114.591, -45.837, 148.97, -5.73
    AUS_POLYGON = new PolygonHierarchy(Cartesian3.fromDegreesArray([
        114.591, -45.837, 148.97, -45.837, 148.97, -5.73, 114.591, -5.73, 114.591, -45.837
    ]));

    // Keep track of overall bounding box
    minWest: number;
    maxEast: number;
    minSouth: number;
    maxNorth: number;

    /**
     * This constructor creates the preview map
     */
    constructor(private csMapService: CsMapService, private viewerConf: ViewerConfiguration) {
        // viewerOptions will be passed the Cesium.Viewer constuctor
        this.viewerConf.viewerOptions = {
            selectionIndicator: false,
            timeline: false,
            infoBox: false,
            fullscreenButton: false,
            baseLayerPicker: true,
            imageryProviderViewModels: this.csMapService.createBaseMapLayers(),
            terrainProviderViewModels: [],
            animation: false,
            shouldAnimate: false,
            homeButton: false,
            geocoder: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            mapMode2D: MapMode2D.INFINITE_SCROLL,
        };
        // Will be called on viewer initialistion
        this.viewerConf.viewerModifier = (viewer: any) => {
            this.viewer = viewer;
            // Look at Australia
            viewer.camera.setView({
                destination: CsMapComponent.AUSTRALIA
            });
            // This reduces the blockiness of the text fonts and other graphics
            this.viewer.resolutionScale = window.devicePixelRatio;
        }
    }

    /**
     * Add a bbox to the map
     * @param name the name of the bbox
     * @param coords an array of lon/lat coords [west, south, east, north]
     */
    addBbox(record: CSWRecordModel, coords: number[]) {
        // Adjust overall bounding box values
        if (!this.minWest || coords[0] < this.minWest) {
            this.minWest = coords[0];
        }
        if (!this.minSouth || coords[1] < this.minSouth) {
            this.minSouth = coords[1];
        }
        if (!this.maxEast || coords[2] > this.maxEast) {
            this.maxEast = coords[2];
        }
        if (!this.maxNorth || coords[3] > this.maxNorth) {
            this.maxNorth = coords[3];
        }

        if (this.minWest === this.maxEast && this.minSouth === this.maxNorth) {
            // If min/max lon and min/max lat are equal, add point, not poly
            this.viewer.entities.add({
                name: record.name,
                id: record.id,
                position: Cartesian3.fromDegrees(this.minWest, this.minSouth),
                point: {
                    pixelSize: 5,
                    color: Color.WHITE,
                    outlineColor: Color.BLACK,
                    outlineWidth: 2,
                }
            });
        } else {
            // Add bbox polygon
            this.viewer.entities.add({
                name: record.name,
                id: record.id,
                polygon: {
                    hierarchy: new PolygonHierarchy(Cartesian3.fromDegreesArray([
                        coords[0], coords[1],
                        coords[2], coords[1],
                        coords[2], coords[3],
                        coords[0], coords[3],
                        coords[0], coords[1]
                    ])),
                    height: 0,
                    material: this.BBOX_STANDARD_COLOUR,
                    outline: true,
                    outlineColor: Color.BLACK
                }
            });
        }
    }

    /**
     * Determine the min/max bounds of the added bboxes and fit view to these
     */
    fitMap() {
        let fitPolygon = this.AUS_POLYGON;

        if (this.minWest === this.maxEast) {
            if (this.maxEast !== 180 && this.maxEast + this.POINT_OFFSET_AMOUNT < 180) {
                this.maxEast = this.maxEast + this.POINT_OFFSET_AMOUNT;
            } else {
                this.minWest = this.minWest - this.POINT_OFFSET_AMOUNT;
            }
        }
        if (this.minSouth === this.maxNorth) {
            if (this.minSouth > -90 && this.minSouth - this.POINT_OFFSET_AMOUNT > -90) {
                this.minSouth = this.minSouth - this.POINT_OFFSET_AMOUNT;
            } else {
                this.maxNorth = this.maxNorth + this.POINT_OFFSET_AMOUNT;
            }
        }

        if (this.minWest && this.minWest !== -180 && this.maxEast && this.maxEast !== 180 &&
            this.minSouth && this.minSouth !== -90 && this.maxNorth && this.maxNorth !== 90 ) {
            fitPolygon = new PolygonHierarchy(Cartesian3.fromDegreesArray([
                this.minWest, this.minSouth,
                this.maxEast, this.minSouth,
                this.maxEast, this.maxNorth,
                this.minWest, this.maxNorth,
                this.minWest, this.minSouth
            ]));
        }
        // Can't zoomTo Entities that aren't added to map, so add invisible, zoom then delete
        this.viewer.entities.add({
            id: 'temp-bbox',
            show: false,
            polygon: {
                hierarchy: fitPolygon
            }
        });
        const bboxEntity = this.viewer.entities.getById('temp-bbox');
        this.viewer.zoomTo(bboxEntity).then(() => {
            this.viewer.entities.removeById('temp-bbox');
        });
    }

    /**
     * Highlights or unhighlights a bounding box in the preview map
     *
     * @param id the ID of the CSW record associated with the bbox
     * @param state if true will highlight bounding box, else will unhighlight it
     */
    setBBoxHighlight(id: string, state: boolean) {
        const entity = this.viewer.entities.getById(id);
        // No entity will be returned for world coverage layers as no bbox is shown
        if (entity) {
            entity.polygon.material = state ? this.BBOX_HIGHLIGHT_COLOUR : this.BBOX_STANDARD_COLOUR;
        }
    }

}
