

export class IrisQuerierHandler {

  constructor(private feature: any) {}

  public getHTML(): string {
    let html = '<div class="row"><div class="col-md-3">Station</div><div class="col-md-9">' + this.feature.values_.name + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Description</div><div class="col-md-9">' + this.feature.layer.description + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Parser</div><div class="col-md-9">' + this.feature.values_.description + '</div></div><hr>';
    html += '<div class="row"><div class="col-md-3">Layer</div><div class="col-md-9">' + this.feature.layer.group + '</div></div><hr>';

    html += '<div class="row"><div class="col-md-3">Record Info</div><div class="col-md-9">';
    for (const cswRecord of this.feature.layer.cswRecords) {
      html += '<div class="row"><div class="col-md-3">Contact Org</div><div class="col-md-9">' + cswRecord.contactOrg + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Resource Description</div><div class="col-md-9">' + cswRecord.description + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Provider</div><div class="col-md-9">' + cswRecord.resourceProvider + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Date</div><div class="col-md-9">' + cswRecord.date + '</div></div><hr>';
      html += '<div class="row"><div class="col-md-3">Source</div><div class="col-md-9"><a href="' + cswRecord.recordInfoUrl + '">Full Metadata and download</a></div></div><hr>';
    }
    html += '</div></div>';

    return html;
  }

   public getKey(): string {
    return this.feature.values_.name;
  }

}
