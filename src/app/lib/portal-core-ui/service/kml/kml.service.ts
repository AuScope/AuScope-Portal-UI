import { Injectable, Inject } from '@angular/core';

/**
 * This service class contains functions used for manipulating KML documents
 */
@Injectable({
  providedIn: 'root'
})
export class KMLDocService {

  constructor(@Inject('env') private env) { }

  /**
   * Clean KML text by removing illegal chars and 
   * forcing proxying of icon images to avoid CORS errors
   * 
   * @param kmlTxt KML text to be cleaned
   * @returns clean KML string
   */
  public cleanKML(kmlTxt: string): string {
    // Removes non-standard chars that can cause errors
    kmlTxt = kmlTxt.replace(/\x0e/g, '');
    kmlTxt = kmlTxt.replace(/\x02/g, '');
    // Inserts local paddle image to avoid CORS errors
    // Cesium does not load proxied images for some as yet unknown reason
    kmlTxt = kmlTxt.replace(/<Icon>\s*<href>.*<\/href>/g, 
             '<Icon>\n<href>extension/images/white-paddle.png</href>');
    return kmlTxt;
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
