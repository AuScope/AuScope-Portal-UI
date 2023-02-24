import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Constants, LayerModel, LayerStatusService, ManageStateService, OnlineResourceModel, SldService, UtilitiesService } from '@auscope/portal-core-ui';
import { LegendModalComponent } from 'app/modalwindow/legend/legend.modal.component';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';


@Injectable()
export class LegendUiService {

  // Track which legends are open
  displayedLegends: Map<string, MatDialogRef<LegendModalComponent>> = new Map<string, MatDialogRef<LegendModalComponent>>();

  constructor(private manageStateService: ManageStateService, private sldService: SldService,
              private layerStatusService: LayerStatusService, private http: HttpClient, private dialog: MatDialog) {}

  /**
   * Get the first WMS OnlineResource for a layer
   *
   * @param layer the Layermodel for the layer
   * @returns the first WMS OnlineResourceModel for the layer, or undefined if one doesn't exist
   */
  private getWMSOnlineResource(layer: LayerModel): OnlineResourceModel {
    let wmsOnlineResource;
    if (layer.cswRecords) {
      for (const cswRecord of layer.cswRecords) {
        if (cswRecord.onlineResources) {
          wmsOnlineResource = cswRecord.onlineResources.find(r => r.type === 'WMS');
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
   * @param legendUrlList list of legend image URLs (either this or legendRequestList will be required)
   * @param legendRequestList list of image requests (either this or legendUrlList will be required)
   */
  private displayLegendDialog(layerId: string, legendTitle: string, legendUrlList: string[], legendRequestList: Observable<any>[]) {
    const dialogConfig = new MatDialogConfig();
      dialogConfig.autoFocus = true;
      dialogConfig.hasBackdrop = false;
      dialogConfig.panelClass = 'legend-modal';
      dialogConfig.data = {
        layerId: layerId,
        legendTitle: legendTitle,
        legendUrlList: legendUrlList,
        legendRequestList: legendRequestList
      };
      const dialogRef = this.dialog.open(LegendModalComponent, dialogConfig);
      this.displayedLegends.set(layerId, dialogRef);
  }

  /**
   * Retrieve the legend image data as a blob
   *
   * @param legendUrl the URL from which to retrieve the image data
   * @returns a Blob observable of legend image data
   */
  private getLegendImageData(legendUrl: string): Observable<Blob> {
    return this.http.post<Blob>(legendUrl, { responseType: 'blob' });
  }

  /**
   * Create HttpParams for the GetLegendGraphic requests
   * @param layerName the layer name
   * @param sldBody the styled layer descriptor (SLD_BODY)
   * @param collatedParam other layer specific collated parameters
   * @returns a set of HttpParams for th eGetLegendGraphic request
   */
  private getHttpParams(layerName: string, sldBody: string, collatedParam: any): HttpParams {
    let httpParams = new HttpParams()
          .set('SERVICE', 'WMS')
          .append('REQUEST', 'GetLegendGraphic')
          .append('VERSION', '1.1.1')
          .append('FORMAT', 'image/png')
          .append('LAYER', layerName)
          .append('LAYERS', layerName)
          .append('SLD_BODY', sldBody)
          .append('SCALE', '1000000')
          .append('LEGEND_OPTIONS', 'forceLabels:on;minSymbolSize:16');

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
  private trimUrl(wmsUrl: string ) {
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
  private createRequestUrl(wmsUrl: string, layerName: string, sldBody: string): string {
    wmsUrl = this.trimUrl(wmsUrl);
    let requestUrl = wmsUrl + '?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&BGCOLOR=0xFFFFFF' +
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
  public showLegend(layer: LayerModel) {
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
    const usePost = (environment.portalBaseUrl + layer.proxyStyleUrl + collatedParam.toString()).length > Constants.WMSMAXURLGET;

    this.sldService.getSldBody(layer.proxyStyleUrl, usePost, wmsOnlineResource, collatedParam).subscribe(sldBody => {
      if (sldBody) {
        const wmsOnlineResources = this.getWMSOnlineResources(layer);
        // Compile list of legend requests and/or URLs
        const legendRequestList: Observable<any>[] = [];
        const legendUrlList: string[] = [];
        for (const resource of wmsOnlineResources) {
          if (!this.layerStatusService.isEndpointFailing(layer.id, wmsOnlineResource)) {
            // Some GET URLs were being truncated at the server despite not being very long, other servers were outright rejecting POST
            // requests, so create lists of GET URLs and POST requests to throw everything at the wall and see what sticks.
            const requestUrl = this.createRequestUrl(resource.url, resource.name, sldBody);
            const httpParams = this.getHttpParams(wmsOnlineResource.name, sldBody, collatedParam);
            const request = this.http.post(this.trimUrl(resource.url), httpParams, { responseType: 'blob' }).pipe(
              catchError(err => {
                return of(undefined);
              })
            );
            legendRequestList.push(request);
            legendUrlList.push(requestUrl);
          }
        }
        this.displayLegendDialog(layer.id, layer.name, legendUrlList, legendRequestList);
      } else {
        const requestUrl = this.createRequestUrl(wmsOnlineResource.url, wmsOnlineResource.name, null);
        this.displayLegendDialog(layer.id, layer.name, [requestUrl], []);
      }
    });
  }

  /**
   * Close displayed legend
   *
   * @param layerId ID of relevant layer
   */
  public removeLegend(layerId: string) {
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
  public isLegendDisplayed(layerId): boolean {
    return this.displayedLegends.has(layerId);
  }

}
