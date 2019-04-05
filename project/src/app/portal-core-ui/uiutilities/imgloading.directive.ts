import { Directive, ElementRef, HostListener } from '@angular/core';

/** This directive adds a spinner image to the background of an <img> tag.
 The spinner will disappear once the image is loaded or an error occurs.
 NOTA BENE: This directive modifies the 'style' attribute of the <img>.
 */
@Directive({ selector: '[appImgLoading]' })
export class ImgLoadingDirective {
    /**
      * Gets called at the start, adds a spinner to the loading image
      */
    constructor(private el: ElementRef) {
        el.nativeElement.setAttribute('style', 'background: transparent url(extension/images/ajax-loader.gif) no-repeat scroll center');
    }

    /**
     * Gets called when image has loaded, it removes the spinner
     */
    @HostListener('load') onImageLoad() {
        this.el.nativeElement.removeAttribute('style');
    }

    /**
     * Gets called when image fails to load, it removes the spinner and adds a brief error message
     */
    @HostListener('error') onImageError() {
        this.el.nativeElement.removeAttribute('style');
        this.el.nativeElement.setAttribute('alt', 'Image not found');
    }
}
