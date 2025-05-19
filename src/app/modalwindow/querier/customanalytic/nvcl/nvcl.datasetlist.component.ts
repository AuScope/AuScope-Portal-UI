import { RickshawService } from '@auscope/portal-core-ui';
import { LayerModel } from '@auscope/portal-core-ui';
import { OnlineResourceModel } from '@auscope/portal-core-ui';
import { NVCLService } from './nvcl.service';
import { Component, Input, OnInit, ApplicationRef } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { saveAs } from 'file-saver';
import { NVCLBoreholeAnalyticService } from '../../../layeranalytic/nvcl/nvcl.boreholeanalytic.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { UtilitiesService } from '@auscope/portal-core-ui';
import { trace } from 'console';

export interface DialogData {
  scalarClasses: any[];
  name: string;
}

@Component({
    selector: 'app-nvcl-datasetlist-component',
    templateUrl: './nvcl.datasetlist.component.html',
    providers: [RickshawService, NVCLBoreholeAnalyticService],
    styleUrls: ['../../../../../../node_modules/@auscope/portal-core-ui/src/lib/widget/chart/rickshaw/rickshaw.service.scss', '../../../modalwindow.scss', './nvcl.datasetlist.component.scss'],
    standalone: false
})
export class NVCLDatasetListComponent implements OnInit {

  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  public nvclDatasets: any[] = [];
  public collapse: any[] = [];
  public datasetImages: any[] = [];
  public datasetScalars: any[] = [];
  public datasetScalarDefinition = {};
  public tipScalarDefinition = null;
  public drawGraphMode = false;
  public selectedLogNames = [];
  public processingGraph = false;
  public downloadEmail = '';
  public downloadResponse = '';
  public downloadingTSG = false;
  public jobView = false;
  public selectedScalar = null;
  public selectedScalarName = '';
  public selectedScalardata: any;
  public legendDialogRef = null;
  public imagesLoaded: string[] = [];

  public linPal: number[] = [255, 767, 1279, 1791, 2303, 3071, 3583, 4095, 4863, 5375, 5887, 6655, 7167, 7935, 8447, 9215, 9727, 10495, 11007, 11775, 12543, 13055, 13823, 14591,
    15103, 15871, 16639, 17407, 18175, 18943, 19711, 20223, 20991, 21759, 22527, 23295, 24319, 25087, 25855, 26623, 27391, 28159, 29183, 29951, 30719, 31743, 32511, 33279, 34303,
    35071, 36095, 37119, 37887, 38911, 39679, 40703, 41727, 42751, 43519, 44543, 45567, 46591, 47615, 48639, 49663, 50687, 51711, 52735, 53759, 54783, 56063, 57087, 58111, 59391,
    60415, 61439, 62719, 63743, 65023, 65532, 65527, 65523, 65518, 65513, 65509, 65504, 65499, 65494, 65489, 65485, 65480, 65475, 65470, 65465, 65460, 65455, 65450, 65445, 65439,
    65434, 65429, 65424, 65419, 65413, 65408, 65403, 65398, 65392, 65387, 65381, 65376, 65371, 65365, 65360, 65354, 65349, 65343, 65338, 65332, 65327, 65321, 65316, 65310, 65305,
    65299, 65293, 65288, 65282, 196352, 589568, 917248, 1310464, 1703680, 2031360, 2424576, 2752256, 3145472, 3473152, 3866368, 4194048, 4587264, 4914944, 5308160, 5635840,
    6029056, 6356736, 6684416, 7077632, 7405312, 7798528, 8126208, 8453888, 8781568, 9174784, 9502464, 9830144, 10157824, 10485504, 10878720, 11206400, 11534080, 11861760,
    12189440, 12517120, 12844800, 13172480, 13500160, 13762304, 14089984, 14417664, 14745344, 15073024, 15335168, 15662848, 15990528, 16252672, 16580352, 16776448, 16775168,
    16774144, 16772864, 16771840, 16770816, 16769536, 16768512, 16767488, 16766208, 16765184, 16764160, 16763136, 16762112, 16761088, 16760064, 16759040, 16758016, 16756992,
    16755968, 16754944, 16754176, 16753152, 16752128, 16751104, 16750336, 16749312, 16748544, 16747520, 16746496, 16745728, 16744704, 16743936, 16743168, 16742144, 16741376,
    16740608, 16739584, 16738816, 16738048, 16737280, 16736512, 16735744, 16734720, 16733952, 16733184, 16732416, 16731648, 16731136, 16730368, 16729600, 16728832, 16728064,
    16727296, 16726528, 16726016, 16725248, 16724480, 16723968, 16723200, 16722432, 16721920, 16721152, 16720640, 16719872, 16719360, 16718592, 16718080, 16717312, 16716800,
    16716288, 16715520, 16715008, 16714496, 16713728, 16713216, 16712704, 16712192, 16711680];

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


