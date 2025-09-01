import { CSWRecordModel } from '../lib/portal-core-ui/model/data/cswrecord.model';

export interface SearchResponse {
  totalCSWRecordHits: number;
  cswRecords: CSWRecordModel[];
  knownLayerIds: string[];
}
