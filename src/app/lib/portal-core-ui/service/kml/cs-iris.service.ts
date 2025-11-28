
import { throwError as observableThrowError, Observable } from 'rxjs';

import { catchError, map } from 'rxjs/operators';

import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { LayerModel } from '../../model/data/layer.model';
import { LayerHandlerService } from '../cswrecords/layer-handler.service';
import { MapsManagerService } from '@auscope/angular-cesium';
import { ResourceType } from '../../utility/constants.service';
import { RenderStatusService } from '../cesium-map/renderstatus/render-status.service';

// NB: Cannot use "import { XXX, YYY, ZZZ, Color } from 'cesium';" - it prevents initialising ContextLimits.js properly
// which causes a 'DeveloperError' when trying to draw the KML
declare let Cesium;

/**
 * Use Cesium to add layer to map. This service class adds IRIS layer to the map
 */
@Injectable()
export class CsIrisService {

  public irisLayers: {
    layerId: string;
    maxDist: number;
    color: any;
  }[] = [
      { layerId: 'seismology-in-schools-site', maxDist: 8000000.0, color: Cesium.Color.PURPLE },
      { layerId: 'seismology-skippy', maxDist: 8000000.0, color: Cesium.Color.AQUAMARINE },
      { layerId: 'seismology-kimba97', maxDist: 3000000.0, color: Cesium.Color.BROWN },
      { layerId: 'seismology-kimba98', maxDist: 3000000.0, color: Cesium.Color.CADETBLUE },
      { layerId: 'seismology-wacraton', maxDist: 3000000.0, color: Cesium.Color.CHARTREUSE },
      { layerId: 'seismology-seal', maxDist: 1500000.0, color: Cesium.Color.CORAL },
      { layerId: 'seismology-seal2', maxDist: 1500000.0, color: Cesium.Color.CORNFLOWERBLUE },
      { layerId: 'seismology-seal3', maxDist: 1500000.0, color: Cesium.Color.DARKCYAN },
      { layerId: 'seismology-capral', maxDist: 3000000.0, color: Cesium.Color.DARKMAGENTA },
      { layerId: 'seismology-soc', maxDist: 3000000.0, color: Cesium.Color.DARKORANGE },
      { layerId: 'seismology-gawler', maxDist: 1500000.0, color: Cesium.Color.DARKORCHID },
      { layerId: 'seismology-bilby', maxDist: 3000000.0, color: Cesium.Color.THISTLE },
      { layerId: 'seismology-curnamona', maxDist: 1500000.0, color: Cesium.Color.DARKSALMON },
      { layerId: 'seismology-minq', maxDist: 3000000.0, color: Cesium.Color.DARKSEAGREEN },
      { layerId: 'seismology-eal1', maxDist: 1500000.0, color: Cesium.Color.DEEPPINK },
      { layerId: 'seismology-eal2', maxDist: 1500000.0, color: Cesium.Color.DIMGRAY },
      { layerId: 'seismology-eal3', maxDist: 1500000.0, color: Cesium.Color.GOLDENROD },
      { layerId: 'seismology-bass', maxDist: 3000000.0, color: Cesium.Color.GREENYELLOW },
      { layerId: 'seismology-sqeal', maxDist: 1500000.0, color: Cesium.Color.HOTPINK },
      { layerId: 'seismology-aq3', maxDist: 1500000.0, color: Cesium.Color.LIGHTBLUE },
      { layerId: 'seismology-aqt', maxDist: 1500000.0, color: Cesium.Color.BURLYWOOD },
      { layerId: 'seismology-banda', maxDist: 3000000.0, color: Cesium.Color.MEDIUMPURPLE },
      { layerId: 'seismology-asr', maxDist: 8000000.0, color: Cesium.Color.BLUE },
      { layerId: 'seismology-marla-line', maxDist: 3000000.0, color: Cesium.Color.ORCHID },];


  constructor(private layerHandlerService: LayerHandlerService,
    private http: HttpClient,
    private renderStatusService: RenderStatusService,
    private mapsManagerService: MapsManagerService,
    @Inject('env') private env) {
  }

  /**
   * Retrieves station details including the channel information from the IRIS service
   *
   * @param layer the IRIS layer for the getfeature request to be made
   * @return Observable the observable from the http request
   */
  public getIrisStationFeature(layer: LayerModel): Observable<any> {
    try {
      const retVal = { data: [], msg: "", success: true };
      return this.getKMLFeature(layer).pipe(map(
        (response) => {
          const parser = new DOMParser();
          const stationLst = []; // List of stations in a network
          let minStartDate: string | number | Date = null; // Earliest start date for all stations in a network
          let maxEndDate: string | number | Date = null; // Latest end date for all stations in a network
          const dom = parser.parseFromString(response, "application/xml");
          const placemarks = dom.querySelectorAll("Placemark");
          // for each station
          placemarks.forEach(placemark => {
            let channelLst = []; // List of channels for a station
            const extendedData = placemark.querySelector("ExtendedData").querySelectorAll("Data");
            let stationCode: string;
            let startDate: string | number | Date; // Start date for a station's data
            let endDate: string | number | Date; // End date for a station's data
            extendedData.forEach(data => {
              const att = data.getAttribute('name');
              if (att == 'Code') {
                stationCode = data.querySelector("value").textContent;
              }
              if (att == 'StartDate') {
                startDate = data.querySelector("value").textContent;
              }
              if (att == 'EndDate') {
                endDate = data.querySelector("value").textContent;
              }
            })
            channelLst = this.parseChannelInfo(placemark);

            // Assemble a list of station information
            const station = {
              name: placemark.querySelector("name").textContent,
              description: placemark.querySelector("description").textContent,
              code: stationCode,
              startDate: startDate ? new Date(startDate).toISOString().slice(0, 10) : null,
              endDate: endDate ? new Date(endDate).toISOString().slice(0, 10) : null,
              channelLst: channelLst
            };
            stationLst.push(station);

            // Calculate the earliest start date and latest end data for all stations in a network
            minStartDate = !minStartDate || minStartDate > startDate ? station.startDate : minStartDate;
            maxEndDate = !maxEndDate || maxEndDate < endDate ? station.endDate : maxEndDate;
          });
          // Creating a list of station information with min start and max end dates
          retVal.data.push({
            stationLst: stationLst,
            minDate: minStartDate,
            maxDate: maxEndDate
          });
          return retVal;
        }));
    } catch (e) {
      console.error("Retrieves stations error:", e);
      return observableThrowError(e);
    }
  }

