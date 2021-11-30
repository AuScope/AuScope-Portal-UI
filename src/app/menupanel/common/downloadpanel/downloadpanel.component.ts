import {Bbox} from '@auscope/portal-core-ui';
import {LayerModel} from '@auscope/portal-core-ui';
import {LayerHandlerService} from '@auscope/portal-core-ui';
import {CsMapService} from '@auscope/portal-core-ui';
import {DownloadWfsService} from '@auscope/portal-core-ui';
import {Component, Input, OnInit} from '@angular/core';
import {UtilitiesService} from '@auscope/portal-core-ui';
import {ResourceType} from '@auscope/portal-core-ui';
import {saveAs} from 'file-saver';
import {config} from '../../../../environments/config';
import { RectangleEditorObservable } from 'angular-cesium';
import { ChangeDetectorRef } from '@angular/core';
import { DownloadWcsService ,CsClipboardService } from '@auscope/portal-core-ui';

@Component({
  selector: 'app-download-panel',
  templateUrl: './downloadpanel.component.html',
  styleUrls: ['../../menupanel.scss']
})


export class DownloadPanelComponent implements OnInit {


  @Input() layer: LayerModel;
  bbox: Bbox;
  polygonFilter: any;
  drawStarted: boolean;
  downloadStarted: boolean;
  download4pStarted: boolean;
  isCsvSupportedLayer: boolean;

  isWCSDownloadSupported: boolean;
  downloadSizeLimit: number;

  wcsDownloadListOption: any;
  wcsDownloadForm: any;

  // Default values for selectors
  public SELECT_DEFAULT_DOWNLOAD_FMT = "Choose a download format";
  public SELECT_DEFAULT_REF_SYSTEM = "Choose a reference system";
  public SELECT_DEFAULT_OUTPUT_CRS = "Choose an output CRS";
  public SELECT_DEFAULT_TIME_POS = "Choose a time position";
  
  // the rectangle drawn on the map
  private rectangleObservable: RectangleEditorObservable;
  
