import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isSidebarOpenSubject = new BehaviorSubject<boolean>(false);
  isSidebarOpen$ = this.isSidebarOpenSubject.asObservable();

  public setOpenState(isOpen: boolean): void {
    this.isSidebarOpenSubject.next(isOpen);
  }
  
  toggleSidebar() {
    const currentState = this.isSidebarOpenSubject.getValue();
    this.isSidebarOpenSubject.next(!currentState);
  }
}
