import { Inject, Injectable } from '@angular/core';
import { Bookmark } from 'app/models/bookmark.model';
import { PermanentLink } from 'app/models/permanentlink.model';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { User } from '../../models/user.model';
import { AuscopeApiService } from '../api/auscope-api.service';
import { CsMapService, ManageStateService, Polygon, UtilitiesService } from '@auscope/portal-core-ui';
import { v4 as uuidv4 } from 'uuid';
import { HttpResponse } from '@angular/common/http';
import { environment } from 'environments/environment';
import { UILayerModelService } from '../ui/uilayer-model.service';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';


@Injectable()
export class UserStateService {

  // User
  private _user: BehaviorSubject<User> = new BehaviorSubject(null);
  public readonly user: Observable<User> = this._user.asObservable();

  // Bookmarks for User
  private _bookmarks: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  public readonly bookmarks: Observable<Bookmark[]> = this._bookmarks.asObservable();

  // Portal map states for User
  private _states: BehaviorSubject<PermanentLink[]> = new BehaviorSubject([]);
  public readonly states: Observable<PermanentLink[]> = this._states.asObservable();

  //ROI for User
  public roiList:Polygon[] = [];
  public roiKey = '';

  constructor(private apiService: AuscopeApiService, private manageStateService: ManageStateService, private csMapService: CsMapService, @Inject(LOCAL_STORAGE) private storage: StorageService, private uiLayerModelService: UILayerModelService) {}

  /**
   * Get the currently logged in user (if one is logged in)
   *
   * @returns currently logged in user as Observable
   */
  public updateUser() {
    this.apiService.user.subscribe(user => {
      // If full name is empty (as with AAF login), use email address as name
      if (user.fullName === undefined || user.fullName === '') {
        user.fullName = user.email;
      }
      this._user.next(user);
      // Update user's bookmarks and map states
      this.updateBookmarks();
      this.updateUserStates();
      // Update user's ROI
      this.updateUserROI(user);
    }, () => {
      // Failure to retrieve User means no User logged in
      this.logoutUser();
      return of(undefined);
    });
  }

  /**
   * Logout the current user
   */
  public logoutUser() {
    this._bookmarks.next([]);
    this._states.next([]);
    this._user.next(undefined);
  }

  /**
   * Update the user's bookmarks list
   */
  private updateBookmarks() {
    this.apiService.getBookmarks().subscribe(
      bookmarklist => this._bookmarks.next(bookmarklist)
    );
  }

  /**
   * Add a bookmark
   *
   * @param layerId layer ID
   */
  public addBookmark(layerId: string) {
    this.apiService.addBookmark(layerId).subscribe(newBookmarkId => {
      this.bookmarks.pipe(take(1)).subscribe(currentBookmarks => {
        if (!currentBookmarks.find(b => b.fileIdentifier === layerId)) {
          const newBookmark: Bookmark = {
            id: newBookmarkId,
            fileIdentifier: layerId,
            serviceId: ''
          }
          currentBookmarks.push(newBookmark);
        }
      });
    });
  }

  /**
   * Delete bookmark
   *
   * @param layerId layer ID
   */
  public removeBookmark(layerId: string) {
    this.bookmarks.pipe(take(1)).subscribe(currentBookmarks => {
      const bm = currentBookmarks.find(b => b.fileIdentifier === layerId);
      if (bm) {
        this.apiService.removeBookmark(bm.id).subscribe(() => {
          const newBookmarks = currentBookmarks.filter(b => b.id !== bm.id);
          this._bookmarks.next(newBookmarks);
        });
      }
    });
  }

  /**
   * Retrieve a list of map states associated with the user
   */
  public updateUserStates() {
    this.apiService.getUserPortalStates().subscribe(
      statelist => this._states.next(statelist)
    );
  }

  /**
   * Add a map state associated with the user
   *
   * @param name the name of the state
   * @param description optional state description
   * @param isPublic whether the link is publically accessible
   */
  public addState(name: string, description: string, isPublic: boolean, anonymous: boolean): Observable<any> {
    const id = uuidv4();
    const state = this.manageStateService.getState();
    // Add the base map to the state
    const baseMapImagery = this.csMapService.getViewer().baseLayerPicker.viewModel.selectedImagery;
    const baseMap = environment.baseMapLayers.find(bm => bm.viewValue === baseMapImagery.name);
    if (baseMap) {
      state.baseMap = baseMap.value;
    }
    // Add the index position of each layer to the state object
    for (const layerKey of Object.keys(state)) {
      if (layerKey.toLowerCase() !== 'map' && layerKey.toLowerCase() !== 'basemap') {
        const layerIndex = this.csMapService.getLayerIndex(layerKey);
        state[layerKey].index = layerIndex;
        state[layerKey].opacity = this.uiLayerModelService.getUILayerModel(layerKey).opacity;
      }
    }

    // Differentiate between anonymous and user call
    let apiCall = this.apiService.saveAnonymousPortalState(id, name, description, JSON.stringify(state), isPublic);
    if (!anonymous) {
      apiCall = this.apiService.saveUserPortalState(id, name, description, JSON.stringify(state), isPublic);
    }
    return apiCall.pipe(map(response => {
      if (response['success']) {
        response['id'] = id;
      }
      return response;
    }), catchError(
      (error: HttpResponse<any>) => {
        return throwError(error);
      }
    ), );
  }

  /**
   * Update an existing state (name, description and isPublic only)
   *
   * @param id ID of state
   * @param userId ID of user
   * @param name name of state
   * @param description optional state description
   * @param isPublic if false, only user can load state, if true there are no restrictions
   * @returns ID of state on success
   */
  public updateState(id: string, userId: string, name: string, description: string, isPublic: boolean): Observable<any> {
    return this.apiService.updateUserPortalState(id, userId, name, description, isPublic).pipe(map(response => {
      if (response['success']) {
        response['id'] = id;
      }
      return response;
    }));
  }

  /**
   * Remove map state associated with user
   *
   * @param id ID of the state
   */
  public removeState(id: string): Observable<any> {
    return this.apiService.deleteUserPortalState(id).pipe(map(response => {
      return response;
    }));
  }

  /**
   * Get a specific State for the current user. If state layers contain an index field they will be sorted by this.
   *
   * @param stateId state ID
   * @returns the protal state as a JSON Object
   */
  getPortalState(stateId: string): Observable<any> {
    if (!stateId) {
      return of({});
    }
    return this.apiService.getPortalState(stateId).pipe(map(state => {
      if (state) {
        return state.jsonState;
      }
      return undefined;
    }), catchError(
      (error: HttpResponse<any>) => {
        return of(undefined);
      }),
    );
  }
  /**
   * Save the user's list of ROI
   */
  public saveROI() {
    if (UtilitiesService.isEmpty(this.roiKey))
      return;

    let strROIs = JSON.stringify(this.roiList);
    this.storage.set(this.roiKey, strROIs);
  }

  /**
   * Retrieve a list of ROI associated with the user
   * @param user
   */
  public updateUserROI(user:User){
    let key = user.id + user.email + user.fullName;
    this.roiKey = key.replace(' ','-');
    if (this.storage.has(this.roiKey)){
      let strROIs = this.storage.get(this.roiKey);
      this.roiList = JSON.parse(strROIs);
    }
  }
}
