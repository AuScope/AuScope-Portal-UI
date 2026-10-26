import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private readonly _isSidebarOpen = signal(false);

  readonly isSidebarOpen = this._isSidebarOpen.asReadonly();

  public setOpenState(isOpen: boolean): void {
    this._isSidebarOpen.set(isOpen);
  }

  public toggleSidebar(): void {
    this._isSidebarOpen.update(current => !current);
  }
}