  public jobList: any[] = [];
  public currentStatus = [];
  public checkingTSG = false;

  constructor(public nvclService: NVCLService,
    public domSanitizer: DomSanitizer,
    private rickshawService: RickshawService,
    private appRef: ApplicationRef,
    public nvclBoreholeAnalyticService: NVCLBoreholeAnalyticService,
    private modalRef: BsModalRef, private modalService: BsModalService) {
  }

  ngOnInit(): void {
    if (!(this.featureId)) {
      return;
    };
    if (!(this.onlineResource.url)) {
      return;
    }

    this.nvclService.getNVCLDatasets(this.onlineResource.url, this.featureId).subscribe(result => {
      for (const nvclDataset of result) {
        this.nvclService.setScalarLoaded(false);
        nvclDataset.image = true;
        nvclDataset.scalar = false;
        nvclDataset.download = false;
        nvclDataset.TSGCacheDownloadurl = "";
        if (this.nvclBoreholeAnalyticService.hasSavedEmail()) {
          this.downloadEmail = this.nvclBoreholeAnalyticService.getUserEmail();
        }
        this._getNVCLImage(this.onlineResource.url, nvclDataset.datasetId, null);
        this._getNVCLScalar(this.onlineResource.url, nvclDataset.datasetId);
        this.isCachedTSGFileAvailable(nvclDataset);
        this.nvclDatasets.push(nvclDataset); 
      }
      if (result.length === 0) {
        this.nvclService.setAnalytic(false);
      } else {
        this.nvclService.setAnalytic(true);
      }
    });

    this.nvclService.getNVCL2_0_TsgJobsByBoreholeId(this.featureId).subscribe(result => {
      this.jobList[this.featureId] = result;
    });
  }

  /**
   * Sets a dataset's images as having completed loading
   *
   * @param event the event that triggered this method
   * @param nvclDatasetId the ID of the dataset for which images have been loaded
   */
  setImagesLoaded(event: any, nvclDatasetId: string) {
    // Chrome will fire this event when added to DOM, ignore that
    if (event.target.src !== '') {
      this.imagesLoaded.push(nvclDatasetId);
    }
  }

  /**
   * Check if images for a dataset have finished loading
   *
   * @param nvclDatasetId the ID of the dataset to check
   * @returns true if images have been loaded, false if not
   */
  haveImagesLoaded(nvclDatasetId: string): boolean {
    return (this.imagesLoaded.indexOf(nvclDatasetId) !== -1);
  }

  public drawGraph(logIds: Array<string>, logNames: Array<string>) {
    this.processingGraph = true;
    this.appRef.tick();
    this.nvclService.getNVCL2_0_JSONDataBinned(this.onlineResource.url, logIds).
      subscribe(response => {
        if (response.success) {
          this.rickshawService.drawNVCLDataGraph(response.data, logIds, logNames);
          this.processingGraph = false;
          this.appRef.tick();
        } else {
          alert('Failed to load resources');
          this.processingGraph = false;
          this.drawGraphMode = false;
        }
      });
  }

  public changeScalarSelection(datasetid) {
    this._getNVCLImage(this.onlineResource.url, datasetid, this.selectedScalar);
  }

  public drawGraphJob(jobIds: Array<string>) {
    this.processingGraph = true;
    this.nvclService.getNVCL2_0_JobsScalarBinned(this.featureId, jobIds).
      subscribe(response => {
        if (response.success) {
          this.rickshawService.drawNVCLJobsGraph(response, {}, jobIds, jobIds);
          this.processingGraph = false;
        } else {
          alert('Failed to load resources');
          this.processingGraph = false;
          this.drawGraphMode = false;
        }
      });
  }

  public onMouseoverScalarDefinition(logName: string): void {
    if (this.datasetScalarDefinition[logName] !== undefined) {
      this.tipScalarDefinition = logName + ': ' + this.datasetScalarDefinition[logName].definition;
    } else {
      this.tipScalarDefinition = null;
    }
  }

  public onMouseoutScalarDefinition(): void {
    this.tipScalarDefinition = null;
  }

