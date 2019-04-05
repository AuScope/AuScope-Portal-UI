import { OnlineResourceModel } from './onlineresource.model';
import {BehaviorSubject} from 'rxjs';

/**
 * A representation of the current rendering status of a layer. User should not be directly accessing these under
 * normal circumstances. Use RenderStatusService instead which provides a wrapper to get these updates
 */
export class StatusMapModel {
  private layerid: string;
  private total: number;
  private completed: number;
  private completePercentage: string;
  public resourceMap: Object;
  private renderComplete: boolean;
  private renderStarted: boolean;
  private containsError: boolean;
  private _statusMap = new BehaviorSubject<StatusMapModel>(this);


  constructor(layerid: string) {
    this.layerid = layerid;
    this.completed = 0;
    this.total = 0;
    this.resourceMap = {};
    this.renderComplete = false;
    this.renderStarted = false;
    this.containsError = false;
  }

  /**
   * Add resource to the counter and update its status
   * @param onlineresource  online resource that is being loaded now
   */
  public updateTotal(onlineresource: OnlineResourceModel) {
    if (!this.resourceMap[onlineresource.url]) {
      this.resourceMap[onlineresource.url] = {};
    }
    this.resourceMap[onlineresource.url].status = 'Loading...';
    if (!this.resourceMap[onlineresource.url].total) {
      this.resourceMap[onlineresource.url].total = 0;
    }
    this.resourceMap[onlineresource.url].total += 1;
    this.total += 1;
    this.renderStarted = true;
    this._statusMap.next(this);
  }

  /**
   * Register a resource without updating it
   * @param onlineresource  online resource that is being loaded now
   */
  public register(onlineresource: OnlineResourceModel) {
    if (!this.resourceMap[onlineresource.url]) {
      this.resourceMap[onlineresource.url] = {};
    }
    this.resourceMap[onlineresource.url].status = 'Loading...';
    if (!this.resourceMap[onlineresource.url].total) {
      this.resourceMap[onlineresource.url].total = 0;
    }
    if (this.total === 0) {
      this.completePercentage = '0%'
    } else {
      this.completePercentage = Math.floor(this.completed / this.total * 100) + '%';
    }
    this.renderStarted = true;
    this._statusMap.next(this);
  }
   /**
   * Add resource to the counter and update its status
   * @param onlineresource  online resource that is being loaded now
   */
  public skip(onlineresource: OnlineResourceModel) {
    if (!this.resourceMap[onlineresource.url]) {
      this.resourceMap[onlineresource.url] = {};
    }
    this.resourceMap[onlineresource.url].status = 'Skipped';
    this._statusMap.next(this);
  }

  /**
   * update the counter for each completed job
   * @param onlineresource  online resource that is being updated
   * @param error? a optional parameter to flag there was an error in the download of the resource.
   */
  public updateComplete(onlineresource: OnlineResourceModel, error?: boolean) {
    this.completed += 1;
    if (!this.resourceMap[onlineresource.url]) {
      return;
    }
    if (!this.resourceMap[onlineresource.url].completed) {
      this.resourceMap[onlineresource.url].completed = 0;
    }
    this.resourceMap[onlineresource.url].completed += 1;

    if (Math.floor(this.completed / this.total * 100) > 100) {
      // VT: This is a problem when user adds and immediately delete the layer which corrupts the listeners
      this.completePercentage = '100%';
    } else {
      this.completePercentage = Math.floor(this.completed / this.total * 100) + '%';
    }
    if (error) {
      this.resourceMap[onlineresource.url].status = 'Error';
      this.containsError = true;
    }
    if (this.resourceMap[onlineresource.url].total ===  this.resourceMap[onlineresource.url].completed) {
      if (this.resourceMap[onlineresource.url].status !== 'Error') {
        this.resourceMap[onlineresource.url].status = 'Complete';
      }
    }
    if (this.completed === this.total) {
      this.renderComplete = true;
      this._statusMap.next(this);
    }
  }

  /**
   * Return a behavior subject so that any class listening to any status update can subscribe to the event
   * @returns a subscriptable object
   */
  public getStatusBSubject(): BehaviorSubject<StatusMapModel> {
    return this._statusMap;
  }

  /**
   * reset the status object to start from fresh again
   */
  public resetStatus() {
    this.completed = 0;
    this.total = 0;
    this.resourceMap = {};
    this.renderComplete = false;
    this.renderStarted = false;
    this.containsError = false;
    this._statusMap.next(this);
  }

}
