import { CSWRecordModel } from "@auscope/portal-core-ui";

export interface SearchResponse {
  totalCSWRecordHits: number;
  cswRecords: CSWRecordModel[];
  knownLayerIds: string[];
}