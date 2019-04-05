import {Directive, HostListener} from '@angular/core';

/**
 * helper directive to stop the click event from propagating upwards
 */
@Directive({
    selector: '[appStopPropagation]'
})
export class StopPropagationDirective {
    @HostListener('click', ['$event'])
    public onClick(event: any): void {
        event.stopPropagation();
    }
}
