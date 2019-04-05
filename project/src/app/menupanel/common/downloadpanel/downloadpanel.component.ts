import {Bbox} from '../../../portal-core-ui/model/data/bbox.model';
import {LayerModel} from '../../../portal-core-ui/model/data/layer.model';
import {LayerHandlerService} from '../../../portal-core-ui/service/cswrecords/layer-handler.service';
import {OlMapService} from '../../../portal-core-ui/service/openlayermap/ol-map.service';
import {DownloadWfsService} from '../../../portal-core-ui/service/wfs/download/download-wfs.service';
import {Component, Input, OnInit} from '@angular/core';
import {UtilitiesService} from '../../../portal-core-ui/utility/utilities.service';
import {saveAs} from 'file-saver/FileSaver';
import {config} from '../../../../environments/config';
import { DownloadWcsService } from '../../../portal-core-ui/service/wcs/download/download-wcs.service';

@Component({
  selector: 'app-download-panel',
  templateUrl: './downloadpanel.component.html',
  styleUrls: ['../../menupanel.scss']
})


export class DownloadPanelComponent implements OnInit {


  @Input() layer: LayerModel;
  bbox: Bbox;
  drawStarted: boolean;
  downloadStarted: boolean;
  isCsvSupportedLayer: boolean;

  isWCSDownloadSupported: boolean;
  downloadSizeLimit: number;

  wcsDownloadListOption: any
  wcsDownloadForm: any

  constructor(private layerHandlerService: LayerHandlerService, private olMapService: OlMapService,
    private downloadWfsService: DownloadWfsService, private downloadWcsService: DownloadWcsService) {
    this.bbox = null;
    this.drawStarted = false;
    this.downloadStarted = false;
    this.wcsDownloadForm = {};

  }

  ngOnInit(): void {
    if (this.layer) {
      this.isCsvSupportedLayer = config.csvSupportedLayer.indexOf(this.layer.id) >= 0;
      if (config.wcsSupportedLayer[this.layer.id]) {
        this.isWCSDownloadSupported = true;
        this.downloadSizeLimit = config.wcsSupportedLayer[this.layer.id].downloadAreaMaxSize;
      } else {
        this.isWCSDownloadSupported = false;
      }
    } else {
      this.isCsvSupportedLayer = false;
      this.isWCSDownloadSupported = false;
    }
  }

  /**
   * Draw bound to get the bbox for download
   */
  public drawBound(): void {
    setTimeout(() => this.drawStarted = true, 0);

    this.olMapService.drawBound().subscribe((vector) => {
      this.drawStarted = false;
      const features = vector.getSource().getFeatures();
      const me = this;
      // Go through this array and get coordinates of their geometry.
      features.forEach(function(feature) {
       if (config.wcsSupportedLayer[me.layer.id] && config.wcsSupportedLayer[me.layer.id].downloadAreaMaxSize < feature.getGeometry().getArea()) {
         alert('The area size you have selected of ' + feature.getGeometry().getArea() + 'm2 exceed the limited size of ' +
         config.wcsSupportedLayer[me.layer.id].downloadAreaMaxSize + 'm2. Due to the size of the dataset' +
           ' we have to limit the download area');
         me.bbox = null;
         return;
       }
        me.bbox = new Bbox();
        me.bbox.crs = 'EPSG:4326';
        const bbox4326 = feature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
        me.bbox.eastBoundLongitude = bbox4326.getExtent()[2];
        me.bbox.westBoundLongitude = bbox4326.getExtent()[0];
        me.bbox.northBoundLatitude = bbox4326.getExtent()[3];
        me.bbox.southBoundLatitude = bbox4326.getExtent()[1];

        if (me.isWCSDownloadSupported) {
          me.describeCoverage();
        }
      });

    });

  }

  public describeCoverage() {
    if (this.layerHandlerService.containsWCS(this.layer)) {
      const wcsResources = this.layerHandlerService.getWCSResource(this.layer);
      this.downloadWcsService.describeCoverage(wcsResources[0].url, wcsResources[0].name).subscribe(response => {
        this.wcsDownloadListOption = {
          inputCrsList: response.supportedRequestCRSs,
          outputCrsList: response.supportedResponseCRSs,
          downloadFormatList: response.supportedFormats
        }
      })
    } else {
      alert('No coverage found. Kindly contact cg-admin@csiro.au');
    }
  }



  /**
   * clear the bounding box
   */
  public clearBound(): void {
    this.bbox = null;
    this.wcsDownloadForm = {};
    this.wcsDownloadListOption = null;
  }
  /**
   * Download the layer
   */
  public download(): void {
    if (this.downloadStarted) {
      alert('Download in progres, kindly wait for it to completed');
      return
    }
    this.downloadStarted = true;

    let obverableResponse = null;
    if (this.isWCSDownloadSupported) {
      if (!this.bbox || UtilitiesService.isEmpty(this.wcsDownloadForm)) {
        this.downloadStarted = false;
        alert('Required information missing. Make sure you have selected a area, crs and format for download');
        return;
      }
      obverableResponse = this.downloadWcsService.download(this.layer, this.bbox, this.wcsDownloadForm.inputCrs,
        this.wcsDownloadForm.downloadFormat, this.wcsDownloadForm.outputCrs);
    } else {
      obverableResponse = this.downloadWfsService.download(this.layer, this.bbox)
    }

    obverableResponse.subscribe(value => {
      this.downloadStarted = false;
      const blob = new Blob([value], {type: 'application/zip'});
      saveAs(blob, 'download.zip');
    }, err => {
      this.downloadStarted = false;
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occured whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        alert(err.message + '. Kindly contact cg-admin@csiro.au');
      }
    });
  }
}
