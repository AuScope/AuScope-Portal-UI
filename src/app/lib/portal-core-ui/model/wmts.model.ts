/**
 * A representation of an OnlineResourceModel's optional WMTS information
 */
export class WMTSResourceModel {
  wmtsCapabilitiesUrl: string;
  wmtsAccessMethod: string;
  wmtsTileTemplate: string;
  wmtsStyle: string;
  wmtsTileMatrixSet: string;
  wmtsFormat: string;
  wmtsTileMatrixLabels: string[];
  wmtsTileMatrixSets: string[];
}

export class WMTSFeatureInfoParams {
  format: string;
  tileMatrix: string;
  tileRow: number;
  tileCol: number;
  i: number;
  j: number;
  level: number;
}