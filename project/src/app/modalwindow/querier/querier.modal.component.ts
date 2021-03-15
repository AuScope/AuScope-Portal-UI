
import {UtilitiesService} from '@auscope/portal-core-ui';
import {Component} from '@angular/core';
import {environment} from '../../../environments/environment';
import {config} from '../../../environments/config';
import {ref} from '../../../environments/ref';
import {QuerierInfoModel} from '@auscope/portal-core-ui';
import {NVCLService} from './customanalytic/nvcl/nvcl.service';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {CsClipboardService, Polygon} from '@auscope/portal-core-ui';
import {ManageStateService} from '@auscope/portal-core-ui';
import {GMLParserService} from '@auscope/portal-core-ui';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {BehaviorSubject, of as observableOf} from 'rxjs';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Inject} from '@angular/core';
import * as _ from 'lodash';
import * as X2JS from 'x2js';
import { DomSanitizer } from '@angular/platform-browser';


export class FileNode {
  children: FileNode[];
  filename: string;
  type: any;
}

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
  public uniqueLayerNames: string[] = [];
  public selectLayerNameFilter = 'ALL';
  public analyticMap;
  public tab: {};
  public bToClipboard = false;
  public data: FileNode[][] = [];
  dataChange: BehaviorSubject<FileNode[]>[] = [];
  
  nestedTreeControl: NestedTreeControl<FileNode>[] = [];

  nestedDataSource: MatTreeNestedDataSource<FileNode>[] = [];

  constructor(public bsModalRef: BsModalRef, public CsClipboardService: CsClipboardService,
    private manageStateService: ManageStateService, private gmlParserService: GMLParserService, 
        private http: HttpClient, @Inject('env') private env, private sanitizer: DomSanitizer) {
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
    this.manageStateService.getCompressedString(uncompStateStr, function(result) {
      // Encode state in base64 so it can be used in a URL
      const stateStr = UtilitiesService.encode_base64(String.fromCharCode.apply(String, result));
      const permanentlink = environment.hostUrl + '?state=' + stateStr
      window.open(permanentlink);
    });

  }


  /**
   * Copy drawn polygon to clipboard
   * @param document polygon as document
   */
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
      this.CsClipboardService.addPolygon(polygon);
      this.CsClipboardService.toggleClipboard(true);
    }
  }
  
  public transformToHtml(document): void {    
    if (document.transformed) {
       // this is when you're clicking to close an expanded feature
       return;
    }
    if (!document.raw.includes("gml")) {
       // We don't care about formatting non gml
       return this.parseTree(document);
    }
    let formdata = new HttpParams();
    formdata = formdata.append('gml', document.value.outerHTML);
    
    this.http
        .post(this.env.portalBaseUrl + 'transformToHtmlPopup.do', formdata.toString(),
            {headers: 
                new HttpHeaders().set('Content-Type','application/x-www-form-urlencoded'),
                responseType: 'text'
            })
        .subscribe(
            response => { 
                var bodyHtml = /<body.*?>([\s\S]*)<\/body>/.exec(response)[1];
                if (bodyHtml.length < 1) {
                    // if no transformation, fallback to XML tree
                    return this.parseTree(document);
                }
                //sanitizer will make sure the HTML styling is applied
                document.transformed = this.sanitizer.bypassSecurityTrustHtml(response);
                if (!document.transformed) {
                    // fallback to XML tree
                    return this.parseTree(document);
                }
                document.home = true;
                document.loadSubComponent = true
            }, 
            // try default XML tree display
            error => { this.parseTree(document) }
        );
  }


  /**
   * Parses server response and builds a document tree
   * @param document server response object
   */
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

    let result = doc;
    // If it is not JSON then convert to JSON
    if (document.hasOwnProperty('format') && document.format !== 'JSON') {
      try {
        // Convert XML to JSON object
        const x2jsObj = new X2JS();
        result = x2jsObj.xml2js(doc.outerHTML);
      } catch (e) {
        console.log('XML to JSON conversion error: ', e);
      }
    }
    const data = this.buildFileTree(JSON.parse(`{"${name}":${JSON.stringify(result)}}`), 0);
    this.dataChange[name].next(data);
  }


  /**
   * Recursively searches for geometry elements
   * @param Node starts search here
   * @returns a geometry FileNode or null
   */
  private findtheGeom(Node: FileNode): FileNode {
    if (Node.filename === 'the_geom' || Node.filename === 'shape' ) { return Node; }
    for (let i = 0; Node.children && i < Node.children.length; i++) {
      const foundnode = this.findtheGeom(Node.children[i]);
      if (foundnode) { return foundnode }
    }
    return null;
  }

  /**
   * Recursively builds a display tree using 'FileNode' elements
   * @param value current node value
   * @param level recursion depth
   */
  private buildFileTree(value: any, level: number): FileNode[] {
    const data: any[] = [];
    for (const k in value) {
      // Remove __prefix
      if (k === '__prefix') {
        continue;
      }
      // RA: Remove namespace declarations
      if (k.startsWith('_xmlns')) {
        continue;
      }      
      
      const v = value[k];
      const node = new FileNode();

      // RA AUS-3342: make popup labels more friendly 
      if (level > 0) {
          node.filename = this.formatLabels(`${k}`);
      } else {
          // gml:id to stay as is
          node.filename = `${k}`;
      }      
      
      if (v === null || v === undefined) {
        // no action
      } else if (typeof v === 'object') {
        // Use '__text' as value (RHS column in popup)
        if (v.hasOwnProperty('__text')) {
          node.type = v['__text'];
        } else if (Object.keys(v).length !== 0) {
          node.children = this.buildFileTree(v, level + 1);
        } else {
          node.type = '';
        }
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


  /**
   * Reformats labels to make them more user-friendly
   * @param label label string
   * @returns formatted label string
   */
  private formatLabels(label: string): string {
    // remove prefix
    var filename = label.substring(label.indexOf(':') + 1, label.length);
    // Remove leading underscores from name (LHS column in popup)
    while (filename.startsWith('_')) {
        filename = filename.substring(1);
    }
    // separate camel case e.g. observationMethod
    filename = filename.replace(/([a-z])([A-Z])/g, '$1 $2');
    // separate "_"
    filename = filename.split(/[_]/).join(" ");
    var terms = filename.split(" ");
    for(var j = 0; j < terms.length; j++) {
        const term = terms[j];
        switch(term) {
            // capitalise abbreviations
            // i.e. UOM, SRS, URI, HREF
            case 'uom':
            case 'uri':
            case 'srs':
            case 'nvcl':
            case 'href': {
                terms[j] = term.toUpperCase();
                break;
            }
            // put uom in brackets
            case 'm': {  
                terms[j] = "(" + term + ")";
                break;
            }
            // handle geom pos and posList
            case 'pos': { 
                terms[j] = 'Position';
                break;
            }
            case 'posList': {
                terms[j] = 'Position List';
                break;
            }                          
            default: {
                // make sure each first letter is capitalised
                terms[j] = term[0].toUpperCase() + term.slice(1);
            }
        }
    }
    return terms.join(" ");  
  }

}


