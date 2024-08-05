/* eslint-disable @typescript-eslint/member-ordering */
import { ApplicationRef, ChangeDetectorRef, Component, Inject, OnInit, ElementRef, ViewChild, AfterViewInit, Renderer2 } from '@angular/core';
import { environment } from '../../../environments/environment';
import { config } from '../../../environments/config';
import { ref } from '../../../environments/ref';
import { CsClipboardService, GMLParserService, ManageStateService, Polygon, QuerierInfoModel, RickshawService, UtilitiesService } from '@auscope/portal-core-ui';
import { NVCLService } from './customanalytic/nvcl/nvcl.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as _ from 'lodash';
import * as X2JS from 'x2js';
import { DomSanitizer } from '@angular/platform-browser';
import { MSCLService } from '../layeranalytic/mscl/mscl.service';
import { NVCLBoreholeAnalyticService } from '../layeranalytic/nvcl/nvcl.boreholeanalytic.service';
import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';

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
  providers: [RickshawService, NVCLBoreholeAnalyticService],
  styleUrls: ['../modalwindow.scss', './querier.modal.component.scss']
})

export class QuerierModalComponent implements OnInit, AfterViewInit {
  [x: string]: any;
  @ViewChild('childElement', { static: false }) childElement: ElementRef;
  public downloading: boolean;
  public transformingToHtml: Map<string, boolean> = new Map<string, boolean>();
  public docs: QuerierInfoModel[] = [];
  public htmls: QuerierInfoModel[] = [];
  public currentHTML = ''; // HTML displayed in popup window for those layers that use it
  public uniqueLayerNames: string[] = [];
  public selectLayerNameFilter = 'ALL';
  public analyticMap;
  public tab: {};
  public bToClipboard = false;
  public hasMsclAnalytics = false; // Display 'Analytics' tab to analyse GML observation
  public selectedNode: string;
  public currentIndex = 0;
  public jsonDoc;
  public list = [];
  public currentDoc: any;
  public selectedFeature = 'Feature';
  public currentFeature = 'Feature';
  public selectedLayer = 'Layer';
  public selectedToolTip = '';
  public imScDoButtonsEnabled = false; // Image-Scalar-Download buttons used by NVCL boreholes layer
  public analyticEnabled = false;

