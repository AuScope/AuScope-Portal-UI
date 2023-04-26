/**
 * PermanentLink model
 */
export interface PermanentLink {
  id: string;
  name: string;
  description: string;
  creationDate: Date,
  jsonState: any;
  isPublic: boolean;
}
