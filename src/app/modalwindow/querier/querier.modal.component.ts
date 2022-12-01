import { ApplicationRef, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { config } from '../../../environments/config';
import { ref } from '../../../environments/ref';
import { CsClipboardService, GMLParserService, ManageStateService, Polygon, QuerierInfoModel } from '@auscope/portal-core-ui';
import { NVCLService } from './customanalytic/nvcl/nvcl.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as _ from 'lodash';
import * as X2JS from 'x2js';
import { DomSanitizer } from '@angular/platform-browser';
import { MSCLService } from '../layeranalytic/mscl/mscl.service';

export class FileNode {
  children: FileNode[];
  filename: string;
  type: any;
}

/** Flat node with expandable and level information */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-querier-modal-window',
  templateUrl: './querier.modal.component.html',
  providers: [],
  styleUrls: ['../modalwindow.scss']
})

export class QuerierModalComponent  implements OnInit {
  public downloading: boolean;
  public transformingToHtml: Map<string, boolean> = new Map<string, boolean>();
  public docs: QuerierInfoModel[] = [];
  public htmls: QuerierInfoModel[] = [];
  public uniqueLayerNames: string[] = [];
  public selectLayerNameFilter = 'ALL';
  public analyticMap;
  public tab: {};
  public bToClipboard = false;
  public hasMsclAnalytics = false; // Display 'Analytics' tab to analyse GML observations

  // Show a message to zoom in
  public showZoomMsg: boolean = false;

