import { Bbox } from '@auscope/portal-core-ui';
import { LayerModel } from '@auscope/portal-core-ui';
import { LayerHandlerService } from '@auscope/portal-core-ui';
import { CsMapService } from '@auscope/portal-core-ui';
import { DownloadWfsService } from '@auscope/portal-core-ui';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { UtilitiesService } from '@auscope/portal-core-ui';
import { ResourceType } from '@auscope/portal-core-ui';
import { saveAs } from 'file-saver';
import { config } from '../../../../environments/config';
import { environment } from '../../../../environments/environment'; //CVP
import { RectangleEditorObservable } from '@auscope/angular-cesium';
import { ChangeDetectorRef } from '@angular/core';
import { DownloadWcsService, CsClipboardService, DownloadIrisService, CsIrisService } from '@auscope/portal-core-ui';
import { NVCLTSGDownloadComponent } from 'app/modalwindow/layeranalytic/nvcl/nvcl.tsgdownload.component';
import { isNumber } from '@turf/helpers';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NVCLService } from '../../../modalwindow/querier/customanalytic/nvcl/nvcl.service';
import { TSGDownloadService } from 'app/modalwindow/layeranalytic/nvcl/tsgdownload.service';
import { shareReplay } from 'rxjs/operators';

declare var gtag: Function;

@Component({
  selector: 'app-download-panel',
  templateUrl: './downloadpanel.component.html',
  styleUrls: ['../../menupanel.scss']
})


export class DownloadPanelComponent implements OnInit {
  [x: string]: any;
  @Input() layer: LayerModel;
  bbox: Bbox;
  polygonFilter: any;
  drawStarted: boolean;
  downloadStarted: boolean;
  download4pStarted: boolean;
  download4PolygonKMLStarted: boolean;
  isPolygonSupportedLayer: boolean;
  isCsvSupportedLayer: boolean;  // Supports CSV downloads of WFS Features
  isDatasetURLSupportedLayer: boolean; // Supports dataset downloads using a URL in the WFS GetFeature response
  isWCSDownloadSupported: boolean; // Supports WCS dataset downloads
  isNvclLayer: boolean;
  isTsgDownloadAvailable: boolean;
  tsgDownloadServiceMsg: string;
  tsgDownloadEmail: string;
  downloadSizeLimit: number; // Limits the WCS download size
  showDOIs: boolean;
  wcsDownloadListOption: any;
  wcsDownloadForm: any;

  irisDownloadListOption: any;
  isIRISDownloadSupported: boolean;

  // Default values for selectors
  public SELECT_DEFAULT_DOWNLOAD_FMT = "Choose a download format";
  public SELECT_DEFAULT_REF_SYSTEM = "Choose a reference system";
  public SELECT_DEFAULT_OUTPUT_CRS = "Choose an output CRS";
  public SELECT_DEFAULT_TIME_POS = "Choose a time position";
  public SELECT_DEFAULT_DATA_TYPE = "Choose a data type service";
  public SELECT_DEFAULT_STATION = "Choose a station";
  public SELECT_ALL_STATION = "All stations";
  public SELECT_ALL_CODE = "*";
  public SELECT_DEFAULT_CHANNEL = "Choose a channel";
  public SELECT_ALL_CHANNEL = "All channels";

  // the rectangle drawn on the map
  private rectangleObservable: RectangleEditorObservable;
  private bsModalRef = null;

  constructor(private tsgDownloadService: TSGDownloadService, private cdRef: ChangeDetectorRef, private layerHandlerService: LayerHandlerService, private csMapService: CsMapService,
    private downloadWfsService: DownloadWfsService, private downloadWcsService: DownloadWcsService, private downloadIrisService: DownloadIrisService,
    private csClipboardService: CsClipboardService, private csIrisService: CsIrisService, public activeModalService: NgbModal, private nvclService: NVCLService) {
    this.isNvclLayer = false;
    this.isTsgDownloadAvailable = false;
    this.bbox = null;
    this.drawStarted = false;
    this.downloadStarted = false;
    this.wcsDownloadForm = {};
    this.showDOIs = false;
  }

