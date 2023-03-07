import { Injectable } from '@angular/core';
import { Bookmark } from 'app/models/bookmark.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { AuscopeApiService } from '../api/auscope-api.service';


@Injectable()
export class UserStateService {

  // User
  private _user: BehaviorSubject<User> = new BehaviorSubject(null);
  public readonly user: Observable<User> = this._user.asObservable();

  // Bookmarks for User
  private _bookmarks: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  public readonly bookmarks: Observable<Bookmark[]> = this._bookmarks.asObservable();


  constructor(private apiService: AuscopeApiService) {}

  /**
   * Get the currently logged in user (if one is logged in)
   *
   * @returns currently logged in user as Observable
   */
  public updateUser(): Observable<User> {
    return this.apiService.user.pipe(
      map((user: User) => {
        // If full name is empty (as with AAF login), use email address as name
        if (user.fullName === undefined || user.fullName === '') {
          user.fullName = user.email;
        }
        this._user.next(user);

        // Update user's bookmarks
        this.updateBookmarks();

        return user;
    },
    // Failure to retrieve User means no User logged in
    () => {
      this.logoutUser();
    }));
  }

  /**
   * Logout the current user
   */
  public logoutUser() {
    this._bookmarks.next([]);
    this._user.next(null);
  }

  /**
   * Update the user's bookmarks list
   */
  private updateBookmarks() {
    this.apiService.getBookmarks().subscribe(bookmarklist => this._bookmarks.next(bookmarklist));
  }

  /**
   * Add a bookmark
   *
   * @param layerId layer ID
   */
  public addBookmark(layerId: string) {
    this.apiService.addBookmark(layerId).subscribe(newBookmarkId => {
      this.bookmarks.subscribe(currentBookmarks => {
        if (!currentBookmarks.find(b => b.fileIdentifier === layerId)) {
          const newBookmark: Bookmark = {
            id: newBookmarkId,
            fileIdentifier: layerId,
            serviceId: ''
          }
          currentBookmarks.push(newBookmark);
        }
      });
    }, error => {
      console.log('Error adding bookmark: ', error);
    });
  }

  /**
   * Delete bookmark
   *
   * @param layerId layer ID
   */
  public removeBookmark(layerId: string) {
    // Get bookmark ID
    this.bookmarks.pipe(take(1)).subscribe(bookmarks => {
      for (const b of bookmarks) {
        if (b.fileIdentifier === layerId) {
          const bookmarkId = b.id;
          // Delete from DB
          this.apiService.removeBookmark(bookmarkId).subscribe(() => {
            const i = bookmarks.findIndex(item => {
              return (item.id === bookmarkId);
            });
            if (i > -1) {
              bookmarks.splice(i, 1);
              this._bookmarks.next(bookmarks);
            }
          }, error => {
            console.log('Error removing bookmark: ', error);
          });
          break;
        }
      }
    });
  }

}
