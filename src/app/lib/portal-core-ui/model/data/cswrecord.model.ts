import { OnlineResourceModel } from './onlineresource.model';
import { TemporalExtentModel } from './temporal-extent.model';

/**
 * A representation of a csw record
 */
export class CSWRecordModel {
  adminArea: string;
  childRecords: any;
  constraints: any;
  useLimitConstraints: any;
  accessConstraints: any;
  contactOrg: string;
  funderOrg: string;
  datasetURIs: any;
  date: string;
  description: string;
  descriptiveKeywords: any;
  geographicElements: any;
  id: string;
  name: string;
  noCache: boolean;
  onlineResources: OnlineResourceModel[];
  recordInfoUrl: string;
  resourceProvider: string;
  service: boolean;
  expanded = false;
  temporalExtent?: TemporalExtentModel;
  knownLayerIds?: string[];
}
