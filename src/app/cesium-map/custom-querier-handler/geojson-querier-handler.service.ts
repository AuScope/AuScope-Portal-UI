export class GeoJsonQuerierHandler {

  constructor(private entity: any) {}

  /**
   * Creates an HTML string using a feature's GeoJsonFeatureData
   *
   * @returns HTML string
   */
  public getHTML(): string {
    let html;
    if (this.entity['name']) {
      html = '<div class="row"><div class="col-md-3">Name</div><div class="col-md-9">' + this.entity['name'] + '</div></div><hr>';
    } else {
      html = '<div class="row"><div class="col-md-3">Name</div><div class="col-md-9">' + this.entity['NAME'] + '</div></div><hr>';
    }
    let extendedData:any;
    if (this.entity['_properties']) {
      extendedData = this.entity['_properties']['_propertyNames'];
    } else {
      // might be a "PointPrimitiveCollection"
      extendedData = this.entity;
    }
    for (const attr in extendedData) {
        const key = extendedData[attr];
        if (this.entity['_properties']) {
          html += '<div class="row"><div class="col-md-3">' + key + '</div><div class="col-md-9">' + this.entity['_properties'][key]['_value'] + '</div></div>';
        } else {
          // eg might be a "PointPrimitiveCollection"
          if (!attr.startsWith("_")) {
            html += '<div class="row"><div class="col-md-3">' + attr + '</div><div class="col-md-9">' + key + '</div></div>';
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
    if (this.entity['name']) {
      return this.entity['name'];
    } else {
      return this.entity['NAME'];
    }
  }

}
