import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { OlMapService } from '@auscope/portal-core-ui';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent implements OnInit {

    // Emit sidebar expansion/contraction event on change
    @Output() sidebarExpansionEvent = new EventEmitter<boolean>();

    isActive: boolean = false;
    showMenu: string = '';

    // Sidebar expansion passed from parent layout component
    @Input() isSidebarExpanded: boolean;


    constructor(private olMapService: OlMapService) {
    }

    ngOnInit(): void {
    }

    /**
     * Set the sidebar style based on whether it is expanded or not
     */
    public setSidebarStyle(): any {
        let styles = {
            'left': this.isSidebarExpanded ? '200px' : '60px',
            'width': this.isSidebarExpanded ? '200px' : '60px',
            'margin-left': this.isSidebarExpanded ? '-200px' : '-60px'
        };
        return styles;
    }

    /**
     * Set whether the sidebar should be expanded or not
     *
     * @param expanded true if sidebar expanded, false if not
     */
    public setExpanded(expanded: boolean): void {
        this.sidebarExpansionEvent.emit(expanded);
        // Update map size after, skip a tick to ensure it happens after Sidebar UI update
        setTimeout(() => {
            this.olMapService.updateSize();
        });
    }

    eventCalled() {
        this.isActive = !this.isActive;
    }

    addExpandClass(element: any) {
        if (element === this.showMenu) {
            this.showMenu = '0';
        } else {
            this.showMenu = element;
        }
    }

    isMediaScreen(): boolean {
        return window.innerWidth <= 992;
    }

}
