/* Registry information used in faceted search and for book marks*/
export interface Registry {
    title: string;            // Title for display
    id: string;               // Identifier
    serviceUrl: string;       // URL for service calls
    recordUrl: string;        // URL for record calls
    type: string;             // OGC service provider type (Default, GeoServer, PyCSW, ArcGIS)  
    checked?: boolean;        // Is registry checked in UI
    startIndex?: number;      // Current start index for search
    prevIndices?: number[];   // Previous start indices for search
    recordsMatched?: number;  // Total number of records matched
    currentPage?: number;     // Current page of search records
    searching?: boolean;      // Is a faceted search in progress?
    searchError?: string;     // Faceted search error result for registry
}
