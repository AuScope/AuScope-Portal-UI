import { CSWRecordModel } from 'portal-core-ui/model/data/cswrecord.model';
import { CataloguesearchService } from './cataloguesearch.service';
import { OnlineResourceModel } from 'portal-core-ui/model/data/onlineresource.model';


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
        private userStateService: UserStateService,
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
