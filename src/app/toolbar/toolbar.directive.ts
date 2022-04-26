import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[toolbar]',
})
export class ToolbarDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
