import { config } from '../../environments/config';
import { ref } from '../../environments/ref';
import {QuerierModalComponent} from '../modalwindow/querier/querier.modal.component';
import { CSWRecordModel } from '../portal-core-ui/model/data/cswrecord.model';
import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import olZoom from 'ol/control/zoom';
import olScaleLine from 'ol/control/scaleline';
import {OlMapObject} from '../portal-core-ui/service/openlayermap/ol-map-object';
import {OlMapService} from '../portal-core-ui/service/openlayermap/ol-map.service';
import { ManageStateService } from '../portal-core-ui/service/permanentlink/manage-state.service';
import { OlCSWService } from '../portal-core-ui/service/wcsw/ol-csw.service';
import {QueryWFSService} from '../portal-core-ui/service/wfs/query-wfs.service';
import {QueryWMSService} from '../portal-core-ui/service/wms/query-wms.service';
import {GMLParserService} from '../portal-core-ui/utility/gmlparser.service';
import {SimpleXMLService} from '../portal-core-ui/utility/simplexml.service';
import { UtilitiesService } from '../portal-core-ui/utility/utilities.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {BsModalRef} from 'ngx-bootstrap';
import olControlMousePosition from 'ol/control/mouseposition';
import olCoordinate from 'ol/coordinate';

@Component({
  selector: 'app-ol-map',
  template: `
    <div #mapElement id="map" class="height-100pc width-100pc"> </div>
    `,
  styleUrls: ['./olmap.component.css']
  // The "#" (template reference variable) matters to access the map element with the ViewChild decorator!
})

export class OlMapComponent implements AfterViewInit {
  // This is necessary to access the html element to set the map target (after view init)!
  @ViewChild('mapElement') mapElement: ElementRef;

  private bsModalRef: BsModalRef;

  constructor(public olMapObject: OlMapObject, private olMapService: OlMapService, private modalService: BsModalService,
    private queryWFSService: QueryWFSService, private queryWMSService: QueryWMSService, private gmlParserService: GMLParserService,
    private manageStateService: ManageStateService) {
    this.olMapService.getClickedLayerListBS().subscribe(mapClickInfo => {
      this.handleLayerClick(mapClickInfo);
    })
  }


  // After view init the map target can be set!
  ngAfterViewInit() {
    const mousePositionControl = new olControlMousePosition({
      coordinateFormat: olCoordinate.createStringXY(4),
      projection: 'EPSG:4326',
      target: document.getElementById('mouse-position'),
      undefinedHTML: 'Mouse out of range'
    });

    this.olMapObject.addControlToMap(mousePositionControl);
    this.olMapObject.addControlToMap(new olZoom());
    this.olMapObject.addControlToMap(new olScaleLine('metric'));
    this.olMapObject.getMap().setTarget(this.mapElement.nativeElement.id);

    // VT: permanent link(open borehole in external window)
    const state = UtilitiesService.getUrlParameterByName('state');
    if (state) {
      const me = this;
      this.manageStateService.getUnCompressedString(state, function(result) {
        const layerStateObj = JSON.parse(result);
        const modalDisplayed = {value: false}

          for (const layerKey in layerStateObj) {
            if (layerKey === 'map') {
              continue;
            }
            if (layerStateObj[layerKey].raw) {
              me.olMapService.getAddLayerSubject().subscribe(layer => {
                setTimeout(() => {
                  if (layer.id === layerKey) {
                    const mapLayer = {
                      onlineResource: layerStateObj[layerKey].onlineResource,
                      layer: layer
                    }
                    me.displayModal(modalDisplayed, null);
                    me.setModal(layerStateObj[layerKey].raw, mapLayer, me.bsModalRef, layerStateObj[layerKey].gmlid);
                  }
                }, 0);

              })


            }
          }

      });
      // VT: End permanent link
    }
  }

