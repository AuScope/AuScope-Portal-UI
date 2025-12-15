export interface EpsgEntry {
    code: number;
    name: string;
    proj4: string;
    bbox?: [number, number, number, number];
}
