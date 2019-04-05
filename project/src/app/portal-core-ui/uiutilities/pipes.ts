import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Pipe for retriving the key in a associative array
 */
@Pipe({name: 'getKey'})
export class KeysPipe implements PipeTransform {
  transform(value, args: string[]): any {
    const keys = [];
    for (const key in value) {
      keys.push({key: key, value: value[key]});
    }
    return keys;
  }
}

/**
 * Pipe used for searching and filtering the layer
 */
@Pipe({name: 'querierFeatureSearchPipe'})
export class QuerierFeatureSearchPipe implements PipeTransform {
  transform(value, args?): Array<any> {
    if (value && value.length > 0) {
      return value.filter(feature => {
        if (feature.layer.name) {
          if (feature.layer.name === args || args === 'ALL' ) {
            return true;
          }
        }
      });
    } else {
      return value;
    }
  }
}
/**
 * Pipe used to mark a resource url as trusted e.g in a iframe
 */
@Pipe({ name: 'trustResourceUrl' })
export class TrustResourceUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

/**
 * Pipe used to mark the resource html as trusted
 */
@Pipe({ name: 'trustResourceHtml' })
export class TrustResourceHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(html) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
