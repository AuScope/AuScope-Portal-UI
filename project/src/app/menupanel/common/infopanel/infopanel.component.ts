import { Component, Input, ViewChild, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { point, featureCollection, polygon } from '@turf/helpers';
import * as center from '@turf/center';
import * as envelope from '@turf/envelope';
import { CSWRecordModel } from '../../../portal-core-ui/model/data/cswrecord.model';
import { LayerModel } from '../../../portal-core-ui/model/data/layer.model';
import { LayerHandlerService } from '../../../portal-core-ui/service/cswrecords/layer-handler.service';
import { OlMapPreviewComponent } from './openlayermappreview/olmap.preview.component';
import olProj from 'ol/proj';



@Component({
    selector: 'info-panel',
    templateUrl: './infopanel.component.html',
    styleUrls: ['../../menupanel.scss']
})

export class InfoPanelComponent implements OnChanges {
    @Input() cswRecords: CSWRecordModel[];
    @Input() layer: LayerModel;
    @Input() expanded: boolean;
    @ViewChild(OlMapPreviewComponent) private previewMap: OlMapPreviewComponent;
    @ViewChild('subPanelElement') subPanelElement: ElementRef;

    // legends: any = {};
    featureArr: any = [];

    constructor(private layerHandlerService: LayerHandlerService) {
    }

    /**
     * Creates a string key for use with storing bounding box details within an associative array,
       given layer name and administrative area strings
     * @param layerName name of layer
     * @param adminArea administrative area
     */
    private makeKey(layerName: string, adminArea: string): string {
        return layerName + '#' + adminArea;
    }

    /**
     * Gets called by Angular framework upon any changes
     * @param changes object which holds the changes
     */
    ngOnChanges(changes: SimpleChanges) {
        // If this panel becomes expanded, then load up the legend and preview map
        if (changes.expanded.currentValue === true && !changes.expanded.previousValue) {

            // Gather up BBOX coordinates to calculate the centre and envelope
            const bboxArr = [];
            const bboxPolygonArr = {};
            for (let i = 0; i < this.cswRecords.length; i++) {
                const bbox = this.cswRecords[i].geographicElements[0];
                if (bbox !== undefined && (bbox.westBoundLongitude !== 0 || bbox.northBoundLatitude !== 0 || bbox.eastBoundLongitude !== 0 || bbox.southBoundLatitude !== 0)
                && (bbox.eastBoundLongitude !== 180 || bbox.westBoundLongitude !== 180 || bbox.northBoundLatitude !== 90 || bbox.southBoundLatitude !== -90)) {
                    this.featureArr.push(point([bbox.westBoundLongitude, bbox.northBoundLatitude]));
                    this.featureArr.push(point([bbox.westBoundLongitude, bbox.southBoundLatitude]));
                    this.featureArr.push(point([bbox.eastBoundLongitude, bbox.southBoundLatitude]));
                    this.featureArr.push(point([bbox.eastBoundLongitude, bbox.northBoundLatitude]));
                    bboxArr.push(bbox);

                    // Create a GeoJSON polgon object array to pass to the preview map component
                    const key = this.makeKey(this.layer.name, this.cswRecords[i].adminArea);
                    bboxPolygonArr[key] = featureCollection([polygon([[
                        olProj.fromLonLat([bbox.westBoundLongitude, bbox.northBoundLatitude]),
                        olProj.fromLonLat([bbox.westBoundLongitude, bbox.southBoundLatitude]),
                        olProj.fromLonLat([bbox.eastBoundLongitude, bbox.southBoundLatitude]),
                        olProj.fromLonLat([bbox.eastBoundLongitude, bbox.northBoundLatitude]),
                        olProj.fromLonLat([bbox.westBoundLongitude, bbox.northBoundLatitude])
                    ]])]);
                    bboxPolygonArr[key].crs = {
                        'type': 'name',
                        'properties': {
                            'name': 'EPSG:3857'
                        }
                    };
                }
                if (this.cswRecords.length === 1) {
                  this.cswRecords[i].expanded = true;
                }
            }

            // Use 'turf' to calculate the centre point of the BBOXES, use this to re-centre the map
            // Only calculate centre if the coords are not dispersed over the globe
            let reCentrePt: any = {};
            if (this.featureArr.length > 0) {
                // Calculate the envelope, if not too big then re-centred map can be calculated
                const featureColl = featureCollection(this.featureArr);
                const envelopePoly = envelope(featureColl);

                if (envelopePoly.geometry.coordinates[0][1][0] - envelopePoly.geometry.coordinates[0][0][0] < 30
                    && envelopePoly.geometry.coordinates[0][2][1] - envelopePoly.geometry.coordinates[0][0][1] < 30) {
                        // Calculate centre so we can re-centre the map
                        const centerPt = center(featureColl);
                        if (centerPt.geometry.coordinates !== undefined && centerPt.geometry.coordinates.length === 2
                            && !isNaN(centerPt.geometry.coordinates[0]) && !isNaN(centerPt.geometry.coordinates[1])) {
                                reCentrePt = { latitude: centerPt.geometry.coordinates[1], longitude: centerPt.geometry.coordinates[0] };
                        }
                }
                if (reCentrePt !== {}) {
                    // Ask preview map component to draw bounding boxes and recentre the map
                    this.previewMap.setupBBoxes(olProj.fromLonLat([reCentrePt.longitude, reCentrePt.latitude]), bboxPolygonArr);
                }
            }
        }
    }

    /**
     * Highlights a bounding box on the preview map
     * @param layerName name of layerName
     * @param adminArea name of administrative area
     */
    highlightOnPreviewMap(layerName: string, adminArea: string): void {
        const key = this.makeKey(layerName, adminArea);
        this.previewMap.setBBoxHighlight(true, key);
    }

    /**
     * Unhighlights a bounding box on the preview map
     * @param layerName name of layerName
     * @param adminArea name of administrative area
     */
    lowlightOnPreviewMap(layerName: string, adminArea: string): void {
        const key = this.makeKey(layerName, adminArea);
        this.previewMap.setBBoxHighlight(false, key);
    }

    /**
     * check if the cswRecord has a entry in the list of failing nagios record
     * @param nagiosFailingHosts array of the list of host that is experiencing problem
     * @param cswRecord the csw we are matching for problem
     */
    isEndpointFailing(nagiosFailingHosts: string[], cswRecord: CSWRecordModel): boolean {
      if (nagiosFailingHosts && nagiosFailingHosts.length > 0) {
        for (const nagiosFailingHost of nagiosFailingHosts) {
          for (const onlineResource of this.layerHandlerService.getOnlineResourcesFromCSW(cswRecord)) {
            if (onlineResource.url.indexOf(nagiosFailingHost) > -1) {
              return true;
            }
          }

        }
      }

      return false;
    }

}
