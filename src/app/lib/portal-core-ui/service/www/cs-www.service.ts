import { CSWRecordModel } from '../../model/data/cswrecord.model';
import { Injectable, Inject } from '@angular/core';
import { LayerModel } from '../../model/data/layer.model';
import { OnlineResourceModel } from '../../model/data/onlineresource.model';
import { PrimitiveModel } from '../../model/data/primitive.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { GeometryType } from '../../utility/constants.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';
import { CsMapObject } from '../cesium-map/cs-map-object';

/**
 * Use Cesium to add layer to map. This service class adds www layer to the map
 */
@Injectable()
export class CsWWWService {

  constructor(private csMapObject: CsMapObject,
              private layerHandlerService: LayerHandlerService,
              private renderStatusService: RenderStatusService,
              @Inject('env') private env) {
  }

  /**
   * Add geometry type point to the map
   * @param layer the layer where this point derived from
   * @param primitive the point primitive
   */
  public addPoint(layer: LayerModel, cswRecord: CSWRecordModel, primitive: PrimitiveModel): void {

    // FIXME Use cs map service & cesium to add a point
  }


  public addPolygon(layer: LayerModel, cswRecord: CSWRecordModel, primitive: PrimitiveModel): void {
  
    // FIXME Use cs map service & cesium to add a polgon
  }

  /**
   * Add the www layer
   * @param layer the layer to add to the map
   * @param the www layer to be added to the map
   */
  public addLayer(layer: LayerModel, param?: any): void {
    const cswRecords = this.layerHandlerService.getCSWRecord(layer);

    // VT: create the vector on the map if it does not exist.
    //if (!this.csMapService.getLayerById(layer.id)) {
       // FIXME Use cs map service & cesium to create a vector
    //}

    const onlineResource = new OnlineResourceModel();
    onlineResource.url = 'Not applicable, rendering from www records';
    this.renderStatusService.addResource(layer, onlineResource);

    for (const cswRecord of cswRecords) {
      // VT do some filter based on the parameter here
      const primitive = new PrimitiveModel();

      const geoEls = cswRecord.geographicElements;
      for (let j = 0; j < geoEls.length; j++) {
        const geoEl = geoEls[j];
        if (geoEl.eastBoundLongitude && geoEl.westBoundLongitude && geoEl.southBoundLatitude && geoEl.northBoundLatitude) {
          const primitive = new PrimitiveModel();
          if (geoEl.eastBoundLongitude === geoEl.westBoundLongitude &&
              geoEl.southBoundLatitude === geoEl.northBoundLatitude) {

            primitive.geometryType = GeometryType.POINT;
            primitive.name = cswRecord.name;
            primitive.coords = {
              lng: geoEl.eastBoundLongitude,
              lat: geoEl.southBoundLatitude
            };
          } else {
            primitive.geometryType = GeometryType.POLYGON;
            primitive.name = cswRecord.name;
            primitive.coords = [[geoEl.eastBoundLongitude, geoEl.northBoundLatitude], [geoEl.westBoundLongitude, geoEl.northBoundLatitude],
              [geoEl.westBoundLongitude, geoEl.southBoundLatitude], [geoEl.eastBoundLongitude, geoEl.southBoundLatitude]];
          }

          switch (primitive.geometryType) {
            case GeometryType.POINT:
              this.addPoint(layer, cswRecord, primitive);
              break;
            case GeometryType.POLYGON:
              this.addPolygon(layer, cswRecord, primitive);
              break;
          }

        }
      }
    }
    this.renderStatusService.updateComplete(layer, onlineResource);
  }

}