  ngOnInit(): void {
    if (this.layer.group == "Passive Seismic") {
      this.showDOIs = true;
    }
    if (this.layer) {
      if (this.nvclService.isNVCL(this.layer.id)) {
        this.isNvclLayer = true;
        //Setup TsgDownload Button if API is ready.
        const observableResponse = this.downloadWfsService.checkTsgDownloadAvailable();
        observableResponse.subscribe(response => {
          if (response['success'] === true){
            this.isTsgDownloadAvailable = true;
            this.tsgDownloadServiceMsg = response['msg'];
          } else {
            this.isTsgDownloadAvailable = false;
          }
        }, err => {
          this.isTsgDownloadAvailable = false;
        });
      }
      this.isPolygonSupportedLayer = config.polygonSupportedLayer.indexOf(this.layer.id) >= 0;
      this.isCsvSupportedLayer = config.csvSupportedLayer.indexOf(this.layer.id) >= 0;
      this.isDatasetURLSupportedLayer = config.datasetUrlSupportedLayer[this.layer.id] !== undefined;
      // If it is an IRIS layer get the station information
      if (config.datasetUrlAussPassLayer[this.layer.group.toLowerCase()] !== undefined &&
          this.layerHandlerService.contains(this.layer, ResourceType.IRIS)) {
        this.isIRISDownloadSupported = true;
        this.getIRISStationInfo();
      }
      // If layer supports WCS set download size limit
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
            this.clearBound();
            this.polygonFilter = '<ogc:Filter  xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\"><ogc:Intersects><ogc:PropertyName>gsmlp:shape</ogc:PropertyName>' + polygonBBox.coordinates + '</ogc:Intersects></ogc:Filter>';
          } else {
            this.polygonFilter = null;
          }
      });

      this.downloadWfsService.tsgDownloadStartBS.subscribe(
        (message) => {
          let progressData =  message.split(',');
          if ('start'.match(progressData[0])) {    
            this.tsgDownloadEmail =  progressData[1];    
            this.Download4TsgFiles();
          }
        });

    } else {
      this.isCsvSupportedLayer = false;
      this.isWCSDownloadSupported = false;
      this.isPolygonSupportedLayer = false;
      this.isDatasetURLSupportedLayer = false;
    }
  }

  /**
   * Draw bound to get the bbox for download
   */
  public drawBound(): void {
    this.clearBound();
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
        || vector.points[0].getPosition().x === vector.points[1].getPosition().x
        || vector.points[0].getPosition().y === vector.points[1].getPosition().y) {
        // drawing hasn't finished
        return;
      }
      const points = vector.points;
      // calculate area from the 2 rectangle points
      const width = points[0].getPosition().x - points[1].getPosition().x;
      const length = points[0].getPosition().y - points[1].getPosition().y;
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

  /**
   * Runs the WCS 'DescribeCoverage' request to gather more information about the WCS resource
   */
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
        if (me.wcsDownloadListOption.inputCrsList.length === 1) {
          me.wcsDownloadForm.inputCrs = me.wcsDownloadListOption.inputCrsList[0];
        } else {
          me.wcsDownloadForm.inputCrs = this.SELECT_DEFAULT_REF_SYSTEM;
        }

        // If there is only one download format option, then that is selected
        if (me.wcsDownloadListOption.downloadFormatList.length === 1) {
          me.wcsDownloadForm.downloadFormat = me.wcsDownloadListOption.downloadFormatList[0];
        } else {
          me.wcsDownloadForm.downloadFormat = this.SELECT_DEFAULT_DOWNLOAD_FMT;
        }

        // If there is only one download format option, then that is selected
        if (me.wcsDownloadListOption.outputCrsList.length === 1) {
          me.wcsDownloadForm.outputCrs = me.wcsDownloadListOption.outputCrsList[0];
        } else {
          me.wcsDownloadForm.outputCrs = this.SELECT_DEFAULT_OUTPUT_CRS;
        }

        // If there is only one time position, then that is selected
        if (me.wcsDownloadListOption.timePositionList.length === 1) {
          me.wcsDownloadForm.timePosition = me.wcsDownloadListOption.timePositionList[0];
        } else if (me.wcsDownloadListOption.timePositionList.length === 0) {
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
   * Runs the getIrisStationFeature request to gather information about the IRIS stations and channels
   */
  private getIRISStationInfo() {
    const serviceTypeList = Object.keys(config.datasetUrlAussPassLayer[this.layer.group.toLowerCase()]['serviceType']);
    this.csIrisService.getIrisStationFeature(this.layer).subscribe(response => {

      const channelLst = this.getAvilChannel(response['data'][0].stationLst);

      let stationLst = response['data'][0].stationLst;
      stationLst = [{ 'code': this.SELECT_ALL_CODE, 'name': this.SELECT_ALL_STATION }].concat(stationLst);

      this.irisDownloadListOption = {
        serviceTypeList: serviceTypeList,
        stationLst: stationLst,
        channelLst: channelLst,
        selectedserviceType: (serviceTypeList.length > 0) ? serviceTypeList[0] : this.SELECT_DEFAULT_DATA_TYPE,
        selectedChannels: [],
        selectedStations: [],
        displayBbox: true,
        minDate: response['data'][0].mintDate,
        maxDate: response['data'][0].maxDate,
        dateFrom: response['data'][0].mintDate,
        dateTo: response['data'][0].maxDate,
      }
    })
  }

  /**
   * Create a channel list to display in the dropdown. The list is the union of all available channels for all stations.
   */
  private getAvilChannel(stationLst) {
    let channelLst = [];
    stationLst.forEach(station => {
      if (station.channelLst && station.channelLst.length > 0) {
        station.channelLst.forEach(channel => {
          if (!channelLst.find(r => r.code === channel.code)) {
            channelLst.push(channel);
          }
        });
      }
    });
    channelLst = [{ 'code': this.SELECT_ALL_CHANNEL }].concat(channelLst);
    return channelLst;
  }

  /**
   * Clear the bounding box
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
      if (this.wcsDownloadForm.inputCrs === this.SELECT_DEFAULT_REF_SYSTEM) {
        alert('Cannot download. A reference system value has not been selected');
        return;
      }
      if (this.wcsDownloadForm.downloadFormat === this.SELECT_DEFAULT_DOWNLOAD_FMT) {
        alert('Cannot download. An download format has not been selected');
        return;
      }
      if (this.wcsDownloadForm.outputCrs === this.SELECT_DEFAULT_OUTPUT_CRS) {
        alert('Cannot download. An output CRS has not been selected');
        return;
      }
      if (this.wcsDownloadListOption.timePositionList.length > 0 && this.wcsDownloadForm.timePosition === this.SELECT_DEFAULT_TIME_POS) {
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

      // Download datasets using a URL in the WFS GetFeature response
    } else if (this.isDatasetURLSupportedLayer) {
      this.downloadStarted = true;
      observableResponse = this.downloadWfsService.downloadDatasetURL(this.layer, this.bbox, null);

      // Download datasets by constructing a data download URL. User can select the eigther Dataselect or Station
    } else if (this.irisDownloadListOption) {
      this.downloadStarted = true;

      let start = (this.irisDownloadListOption.dateFrom !== null && this.irisDownloadListOption.dateFrom !== '') ? new Date(new Date(this.irisDownloadListOption.dateFrom)).toISOString() : null;
      let end = (this.irisDownloadListOption.dateToTo !== null && this.irisDownloadListOption.dateTo !== '') ? new Date(new Date(this.irisDownloadListOption.dateTo)).toISOString() : null;

      let station = this.SELECT_ALL_CODE;
      station = !this.irisDownloadListOption.selectedStations.includes(this.SELECT_ALL_CODE) ? this.irisDownloadListOption.selectedStations.join(",") : this.SELECT_ALL_CODE;

      let channel = this.SELECT_ALL_CODE;
      channel = !this.irisDownloadListOption.selectedChannels.includes(this.SELECT_ALL_CHANNEL) ? this.irisDownloadListOption.selectedChannels.join(",") : this.SELECT_ALL_CODE;

      if (this.irisDownloadListOption.selectedserviceType === 'Station') {
        observableResponse = this.downloadIrisService.downloadIRISStation(this.layer, this.bbox, station, channel, start, end);
      } else {
        observableResponse = this.downloadIrisService.downloadIRISDataselect(this.layer, station, channel, start, end);
      }
    } else {
      this.downloadStarted = true;
      observableResponse = this.downloadWfsService.downloadCSV(this.layer, this.bbox, null, true);
    }

    // Kick off the download process and save zip file in browser
    observableResponse.subscribe(value => {
      //console.log("downloadpanel.component.ts().observableResponse.value:"+value);
      this.downloadStarted = false;
      const blob = new Blob([value], { type: 'application/zip' });
      saveAs(blob, 'download.zip');
    }, err => {
      this.downloadStarted = false;
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occurred whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        if (err.status === 413 && this.irisDownloadListOption) {
          alert('An error has occurred whilst attempting to download. (Request entity is too large, please reduce the size by limiting the stations, channels, or time period.) Kindly contact cg-admin@csiro.au');

        } else {
          alert('An error has occurred whilst attempting to download. (' + err.message + ') Kindly contact cg-admin@csiro.au');
        }
      }
    });
  }
  /**
   * export2KML 
   */
  public saveKML(csv: string):void {
    const coordsEPSG4326LngLat = this.csClipboardService.getCoordinates(this.polygonFilter);
    // Lingbo: Need to swap from [Lng,Lat Lng,Lat] to [Lat,Lng Lat,Lng]
    let coordsListLngLat = [];
    let coordsListLatLng = [];
    const coordsList = coordsEPSG4326LngLat.split(' ');

    for (let i = 0; i<coordsList.length; i++) {
      const coord = coordsList[i].split(',')
      const lng = parseFloat(coord[0]).toFixed(3);
      const lat = parseFloat(coord[1]).toFixed(3)
      if (isNumber(lng) && isNumber(lat)) {
        coordsListLngLat.push(lng);
        coordsListLngLat.push(lat);
        coordsListLatLng.push(lat.toString() + ',' + lng.toString());
      }
    } 
    const coordsEPSG4326LatLng = coordsListLatLng.join(' ');
    //console.log(coordsEPSG4326LatLng);
    //149.096503,-31.845448 149.821601,-31.124050 
    const kmlHeader = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>' +
                      '<kml xmlns=\"http://www.opengis.net/kml/2.2\">' +
                      '<Document><name>AuScope-Portal-KML</name><description>Content</description>' +
                      '<Style id=\"markerstyle\"><IconStyle><Icon><href>http://maps.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png</href></Icon></IconStyle></Style>' ;                      
    const kmlTail = '</Document></kml>';
    const kmlPlaceMarkPolygon = '<Placemark><name>Polygon</name><description>AuScope-Portal Export</description><styleUrl>#Path</styleUrl>' +
                                '<Polygon><tessellate>1</tessellate><altitudeMode>clampToGround</altitudeMode><outerBoundaryIs><LinearRing><coordinates>' +
                                coordsEPSG4326LatLng +
                                '</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>';

    const kmlPlaceMarkBHTemplate = '<Placemark><name>${GMLID}</name><styleUrl>#icon-1899-0288D1</styleUrl><ExtendedData>${METADATA}</ExtendedData><Point><coordinates>${GSMLPSHAPE}</coordinates></Point></Placemark>';
    const bhMetaDataTemplate = '<Data name="${NAME}"><value>${VALUE}</value></Data>';
    let kml = "";
    let kmlPlaceMarkBHarray=[];
    let gmlid = "";
    let gsmlpshape = "";
    let gsmlpidentifier = "";
    let metaData = "";
    let name = "";
    let value = "";
    //csv data process
    let csvArray = csv.split(/\r?\n/g);    
    let csvHeader = csvArray[0].split(",");
    let indexGsmlpShape = csvHeader.indexOf("gsmlp:shape");
    let indexGmlId = csvHeader.indexOf("gml:id");
    let indexGsmlpIdentifier = csvHeader.indexOf("gsmlp:identifier")

    if (indexGsmlpShape < 0 || indexGmlId < 0) {
      console.log("saveKML:error to find gsmlp:shape");
      return;
    }
    kmlPlaceMarkBHarray.push(kmlHeader);
    kmlPlaceMarkBHarray.push(kmlPlaceMarkPolygon);

    for (var i = 1; i < csvArray.length; i++) {
      metaData = "";
      let csvline = csvArray[i].split(",");
      gmlid = csvline[indexGmlId]; 
      gsmlpshape = csvline[indexGsmlpShape];
      //skip the invalid line
      if (csvline.length < indexGsmlpShape || gsmlpshape.indexOf("POINT")<0) {
        continue;
      }
      gsmlpshape = gsmlpshape.substring(gsmlpshape.indexOf('(') + 1, gsmlpshape.indexOf(')')).split(' ').join(',');

      for(var j = 0; j < csvline.length; j++) {
        if (UtilitiesService.isEmpty(csvline[j])) {
          continue;
        }
        metaData = metaData + bhMetaDataTemplate.replace("${NAME}", csvHeader[j]).replace("${VALUE}", csvline[j]);
      }
      kmlPlaceMarkBHarray.push(kmlPlaceMarkBHTemplate.replace("${GMLID}", gmlid).replace("${GSMLPSHAPE}", gsmlpshape).replace("${METADATA}", metaData));
    }
    kmlPlaceMarkBHarray.push(kmlTail);

    var blob = new Blob([kmlPlaceMarkBHarray.join('\n')], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "AuScope-Portal-BHPolygon.kml");
  }
    /**
   * Download the layer
   */
  public download4PolygonKML(): string {
    if (this.download4PolygonKMLStarted) {
      alert('Download in progress, kindly wait for it to completed');
      return;
    }
    if (this.polygonFilter === null) {
      return;
    }
    let observableResponse = null;
    // fetch polygon filter
    this.download4PolygonKMLStarted = true;
    observableResponse = this.downloadWfsService.downloadCSV(this.layer, null, this.polygonFilter, false);
 
    // Kick off the download process and save zip file in browser
    observableResponse.subscribe(csv => {
      this.saveKML(csv);
      this.download4PolygonKMLStarted = false;
    }, err => {
      this.download4PolygonKMLStarted = false;
      alert('export2KML: An error has occurred whilst attempting to download. (' + err.message + ') Kindly contact cg-admin@csiro.au');
    });
  }
  /**
   * Popup the TSGDownload Model window.
   */
  public PopupTSGDownload() {
    if (this.polygonFilter === null && this.bbox === null) {
      alert('Please draw a boundary or polygon first, otherwise the TSG datasets will be too big to download.');
      return;
    }

    this.bsModalRef = this.activeModalService.open(NVCLTSGDownloadComponent, {
      size: 'lg',
      backdrop: false
      });
    this.bsModalRef.componentInstance.layer = this.layer;
    this.bsModalRef.componentInstance.tsgDownloadServiceMsg = this.tsgDownloadServiceMsg;

  }

   /**
   * Download the TSG files filtering with a bbox or polyon filter
   */
  public Download4TsgFiles() {
    let observableResponse = null;
    // Download WFS features as CSV files
    if (this.polygonFilter) {
      observableResponse = this.downloadWfsService.downloadTsgFileUrls(this.layer, null, this.tsgDownloadEmail, this.polygonFilter).pipe(shareReplay(1));
    } else {
      observableResponse = this.downloadWfsService.downloadTsgFileUrls(this.layer, this.bbox, this.tsgDownloadEmail, null).pipe(shareReplay(1));
    }

    // Kick off the download process and save zip file in browser
    observableResponse.subscribe(urls => {
      let total = 0;
      let urlsArray = [];
      if (urls) {
        urlsArray = urls.split(/\r?\n/g).filter(function(url) {
          return url.match(/^http/g);
        });    
        total = urlsArray.length;
      }
      if (!urls || total<1) {
        alert('TSGFilesDownload: No TSGFiles was found in the area. Please draw another boundary or polygon to search.');
        this.downloadWfsService.tsgDownloadBS.next('completed,completed');        
        return;
      }
      this.bsModalRef.componentInstance.urlsArray = urlsArray;
      this.bsModalRef.componentInstance.BulkDownloadTsgFiles();
      /**
       * do not "log" the "email" to "Google Analytics" - as this is an ethics issue
       * 
       * console.log("environment.googleAnalyticsKey: "+environment.googleAnalyticsKey);
       */
        if (environment.googleAnalyticsKey && typeof gtag === "function") {
        gtag('event', 'TSGDownload', {
          event_category: 'TSGBulkDownload',
          event_action: '['+total+' of '+urlsArray.length+']'+urls
          //event_label: this.tsgDownloadEmail
        });
      }      
    }, err => {
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occurred whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        alert('An error has occurred whilst attempting to download. (' + err.message + ') Kindly contact cg-admin@csiro.au');
      }
    });

    return;
  }
  
   /**
   * Download the layer using a polyon to specify desired area
   */
  public download4Polygon(): void {

    if (this.download4pStarted) {
      alert('Download in progress, kindly wait for it to completed');
      return;
    }
    let observableResponse = null;
    this.download4pStarted = true;

    // Download datasets using a URL in the WFS GetFeature response
    if (this.isDatasetURLSupportedLayer) {
      observableResponse = this.downloadWfsService.downloadDatasetURL(this.layer, null, this.polygonFilter);

      // Download WFS features as CSV files
    } else {
      observableResponse = this.downloadWfsService.downloadCSV(this.layer, null, this.polygonFilter, true);
    }

    // Kick off the download process and save zip file in browser
    observableResponse.subscribe(value => {
      this.download4pStarted = false;
      const blob = new Blob([value], { type: 'application/zip' });
      saveAs(blob, 'download.zip');
    }, err => {
      this.download4pStarted = false;
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occurred whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        alert('An error has occurred whilst attempting to download. (' + err.message + ') Kindly contact cg-admin@csiro.au');
      }
    });
  }

  /**
   * on data type change construct the associated options
   */
  public onServiceTypeChange() {
    this.irisDownloadListOption.displayBbox = config.datasetUrlAussPassLayer[this.layer.group.toLowerCase()]['serviceType'][this.irisDownloadListOption.selectedserviceType].isGeometryOptional;
  }

  /**
   * on selected station change construct the channel list which is the union of all available channels for the selected stations.
   */
  public onStationChange() {
    this.irisDownloadListOption.channelLst.length = 0;
    if (this.irisDownloadListOption.selectedStations.includes(this.SELECT_ALL_CODE)) {
      this.irisDownloadListOption.channelLst = this.getAvilChannel(this.irisDownloadListOption.stationLst);
    } else {
      const stations = this.irisDownloadListOption.stationLst.filter(station => this.irisDownloadListOption.selectedStations.includes(station.code));
      this.irisDownloadListOption.channelLst = this.getAvilChannel(stations);
    }
  }
}
