import { CSWRecordModel } from './cswrecord.model';
import { SplitDirection } from 'cesium';

/**
 * A representation of a layer
 */
export class LayerModel {
  cswRecords: CSWRecordModel[];
  capabilityRecords: any;
  description: string;
  group: string;
  hidden: boolean;
  id: string;
  csLayers: any[];
  layerMode: string;
  name: string;
  order: string;
  proxyDownloadUrl: string;
  proxyStyleUrl: string;
  proxyUrl: string;
  useDefaultProxy?: boolean;    // Use the default proxy (getViaProxy.do) if true (custom layers)
  useProxyWhitelist?: boolean;  // Use the default proxy whitelist if true (custom layers)
  relatedRecords: any;
  singleTile: boolean;
  legendImg?: string;
  iconUrl: string;
  filterCollection: any;
  stackdriverFailingHosts: string[];
  ogcFilter: String;
  wfsUrls: String[];
  sldBody: string;      // SLD_BODY for 1.1.1 GetMap/GetFeatureInfo requests
  sldBody130?: string;  // SLD_BODY FOR 1.3.0 GetMap/GetFeatureInfo requests
  clickCSWRecordsIndex: number[];
  clickPixel: any;
  clickCoord: any;
  // SplitDirection.[LEFT|RIGHT|NONE], NONE by default
  splitDirection?: SplitDirection;
  // Layer supports downloading, usually feature data in CSV form
  supportsCsvDownloads: boolean;
  kmlDoc: any; // Document object for custom KML layer
  jsonDoc: any; // Document object for custom Json layer  
  serverType?: string;  // Type of server hosting the data
  initialLoad: boolean; // if first time loaded, zoom to bbox
  minScaleDenominator?: number;  // MinScaleDenominator (from GetCapabilities)
  maxScaleDenominator?: number;  // MaxScaleDenominator (from GetCapabilities)
  stylefn?: any; //style function for GeoJson layer
}
