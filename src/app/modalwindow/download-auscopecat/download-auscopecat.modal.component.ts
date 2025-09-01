import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { LayerModel } from '../../lib/portal-core-ui/model/data/layer.model';
import { OnlineResourceModel } from '../../lib/portal-core-ui/model/data/onlineresource.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import bboxPolygon from '@turf/bbox-polygon';
import { Feature } from '@turf/helpers';
import intersect from '@turf/intersect';
import { Polygon } from 'geojson';

type LatLon = [number, number];

/**
 * Instructions on downloading selected layer via AuScope-Cat
 */
@Component({
    selector: 'app-download-auscopecat-modal',
    templateUrl: './download-auscopecat.modal.component.html',
    styleUrls: ['./download-auscopecat.modal.component.scss'],
    imports: [CommonModule],
    standalone: true
})
export class DownloadAuScopeCatModalComponent implements OnInit {

    @Input() layer: LayerModel;
    @Input() bbox: any;
    @Input() polygon: any;

    code: string; // Code block output
    codeCopied: boolean = false; // Flag for code having been copied
    private clipboard = inject(Clipboard); // clipboard for coying code
    private activeModal = inject(NgbActiveModal);

    /**
     * Create auscopecat library code string
     */
    ngOnInit(): void {
        if (!this.layer) {
            this.code = '# No layer provided for download.';
            return;
        }

        // WFS resources
        const wfsResources = this.layer.cswRecords
            .flatMap(r => r.onlineResources ?? [])
            .filter(r => r.type.toLowerCase() === 'wfs');

        if (!wfsResources.length) {
            this.code = '# This layer appears to have no WFS resources for downloading.';
            return;
        }

        // Code imports
        const lines: string[] = [
            'from types import SimpleNamespace',
            'from auscopecat.api import download',
            'from auscopecat.auscopecat_types import DownloadType',
            'from auscopecat.auscopecat_types import ServiceType',
            '',
        ];

        // Polygon bounds and snippet
        const { boundsPoly, pythonHeader } = this.resolveBounds();
        lines.push(pythonHeader, '');

        // Per‐resource code, splitting intersects vs non‐intersects
        const intersecting: string[] = [];
        const fallback: string[] = [];

        wfsResources.forEach((res, idx) => {
            const call = this.buildDownloadCall(res, idx + 1);
            const geoEls = res.geographicElements ?? [];
            const doesIntersect = geoEls.some(el =>
                el.type === 'bbox' &&
                intersect(boundsPoly,
                    bboxPolygon([
                        el.westBoundLongitude,
                        el.southBoundLatitude,
                        el.eastBoundLongitude,
                        el.northBoundLatitude
                    ])
                ) !== null);
            (doesIntersect ? intersecting : fallback).push(call);
        });

        // Append intersecting or fallback code block
        if (intersecting.length) {
            lines.push(...intersecting);
        } else {
            lines.push(
                '# No WFS resources intersect the specified bounds.',
                '# Listing all WFS endpoints (results may be empty):',
                '',
                ...fallback
            );
        }

        this.code = lines.join('\n');
    }

    /**
     * Builds the Python snippet for a single WFS resource
     * @param resource the OnlineResourceModel
     * @param index resource index
     * @returns a string representing the download api call
     */
    private buildDownloadCall(resource: OnlineResourceModel, index: number): string {
        const bboxOrPolygon = this.bbox ? 'bbox=bbox' : 'polygon=polygon';
        return [
            'download_resource = SimpleNamespace(',
            `  url = "${resource.url}",`,
            '  type = ServiceType.WFS,',
            `  name = "${resource.name}"`,
            ')',
            `download(download_resource, ${bboxOrPolygon}, download_type=DownloadType.CSV, file_name="download_${index}.csv")`,
            ''
        ].join('\n');
    }

