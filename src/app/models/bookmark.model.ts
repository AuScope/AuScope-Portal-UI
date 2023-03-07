/**
 * Bookmark model.
 *
 * The fields fileIdentifier and serviceId are legacy (VGL) and refer to a CSW
 * data source's service ID and file identifier. They still represent this for
 * a bookmark created from the Data Search panel, but if the serviceId is
 * null/undefined then the fileIdentifier will refer to a KnownLayer's ID.
 */
export interface Bookmark {
  id?: number;
  userId?: string;
  fileIdentifier: string;
  serviceId: string;
}
