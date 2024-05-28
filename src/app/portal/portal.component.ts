import { AuthService } from 'app/services/auth/auth.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from './sidebar.service';
/**
 * Defines the overall app layout
 */
@Component({
    selector: 'app-portal',
    templateUrl: './portal.component.html',
    styleUrls: ['../../styles.scss']
})
export class PortalComponent implements OnInit, OnDestroy  {
  private sidebarSubscription: Subscription;

  featuredLayersCheckbox: boolean = true;
  isSidebarOpen = false;
  
  constructor(private authService: AuthService, private modalService: BsModalService, private sidebarService: SidebarService

  ) {}

  /**
   * Featured layers would not display after logging in due to a strange UI bug, so by binding
   * the panel checkbox to a variable we can set it immediately after display to ensure the
   * panel is always expanded after a page refresh
   */
  ngOnInit() {
    this.sidebarSubscription = this.sidebarService.isSidebarOpen$.subscribe(isOpen => {
      this.isSidebarOpen = isOpen;
    });
    
  }

  ngOnDestroy() {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.featuredLayersCheckbox = true;
    }, 10);
  }
  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
  /**
   * Check is a user is logged in.
   *
   * @returns true if user logged in, false otherwise
   */
  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

}