import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { Constants } from '../../utility/constants.service';

/**
 * This service class contains functions used for manipulating KML documents
 */
@Injectable({
  providedIn: 'root'
})
export class KMLDocService {
  private http = inject(HttpClient);

  // check if the icon - href url works/exists
  public getIconRecord(iconUrl: string, portalBaseUrl: any): Observable<any> {

    return this.http.get(portalBaseUrl + "/" + iconUrl, { responseType: "text" }).pipe(map(
      (_response) => {
        return { status: true, url: iconUrl };
      }), catchError(
        (_error: HttpResponse<any>) => {
          this.getIconRecord(portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + iconUrl, portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=");
          return this.http.get(iconUrl, { responseType: "text" }).pipe(map(
            (_response) => {
              return { status: true, url: iconUrl };
            }), catchError(
              (_error: HttpResponse<any>) => {
                return throwError('This will error').pipe(catchError(_error => of({ status: false, url: iconUrl })))
              }
            ));

        }
      )
    );
  }

  // make a list of start and end positions for urls enclosed by the xml <Icon><href>
  getXmlElements(kmlTxt: string, xmlStartPattern: string, xmlEndPattern: string) {
    const iconPosList: { start: number; end: number; }[] = [];
    let startPos = 0;
    let endScan: boolean = false;
    while (!endScan) {
      endScan = true;
      const pos1 = kmlTxt.indexOf(xmlStartPattern, startPos);
      if (pos1 > 0) {
        const pos1a = kmlTxt.indexOf("<href>", pos1);
        if (pos1a > 0) {
          endScan = false;
          startPos = pos1 + 6; //  + <href>
          const pos2 = kmlTxt.indexOf(xmlEndPattern, startPos);
          const iconItem = { start: pos1a + 6, end: pos2 };
          iconPosList.push(iconItem);
          startPos = pos2;
        }
      }
    }
    return iconPosList;
  }

  /**
   * check if document contains a ground overlay
   *
   * @param kmlDoc
   * @returns overlayStatus
   */
  public groundOverlay(kmlStr: string): boolean {
    let overlayStatus = false;
    let doc : any;

    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlStr, "text/xml");

    doc = kmlDoc;
    const gos = doc.querySelector("GroundOverlay");

    if (gos) {
      overlayStatus = true;
    }
    return overlayStatus;
  }

  /**
   * Clean KML text by removing illegal chars and
   * forcing proxying of icon images to avoid CORS errors
   *
   * @param kmlTxt KML text to be cleaned
   * @returns clean KML string
   */
  public cleanKML(kmlTxt: string, portalBaseUrl: any): Observable<string> {
    // Removes non-standard chars that can cause errors
    kmlTxt = kmlTxt.replace(/\x0e/g, '');
    kmlTxt = kmlTxt.replace(/\x02/g, '');
    // Inserts local paddle image to avoid CORS errors
    // Cesium does not load proxied images for some as yet unknown reason

    const overlay = this.groundOverlay(kmlTxt);

    // make a list of start and end positions for urls enclosed by the xml <Icon><href>
    let iconPosList: { start: number; end: number; }[] = [];
    iconPosList = this.getXmlElements(kmlTxt, '<Icon>', '</href>');
    if (iconPosList.length > 0) {

      // An array of Observables, where each represents a GET request
      const requests: Observable<{ status: boolean, url: string }>[] = [];

      const me = this;

      let iconCount = 0;
      iconPosList.forEach(iconItem => {
        iconCount++;
        const urlTxt = kmlTxt.substring(iconItem.start, iconItem.end);
        //if (iconCount === 1) { urlTxt += "_bad"; } // test to make a "bad" url
        requests.push(this.getIconRecord(urlTxt, portalBaseUrl));
      });

      const allOperations = forkJoin(requests);
      const observable = new Observable<string>(function subscribe(observer) {
        // Wait until all operations have completed
        allOperations.subscribe((res) => {
          // Now that data is 100% populated, emit to anything subscribed to cleanKML().

          // check for "bad" icon urls and replace any with "white-paddle"
          let i = 0;
          res.forEach(ui => {
            if (!ui['status']) { // for a "bad" url replace with "white-paddle" in the kml
              const iconItem = iconPosList[i];

              // Use the proxy
              const proxyUrl = portalBaseUrl + Constants.PROXY_API + "?usewhitelist=false&url=" + kmlTxt.substring(iconItem.start, iconItem.end);

              const startUrl = kmlTxt.substring(0, iconItem.start);
              const endUrl = kmlTxt.substring(iconItem.end, kmlTxt.length);

              if (overlay) {
                //kmlTxt = startUrl + proxyUrl + endUrl;
              } else {
                kmlTxt = startUrl + "extension/images/white-paddle.png" + endUrl;
              }
            }
            i++;
          })

          observer.next(kmlTxt);
          observer.complete();
        });

      });
      // We return the observable, with the code above to be executed only once it is subscribed to
      return observable;
    } else {
      return of(kmlTxt);
    }
  }

  /**
   * Clean KMZ text by removing illegal chars
   * future: when cesium support proxying of images
   *
   * @param kmzTxt KML text to be cleaned
   * @returns clean KML string
   */
  public cleanKMZ(kmZTxt: string): string {
    // Removes non-standard chars that can cause errors
    kmZTxt = kmZTxt.replace(/\x0e/g, '');
    kmZTxt = kmZTxt.replace(/\x02/g, '');
    return kmZTxt;
  }
}
