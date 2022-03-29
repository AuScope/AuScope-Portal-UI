import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { GraceStyleSettings } from '../../../toolbar/components/grace/grace-graph.models';
import { first } from 'rxjs/operators';

/**
 * Service for the GRACE API
 */
@Injectable()
export class GraceService {
    // Current GRACE style settings
    private _currentGraceStyleSettings: BehaviorSubject<GraceStyleSettings> = new BehaviorSubject({
        minColor: '#ff0000',
        minValue: -1,
        neutralColor: '#ffffff',
        neutralValue: 0,
        maxColor: '#0000ff',
        maxValue: 1,
        transparentNeutralColor: false
    });
    public readonly currentGraceStyleSettings: Observable<GraceStyleSettings> = this._currentGraceStyleSettings.asObservable();
    // Editor GRACE style settings
    private _editedGraceStyleSettings: BehaviorSubject<GraceStyleSettings> = new BehaviorSubject({
        minColor: '#ff0000',
        minValue: -1,
        neutralColor: '#ffffff',
        neutralValue: 0,
        maxColor: '#0000ff',
        maxValue: 1,
        transparentNeutralColor: false
    });
    public readonly editedGraceStyleSettings: Observable<GraceStyleSettings> = this._editedGraceStyleSettings.asObservable();
    // Current GRACE epoch
    private _graceDate: BehaviorSubject<any> = new BehaviorSubject({ undefined });
    public readonly graceDate: Observable<Date> = this._graceDate.asObservable();

    constructor(private http: HttpClient) {
        this.getGraceDates().subscribe(dates => {
            this._graceDate.next(dates[0]);
        });
    }

    /**
     * Get GRACE time series data for a point
     * @param x longitude
     * @param y latitude
     * @returns GRACE data
     */
    public getGraceTimeSeriesDataForPoint(x: number, y: number): Observable<any> {
        return this.http.get(environment.grace.hostUrl + '/graph/coord/' + x + '/' + y);
    }

    /**
     * Create a query string from a coordinate list for time series request
     * @param coordinateList polygon coordinate list
     * @returns query string
     */
    private coordinateListToQueryString(coordinateList: string[]): string {
        let coordinateQueryString = 'p=';
        for (let i = 0; i < coordinateList.length; i++) {
            coordinateQueryString += coordinateList[i];
            if (i !== coordinateList.length - 1) {
                coordinateQueryString += '&p=';
            }
        }
        return coordinateQueryString;
    }

    /**
     * Get GRACE time series data for a point
     * @param x longitude
     * @param y latitude
     * @returns GRACE data
     */
    public getGraceTimeSeriesDataForPolygon(coordinateList: any[]): Observable<any> {
        const coordinateQueryList: string = this.coordinateListToQueryString(coordinateList);
        return this.http.get(environment.grace.hostUrl + '/graph/poly?' + coordinateQueryList);
    }

    /**
     * Get GRACE epochs
     * @returns list of GRACE epochs
     */
    public getGraceDates(): Observable<Date[]> {
        return this.http.get<Date[]>(environment.grace.hostUrl + '/dates');
    }

    public setGraceDate(d: Date) {
        this._graceDate.next(d);
    }

    /**
     * Create a GRACE time series animation
     * @param animationOptions animation options
     * @returns video file animation of GRACE time series
     */
    public createAnimation(animationOptions: any) {
        return this.http.post(environment.grace.hostUrl + '/video/', animationOptions, {
            responseType: 'blob' as 'json'
        });
    }

    public setCurrentGraceStyleSettings(graceStyleSettings: GraceStyleSettings) {
        this._currentGraceStyleSettings.next(graceStyleSettings);
    }

    public setEditedGraceStyleSettings(graceStyleSettings: GraceStyleSettings) {
        this._editedGraceStyleSettings.next(graceStyleSettings);
    }

    /**
     * Make the editor style settings the current map settings
     */
    public updateCurrentGraceStyleSettings() {
        this.editedGraceStyleSettings.pipe(first()).subscribe(style => {
            this._currentGraceStyleSettings.next(style);
        });
    }

}
