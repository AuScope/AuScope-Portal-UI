import { CSWRecordModel, LayerModel } from "@auscope/portal-core-ui";

export interface KnownLayerAndRecords {

  knownLayerId: string;
  knownLayer: LayerModel;
  belongingRecords: CSWRecordModel[];
  relatedRecords: CSWRecordModel[];
  capabilitiesRecords: any[];
}
