import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { AuscopeApiService } from '../api/auscope-api.service';


@Injectable()
export class UserStateService {

  private _user: BehaviorSubject<User> = new BehaviorSubject(null);
  public readonly user: Observable<User> = this._user.asObservable();

  constructor(private apiService: AuscopeApiService) {}

  public updateUser(): Observable<User> {
    return this.apiService.user.pipe(
      map((user: User) => {
        // If full name is empty (as with AAF login), use email address as name
        if (user.fullName === undefined || user.fullName === '') {
          user.fullName = user.email;
        }
        this._user.next(user);

        // TODO: Update bookmarks when we have them

        return user;
    },
    // Failure to retrieve User means no User logged in
    () => {
      this.removeUser();
    }));
  }

  public removeUser() {
    this._user.next(null);
  }

}
