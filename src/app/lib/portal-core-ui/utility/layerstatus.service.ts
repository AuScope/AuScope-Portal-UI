import { timer } from 'rxjs';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CSWRecordModel } from '../model/data/cswrecord.model';
import { OnlineResourceModel } from '../model/data/onlineresource.model';

/**
 * This service periodically queries getKnownLayers in the back end, which will get latest statuses from
 * Google StackDriver.
 */
@Injectable()
export class LayerStatusService {
  // synchronised layer id to failing hosts from getKnownLayers in the backend queried from stackdriver
  private layerStatusMap: Map<string, string[]>;
  constructor(
    private http: HttpClient,
    @Inject('env') private env
  ) {
    this.layerStatusMap = new Map<string, string[]>();
    this.updateLayerStatus();
  }

  /**
   * Regularly update layer status from stackdriver service by calling getKnownLayers.
   */
  private updateLayerStatus() {
    const me = this;
    timer(0, 15 * 60 * 1000).subscribe(() => { // will execute every 15 minutes
      return this.http.get(this.env.portalBaseUrl + this.env.getCSWRecordEndP)
        .subscribe((response) => {
          const layerList = response['data'];
          layerList.forEach(function (item, i) {
            me.layerStatusMap.set(item.id, item.stackdriverFailingHosts);
          });
       });
    });
  }
  /**
   * Query the status cache against stackdriver if any related services is down.
   * @param layer id
   * @return true if one of the services is down
   */
  public isLayerDown(layerId: string): boolean {
    var failingHosts = this.layerStatusMap ? this.layerStatusMap.get(layerId) : null;
    if (failingHosts && failingHosts.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * check if the cswRecord has a entry in the list of failing stackdriver record
   * @param layerId Layer id from CSW record
   * @param cswRecord the csw we are matching for problem
   */
  public showInfoWarning(layerId: string, cswRecord: CSWRecordModel): boolean {
    if (!cswRecord.onlineResources) {
      return false;
    }
    for (const onlineResource of cswRecord.onlineResources) {
      if (this.isEndpointFailing(layerId, onlineResource)) {
        return true;
      }
    }
    return false;
  }

  /**
   * check if the cswRecord has a entry in the list of failing stackdriver record
   * @param layerId Layer id from CSW record
   * @param onlineResource OnlineResource model representing CSW record
   */
  public isEndpointFailing(layerId: string, onlineResource: OnlineResourceModel): boolean {
    const stackdriverFailingHosts = this.layerStatusMap.get(layerId);
    if (stackdriverFailingHosts && stackdriverFailingHosts.length > 0) {
      for (const stackdriverFailingHost of stackdriverFailingHosts) {
        if (onlineResource.url.indexOf(stackdriverFailingHost) > -1) {
           return true;
        }
      }
    }
    return false;
  }
}
