import { LayerModel } from '@auscope/portal-core-ui';
import { LayerHandlerService } from '@auscope/portal-core-ui';
import { CapdfFilterService } from './capdf.filter.service';
import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AdvancedFilterDirective } from '../advanced-filter.directive';


@Component({
  templateUrl: './capdf.advancefilter.component.html',
  providers: [CapdfFilterService],
  styleUrls: ['./capdf.advancefilter.component.scss', '../../../../menupanel.scss']
})
export class CapdfAdvanceFilterComponent extends AdvancedFilterDirective implements OnInit {

  @Input() layer: LayerModel;
  public advanceparamBS = new BehaviorSubject<any>({});
  public groupOfInterests;
  public aoiParams;
  public param;
  public selectedPOI;
  public sliderRange = [0, 1];


  constructor(public capdfFilterService: CapdfFilterService, private layerHandler: LayerHandlerService, private changeDetectorRef: ChangeDetectorRef) {
    super();
    this.param = [];
  }


  ngOnInit() {
    const wfsResource = this.layerHandler.getWFSResource(this.layer);
    this.capdfFilterService.doGetGroupOfInterest(wfsResource[0].url).subscribe(response => {
      this.groupOfInterests = response;
    })
  }

  public getAOIParam(featureType: string) {
    const wfsResource = this.layerHandler.getWFSResource(this.layer);
     this.capdfFilterService.doGetAOIParam(wfsResource[0].url, featureType).subscribe(response => {
      this.aoiParams = response;
    })
  }

  public setPOI(selectedPOI) {
    this.param['poi'] = selectedPOI[0];
    this.param['min'] = parseFloat(selectedPOI[2])
    this.param['max'] = parseFloat(selectedPOI[3])
    this.changeDetectorRef.detectChanges();
    const me = this;
    setTimeout(() => {
      me.sliderRange = [parseFloat(selectedPOI[2]), parseFloat(selectedPOI[3])];
    });
    this.advanceparamBS.next(this.param);
  }

  public onRangeChange($event) {
    this.param['min'] = $event[0]
    this.param['max'] = $event[1];
    this.advanceparamBS.next(this.param);
  }

  public convertStringToNumber(num: string): number {
    return parseFloat(num);
  }

}
