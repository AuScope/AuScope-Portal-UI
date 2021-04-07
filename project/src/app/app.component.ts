import { Component, OnInit, HostListener } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    // Will affect both sidebar and main contiainer widths
    isSidebarExpanded: boolean = true;


    constructor() { }


    ngOnInit() {
        if(window.innerWidth <= 992) {
            this.isSidebarExpanded = false;
        }
    }

    /**
     * Set the style for the main container depending on whether the sidebar is
     * expanded
     */
    public setMainContainerStyle(): any {
        let marginLeft = '0px';
        if(window.innerWidth > 992) {
            if(this.isSidebarExpanded) {
                marginLeft = '200px';
            } else {
                marginLeft = '60px';
            }
        }
        let styles = {
            'margin-left': marginLeft,
            'margin-right': '12px'
        };
        return styles;
    }

    /**
     * Catch the sidebar expansion/contraction event fired in the sidebar
     * component
     *
     * @param event will be true or false depending on whether the sidebar is
     * expanded (true) or contracted (false)
     */
    public sidebarExpanded(event) {
        this.isSidebarExpanded = event;
    }

    /**
     * Catch the inner width changing so we can programtically detect when the
     * screen changes to media (<= 992)
     * 
     * @param event 
     */
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        if(window.innerWidth <= 992) {
            this.sidebarExpanded(false);
        }
    }
}
