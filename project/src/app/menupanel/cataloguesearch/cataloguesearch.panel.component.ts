import { Component, OnInit } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { CatalogueSearchModalComponent } from '../../modalwindow/cataloguesearch/cataloguesearch.modal.component';

@Component({
  selector: 'appCatalogueSearchPanel',
  templateUrl: './cataloguesearch.panel.component.html',
  styleUrls: ['../menupanel.scss']
})
export class CatalogueSearchPanelComponent implements OnInit {
  private modalRef;

  constructor(private modalService: BsModalService) { }

  ngOnInit() {
  }
  
  OpenCatalogueSearchModal(): void {
    this.modalRef = this.modalService.show(CatalogueSearchModalComponent);
  }
 
}
