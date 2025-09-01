/**
 * A representation of a bbox
 */
import { LayerModel } from './layer.model';
import { OnlineResourceModel } from './onlineresource.model';
export class QuerierInfoModel {
  key: string;
  value: any;
  layer: LayerModel;
  onlineResource: OnlineResourceModel;
  raw: string; // VT: contains the raw xml or html
}
