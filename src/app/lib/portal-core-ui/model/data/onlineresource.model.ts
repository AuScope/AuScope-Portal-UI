import { ResourceType } from "../../utility/constants.service";
/**
 * A representation of a online resource
 */
export class OnlineResourceModel {
  applicationProfile: string;
  description: string;
  name: string;
  type: ResourceType;
  url: string;
  version: string;
  geographicElements: any;
  protocolRequest: string;
}
