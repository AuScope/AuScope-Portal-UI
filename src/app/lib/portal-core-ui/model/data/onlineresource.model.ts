import { ResourceType } from "../../utility/constants.service";
import { WMTSResourceModel } from "../wmts.model";

/**
 * A representation of a online resource
 */
export class OnlineResourceModel {
  applicationProfile: string | {server:string, version:string};
  description: string;
  name: string;
  type: ResourceType;
  url: string;
  version: string;
  geographicElements: any;
  protocolRequest: string;
  wmts?: WMTSResourceModel; // Optional WMTS information
}
