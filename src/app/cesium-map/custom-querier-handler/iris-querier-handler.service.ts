import { LayerModel } from "@auscope/portal-core-ui";
import { KmlFeatureData } from "cesium";


export class IrisQuerierHandler {

  constructor(private layer: LayerModel, private entity: KmlFeatureData) {}

  /**
   * Creates an HTML string using a feature's KMLFeatureData and CSW records info
   *
   * @returns HTML string
   */
  public getHTML(): string {
    const extendedData = this.entity['kml']['extendedData'];
    let html = '<div class="row"><div class="col-md-3">Station</div><div class="col-md-9">' + this.entity['name'] + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Code</div><div class="col-md-9">' + extendedData['Code']['value'] + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Country</div><div class="col-md-9">' + extendedData['Country']['value'] + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Brief Description</div><div class="col-md-9">' + this.layer.description + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Layer</div><div class="col-md-9">' + this.layer.group + '</div></div><hr>';

    html += '<div class="row"><div class="col-md-3">Record Info</div><div class="col-md-9">';
    for (const cswRecord of this.layer.cswRecords) {
      html += '<div class="row"><div class="col-md-3">Contact Org</div><div class="col-md-9">' + cswRecord.contactOrg + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Resource Description</div><div class="col-md-9">' + cswRecord.description + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Provider</div><div class="col-md-9">' + cswRecord.resourceProvider + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Date</div><div class="col-md-9">' + cswRecord.date + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Source</div><div class="col-md-9"><a style="color: #000000" href="' + cswRecord.recordInfoUrl + '">Full Metadata and download</a></div></div><hr>';
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
