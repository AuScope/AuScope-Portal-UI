import { AuthService } from 'app/services/auth/auth.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from './sidebar.service';
/**
 * Defines the overall app layout
 */
@Component({
    selector: 'app-portal',
    templateUrl: './portal.component.html',
    styleUrls: ['../../styles.scss'],
    standalone: false
})
export class PortalComponent implements OnInit, OnDestroy, AfterViewInit {
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
  ngOnInit(): void {
    this.sidebarSubscription = this.sidebarService.isSidebarOpen$.subscribe(isOpen => {
      this.isSidebarOpen = isOpen;
    });

  }

  ngOnDestroy(): void {
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.featuredLayersCheckbox = true;
    }, 10);
  }

  toggleSidebar(): void {
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