  public scalarPriorityOrder: string[] = ['Grp1 dTSAS+', 'Grp2 dTSAS+', 'Grp3 dTSAS+', 'Grp1 uTSAS+', 'Grp2 uTSAS+', 'Grp3 uTSAS+', 'Grp1 sTSAS+', 'Grp2 sTSAS+',
    'Grp3 sTSAS+', 'Grp1 dTSAS', 'Grp2 dTSAS', 'Grp3 dTSAS', 'Grp1 uTSAS', 'Grp2 uTSAS', 'Grp3 uTSAS', 'Grp1 SWIR-CLS', 'Grp2 SWIR-CLS', 'Grp3 SWIR-CLS', 'Grp1 sTSAS',
    'Grp2 sTSAS', 'Grp3 sTSAS', 'Grp1 djCLST', 'Grp2 djCLST', 'Grp3 djCLST', 'Grp4 djCLST', 'Grp5 djCLST', 'Grp6 djCLST', 'Grp7 djCLST', 'Grp1 ujCLST', 'Grp2 ujCLST',
    'Grp3 ujCLST', 'Grp4 ujCLST', 'Grp5 ujCLST', 'Grp6 ujCLST', 'Grp7 ujCLST', 'Grp1 sjCLST', 'Grp2 sjCLST', 'Grp3 sjCLST', 'Grp4 sjCLST', 'Grp5 sjCLST', 'Grp6 sjCLST',
    'Grp7 sjCLST', 'Grp1 dTSAT', 'Grp2 dTSAT', 'Grp3 dTSAT', 'Grp4 dTSAT', 'Grp5 dTSAT', 'Grp6 dTSAT', 'Grp7 dTSAT', 'Grp1 uTSAT', 'Grp2 uTSAT', 'Grp3 uTSAT',
    'Grp4 uTSAT', 'Grp5 uTSAT', 'Grp6 uTSAT', 'Grp7 uTSAT', 'Grp1 TIR-CLS', 'Grp2 TIR-CLS', 'Grp3 TIR-CLS', 'Grp4 TIR-CLS', 'Grp5 TIR-CLS', 'Grp6 TIR-CLS',
    'Grp7 TIR-CLS', 'Min1 dTSAS+', 'Min2 dTSAS+', 'Min3 dTSAS+', 'Min1 uTSAS+', 'Min2 uTSAS+', 'Min3 uTSAS+', 'Min1 sTSAS+', 'Min2 sTSAS+', 'Min3 sTSAS+', 'Min1 dTSAS',
    'Min2 dTSAS', 'Min3 dTSAS', 'Min1 uTSAS', 'Min2 uTSAS', 'Min3 uTSAS', 'Min1 SWIR-CLS', 'Min2 SWIR-CLS', 'Min3 SWIR-CLS', 'Min1 sTSAS', 'Min2 sTSAS', 'Min3 sTSAS',
    'Min1 djCLST', 'Min2 djCLST', 'Min3 djCLST', 'Min4 djCLST', 'Min5 djCLST', 'Min6 djCLST', 'Min7 djCLST', 'Min1 ujCLST', 'Min2 ujCLST', 'Min3 ujCLST', 'Min4 ujCLST',
    'Min5 ujCLST', 'Min6 ujCLST', 'Min7 ujCLST', 'Min1 sjCLST', 'Min2 sjCLST', 'Min3 sjCLST', 'Min4 sjCLST', 'Min5 sjCLST', 'Min6 sjCLST', 'Min7 sjCLST', 'Min1 dTSAT',
    'Min2 dTSAT', 'Min3 dTSAT', 'Min4 dTSAT', 'Min5 dTSAT', 'Min6 dTSAT', 'Min7 dTSAT', 'Min1 uTSAT', 'Min2 uTSAT', 'Min3 uTSAT', 'Min4 uTSAT', 'Min5 uTSAT',
    'Min6 uTSAT', 'Min7 uTSAT', 'Min1 TIR-CLS', 'Min2 TIR-CLS', 'Min3 TIR-CLS', 'Min4 TIR-CLS', 'Min5 TIR-CLS', 'Min6 TIR-CLS', 'Min7 TIR-CLS', 'Error dTSAS+',
    'Error uTSAS+', 'Error sTSAS+', 'Error dTSAS', 'Error uTSAS', 'Error SWIR-CLS', 'Error djCLST', 'Error ujCLST', 'Error sjCLST', 'Error dTSAT', 'Error uTSAT',
    'Error TIR-CLS', 'Wt1 dTSAS+', 'Wt1 uTSAS+', 'Wt1 sTSAS+', 'Wt1 dTSAS', 'Wt1 uTSAS', 'Wt1 SWIR-CLS', 'Wt2 dTSAS+', 'Wt2 uTSAS+', 'Wt2 sTSAS+', 'Wt2 dTSAS',
    'Wt2 uTSAS', 'Wt2 SWIR-CLS', 'Wt3 dTSAS+', 'Wt3 uTSAS+', 'Wt3 sTSAS+', 'Wt3 dTSAS', 'Wt3 uTSAS', 'Wt3 SWIR-CLS', 'Wt1 djCLST', 'Wt1 ujCLST', 'Wt1 sjCLST',
    'Wt1 dTSAT', 'Wt1 uTSAT', 'Wt1 TIR-CLS', 'Wt2 djCLST', 'Wt2 ujCLST', 'Wt2 sjCLST', 'Wt2 dTSAT', 'Wt2 uTSAT', 'Wt2 TIR-CLS', 'Wt3 djCLST', 'Wt3 ujCLST',
    'Wt3 sjCLST', 'Wt3 dTSAT', 'Wt3 uTSAT', 'Wt3 TIR-CLS', 'Wt4 djCLST', 'Wt4 ujCLST', 'Wt4 sjCLST', 'Wt4 dTSAT', 'Wt4 uTSAT', 'Wt4 TIR-CLS', 'Wt5 djCLST',
    'Wt5 ujCLST', 'Wt5 sjCLST', 'Wt5 dTSAT', 'Wt5 uTSAT', 'Wt5 TIR-CLS', 'Wt6 djCLST', 'Wt6 ujCLST', 'Wt6 sjCLST', 'Wt6 dTSAT', 'Wt6 uTSAT', 'Wt6 TIR-CLS',
    'Wt7 djCLST', 'Wt7 ujCLST', 'Wt7 sjCLST', 'Wt7 dTSAT', 'Wt7 uTSAT', 'Wt7 TIR-CLS'];

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
  public listingdata: any;
  public isScalarLoaded = false;
  public modalVisible = true;

  constructor(public nvclService: NVCLService, public bsModalRef: BsModalRef, public csClipboardService: CsClipboardService,
    private manageStateService: ManageStateService, private gmlParserService: GMLParserService,
    private http: HttpClient, @Inject('env') private env, private sanitizer: DomSanitizer,
    public nvclBoreholeAnalyticService: NVCLBoreholeAnalyticService,
    private changeDetectorRef: ChangeDetectorRef, private appRef: ApplicationRef,
    private msclService: MSCLService, private renderer: Renderer2, private elementRef: ElementRef,
    private modalService: BsModalService, public dialog: MatDialog, private rickshawService: RickshawService) {
    this.analyticMap = ref.analytic;
    this.flagNVCLAnalytic = false;
    this.initialScalarLoad = true;
    this.screenWidth = window.innerWidth;
  }

