import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Constants } from '../../lib/portal-core-ui/utility/constants.service';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { LayerStatusService } from '../../lib/portal-core-ui/utility/layerstatus.service';
import { ManageStateService } from '../../lib/portal-core-ui/service/permanentlink/manage-state.service';
import { OnlineResourceModel } from '../../lib/portal-core-ui/model/data/onlineresource.model';
import { SldService } from '../../lib/portal-core-ui/service/style/wms/sld.service';
import { UtilitiesService } from '../../lib/portal-core-ui/utility/utilities.service';
import { LegendModalComponent } from 'app/modalwindow/legend/legend.modal.component';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';


@Injectable()
export class LegendUiService {

  // Track which legends are open
  displayedLegends: Map<string, MatDialogRef<LegendModalComponent>> = new Map<string, MatDialogRef<LegendModalComponent>>();

  constructor(private manageStateService: ManageStateService,
              private sldService: SldService,
              private layerStatusService: LayerStatusService,
              private http: HttpClient,
              private dialog: MatDialog,
              @Inject('env') private env
  ) {}

  /**
   * Get the first WMS OnlineResource for a layer
   *
   * @param layer the Layermodel for the layer
   * @returns the first WMS OnlineResourceModel for the layer, or undefined if one doesn't exist
   */
  private getWMSOnlineResource(layer: LayerModel): OnlineResourceModel {
    let wmsOnlineResource: OnlineResourceModel;
    if (layer.cswRecords) {
      for (const cswRecord of layer.cswRecords) {
        if (cswRecord.onlineResources) {
          wmsOnlineResource = cswRecord.onlineResources.find(r => r.type.toLowerCase() === 'wms');
          break;
        }
      }
    }
    return wmsOnlineResource;
  }

  /**
   * Get a list of WMS OnlineResourceModels for a given layer
   *
   * @param layer the layer of the ID
   * @returns an array of OnlineResourceModels (empty if none are present for layer)
   */
  private getWMSOnlineResources(layer: LayerModel): OnlineResourceModel[] {
    let wmsOnlineResources: OnlineResourceModel[] = [];
    if (layer.cswRecords) {
      for (const cswRecord of layer.cswRecords) {
        if (cswRecord.onlineResources) {
          wmsOnlineResources = wmsOnlineResources.concat(cswRecord.onlineResources.filter(r => r.type.toLowerCase() === 'wms'));
        }
      }
    }
    return wmsOnlineResources;
  }

  /**
   * Display a legend dialog
   *
   * @param layerId the ID of the relevant layer
   * @param legendTitle the title for the dialog
   * @param legendRequestList list of image requests (either this or legendUrlList will be required)
   */
  private displayLegendDialog(layerId: string, legendTitle: string, legendRequestList: Observable<any>[]) {
    const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = true;
      dialogConfig.hasBackdrop = false;
      dialogConfig.panelClass = 'legend-modal';
      dialogConfig.data = {
        layerId: layerId,
        legendTitle: legendTitle,
        legendRequestList: legendRequestList
      };
      const dialogRef = this.dialog.open(LegendModalComponent, dialogConfig);
      this.displayedLegends.set(layerId, dialogRef);
      dialogRef.afterClosed().subscribe(() => {
        this.removeLegend(layerId);
      });
  }

  /**
   * Create HttpParams for the GetLegendGraphic requests
   * @param url URL parameter for proxy request
   * @param layerName the layer name
   * @param collatedParam other layer specific collated parameters
   * @param sldBody the styled layer descriptor (SLD_BODY) - Optional
   * @returns a set of HttpParams for th eGetLegendGraphic request
   */
  private getLegendHttpParams(url: string, layerName: string, collatedParam: any, sldBody?: string): HttpParams {
    let httpParams = new HttpParams()
          .set('SERVICE', 'WMS')
          .append('REQUEST', 'GetLegendGraphic')
          .append('VERSION', '1.1.1')
          .append('FORMAT', 'image/png')
          .append('LAYER', layerName)
          .append('LAYERS', layerName)
          .append('SCALE', '1000000')
          .append('LEGEND_OPTIONS', 'forceLabels:on;minSymbolSize:16')
          .append('url', url)
          .append('usewhitelist', 'false');
    if (sldBody) {
      httpParams = httpParams.append('SLD_BODY', sldBody);
    }

    // Add mandatory filters, discard optional
    for (const p in collatedParam) {
      if (p !== 'optionalFilters') {
        httpParams = httpParams.append(p, collatedParam[p]);
      }
    }
    return httpParams;
  }

  /**
   * Trim a URL of all parameters
   *
   * @param wmsUrl the WMS URL to trim
   * @returns a trimmed URL string
   */
  private trimUrl(wmsUrl: string) {
    let url: string = wmsUrl;
    if (url.indexOf('?') !== -1) {
      url = url.substring(0, url.indexOf('?'));
    }
    return url;
  }

