import { CSWRecordModel } from 'portal-core-ui/model/data/cswrecord.model';
import { CataloguesearchService } from './cataloguesearch.service';
import { OnlineResourceModel } from 'portal-core-ui/model/data/onlineresource.model';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'app-record-modal-content',
    templateUrl: './record.modal.component.html',
    styleUrls: ['./record.modal.component.scss']
})

export class RecordModalComponent implements OnInit {

    @Input() record: any;
    onlineResources: any;

    // Selections saved dialog
    @ViewChild('selectedDatasetsOkModal') public selectedDatasetsOkModal;


    constructor(private router: Router,
        private cswSearchService: CataloguesearchService,
        private modalService: NgbModal,
        public activeModal: NgbActiveModal) { }


    ngOnInit() {
        this.onlineResources = this.cswSearchService.supportedOnlineResources;
    }

    /*
     * Convenience methods to template to access CSWSearch Service
     */
    public getSupportedOnlineResourceTypes(): string[] {
        return this.cswSearchService.getSupportedOnlineResourceTypes();
    }

    public getOnlineResourcesByType(cswRecord: CSWRecordModel, type: string): OnlineResourceModel[] {
        return this.cswSearchService.getOnlineResourcesByType(cswRecord, type);
    }

}
