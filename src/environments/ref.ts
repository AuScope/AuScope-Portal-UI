// This file contains references between classes for the purpose of configuration.
// I.E. when a layer has an additional analytic or advanced filter component it is linked to the layer here.

import { CapdfAdvanceFilterComponent } from '../app/menupanel/common/filterpanel/advance/capdf/capdf.advancefilter.component';
import { CapdfAnalyticComponent } from '../app/modalwindow/layeranalytic/capdf/capdf.analytic.component';
import { NVCLBoreholeAnalyticComponent } from '../app/modalwindow/layeranalytic/nvcl/nvcl.boreholeanalytic.component';
import { RemanentAnomaliesComponent } from '../app/modalwindow/querier/customanalytic/RemanentAnomalies/remanentanomalies.component';
import { NVCLDatasetListComponent } from '../app/modalwindow/querier/customanalytic/nvcl/nvcl.datasetlist.component';
import { TIMAComponent } from '../app/modalwindow/querier/customanalytic/tima/tima.component';
import { MSCLComponent } from '../app/modalwindow/querier/customanalytic/mscl/mscl.component';
import { GraceLegendComponent } from '../app/cesium-map/advanced/grace/grace-legend.component';
import { GraceAdvancedFilterComponent } from 'app/menupanel/common/filterpanel/advance/grace/grace-advanced-filter.component';


export const ref = {
  analytic: {
    'nvcl-borehole': NVCLDatasetListComponent,
    'nvcl-v2-borehole': NVCLDatasetListComponent,
    'tima-geosample': TIMAComponent,
    'remanent-anomalies': RemanentAnomaliesComponent,
    'remanent-anomalies-EMAG': RemanentAnomaliesComponent,
    'mscl-borehole': MSCLComponent
  },
  layeranalytic: {
    'nvcl-v2-borehole': NVCLBoreholeAnalyticComponent,
    'capdf-hydrogeochem': CapdfAnalyticComponent
  },
  advancedFilter: {
    'capdf-hydrogeochem': [CapdfAdvanceFilterComponent],
    'grace-mascons': [GraceAdvancedFilterComponent]
  },
  advancedMapComponent: {
    // Make sure AdvancedMapComponents are in an array
    'grace-mascons': [GraceLegendComponent]
  }
};