  /**
   * Creates a legend GetLegendGraphic request URL
   *
   * @param wmsUrl the URL
   * @param layerName the name of the ayer
   * @param sldBody the SLD_BODY (if one is to be used)
   * @returns a GetLegendGraphic URL for GET requests
   */
  private createLegendUrl(wmsUrl: string, layerName: string, sldBody?: string): string {
    wmsUrl = this.trimUrl(wmsUrl);
    let requestUrl = wmsUrl + '?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&BGCOLOR=0xFFFFFF' +
                    //  '&WIDTH=40&HEIGHT=40' +
                     '&LAYER=' + layerName + '&LAYERS=' + layerName + '&SCALE=1000000' + '&forceLabels=on&minSymbolSize=16';
    if (sldBody) {
      requestUrl += '&SLD_BODY=' + encodeURI(sldBody);
    }
    return requestUrl;
  }

  /**
   * Method to display a legend for the layer
   *
   * @param layer the layer
   */
  public showLegend(layer: LayerModel): void {
    // If a static image has been provided, use that
    if (layer.legendImg && layer.legendImg !== '') {
      const requestUrl = environment.portalBaseUrl + 'legend/' + layer.legendImg;
      const getRequest = this.http.get(requestUrl, { responseType: 'blob' }).pipe(
        catchError(() => {
          return of(undefined);
        })
      );
      this.displayLegendDialog(layer.id, layer.name, [getRequest]);
      return;
    }

    // Get first WMS online resource for layer name
    const wmsOnlineResource = this.getWMSOnlineResource(layer);
    if (!wmsOnlineResource || this.displayedLegends.has(layer.id)) {
      return;
    }

    // Get mandatory filters from layer state
    const layerState = this.manageStateService.getLayerState(layer.id);
    if (layerState['filterCollection']) {
      layer.filterCollection = { optionalFilters: [] };
      if (layerState['filterCollection']['mandatoryFilters']) {
        layer.filterCollection.mandatoryFilters = layerState['filterCollection']['mandatoryFilters'];
      }
    }

    // We don't need optional parameters for legend but it can't be empty
    const param: any = {};
    param.optionalFilters = [];
    const collatedParam = UtilitiesService.collateParam(layer, wmsOnlineResource, param);

    this.sldService.getSldBody(wmsOnlineResource, collatedParam, layer).subscribe(sldBody => {
      if (sldBody) {
        const wmsOnlineResources = this.getWMSOnlineResources(layer);
        // Compile list of legend requests and/or URLs
        const legendRequestList: Observable<any>[] = [];
        for (const resource of wmsOnlineResources) {
          if (!this.layerStatusService.isEndpointFailing(layer.id, wmsOnlineResource)) {
            // Some GET URLs were being truncated at the server despite not being very long, other servers were outright rejecting POST
            // requests, so create lists of GET URLs and POST requests to throw everything at the wall and see what sticks.

            // Assemble params, including 'GetLegend' params
            const httpParams = this.getLegendHttpParams(this.trimUrl(resource.url), wmsOnlineResource.name, collatedParam, sldBody);
            // Make a POST request with proxy
            const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API;
            const postRequest = this.http.post(proxyUrl, httpParams, { responseType: 'blob' }).pipe(
              catchError(() => {
                return of(undefined);
              })
            );
            legendRequestList.push(postRequest);

            // Make a GET request, no proxy
            const requestUrl = this.createLegendUrl(resource.url, resource.name, sldBody);
            const getRequest = this.http.get(requestUrl, { responseType: 'blob' }).pipe(
              catchError(() => {
                return of(undefined);
              })
            );
            legendRequestList.push(getRequest);
          }
        }
        this.displayLegendDialog(layer.id, layer.name, legendRequestList);
      } else {
        // It comes here when there is no SLD_BODY parameter

        // Create a POST request with proxy, with the proxy this enables us to use HTTP services
        // Assemble params, including 'GetLegend' params
        const httpParams = this.getLegendHttpParams(this.trimUrl(wmsOnlineResource.url), wmsOnlineResource.name, collatedParam);
        const proxyUrl = this.env.portalBaseUrl + Constants.PROXY_API;
        const postRequest = this.http.post(proxyUrl, httpParams, { responseType: 'blob' }).pipe(
          catchError(() => {
            return of(undefined);
          })
        );

        // Create a GET request, no proxy
        const requestUrl = this.createLegendUrl(wmsOnlineResource.url, wmsOnlineResource.name);
        const getRequest = this.http.get(requestUrl, { responseType: 'blob' }).pipe(
          catchError(() => {
            return of(undefined);
          })
        );
        this.displayLegendDialog(layer.id, layer.name, [getRequest, postRequest]);
      }
    });
  }

  /**
   * Close displayed legend
   *
   * @param layerId ID of relevant layer
   */
  public removeLegend(layerId: string): void {
    if (this.displayedLegends.has(layerId)) {
      this.displayedLegends.get(layerId).close();
      this.displayedLegends.delete(layerId);
    }
  }

  /**
   * Check whether a legend is displayed for a given layer
   *
   * @param layerId the ID of the layer
   * @returns true if legend is displayed for layer, false otherwise
   */
  public isLegendDisplayed(layerId: string): boolean {
    return this.displayedLegends.has(layerId);
  }

}
