import { LayerModel } from '../../../portal-core-ui/model/data/layer.model';
import { LayerHandlerService } from '../../../portal-core-ui/service/cswrecords/layer-handler.service';
import { UtilitiesService } from '../../../portal-core-ui/utility/utilities.service';
import { LayerAnalyticInterface } from '../layer.analytic.interface';
import { CapdfAnalyticService } from './capdf.analytic.service';
import {saveAs} from 'file-saver/FileSaver';
import { Component, Input, OnInit } from '@angular/core';


@Component({
  templateUrl: './capdf.analytic.component.html',
  providers : [CapdfAnalyticService],
  styleUrls: ['./capdf.analytic.component.scss', '../../modalwindow.scss']
})
export class CapdfAnalyticComponent implements OnInit, LayerAnalyticInterface {

  @Input() layer: LayerModel;
  public groupOfInterests;
  public aoiParams;
  public param ;
  public rendering = false;

  constructor(private capdfAnalyticService: CapdfAnalyticService, private layerHandler: LayerHandlerService) {
    this.param = [];
  }


  ngOnInit() {
    const wfsResource = this.layerHandler.getWFSResource(this.layer);
    this.capdfAnalyticService.doGetGroupOfInterest(wfsResource[0].url).subscribe(response => {
      this.groupOfInterests = response;
    })
  }

  public getAOIParam(featureType: string) {
    const wfsResource = this.layerHandler.getWFSResource(this.layer);
    this.capdfAnalyticService.doGetAOIParam(wfsResource[0].url, featureType).subscribe(response => {
      this.aoiParams = response;
    })
  }


  public onselectedBox($event) {
    this.param['bbox'] = ($event);
  }

  public drawScatter() {
    const wfsResource = this.layerHandler.getWFSResource(this.layer);
    const bbox = this.layer.cswRecords[0].geographicElements[0]
    bbox['crs'] = 'EPSG:4326';
    this.rendering = true;
     this.capdfAnalyticService.doCapdfHydroScatterPlotList(this.param['bbox'], this.param['xaxis'], this.param['yaxis'], this.param['featureType'],
       bbox, wfsResource[0].url).subscribe(response => {
         this.capdfAnalyticService.plotScatter(response.series, 'capdf-graph-analytic', 480, this.param['xaxis'], this.param['yaxis']);
         this.rendering = false;
     });
  }
  public drawBox() {
    const wfsResource = this.layerHandler.getWFSResource(this.layer);
    const bbox = this.layer.cswRecords[0].geographicElements[0]
    bbox['crs'] = 'EPSG:4326';
    this.rendering = true;
    this.capdfAnalyticService.doCapdfHydroBoxPlotList(this.param['bbox'], this.param['xaxis'], this.param['yaxis'], this.param['featureType'],
      bbox, wfsResource[0].url).subscribe(response => {
         this.capdfAnalyticService.plotBox(response.series, 'capdf-graph-analytic', 480, this.param['xaxis'], this.param['yaxis']);
        this.rendering = false;
     });
  }

  public downloadCSV() {
     const wfsResource = this.layerHandler.getWFSResource(this.layer);
    this.rendering = true;
    this.capdfAnalyticService.downloadCapdfCSV(wfsResource[0].url, this.param['featureType'], this.param['bbox'].northBoundLatitude, this.param['bbox'].southBoundLatitude,
      this.param['bbox'].eastBoundLongitude, this.param['bbox'].westBoundLongitude).subscribe(value => {
      this.rendering = false;
      const blob = new Blob([value], {type: 'application/zip'});
      saveAs(blob, this.param['featureType'] + '.csv');
    }, err => {
      if (UtilitiesService.isEmpty(err.message)) {
        alert('An error has occured whilst attempting to download. Kindly contact cg-admin@csiro.au');
      } else {
        alert(err.message + '. Kindly contact cg-admin@csiro.au');
      }
      this.rendering = false;
    });
  }

  public refresh() {
    this.capdfAnalyticService.clearPlot('capdf-graph-analytic');
    this.aoiParams = null;
    this.param = [];
  }

}