    /**
     * Resolve bounds for an OnlineResourceModel
     * @returns a Turf Feature<Polygon> for either the user‐provided bbox/polygon,
     *          or a default Australia‐wide box, plus the Python header snippet
     */
    private resolveBounds(): {
        boundsPoly: Feature<Polygon>;
        pythonHeader: string;
    } {
        // User defined bbox
        if (this.bbox) {
            const { northBoundLatitude: n, eastBoundLongitude: e,
                southBoundLatitude: s, westBoundLongitude: w } = this.bbox;

            const header = [
                'bbox = {',
                `    "north": ${n},`,
                `    "east":  ${e},`,
                `    "south": ${s},`,
                `    "west":  ${w}`,
                '}'
            ].join('\n');

            return {
                boundsPoly: bboxPolygon([w, s, e, n]),
                pythonHeader: header
            };
        }

        // User defined polygon
        if (this.polygon) {
            let coords: LatLon[];
            try {
                coords = this.parseGmlCoords(this.polygon);
            } catch {
                throw new Error('Error parsing polygon coordinates.');
            }

            const header = `polygon = ${this.toAuScopeCatDownloadString(coords)}`;
            return {
                boundsPoly: this.toTurfPolygon(coords),
                pythonHeader: header
            };
        }

        // Fallback to Australia‐wide bounds
        const defaultBounds = { north: -10.689, east: 153.637, south: -43.644, west: 113.155 };
        const header = [
            '# No bbox or polygon supplied, defaulting to Australia wide.',
            '# Note this may result in long load times and large datasets. Adding bounds is highly recommended.',
            'bbox = {',
            `    "north": ${defaultBounds.north},`,
            `    "east":  ${defaultBounds.east},`,
            `    "south": ${defaultBounds.south},`,
            `    "west":  ${defaultBounds.west}`,
            '}'
        ].join('\n');

        return {
            boundsPoly: bboxPolygon([defaultBounds.west, defaultBounds.south, defaultBounds.east, defaultBounds.north]),
            pythonHeader: header
        };
    }

    /**
     * Copy code to clipboard
     */
    copyCode(): void {
        this.clipboard.copy(this.code);
        this.codeCopied = true;
        setTimeout(() => this.codeCopied = false, 2000);
    }

    /**
     * Parse a GML element into an array of LatLon points
     * @param xmlString the GML coordinates an XML string
     * @returns returns an array of LatLon
     * @throws Error if no <gml:coordinates> element is found or if no coordinate data is present
     */
    private parseGmlCoords(xmlString: string): LatLon[] {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const gmlEl = xmlDoc.querySelector('gml\\:coordinates, coordinates');
        if (!gmlEl) throw new Error('No <gml:coordinates> element found');
        const raw = gmlEl.textContent?.trim();
        if (!raw) throw new Error('No coordinate data found');
        const cs = gmlEl.getAttribute('cs') || ',';
        const ts = gmlEl.getAttribute('ts') || ' ';
        return raw.split(ts).map(pair => {
            const [lat, lon] = pair.split(cs).map(Number);
            return [lat, lon];
        });
    }

    /**
     * AuScope-Cat download polygon LatLon formatter
     * @param coords the LatLon array
     * @returns a string of the form "[[lat, lon], [lat, lon], …]"
     */
    private toAuScopeCatDownloadString(coords: LatLon[]): string {
        const fragments = coords.map(
            ([lat, lon]) => `[${lat}, ${lon}]`
        );
        return `"[${fragments.join(', ')}]"`;
    }

    /**
     * TSG LatLon formatter.
     * Currently unused, but could be useful if we add downloading TSG files later.
     * @param coords the LatLon array
     * @returns a string of the form "lon,lat lon,lat …"
     */
    private toTsgString(coords: LatLon[]): string {
        return `"${coords
            .map(([lat, lon]) => `${lon},${lat}`)
            .join(' ')}"`;
    }

    /**
     * Creates a Turf compatible GeoJSON polygon from LatLon array
     * @param coords the LatLon array
     * @returns a GeoJSON polygon of the form { type: 'Polygon', coordinates: [ [ [lon,lat], … ] ] }
     */
    private toTurfPolygon(coords: LatLon[]): Feature<Polygon> {
        const poly = coords.map(([lat, lon]) => [lon, lat] as [number, number]);
        if (poly.length > 0 && (poly[0][0] !== poly[poly.length - 1][0] || poly[0][1] !== poly[poly.length - 1][1])) {
            poly.push([poly[0][0], poly[0][1]]);
        }
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [poly],
            },
            properties: {}
        };
    }

    /**
     * Close dialog
     */
    closeDialog() {
        this.activeModal.close();
    }
}
