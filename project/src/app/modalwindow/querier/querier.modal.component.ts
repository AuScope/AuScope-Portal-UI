
import {UtilitiesService} from '../../portal-core-ui/utility/utilities.service';
import {Component} from '@angular/core';
import {environment} from '../../../environments/environment';
import {config} from '../../../environments/config';
import {ref} from '../../../environments/ref';
import {QuerierInfoModel} from '../../portal-core-ui/model/data/querierinfo.model';
import {NVCLService} from './customanalytic/nvcl/nvcl.service';
import {BsModalRef} from 'ngx-bootstrap';
import {OlClipboardService, Polygon} from '../../portal-core-ui/service/openlayermap/ol-clipboard.service';
import {ManageStateService} from '../../portal-core-ui/service/permanentlink/manage-state.service';
import {GMLParserService} from '../../portal-core-ui/utility/gmlparser.service';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {BehaviorSubject, of as observableOf} from 'rxjs';
import * as _ from 'lodash';
import { NgxXml2jsonService } from 'ngx-xml2json';


@Component({
  selector: 'app-querier-modal-window',
  templateUrl: './querier.modal.component.html',
  providers: [NVCLService],
  styleUrls: ['../modalwindow.scss']
})

export class QuerierModalComponent {
  public downloading: boolean;
  public docs: QuerierInfoModel[] = [];
  public htmls: QuerierInfoModel[] = [];
  public collapse: any[] = [];
  public uniqueLayerNames: string[] = [];
  public selectLayerNameFilter = 'ALL';
  public analyticMap;
  public tab: {};
  public bToClipboard = false;
  public data: FileNode[][] = [];
  dataChange: BehaviorSubject<FileNode[]>[] = [];
  private ngxXml2jsonService: NgxXml2jsonService = new NgxXml2jsonService();

  nestedTreeControl: NestedTreeControl<FileNode>[] = [];

  nestedDataSource: MatTreeNestedDataSource<FileNode>[] = [];

  constructor(public bsModalRef: BsModalRef, private nvclService: NVCLService, public olClipboardService: OlClipboardService,
    private manageStateService: ManageStateService, private gmlParserService: GMLParserService) {
    this.analyticMap = ref.analytic;

  }
  public getData() {return this.data}

  private _getChildren = (node: FileNode) => observableOf(node.children);

  hasNestedChild = (_: number, nodeData: FileNode) =>  (nodeData.children);

  public supportOpenInNewWindow(doc: QuerierInfoModel): boolean {
    return config.supportOpenInNewWindow.includes(doc.layer.id);
  }

  public newWindow(doc: QuerierInfoModel) {

    const state = _.cloneDeep(this.manageStateService.getState());
    const layerid = doc.layer.id;
    for (const key in state) {
      if (key !== layerid && key !== 'map') {
        delete state[key];
      }
      if (key === layerid) {
        state[key].raw = doc.raw;
        state[key].onlineResource = doc.onlineResource;
        state[key].gmlid = doc.key;
      }
    }

    const uncompStateStr = JSON.stringify(state);
    const me = this;
    this.manageStateService.getCompressedString(uncompStateStr, function(result) {
      // Encode state in base64 so it can be used in a URL
      const stateStr = UtilitiesService.encode_base64(String.fromCharCode.apply(String, result));
      const permanentlink = environment.hostUrl + '?state=' + stateStr
      window.open(permanentlink);
    });

  }


  public CopyToClipboard(document) {
    const name = document.key;
    const doc = document.value;
    let polygon: Polygon;
    if (name.indexOf('mineraltenement') >= 0) {
      polygon = this.gmlParserService.parseMultiPolygon(doc, 'srsName',
      config.clipboard.mineraltenement.geomKeyword,
      config.clipboard.mineraltenement.nameKeyword);
      polygon.srs = config.clipboard.mineraltenement.srsName;
    } else {
      polygon = this.gmlParserService.parseMultiPolygon(doc, 'srsName',
      config.clipboard.ProvinceFullExtent.geomKeyword,
      config.clipboard.ProvinceFullExtent.nameKeyword);
      // LJ: hacking due to openlayer rendering on map only support gml2.0.
      polygon.raw = document.raw.replace('http://www.opengis.net/gml/3.2', 'http://www.opengis.net/gml');
      polygon.srs = config.clipboard.ProvinceFullExtent.srsName;
    }
    if (polygon !== null) {
      this.olClipboardService.addPolygon(polygon);
      this.olClipboardService.toggleClipboard(true);
    }
  }

  public parseTree(document): void {
    const name = document.key;
    const doc = document.value;

    if (this.nestedDataSource[name]) {
      return;
    }

    if (!document.home) {
      document.home = true;
    }

    if (!document.loadSubComponent) {
      document.loadSubComponent = true;
    }

    const reg = new RegExp(config.clipboard.supportedLayersRegKeyword, 'gi');
    this.bToClipboard = name.search(reg) === -1 ? false : true;

    this.nestedTreeControl[name] = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource[name] = new MatTreeNestedDataSource();
    this.dataChange[name] = new BehaviorSubject<FileNode[]>(this.data[name]);
    this.dataChange[name].subscribe(data => {
      this.nestedDataSource[name].data = data;
      if (data !== undefined) {
        this.nestedTreeControl[name].expandDescendants(data[0]);
        const geomnode = this.findtheGeom(data[0]);
        if (geomnode) { this.nestedTreeControl[name].collapse(geomnode); }
      }
    });
    const data = this.buildFileTree(JSON.parse(`{"${name}":${JSON.stringify(this.ngxXml2jsonService.xmlToJson(doc))}}`), 0);

    this.dataChange[name].next(data);

  }

  findtheGeom(Node: FileNode): FileNode {
    if (Node.filename === 'the_geom' || Node.filename === 'shape' ) { return Node; }
    for (let i = 0; Node.children && i < Node.children.length; i++) {
      const foundnode = this.findtheGeom(Node.children[i]);
      if (foundnode) { return foundnode }
    }
    return null;
  }

  buildFileTree(value: any, level: number): FileNode[] {
    const data: any[] = [];
    for (const k in value) {
      const v = value[k];
      const node = new FileNode();
      node.filename = `${k}`.substring(`${k}`.indexOf(':') + 1, `${k}`.length);
      if (v === null || v === undefined) {
        // no action
      } else if (typeof v === 'object') {
        if (Object.keys(v).length !== 0) {
          node.children = this.buildFileTree(v, level + 1);
        } else { node.type = ''; }
      } else {
        node.type = v;
      }
      if (node.filename === '@attributes') {
        node.children.forEach(child => data.push(child));
      } else {
       data.push(node);
       }
    }
    return data;
  }

}

export class FileNode {
  children: FileNode[];
  filename: string;
  type: any;
}
