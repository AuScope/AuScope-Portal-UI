import { CSWRecordModel } from './cswrecord.model';

/**
 * A representation of a layer
 */
export class LayerModel {
  cswRecords: CSWRecordModel[];
  description: string;
  feature_count: number;
  group: string;
  hidden: boolean;
  id: string;
  layerMode: string;
  name: string;
  order: string;
  proxyCountUrl: string;
  proxyDownloadUrl: string;
  proxyGetFeatureInfoUrl: string;
  proxyStyleUrl: string;
  proxyUrl: string;
  relatedRecords: any;
  singleTile: boolean;
  staticLegendUrl: boolean;
  iconUrl: string;
  filterCollection: any;
  stackdriverFailingHosts: string[];
  ogcFilter: String;
  wfsUrls: String[];
}