  private handleLayerClick(mapClickInfo) {
    if (UtilitiesService.isEmpty(mapClickInfo)) {
      return;
    }
    // Process lists of features
    const modalDisplayed = {value: false}
    let featureCount = 0;
    for (const feature of mapClickInfo.clickedFeatureList) {
      // NB: This is just testing that the popup window does display
      this.displayModal(modalDisplayed, mapClickInfo.clickCoord);

      // VT: if it is a csw renderer layer, handling of the click is slightly different
      if (config.cswrenderer.includes(feature.layer.id) || OlCSWService.cswDiscoveryRendered.includes(feature.layer.id)) {
        this.setModalHTML(this.parseCSWtoHTML(feature.cswRecord), feature.cswRecord.name, feature, this.bsModalRef);
      } else if (ref.customQuerierHandler[feature.layer.id]) {
          const handler = new ref.customQuerierHandler[feature.layer.id](feature);
          this.setModalHTML(handler.getHTML(feature), handler.getKey(feature), feature, this.bsModalRef);
      } else {       // VT: in a normal feature, yes we want to getfeatureinfo
        featureCount++;
        if (featureCount < 10) {// VT: if more than 10 feature, ignore the rest
         try {
            this.queryWFSService.getFeatureInfo(feature.onlineResource, feature.id_).subscribe(result => {
              this.setModal(result, feature, this.bsModalRef);
            }, err => {
              this.bsModalRef.content.downloading = false;
              });
          } catch (error) {
           this.setModalHTML('<p> ' + error + '</p>',
            'Error Retriving Data', feature, this.bsModalRef);
          }
        } else {
          this.setModalHTML('<p>Too many features to list, zoom in the map to get a more precise location</p>',
            '...', feature, this.bsModalRef);
          break;
        }

      }

    }

    // VT: process list of layers clicked
    for (const maplayer of mapClickInfo.clickedLayerList) {
      this.displayModal(modalDisplayed, mapClickInfo.clickCoord);

      if (config.cswrenderer.includes(maplayer.layer.id)) {
        this.setModalHTML(this.parseCSWtoHTML(maplayer.cswRecord), maplayer.cswRecord.name, maplayer, this.bsModalRef);
      } else {
        if (maplayer.onlineResource) {
          this.bsModalRef.content.downloading = true;
          this.queryWMSService.getFeatureInfo(maplayer.onlineResource, maplayer.sldBody, mapClickInfo.pixel, mapClickInfo.clickCoord).subscribe(result => {
            this.setModal(result, maplayer, this.bsModalRef);
          },
            err => {
              this.bsModalRef.content.downloading = false;
            });
        }
      }

    }
  }
  private parseCSWtoHTML(cswRecord: CSWRecordModel): string {
    let html =  '<div class="row"><div class="col-md-3">Source</div><div class="col-md-9"><a href="' + cswRecord.recordInfoUrl + '">Full Metadata and download</a></div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Title</div><div class="col-md-9">' + cswRecord.name + '</div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Abstract</div><div class="col-md-8"><div class="row" style="height: 100px;overflow-y: scroll;">' +
       cswRecord.description + '</div></div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Keywords</div><div class="col-md-9">' + cswRecord.descriptiveKeywords + '</div></div><hr>';
    html +=  '<div class="row"><div class="col-md-3">Organization</div><div class="col-md-9">' + cswRecord.contactOrg + '</div></div><hr>';

    html +=  '<div class="row"><div class="col-md-3">Resource link</div><div class="col-md-9">';
    for (const onlineResource of cswRecord.onlineResources) {
      html += '<p><a href="' + onlineResource.url + '">' + (onlineResource.name ? onlineResource.name : 'Web resource link') + '</a></p>';
    }
    html += '</div></div>';

    return html;
  }
  /**
   * display the querier modal on map click
   */
  private displayModal(modalDisplayed, clickCoord) {
    if (modalDisplayed.value === false) {
      this.bsModalRef = this.modalService.show(QuerierModalComponent, {class: 'modal-lg'});
      modalDisplayed.value = true;
      this.bsModalRef.content.downloading = true;
      if (clickCoord) {
        const vector = this.olMapService.drawDot(clickCoord);
        this.modalService.onHide.subscribe(reason => {
          this.olMapService.removeVector(vector);
        })
      }
    }
  }

  /**
   * hide the querier modal
   */
  private hideModal() {
    if (this.bsModalRef) {
      this.bsModalRef.hide();
    }
  }

  /**
   * set the modal with the layers that have been clicked on
   * @param gmlid: a optional filter to only display the gmlId specified
   */
  private setModal(result: string, feature: any, bsModalRef: BsModalRef, gmlid?: string) {
    const treeCollections = SimpleXMLService.parseTreeCollection(this.gmlParserService.getRootNode(result), feature);
    let featureCount = 0;
    for (const treeCollection of treeCollections) {
      if (gmlid && gmlid !== treeCollection.key) {
        continue;
      }
      featureCount++;
      if (featureCount >= 10) {
        this.setModalHTML('<p>Too many features to list, zoom in the map to get a more precise location</p>',
          '...', feature, this.bsModalRef);
        break;

      }
      treeCollection.raw = result;
      bsModalRef.content.docs.push(treeCollection);
      if (bsModalRef.content.uniqueLayerNames.indexOf(feature.layer.name) === -1) {
        bsModalRef.content.uniqueLayerNames.push(feature.layer.name)
      }
    }

    this.bsModalRef.content.downloading = false
  }



  /**
   * set the modal with the layers that have been clicked on
   */
  private setModalHTML(html: string, key: any, feature: any, bsModalRef: BsModalRef) {
      bsModalRef.content.htmls.push({
        key: key,
        layer: feature.layer,
        value: html
      });
      if (bsModalRef.content.uniqueLayerNames.indexOf(feature.layer.name) === -1) {
        bsModalRef.content.uniqueLayerNames.push(feature.layer.name)
      }
     this.bsModalRef.content.downloading = false;
  }


}