  /**
 * Parse to extract channel information
 *
 * @param placemark Element representing the station part of the response
 * @return List of channels
 */
  private parseChannelInfo(placemark: Element) {
    const channelLst = [];
    //extract channel information
    const channels = placemark.querySelector("Channels")
    const channelItems=channels?channels.querySelectorAll("Channel"):[];
    //for each channel
    channelItems.forEach(channel => {
      channelLst.push({
        code: channel.getAttribute('Code'),
        azimuth: channel.querySelector("Azimuth").textContent,
        dip: channel.querySelector("Dip").textContent,
        sampleRate: channel.querySelector("SampleRate").textContent
      });
    })
    return channelLst;
  }

  /**
   * Retrieves KML features from the IRIS service via proxy/conversion service
   *
   * @param layer the IRIS layer for the getfeature request to be made
   * @return Observable the observable from the http request
   */
  public getKMLFeature(layer: LayerModel): Observable<any> {

    const irisResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.IRIS);
    const irisResource = irisResources[0];

    // Assemble parameters for proxy/conversion service
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', irisResource.url);
    httpParams = httpParams.append('networkCode', irisResource.name);


    if (layer.proxyUrl) {
      // Send request to proxy/conversion service
      return this.http.get(this.env.portalBaseUrl + layer.proxyUrl, {
        params: httpParams
      }).pipe(map(response => {
        if (response['success'] === true) {
          return response['msg'];
        } else {
          return observableThrowError(response['Error retriving IRIS data']);
        }
      }), catchError(
        (error: HttpResponse<any>) => {
          return observableThrowError(error);
        }
      ));
    };
  }

  /**
   * Private function to style the KML using Cesium's API
   * @param entity
   */
  private styleIrisEntity(entity) {
    if (entity.name) {
      // Style label for each point
      entity.label = new Cesium.LabelGraphics({
        text: entity.name,
        showBackground: false,
        fillColor: Cesium.Color.BLACK,
        font: '12px roboto,sans-serif',
        style: Cesium.LabelStyle.FILL,
        pixelOffset: new Cesium.Cartesian2(9, -2),
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, entity.maxDist),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      });
      // Style point in purple
      entity.point = new Cesium.PointGraphics({
        color: entity.color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        pixelSize: 8,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1.0, 8000000.0),
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 0.35, 1.5e7, 0.35),
      });
      // Don't display a billboard
      // entity.billboard = null;
    }
  }

  /**
   * Add the IRIS KML layer
   * @param layer the IRIS layer to add to the map
   * @param param parameters for the IRIS layer
   */
  public addLayer(layer: LayerModel, _param?: any): void {
    const irisOnlineResources = this.layerHandlerService.getOnlineResources(layer, ResourceType.IRIS);
    const me = this;

    for (const onlineResource of irisOnlineResources) {

      // Tell UI that we're about to add a resource to map
      this.renderStatusService.addResource(layer, onlineResource);

      // Get KML from the proxy/conversion service
      this.getKMLFeature(layer).subscribe(response => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(response, "application/xml");

        // Get CesiumJS viewer
        const viewer = me.getViewer();
        const options = {
          camera: viewer.scene.camera,
          canvas: viewer.scene.canvas
        };
        const stylefn = (entity: any) => me.styleIrisEntity(entity);
        // Create data source
        const source = new Cesium.KmlDataSource(options);

        // Load KML
        const selectedLayer = this.irisLayers.find(l => l.layerId === layer.id);
        source.load(dom).then(function (dataSource) {
          for (const entity of dataSource.entities.values) {
            entity['color'] = selectedLayer ? selectedLayer.color : Cesium.Color.CRIMSON;
            entity['maxDist'] = selectedLayer ? selectedLayer.maxDist : 8000000.0;
            // Style each KML point
            stylefn(entity);
          }
          // Add all the KML points to map
          viewer.dataSources.add(dataSource).then(dataSrc => {
            layer.csLayers.push(dataSrc);
          });
        });

        // Tell UI that we have completed updating the map
        me.renderStatusService.updateComplete(layer, onlineResource);
      },
        _err => {
          me.renderStatusService.updateComplete(layer, onlineResource, true);
        });
    }
  }

  /**
   * Removes IRIS KML layer from the map
   * @method rmLayer
   * @param layer the IRIS layer to remove from the map.
   */
  public rmLayer(layer: LayerModel): void {
    const viewer = this.getViewer();
    for (const dataSrc of layer.csLayers) {
      viewer.dataSources.remove(dataSrc);
    }
    layer.csLayers = [];
    this.renderStatusService.resetLayer(layer.id)
  }

  /**
   * Fetches Cesium 'Viewer'
  */
  private getViewer() {
    return this.mapsManagerService.getMap().getCesiumViewer();
  }

}
