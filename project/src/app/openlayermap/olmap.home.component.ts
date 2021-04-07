import { config } from '../../environments/config';
import { ref } from '../../environments/ref';
import {QuerierModalComponent} from '../modalwindow/querier/querier.modal.component';
import { CSWRecordModel } from '@auscope/portal-core-ui';
import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import olZoom from 'ol/control/Zoom';
import olScaleLine from 'ol/control/ScaleLine';
import {BsModalService, BsModalRef} from 'ngx-bootstrap/modal';
import {OlMapObject} from '@auscope/portal-core-ui';
import {OlMapService} from '@auscope/portal-core-ui';
import {ManageStateService } from '@auscope/portal-core-ui';
import {OlCSWService } from '@auscope/portal-core-ui';
import {QueryWFSService} from '@auscope/portal-core-ui';
import {QueryWMSService} from '@auscope/portal-core-ui';
import {GMLParserService} from '@auscope/portal-core-ui';
import {SimpleXMLService} from '@auscope/portal-core-ui';
import { UtilitiesService } from '@auscope/portal-core-ui';
import olControlMousePosition from 'ol/control/MousePosition';
import * as olCoordinate from 'ol/coordinate';

@Component({
  selector: 'home-map',
  templateUrl: './olmap.home.component.html',
  styleUrls: ['./olmap.component.css']
})

export class OlMapHomeComponent {


}