  public getDefinition(logName: string): void {
    this.datasetScalarDefinition[logName] = {
      definition: 'Loading ...'
    }
    this.nvclService.getLogDefinition(logName).subscribe(result => {
      if (result['definition']) {
        this.datasetScalarDefinition[logName] = result;
      } else {
        this.datasetScalarDefinition[logName] = {
          definition: 'Error retrieving definition',
          label: 'Error unknown',
          scopeNote: 'Error unknown'
        }
      }
    })
  }

  private _getNVCLImage(url: string, datasetId: string, scalarid: string) {
    this.nvclService.getNVCL2_0_Images(url, datasetId).subscribe(trayImages => {
      for (const trayImage of trayImages) {
        if (trayImage.logName === 'Tray Thumbnail Images') {
          this.datasetImages[datasetId] = [];
          let httpParams = new HttpParams();
          // httpParams = httpParams.append('serviceUrl', this.nvclService.getNVCLDataServiceUrl(this.onlineResource.url));
          // httpParams = httpParams.append('logId', trayImage.logId);
          httpParams = httpParams.append('datasetid', datasetId);
          // httpParams = httpParams.append('width', '3');
          if (scalarid != null) {
            httpParams = httpParams.append('scalarids', scalarid);
          }
          this.datasetImages[datasetId].push(this.nvclService.getNVCLDataServiceUrl(this.onlineResource.url) + 'mosaic.html?' + httpParams.toString());
        }
      }
    });
  }

  private _getNVCLScalar(url: string, datasetId: string) {
    if (this.datasetScalars[datasetId]) {
      return;
    }
    const scalarPriorityOrder = this.scalarPriorityOrder;
    this.nvclService.getNVCLScalars(url, datasetId).subscribe(scalars => {
      this.datasetScalars[datasetId] = scalars.sort(function (one, two) {
        const oneindex = scalarPriorityOrder.findIndex((element) => (element === one.logName));
        const twoindex = scalarPriorityOrder.findIndex((element) => (element === two.logName));
        if (twoindex === -1 && oneindex === -1) { return (one.logName > two.logName) ? 1 : -1 }
        if (twoindex < 0) { return -1; } else if (oneindex < 0) { return 1; } else { return oneindex - twoindex; }
      });
      this.nvclService.setScalarLoaded(true);
    });
  }

  public changeDrawGraphMode(mode: boolean, datasetId: string) {
    this.drawGraphMode = mode;
    if (mode) {
      if (this.jobView) {
        const jobIds = [];
        const jobNames = [];

        for (const ijob of this.jobList[this.featureId]) {
          if (ijob.value) {
            jobIds.push(ijob.jobId);
            jobNames.push(ijob.jobName)
          }
        }
        if (jobIds.length <= 0) {
          alert('No logs selected');
          return;
        }

        this.selectedLogNames[datasetId] = jobNames;
        this.drawGraphJob(jobIds);

      } else {
        const logs = this.datasetScalars[datasetId];
        const logIds = [];
        const logNames = [];

        for (const log of logs) {
          if (log.value) {
            logIds.push(log.logId);
            logNames.push(log.logName);
          }
        }
        this.selectedLogNames[datasetId] = logNames;
        if (logIds.length <= 0) {
          alert('No logs selected');
        }

        setTimeout(() => {
          this.processingGraph = true;
          this.drawGraph(logIds, logNames);
        }, 0);
      }

    } else {
      this.selectedLogNames = [];
    }
  }

  public isCachedTSGFileAvailable(dataset: any) {
    this.nvclService.getTSGCachedDownloadUrl(this.onlineResource.url, dataset.datasetName).
      subscribe(url => {
        dataset.TSGCacheDownloadurl = url;
      },
        () => {
          // swallow error.  the file just isnt cached.
        });
  }

  public downloadCSV(datasetId: string) {
    const logs = this.datasetScalars[datasetId];
    const logIds = [];

    for (const log of logs) {
      if (log.value) {
        logIds.push(log.logId);
      }
    }

    if (logIds.length <= 0) {
      alert('No logs selected');
    }
    this.nvclService.getNVCL2_0_CSVDownload(this.onlineResource.url, logIds).
      subscribe(response => {
        const blob = new Blob([response], { type: 'application/csv' });
        saveAs(blob, datasetId + '.csv');
      });
  }

