import { StatusMapModel } from '../../../../lib/portal-core-ui/model/data/statusmap.model';
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

  constructor(id: string, opacity: number, loadingSubject: BehaviorSubject<StatusMapModel>) {
    this.tabpanel = new UITabPanel();
    this.expanded = false;
    this.opacity = opacity;
    loadingSubject.subscribe((value) => {
      this.statusMap = value;
    });
  }

}
