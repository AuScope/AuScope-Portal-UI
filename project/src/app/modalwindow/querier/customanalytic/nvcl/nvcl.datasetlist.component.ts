import { RickshawService } from '../../../../portal-core-ui/widget/chart/rickshaw/rickshaw.service';
import { LayerModel } from '../../../../portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../../../portal-core-ui/model/data/onlineresource.model';
import { NVCLService } from './nvcl.service';
import { Component, Inject, Input, AfterViewInit } from '@angular/core';
import {HttpParams} from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import {saveAs} from 'file-saver/FileSaver';
import { NVCLBoreholeAnalyticService } from '../../../layeranalytic/nvcl/nvcl.boreholeanalytic.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { UtilitiesService } from 'app/portal-core-ui/utility/utilities.service';


export interface DialogData {
  scalarClasses: any[];
  name: string;
}

@Component({
  selector: 'app-nvcl-datasetlist-component',
  templateUrl: './nvcl.datasetlist.component.html',
  providers: [NVCLService, RickshawService, NVCLBoreholeAnalyticService],
  styleUrls: ['../../../../portal-core-ui/widget/chart/rickshaw/rickshaw.service.scss', '../../../modalwindow.scss']
})
export class NVCLDatasetListComponent implements AfterViewInit {

  @Input() layer: LayerModel;
  @Input() onlineResource: OnlineResourceModel;
  @Input() featureId: string;
  public nvclDatasets: any[] = [];
  public collapse: any[] = [];
  public datasetImages: any[] = [];
  public datasetScalars: any[] = [];
  public datasetScalarDefinition: string[] = [];
  public drawGraphMode = false;
  public selectedLogNames = [];
  public processingGraph = false;
  public downloadEmail = '';
  public downloadResponse = '';
  public downloadingTSG = false;
  public jobView = false;
  public selectedScalar = '';
  public selectedScalarName = '';
  public selectedScalardata: any;

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


  public jobList: any[] = [];
  public currentStatus = [];
  public checkingTSG = false;
  constructor(public nvclService: NVCLService,
    public domSanitizer: DomSanitizer,
    private rickshawService: RickshawService,
    public nvclBoreholeAnalyticService: NVCLBoreholeAnalyticService,
    public dialog: MatDialog) {}


  ngAfterViewInit(): void {

    this.nvclService.getNVCLDatasets(this.onlineResource.url, this.featureId).subscribe(result => {
      for (const nvclDataset of result) {
        nvclDataset.image = true;
        nvclDataset.scalar = false;
        nvclDataset.download = false;
        if (this.nvclBoreholeAnalyticService.hasSavedEmail()) {
          this.downloadEmail = this.nvclBoreholeAnalyticService.getUserEmail();
        }
        this._getNVCLImage(this.onlineResource.url, nvclDataset.datasetId, null);
        this._getNVCLScalar(this.onlineResource.url, nvclDataset.datasetId);
        this.nvclDatasets.push(nvclDataset);
      }

    })

    this.nvclService.getNVCL2_0_TsgJobsByBoreholeId(this.featureId).subscribe(result => {
      this.jobList[this.featureId] = result;
    })
  }

  public drawGraph(logIds: Array<string>, logNames: Array<string>) {
    const me = this;
    this.processingGraph = true;
    this.nvclService.getNVCL2_0_JSONDataBinned(this.onlineResource.url, logIds).
      subscribe(response => {
        if (response.success) {
          this.rickshawService.drawNVCLDataGraph(response.data, logIds, logNames);
          this.processingGraph = false;
        } else {
          alert('Failed to load resources');
          this.processingGraph = false;
          this.drawGraphMode = false;
        }
      })

  }

  public changeScalarSelection (datasetid) {
    this._getNVCLImage(this.onlineResource.url, datasetid, this.selectedScalar);
  }

