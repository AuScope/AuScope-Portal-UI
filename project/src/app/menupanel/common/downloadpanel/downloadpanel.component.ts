import {Bbox} from '@auscope/portal-core-ui';
import {LayerModel} from '@auscope/portal-core-ui';
import {LayerHandlerService} from '@auscope/portal-core-ui';
import {CsMapService} from '@auscope/portal-core-ui';
import {DownloadWfsService} from '@auscope/portal-core-ui';
import {Component, Input, OnInit} from '@angular/core';
import {UtilitiesService} from '@auscope/portal-core-ui';
import {Constants, ResourceType} from '@auscope/portal-core-ui';
import {saveAs} from 'file-saver';
import {config} from '../../../../environments/config';
import { RectangleEditorObservable } from 'angular-cesium';
import { ChangeDetectorRef } from '@angular/core';
import { DownloadWcsService } from '@auscope/portal-core-ui';

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

  wcsDownloadListOption: any;
  wcsDownloadForm: any;
  
  // the rectangle drawn on the map
  private rectangleObservable: RectangleEditorObservable;
  
  constructor( private cdRef:ChangeDetectorRef, private layerHandlerService: LayerHandlerService, private csMapService: CsMapService,
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
        // If 'downloadAreaMaxsize' is not set to Number.MAX_SAFE_INTEGER then download limits will apply
        if (config.wcsSupportedLayer[this.layer.id].downloadAreaMaxSize < Number.MAX_SAFE_INTEGER) {
          this.downloadSizeLimit = config.wcsSupportedLayer[this.layer.id].downloadAreaMaxSize;
        } else {
          this.downloadSizeLimit = 0;
        }
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
    const me = this;
    this.rectangleObservable = this.csMapService.drawBound();
    this.rectangleObservable.subscribe((vector) => {      
      me.drawStarted = false;             
      if (!vector.points) {
          // drawing hasn't started
          return;
      }
      if (vector.points.length < 2
              || vector.points[0].getPosition().x == vector.points[1].getPosition().x
              || vector.points[0].getPosition().y == vector.points[1].getPosition().y) {
          // drawing hasn't finished
          return;
      }
    
      const points = vector.points;
      // calculate area from the 2 rectangle points 
      var width = points[0].getPosition().x - points[1].getPosition().x;
      var length = points[0].getPosition().y - points[1].getPosition().y;
      const area = Math.abs(width * length);
      
      if (config.wcsSupportedLayer[me.layer.id]) {
          // If 'downloadAreaMaxsize' is not set to Number.MAX_SAFE_INTEGER then download limits will apply
          const maxSize = config.wcsSupportedLayer[me.layer.id].downloadAreaMaxSize;
          if (maxSize != Number.MAX_SAFE_INTEGER && maxSize < area) {
            alert('The area size you have selected of ' + area + 'm2 exceed the limited size of ' +
            config.wcsSupportedLayer[me.layer.id].downloadAreaMaxSize + 'm2. Due to the size of the dataset' +
             ' we have to limit the download area');
            me.bbox = null;
            return;
          }
      }
      
      //reproject to EPSG:4326      
      me.bbox = UtilitiesService.reprojectToWGS84(points);
      
      if (me.isWCSDownloadSupported) {
        me.describeCoverage();
      }

    });

  }

  public describeCoverage() {
    if (this.layerHandlerService.contains(this.layer, ResourceType.WCS)) {
      const wcsResources = this.layerHandlerService.getWCSResource(this.layer);
      const me = this;
      this.downloadWcsService.describeCoverage(wcsResources[0].url, wcsResources[0].name).subscribe(response => {
        me.wcsDownloadListOption = {
          inputCrsList: response.supportedRequestCRSs,
          outputCrsList: response.supportedResponseCRSs,
          downloadFormatList: response.supportedFormats
        }
        // somehow needs this to refresh the form with above
        me.cdRef.detectChanges();        
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
    // clear rectangle on the map
    if (this.rectangleObservable) {
        this.rectangleObservable.dispose();
        this.rectangleObservable = null;
    }
  }
  /**
   * Download the layer
   */
  public download(): void {
    if (this.downloadStarted) {
      alert('Download in progress, kindly wait for it to completed');
      return;
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
