import { StatusMapModel } from '@auscope/portal-core-ui';
import { UITabPanel } from './uitabpanel.model';
import { BehaviorSubject } from 'rxjs';

/**
 * a representation of the state of the panel component in the expanded panel.
 */
export class UILayerModel {
  expanded: boolean;
  tabpanel: UITabPanel;
  statusMap: StatusMapModel;
  opacity: number;

  constructor(public id: string, public loadingSubject: BehaviorSubject<StatusMapModel>) {
    this.tabpanel = new UITabPanel();
    this.expanded = false;
    this.opacity = 100;
    loadingSubject.subscribe((value) => {
      this.statusMap = value;
    });
  }

}
