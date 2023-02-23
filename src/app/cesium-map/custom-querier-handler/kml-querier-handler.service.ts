import { UtilitiesService, LayerModel } from "@auscope/portal-core-ui";
import { KmlFeatureData } from "cesium";


export class KMLQuerierHandler {

  constructor(private entity: KmlFeatureData) {}

  /**
   * Creates an HTML string using a feature's KMLFeatureData
   * 
   * @returns HTML string 
   */
  public getHTML(): string {
    const extendedData = this.entity['kml']['extendedData'];
    let html = '<div class="row"><div class="col-md-3">Name</div><div class="col-md-9">' + this.entity['name'] + '</div></div><hr>';
    for (const attr in extendedData) {
      if (extendedData.hasOwnProperty(attr)) {
        const data =  extendedData[attr];
        let displayName = attr
        if (data.hasOwnProperty('displayName') && !UtilitiesService.isEmpty(data['displayName'])) {
          displayName = data['displayName'];
        }
        if (data.hasOwnProperty('value') && !UtilitiesService.isEmpty(data['value'])) {
          html += '<div class="row"><div class="col-md-3">' + displayName + '</div><div class="col-md-9">' + data['value'] + '</div></div>';
        }
      }
    }
    html += '</div></div>';
    return html;
  }

  /**
   * Fetches a feature's name
   * 
   * @returns feature name string
   */
  public getFeatureName(): string {
    return this.entity['name'];
  }
  
}