  ngAfterViewInit(): void {
    const parentElement = this.childElement.nativeElement.parentElement.parentElement;
    //const parentElement2 = this.childElement.nativeElement.parentElement;

    //const left = this.screenWidth

    const left = window.innerWidth;
    const height = window.innerHeight
    this.renderer.setStyle(parentElement, 'resize', 'both');
    this.renderer.setStyle(parentElement, 'overflow', 'auto');
    //this.renderer.setStyle(parentElement, 'top', '10px');
    this.renderer.setStyle(parentElement, 'width', '900px');
    this.renderer.setStyle(parentElement, 'min-height', '600px');
    //this.renderer.setStyle(parentElement, 'display', 'none');
    //this.renderer.setStyle(parentElement, 'height', '600px');
    //this.renderer.setStyle(parentElement, 'left', (left - 900) / 2 + 'px');
    //this.renderer.setStyle(parentElement, 'left', '100px');
    // this.renderer.setStyle(parentElement, 'height', height*0.8  + 'px');
  }

  ngOnInit() {

    /**
     * Checks the state of "isAnalytic" variable in the nvclService - observable
     * and updates the local variable "flagNVCLAnalytic" - which updates the Analytic TAB in the html
     */
    this.nvclService.getAnalytic().subscribe((result) => {
      this.flagNVCLAnalytic = result;

      // Calling this to update the UI
      this.onDataChange();
    });

    /**
     * Checks the state of "isScalarLoaded" variable in the nvclService - observable
     * and updates the local variable "isScalarLoaded" - which updates the scalar button in the html
     */
    this.nvclService.getScalarLoaded().subscribe((result) => {
      this.isScalarLoaded = result;

      // Calling this to update the UI
      this.onDataChange();
    });

    /*
    the following are needed to prevent an "artifact" showing when the active layers panel is showing
    and then slides out of the way - i.e. the header of the modal for Feature Informatio displays at
    the bottom of the layers panel
    */
    this.modalService.onHide.subscribe(reason => {
      /* modal close event has cascaded down; most lieley from the MSCL popup modal or the legend */

      if (!(reason == "backdrop-click")) {  // check - image > scalar > legend
        if (!reason.initialState) { // check - scl chart
          this.modalVisible = false;
        }
      }
    });
    this.modalService.onShow.subscribe(reason => {
      this.modalVisible = true;
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

  private isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
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
        state[key].onlineResource = doc.onlineResource; // TODO: currentDoc. ???
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

  /**
   * Set HTML to be displayed in popup window
   * 
   * @param key key used to select HTML to display
   */
  public setHTML(key) {
    // Clear the WFS XML display
    this.currentDoc = null;
    // Search for our HTML to display
    for (const html of this.htmls) {
      if (html.key == key) {
        this.currentHTML = html.value;
        return;
      }
    }
  }

  /**
   * Set WFS feature data to be displayed in popup window
   * 
   * @param doc XML document
   * @param i index of this XML docment in list of XML documents
   */
  public setWFS(doc, i) {
    // Clear the HTML display  
    this.currentHTML = "";
    // Set up, convert the XML and display in popup 
    this.updateDropDownButtonText(doc);
    this.currentIndex = i;
    this.currentDoc = doc;
    this.currentDoc.analytic = false;
    this.currentDoc.home = true;
    this.transformToHtml(this.currentDoc, i);

    if (this.analyticEnabled) {
        //this.analytic_tab = true;
        this.changeDetectorRef.detectChanges();
    }
  }

/**
 * sets the button/tab active in the dynamic component nvcl.modal.component.html
 * 
 * @param evt 
 * @param tabName 
 */
  public openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    if (this.imScDoButtonsEnabled) { this.analytic_tab = true; }

    // set all the "tabs" to display:none - ie hidden
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    if (document.getElementById(tabName)) {
      document.getElementById(tabName).style.display = "block";
      if (evt) {
        if (evt.target) {
          if (evt.target.className) {
            evt.target.className += " activeBtn";
          }
        }
      }
    }
  }

  /**
   * Look for changes and update UI after brief delay
   */
  public onDataChange(): void {
    const htmldata = []
    const Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    const objExp = new RegExp(Expression);
    for (let i = 0; i < this.docs.length; i++) {
      const doc = new DOMParser().parseFromString(this.docs[i].raw, 'text/xml');
      if (doc.getElementsByTagName('gml:name').length != 0) {
        for (const html in doc.getElementsByTagName('gml:name')) {
          if (!objExp.test(doc.getElementsByTagName('gml:name')[html].innerHTML)) {
            htmldata.push(doc.getElementsByTagName('gml:name')[html].innerHTML)
          }
        }
      } else if (doc.getElementsByTagName('gml:NAME').length != 0) {
        for (const html in doc.getElementsByTagName('gml:NAME')) {
          if (!objExp.test(doc.getElementsByTagName('gml:NAME')[html].innerHTML)) {
            htmldata.push(doc.getElementsByTagName('gml:NAME')[html].innerHTML)
          }
        }
      } else if (doc.getElementsByTagName('gsmlp:name').length != 0) {
        for (const html in doc.getElementsByTagName('gsmlp:name')) {
          if (!objExp.test(doc.getElementsByTagName('gsmlp:name')[html].innerHTML)) {
            htmldata.push(doc.getElementsByTagName('gsmlp:name')[html].innerHTML)
          }
        }
      } else if (doc.getElementsByTagName('null:name').length != 0) {
        for (const html in doc.getElementsByTagName('null:name')) {
          if (!objExp.test(doc.getElementsByTagName('null:name')[html].innerHTML)) {
            htmldata.push(doc.getElementsByTagName('null:name')[html].innerHTML)
          }
        }
      }
      this.docs[i]['node_name'] = htmldata[i]
    }

    setTimeout(() => {
      this.changeDetectorRef.detectChanges();
    }, 50);
  }

  /**
   * When all layers are loaded call onDatachange and automatically set the first feature
   * if it is the only one in the list
   */
  allLayersLoaded() {
    this.onDataChange();
    this.downloading = false;
    if (this.docs.length === 1 && this.htmls.length === 0) {
      this.setWFS(this.docs[0], 0);
      this.openTab(event, 'wfs')
    } else if (this.htmls.length === 1 && this.docs.length === 0) {
      this.setHTML(this.htmls[0].key);
    }
  }

  /**
   * This gets called from the UI when user clicks on first link in popup
   *
   * @param document
   */
  public transformToHtml(document, index): void {
    this.selectedNode = document.node_name;
    this.currentIndex = index;
    if (this.msclService.usesGMLObs(document.raw)) {
      this.hasMsclAnalytics = true;
    }

    if (!this.imScDoButtonsEnabled) {
      if (this.analyticMap[document.layer.id]) { // turn on analytic button, if in "ref.analytic" and not NVCL2
        this.analyticEnabled = true;
      } else {
        this.analyticEnabled = false;
      }
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
      responseType: 'text'
    }).subscribe(response => {
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
    }, () => {
      // try default XML tree display
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

  public formatXML(doc) {
    if (!doc) { return }

    this.list = [];

    let result = doc;

    try {
      // Convert XML to JSON object
      const x2jsObj = new X2JS();
      result = x2jsObj.xml2js(doc.value.outerHTML);
      this.jsonDoc = result.BoreholeView;

      Object.keys(result.BoreholeView).forEach((key) => {
        const value = result.BoreholeView[key];
        var listKey = key.toString();
        var listValue = value.toString();
        this.list.push({ [listKey]: listValue });
      })

      //result.BoreholeView.forEach((element) => {
      //  console.log(element.Id);
      //});

    } catch (e) {
      console.log('XML to JSON conversion error: ', e);
    }
  }

  public updateDropDownButtonText(doc) {
    const d = document.getElementById("dropdownMenuFeature");
    this.selectedFeature = '';
    if (doc.node_name) {
      this.selectedFeature = doc.node_name;
    } else if (doc.key) {
      this.selectedFeature = doc.key;
    }
    this.selectedLayer = this.getAbbr(doc.layer.name, " ");
    this.imScDoButtonsEnabled = false;
    this.analyticEnabled = false;

    // should we check flagNVCLAnalytic ?
    if (this.selectedLayer == "NVCLV-2.0") {
      this.imScDoButtonsEnabled = true;
    }

    this.selectedToolTip = doc.layer.name + ":" + this.selectedFeature;

    if (this.selectedFeature != this.currentFeature) {
      // if changed feature selection then reset
      this.isScalarLoaded = false;
      this.drawGraphMode = false;
      this.analyticEnabled = false;
    }
    this.currentFeature = this.selectedFeature;
  }

  private getAbbr(layerName: string, splitChar: string): string {
    var abbr = "";

    var s = layerName.split(splitChar);

    for (let i = 0; i < s.length; i++) {
      var c: string;

      if (this.isAlpha(s[i])) {
        c = Array.from(s[i])[0];
      } else {
        c = s[i];
      }
      abbr = abbr + c;
    }

    return abbr;
  }

  private isAlpha(str) {
    let regex = /^[a-zA-Z]+$/;
    return regex.test(str);
  }
}
