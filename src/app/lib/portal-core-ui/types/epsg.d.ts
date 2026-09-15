export interface EpsgEntry {
    code: string;
    name: string;
    proj4: string;
    bbox?: [number, number, number, number];
    /*
    // Other fields we could use later
    kind: string;
    wkt: string | null;
    unit: string;
    area: string;
    accuracy: number;
    */
}
