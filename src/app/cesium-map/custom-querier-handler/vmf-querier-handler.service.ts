import { UtilitiesService, LayerModel } from "@auscope/portal-core-ui";

export class VMFQuerierHandler {

  constructor(private entity: any) {}

  /**
   * Creates an HTML string using a feature's VMFFeatureData
   *
   * @returns HTML string
   */
  public getHTML(): string {
    let html = '<div class="row"><div class="col-md-3">Name</div><div class="col-md-9">' + this.entity['name'] + '</div></div><hr>';

    const extendedData = this.entity['_properties']['_propertyNames'];
    for (const attr in extendedData) {
        const key = extendedData[attr];
        if ((key == 'ID') || (key == 'description')) {
            html += '<div class="row"><div class="col-md-3">' + key + '</div><div class="col-md-9">' + this.entity['_properties'][key]['_value'] + '</div></div>';
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