  public drawGraphJob(jobIds: Array<string>) {
    const me = this;
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
      })

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
          definition: 'Error retriving definition',
          label: 'Error unknown',
          scopeNote: 'Error unknown'
        }
      }
    })
  }

  private _getNVCLImage(url: string, datasetId: string, scalarid: string) {
   // if (this.datasetImages[datasetId]) {
   //   return;
  //  }
    this.nvclService.getNVCL2_0_Images(url, datasetId).subscribe(trayImages => {
      for (const trayImage of trayImages) {
        if (trayImage.logName === 'Tray Thumbnail Images') {
          this.datasetImages[datasetId] = []
          let httpParams = new HttpParams();
          // httpParams = httpParams.append('serviceUrl', this.nvclService.getNVCLDataServiceUrl(this.onlineResource.url));
          // httpParams = httpParams.append('logId', trayImage.logId);
          httpParams = httpParams.append('datasetid', datasetId);
         // httpParams = httpParams.append('width', '3');
          if ( scalarid != null ) {
            httpParams = httpParams.append('scalarids', scalarid);
          }
          this.datasetImages[datasetId].push(this.nvclService.getNVCLDataServiceUrl(this.onlineResource.url) + 'mosaic.html?' + httpParams.toString());
        }
      }
    })
  }

  private _getNVCLScalar(url: string, datasetId: string) {
    if (this.datasetScalars[datasetId]) {
      return;
    }
    this.nvclService.getNVCLScalars(url, datasetId).subscribe(scalars => {
      this.datasetScalars[datasetId] = scalars;
    })
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
          alert('no logs selected');
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
          alert('no logs selected');
        }
        const me = this;
        setTimeout(() => {
          me.processingGraph = true;
          me.drawGraph(logIds, logNames);

        }, 0);
      }

    } else {
      this.selectedLogNames = [];
    }
  }

  public downloadCSV(datasetId: string) {
    const logs = this.datasetScalars[datasetId];
    const logIds = [];
    const logNames = [];

    for (const log of logs) {
      if (log.value) {
        logIds.push(log.logId);

      }
    }

    if (logIds.length <= 0) {
      alert('no logs selected');
    }
    this.nvclService.getNVCL2_0_CSVDownload(this.onlineResource.url, logIds).
      subscribe(response => {
        const blob = new Blob([response], {type: 'application/csv'});
        saveAs(blob, datasetId + '.csv');
      })
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
        this.nvclBoreholeAnalyticService.setUserEmail( this.downloadEmail );
      }, error => {
        this.downloadingTSG = false;
      })
  }
  public checkStatus(datasetId: string) {
    if (this.downloadEmail.length === 0 || this.downloadEmail.indexOf('@') < 0) {
      alert('Please enter a valid email address');
      return;
    }
    this.checkingTSG = true;
    this.nvclService.getNVCLTSGDownloadStatus(this.onlineResource.url, this.downloadEmail).
      subscribe(response => {
        this.downloadResponse = response;
        this.checkingTSG = false;
        this.nvclBoreholeAnalyticService.setUserEmail( this.downloadEmail );
      }, error => {
        this.checkingTSG = false;
      })
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
    this.nvclService.getNVCL2_0_JSONDataBinned(this.onlineResource.url, [this.selectedScalar]).
      subscribe(response => {
        if ('success' in response && response.success === true && response.data.length > 0) {
          const this_ptr = this;
          const metric_colours: any[] = [];
          let minval = 999999999;
          let maxval = -999999999;
          let has_data = false;
          const jsonObj = JSON.parse(response.data);
          for (let i = 0; i < jsonObj.length; i++) {
            const bv = jsonObj[i];
            ['stringValues', 'numericValues'].forEach(function (dataType) {
              if (bv.hasOwnProperty(dataType) && bv[dataType].length > 0) {
                // Find the log name for our log id, this will be our 'metric_name'
                const metric_name = this_ptr.datasetScalars[datasetId].filter(x => x.logId === bv.logId)[0].logName
                if (metric_name.length > 0) {
                  bv[dataType].forEach(function (val) {

                    // "stringValues" ==> units are called "Sample Count" and "numericValues" ==> "Meter Average"
                    if (dataType === 'stringValues') {
                      const key = val.classText;
                      // Use the supplied colour for each metric
                      if (!(key in metric_colours)) {
                        metric_colours[key] = this_ptr._colourConvert(val.colour);
                      }
                      has_data = true;
                    } else if (dataType === 'numericValues') {
                      if (val.averageValue < minval) {
                        minval = parseFloat(val.averageValue);
                      }
                      if (val.averageValue > maxval) {
                        maxval = parseFloat(val.averageValue);
                      }
                      has_data = true;
                    } // if
                  }); // for each
                  if (dataType === 'numericValues') {
                    for (let j = 0; j < 9; j++) {
                      metric_colours[(minval + (maxval - minval) * (j / 8)).toLocaleString()] = this_ptr._colourConvert(this_ptr.linPal[256 * (8 - j) / 8]);
                    }
                    metric_colours.sort();
                  }
                } // if
              } // if
            }); // for each
          } // for

          if (has_data) {
            const dialogRef = this.dialog.open(NVCLDatasetListDialogComponent, {
              width: '250px',
              data: {name: 'junk', scalarClasses: metric_colours},
              panelClass: 'legenddialog'
            });
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
})
export class NVCLDatasetListDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<NVCLDatasetListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
