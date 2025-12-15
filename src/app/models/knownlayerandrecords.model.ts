import { CSWRecordModel } from '../lib/portal-core-ui/model/data/cswrecord.model';
import { LayerModel } from '../lib/portal-core-ui/model/data/layer.model';

export interface KnownLayerAndRecords {

  knownLayerId: string;
  knownLayer: LayerModel;
  belongingRecords: CSWRecordModel[];
  relatedRecords: CSWRecordModel[];
  capabilitiesRecords: any[];
}
