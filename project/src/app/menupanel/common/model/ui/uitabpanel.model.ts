/**
 * A representation of the tabpanel used in the expanded panel for each layer
 */
export class UITabPanel {
    filterpanel: {
        expanded: boolean,
    };
    infopanel: {
        expanded: boolean,
    };
    downloadpanel: {
        expanded: boolean,
    };

  constructor() {
    this.filterpanel = {
      expanded: true
    };
    this.infopanel = {
      expanded: false
    };
    this.downloadpanel = {
      expanded: false
    };
  }

  public setPanelOpen(panelType: string): void {
    if (panelType === 'filterpanel') {
      this.filterpanel.expanded = true;
      this.infopanel.expanded = false;
      this.downloadpanel.expanded = false;
    }else if (panelType === 'infopanel') {
      this.filterpanel.expanded = false;
      this.infopanel.expanded = true;
      this.downloadpanel.expanded = false;
    }else if (panelType === 'downloadpanel') {
      this.filterpanel.expanded = false;
      this.infopanel.expanded = false;
      this.downloadpanel.expanded = true;
    }
  }
}