  public downloadTSG(datasetId: string) {
    if (this.downloadEmail.length === 0 || this.downloadEmail.indexOf('@') < 0) {
      alert('Please enter a valid email address');
      return;
    }
    this.downloadingTSG = true;
    this.nvclService.getNVCLTSGDownload(this.onlineResource.url, datasetId, this.downloadEmail).
      subscribe(response => {
        this.downloadResponse = response;
        this.downloadingTSG = false;
        this.nvclBoreholeAnalyticService.setUserEmail(this.downloadEmail);
      }, () => {
        this.downloadingTSG = false;
      });
  }

  public checkStatus() {
    if (this.downloadEmail.length === 0 || this.downloadEmail.indexOf('@') < 0) {
      alert('Please enter a valid email address');
      return;
    }
    this.checkingTSG = true;
    this.nvclService.getNVCLTSGDownloadStatus(this.onlineResource.url, this.downloadEmail).
      subscribe(response => {
        this.downloadResponse = response;
        this.checkingTSG = false;
        this.nvclBoreholeAnalyticService.setUserEmail(this.downloadEmail);
      }, () => {
        this.checkingTSG = false;
      });
  }

  public clearCheckBox(datasetId: string) {
    const logs = this.datasetScalars[datasetId];
    for (const log of logs) {
      if (log.value) {
        log.value = false;
      }
    }
  }

  public _colourConvert(BGRColorNumber) {
    return '#' + UtilitiesService.leftPad((BGRColorNumber & 255).toString(16), 2, '0') +
      UtilitiesService.leftPad(((BGRColorNumber & 65280) >> 8).toString(16), 2, '0') +
      UtilitiesService.leftPad((BGRColorNumber >> 16).toString(16), 2, '0');
  }

  public openLegend(datasetId: string) {
    if (this.selectedScalar === null)
      return;
    this.nvclService.getNVCL2_0_JSONDataBinned(this.onlineResource.url, [this.selectedScalar]).
      subscribe(response => {
        if ('success' in response && response.success === true && response.data.length > 0) {
          const this_ptr = this;
          const metricColours: any = {};
          let minval = 999999999;
          let maxval = -999999999;
          let hasData = false;
          const jsonObj = JSON.parse(response.data);
          for (let i = 0; i < jsonObj.length; i++) {
            const bv = jsonObj[i];
            ['stringValues', 'numericValues'].forEach(dataType => {
              if (bv.hasOwnProperty(dataType) && bv[dataType].length > 0) {
                // Find the log name for our log id, this will be our 'metric_name'
                const metric_name = this_ptr.datasetScalars[datasetId].filter(x => x.logId === bv.logId)[0].logName;
                if (metric_name.length > 0) {
                  bv[dataType].forEach(function (val) {

                    // "stringValues" ==> units are called "Sample Count" and "numericValues" ==> "Meter Average"
                    if (dataType === 'stringValues') {
                      const key = val.classText;
                      // Use the supplied colour for each metric
                      if (!(key in metricColours)) {
                        metricColours[key] = this_ptr._colourConvert(val.colour);
                      }
                      hasData = true;
                    } else if (dataType === 'numericValues') {
                      if (val.averageValue < minval) {
                        minval = parseFloat(val.averageValue);
                      }
                      if (val.averageValue > maxval) {
                        maxval = parseFloat(val.averageValue);
                      }
                      hasData = true;
                    } // if
                  }); // for each
                  if (dataType === 'numericValues') {
                    for (let j = 0; j < 9; j++) {
                      metricColours[(minval + (maxval - minval) * (j / 8)).toLocaleString()] = this_ptr._colourConvert(this_ptr.linPal[256 * (8 - j) / 8]);
                    }
                    metricColours.sort();
                  }
                } // if
              } // if
            }); // for each
          } // for

          if (hasData) {
            //this.modalRef = this.modalService.show(NVCLDatasetListDialogComponent, {class: 'modal-sm modal-dialog-centered'});
            this.modalRef = this.modalService.show(NVCLDatasetListDialogComponent, {class: 'modal-sm'}); 
            this.modalRef.content.scalarClasses = metricColours;
            this.appRef.tick(); // required to make legend modal display the scalarClasses; otherwise required a click to trigger
          }
        } else {
          alert('Failed to render legend');
        }
      });
  }
}

@Component({
    selector: 'app-nvcl-datasetlist-component-dialog',
    templateUrl: 'nvcl.datasetlist.dialog.component.html',
    standalone: false
})
export class NVCLDatasetListDialogComponent {

  scalarClasses: any;

  constructor(public modalRef: BsModalRef) {}

}