  constructor( private cdRef:ChangeDetectorRef, private layerHandlerService: LayerHandlerService, private csMapService: CsMapService,
    private downloadWfsService: DownloadWfsService, private downloadWcsService: DownloadWcsService, private csClipboardService: CsClipboardService ){

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
      this.csClipboardService.polygonsBS.subscribe(
        (polygonBBox) => {
          if (polygonBBox && polygonBBox.coordinates) {
            this.polygonFilter = '<ogc:Filter  xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\"><ogc:Intersects><ogc:PropertyName>gsmlp:shape</ogc:PropertyName>' + polygonBBox.coordinates + '</ogc:Intersects></ogc:Filter>';
            console.log(this.polygonFilter);
          } else {
            this.polygonFilter = null;
          }
      });
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
      
      // Reproject to EPSG:4326      
      me.bbox = UtilitiesService.reprojectToWGS84(points);

      // Run the WCS 'DescribeCoverage' request to gather more information about the WCS resource
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

        // Look for any time period constraints
        // NB: Limited to user selecting from the start and end times only
        const timePositionList = [];
        if ('spatialDomain' in response && 'envelopes' in response.spatialDomain) {
            const envelopes = response.spatialDomain.envelopes;
            if (envelopes && envelopes.length > 0) {
                if ('timePositionStart' in envelopes[0] && 'timePositionEnd' in envelopes[0]) {
                  timePositionList.push(envelopes[0].timePositionStart);
                  // Only insert the end time if it is different to the start time
                  if (envelopes[0].timePositionStart != envelopes[0].timePositionEnd) {
                    timePositionList.push(envelopes[0].timePositionEnd);
                  }
                }
            }
        }
        me.wcsDownloadListOption = {
          inputCrsList: response.supportedRequestCRSs,
          outputCrsList: response.supportedResponseCRSs,
          downloadFormatList: response.supportedFormats,
          timePositionList: timePositionList
        }

        // If there is only one input CRS option, then that is selected
        if (me.wcsDownloadListOption.inputCrsList.length == 1) {
            me.wcsDownloadForm.inputCrs = me.wcsDownloadListOption.inputCrsList[0];
        } else {
            me.wcsDownloadForm.inputCrs = this.SELECT_DEFAULT_REF_SYSTEM;
        }

        // If there is only one download format option, then that is selected
        if (me.wcsDownloadListOption.downloadFormatList.length == 1) {
            me.wcsDownloadForm.downloadFormat = me.wcsDownloadListOption.downloadFormatList[0];
        } else {
            me.wcsDownloadForm.downloadFormat = this.SELECT_DEFAULT_DOWNLOAD_FMT;
        }

        // If there is only one download format option, then that is selected
        if (me.wcsDownloadListOption.outputCrsList.length == 1) {
            me.wcsDownloadForm.outputCrs = me.wcsDownloadListOption.outputCrsList[0];
        } else {
            me.wcsDownloadForm.outputCrs = this.SELECT_DEFAULT_OUTPUT_CRS;
        }

        // If there is only one time position, then that is selected
        if (me.wcsDownloadListOption.timePositionList.length == 1) {
            me.wcsDownloadForm.timePosition = me.wcsDownloadListOption.timePositionList[0];
        } else  if (me.wcsDownloadListOption.timePositionList.length == 0) {
            me.wcsDownloadForm.timePosition = null;
        } else {
            me.wcsDownloadForm.timePosition = this.SELECT_DEFAULT_TIME_POS;
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
    let observableResponse = null;
    // fetch polygon filter

    // WCS download
    if (this.isWCSDownloadSupported) {
      if (!this.bbox || UtilitiesService.isEmpty(this.wcsDownloadForm)) {
        alert('Required information missing. Make sure you have selected an area, crs and format for download');
        return;
      }
      // Check that input values were selected
      if (this.wcsDownloadForm.inputCrs == this.SELECT_DEFAULT_REF_SYSTEM) {
        alert('Cannot download. A reference system value has not been selected');
        return;
      }
      if (this.wcsDownloadForm.downloadFormat == this.SELECT_DEFAULT_DOWNLOAD_FMT) {
        alert('Cannot download. An download format has not been selected');
        return;
      }
      if (this.wcsDownloadForm.outputCrs == this.SELECT_DEFAULT_OUTPUT_CRS) {
        alert('Cannot download. An output CRS has not been selected');
        return;
      }
      if (this.wcsDownloadListOption.timePositionList.length > 0 && this.wcsDownloadForm.timePosition == this.SELECT_DEFAULT_TIME_POS) {
        alert('Cannot download. A time position value has not been selected');
        return;
      }
      this.downloadStarted = true;
      let timePositions = [];
      if (this.wcsDownloadForm.timePosition) {
        timePositions = [this.wcsDownloadForm.timePosition];
      }
      observableResponse = this.downloadWcsService.download(this.layer, this.bbox, this.wcsDownloadForm.inputCrs, 
        this.wcsDownloadForm.downloadFormat, this.wcsDownloadForm.outputCrs, timePositions);

    // WFS download
    } else {
      this.downloadStarted = true;
      observableResponse = this.downloadWfsService.download(this.layer, this.bbox, null);
    }

    observableResponse.subscribe(value => {
      this.downloadStarted = false;
      const blob = new Blob([value], {type: 'application/zip'});
      saveAs(blob, 'download.zip');
    }, err => {
      this.downloadStarted = false;
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occured whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        alert('An error has occured whilst attempting to download. (' + err.message + ') Kindly contact cg-admin@csiro.au');
      }
    });
  }

   /**
   * Download the layer
   */
  public download4Polygon(): void {

    if (this.download4pStarted) {
      alert('Download in progress, kindly wait for it to completed');
      return;
    }
    let observableResponse = null;

    // WFS download

      this.download4pStarted = true;
      observableResponse = this.downloadWfsService.download(this.layer, null, this.polygonFilter);

    observableResponse.subscribe(value => {
      this.download4pStarted = false;
      const blob = new Blob([value], {type: 'application/zip'});
      saveAs(blob, 'download.zip');
    }, err => {
      this.download4pStarted = false;
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occured whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        alert('An error has occured whilst attempting to download. (' + err.message + ') Kindly contact cg-admin@csiro.au');
      }
    });
  }
}