  /* Transforms FileNode into displayable node */
  private _transformer = (node: FileNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      filename: node.filename,
      type: node.type,
      level: level,
    };
  };

  // Data Structures used to create a folding flat tree which displays feature data
  public flatTreeControl = {};
  public treeFlattener = new MatTreeFlattener(this._transformer, node => node.level, node => node.expandable, node => node.children);
  public flatTreeDataSource = {}; // Tree structure is assigned to this

  // Does the 'FlatNode' have children?
  public hasChild = (_: number, node: FlatNode) => node.expandable;


  /**
   * 
   * Reflects the value of nvclService.getAnalytic(); updates the html Analytic TAB
   * 
   * When a "borehole name" is clicked on, onDataChange() is fired and a detectChanges() event causes
   * nvclService.getNVCLDatasets() to be called from nvcl.datasetlist.component.ts
   * This will set the "isAnalytic" variable in the service nvcl.service.ts to be set (boolean).
   * 
   * Note: to support this, nvcl.service was removed as a provide from this component and datasetlist
   * The reason for this is to prevent the service from being instantiated for each component.
   * The app.module.ts code was updated to add this service in the providers list - making it a global instance
   * 
   * If this was not done the two components would not see the same state of the service variable "isAnalytic"
  */
  public flagNVCLAnalytic: boolean;

  constructor(public nvclService: NVCLService, public bsModalRef: BsModalRef, public csClipboardService: CsClipboardService,
        private manageStateService: ManageStateService, private gmlParserService: GMLParserService,
        private http: HttpClient, @Inject('env') private env, private sanitizer: DomSanitizer,
        private changeDetectorRef: ChangeDetectorRef, private appRef: ApplicationRef,
        private msclService: MSCLService) {
    this.analyticMap = ref.analytic;
    this.flagNVCLAnalytic = false;
  }

  ngOnInit() {

  /**
   * Checks the state of "isAnalytic" variable in the nvclService - observable
   * and updates the local variable "flagNVCLAnalytic" - which updates the Analytic TAB in the html
   */
    this.nvclService.getAnalytic().subscribe((result) => {
      // console.log("[querier]ngOnInit().getAnalytic() = "+result);
      this.flagNVCLAnalytic = result;

      // Calling this to update the UI
      this.onDataChange();
    });

  }

  /**
   * Returns true iff layer is NVCL layer
   * 
   * @param layer layer identifier string
   * @returns true iff layer is NVCL layer
   */
  public isNVCL(layer: string): boolean {
    return this.nvclService.isNVCL(layer);
  }

  /**
   * Returns true if this supports open in new window
   * 
   * @param doc 
   * @returns boolean
   */
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

    // Store state object in DB & open up window
    const uncompStateStr = JSON.stringify(state);
    this.manageStateService.saveStateToDB(uncompStateStr).subscribe((response: any) => {
      if (response.success === true) {
        window.open(environment.hostUrl + '?state=' + response.id);
      }
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
      this.csClipboardService.clearClipboard();
      this.csClipboardService.addPolygon(polygon);
      this.csClipboardService.toggleClipboard(true);
      this.appRef.tick();
    }
  }

  // Look for changes and update UI after brief delay
  public onDataChange(): void {
    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 50);
  }

  /**
   * This gets called from the UI when user clicks on first link in popup
   * 
   * @param document
   */
  public transformToHtml(document): void {

    if (this.msclService.usesGMLObs(document.raw)) {
      this.hasMsclAnalytics = true;
    }

    if (!document.expanded) {
      document.expanded = true;
    } else {
      document.expanded = !document.expanded;
    }

    if (document.transformed) {
       // this is when you're clicking to close an expanded feature
       return;
    }
    if (!document.raw.includes('gml')) {
       // We don't care about formatting non gml
       return this.parseTree(document);
    }

    this.transformingToHtml[document.key] = true;
    this.changeDetectorRef.detectChanges();

    let formdata = new HttpParams();
    formdata = formdata.append('gml', document.value.outerHTML);

    this.http.post(this.env.portalBaseUrl + 'transformToHtmlPopup.do', formdata.toString(), {
        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
        responseType: 'text'}).subscribe(response => {
      const bodyHtml = /<body.*?>([\s\S]*)<\/body>/.exec(response)[1];
      if (bodyHtml.length < 1) {
        this.transformingToHtml[document.key] = false;
        // if no transformation, fallback to XML tree
        return this.parseTree(document);
      }
      //sanitizer will make sure the HTML styling is applied
      document.transformed = this.sanitizer.bypassSecurityTrustHtml(response);
      if (!document.transformed) {
        this.transformingToHtml[document.key] = false;
        // fallback to XML tree
        return this.parseTree(document);
      }
      document.home = true;
      document.loadSubComponent = true;
      this.transformingToHtml[document.key] = false;
      this.changeDetectorRef.detectChanges();
    },
    // try default XML tree display
    error => {
      this.parseTree(document);
      this.transformingToHtml[document.key] = false;
      this.changeDetectorRef.detectChanges();
    });
  }


  /**
   * Parses server response and builds a document tree
   * @param document server response object
   */
  public parseTree(document): void {
    const name = document.key;
    const doc = document.value;

    if (this.flatTreeDataSource[name]) {
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
    // Parse the response and build a recursive tree of FileNode objects and assign them to the tree
    const data = this.buildFileTree(JSON.parse(`{"${name}":${JSON.stringify(result)}}`), 0);
    this.flatTreeControl[name] = new FlatTreeControl<FlatNode>(node => node.level, node => node.expandable); 
    this.flatTreeDataSource[name] = new MatTreeFlatDataSource(this.flatTreeControl[name], this.treeFlattener);
    this.flatTreeDataSource[name].data = data;
    this.flatTreeControl[name].expandAll();
    this.changeDetectorRef.detectChanges();
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
    let filename = label.substring(label.indexOf(':') + 1, label.length);
    // Remove leading underscores from name (LHS column in popup)
    while (filename.startsWith('_')) {
        filename = filename.substring(1);
    }
    while (filename.endsWith('_')) {
      filename = filename.substring(0, filename.length - 1)
    }
    // separate camel case e.g. observationMethod
    filename = filename.replace(/([a-z])([A-Z])/g, '$1 $2');
    // separate "_"
    filename = filename.split(/[_]/).join(' ');
    const terms = filename.split(' ');
    for (let j = 0; j < terms.length; j++) {
        const term = terms[j];
        switch (term) {
            // capitalise abbreviations
            // i.e. UOM, SRS, URI, HREF
            case 'uom':
            case 'uri':
            case 'srs':
            case 'nvcl':
            case 'href':
            case 'id': {
                terms[j] = term.toUpperCase();
                break;
            }
            // put uom in brackets
            case 'm':
            case 'km': {
                terms[j] = '(' + term + ')';
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
    return terms.join(' ');
  }

}
