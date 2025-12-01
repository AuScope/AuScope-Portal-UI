import { GeometryType } from "../../utility/constants.service";
/**
 * A representation of a primitive, a concept carried over from old portal-core extjs
 */
export class PrimitiveModel {
  coords: any;
  description: string;
  featureNode: any;
  geometryType: GeometryType;
  name: string;
  srsName: string;
}
