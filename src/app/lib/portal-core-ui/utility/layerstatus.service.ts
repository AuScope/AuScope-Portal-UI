import { timer } from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CSWRecordModel } from '../model/data/cswrecord.model';
import { OnlineResourceModel } from '../model/data/onlineresource.model';
import { Md5 } from 'ts-md5';
import { switchMap } from 'rxjs/operators';

/**
 * This service periodically queries getKnownLayers in the back end, which will get latest statuses from
 * Google StackDriver.
 */
@Injectable()
export class LayerStatusService {
  private http = inject(HttpClient);
  private env = inject<any>('env' as any);
  private noKnownLayers: number = 0; // number of known layers from getKnownLayers in the backend queried from stackdriver
  private md5Value: string = ''; // MD5 checksum of the layer list from getKnownLayers in the backend queried from stackdriver
  private currentLayerList: any; // current list of known layers from getKnownLayers in the backend queried from stackdriver

  // synchronised layer id to failing hosts from getKnownLayers in the backend queried from stackdriver
  private layerStatusMap: Map<string, string[]>;
  constructor() {
    this.layerStatusMap = new Map<string, string[]>();
    this.updateLayerStatus();
  }


  // Calculate an MD5 checksum
  private calculateMD5(value: any): string {
    // If value is missing, return an empty hash or handle gracefully
    if (value === null || value === undefined) {
      return Md5.hashStr('');
    }

    // If it is already a clean string, hash it directly
    if (typeof value === 'string') {
      return Md5.hashStr(value);
    }

    // If it is an object or array, convert it to a JSON string first
    try {
      return Md5.hashStr(JSON.stringify(value));
    } catch (error) {
      console.error('Failed to stringify value for MD5 generation:', value);
      return Md5.hashStr('');
    }
  }

// Symmetric Difference (Items unique to List A OR unique to List B)
  getAbsoluteDifference(listA: any[], listB: any[]): any[] {
  const uniqueToA = listA.filter(itemA => !listB.some(itemB => itemB.id === itemA.id)).map(item => item.name);;
  const uniqueToB = listB.filter(itemB => !listA.some(itemA => itemA.id === itemB.id)).map(item => item.name);;
  
  return [...uniqueToA, ...uniqueToB];
}

  /**
   * Regularly update layer status from stackdriver service by calling getKnownLayers.
   */
  private updateLayerStatus() {
  const me = this;

  // ⏱️ Changed initial delay to 30000ms (30 seconds) to let the backend finish flushing its cache!
  timer(30000, 15 * 60 * 1000) 
    .pipe(
      // switchMap safely maps the timer ticker  into the HTTP GET request      
      switchMap(() => {
        // ✨ Generate a unique timestamp query parameter to bypass browser caching completely
        const cacheBuster = `?t=${new Date().getTime()}`;
        return this.http.get(this.env.portalBaseUrl + this.env.getCSWRecordEndP + cacheBuster);
      })
    )
    .subscribe({
      next: (response) => {
        const layerList = response['data'];
        if (!layerList) return;

        // Clean initial calculation check
        if (this.noKnownLayers === 0) {
          this.md5Value = this.calculateMD5(layerList);
          this.currentLayerList = layerList; // Store the initial layer list for future comparison
        } else {
          const newMD5Value = this.calculateMD5(layerList);
  
          if (this.md5Value !== newMD5Value) {
            console.log("[DEBUG] MD5 mismatch detected! Triggering safe UI notification banner...");
            const diffList = this.getAbsoluteDifference(layerList, this.currentLayerList); // Calculate the absolute difference for debugging/logging if needed
            console.log("[DEBUG] Layers changed:", diffList);
            this.showRefreshBanner();
            return;
          }
          this.md5Value = newMD5Value;
        }
        
        this.noKnownLayers = layerList.length;
        this.currentLayerList = layerList; // Update the current layer list for future comparisons
        
        // Update the functional layer state registry mapping structure
        layerList.forEach(function (item, _i) {
          me.layerStatusMap.set(item.id, item.stackdriverFailingHosts);
        });
      },
      error: (err) => {
        console.error("[updateLayerStatus] Error fetching layer records payload: ", err);
      }
    });
}

/**
 * Display a non-intrusive banner at the top of the page to inform users that the featured layers have changed.
 * This allows users to refresh the page at their convenience without forcing an immediate reload.
 */
private showRefreshBanner() {
  // Check if a banner is already on the screen to avoid duplicates
  if (document.getElementById('portal-refresh-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'portal-refresh-banner';
  
  // Style the banner inline so it sits prominently at the top of the view
  Object.assign(banner.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    backgroundColor: '#ff9800',
    color: '#ffffff',
    textAlign: 'center',
    padding: '12px',
    fontSize: '15px',
    fontWeight: 'bold',
    zIndex: '999999',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    cursor: 'pointer'
  });

  banner.innerHTML = `⚠️ The featured layers have changed. <span style="text-decoration: underline;">Click here to refresh the page</span> and apply changes.`;

  // When the user clicks anywhere on the banner, reload the app smoothly
  banner.onclick = () => {
    window.location.reload();
  };

  document.body.appendChild(banner);
}
  /**
   * Query the status cache against stackdriver if any related services is down.
   * @param layer id
   * @return true if one of the services is down
   */
  public isLayerDown(layerId: string): boolean {
    const failingHosts = this.layerStatusMap ? this.layerStatusMap.get(layerId) : null;
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
