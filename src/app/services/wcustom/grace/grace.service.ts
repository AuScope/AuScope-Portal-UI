import { environment } from '../../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { GraceStyleSettings } from '../../../modalwindow/querier/customanalytic/grace/grace-graph.models';
import { serialize } from '@thi.ng/hiccup';

/**
 * Service for the GRACE API
 */
@Injectable()
export class GraceService {
    // Current GRACE style settings
    public currentGraceStyleSettings: GraceStyleSettings = {
        minColor: '#ff0000',
        minValue: -1,
        neutralColor: '#ffffff',
        neutralValue: 0,
        maxColor: '#0000ff',
        maxValue: 1,
        transparentNeutralColor: false
    };
    public currentGraceStyleSettingsBS: BehaviorSubject<GraceStyleSettings> = new BehaviorSubject(this.currentGraceStyleSettings);
    // Editor GRACE style settings
    public editedGraceStyleSettings: GraceStyleSettings = {
        minColor: '#ff0000',
        minValue: -1,
        neutralColor: '#ffffff',
        neutralValue: 0,
        maxColor: '#0000ff',
        maxValue: 1,
        transparentNeutralColor: false
    };

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

    /**
     * Set the current active GRACE style
     * @param graceStyleSettings the GRACE style
     */
    public setCurrentGraceStyleSettings(graceStyleSettings: GraceStyleSettings) {
        this.currentGraceStyleSettings = graceStyleSettings;
        this.currentGraceStyleSettingsBS.next(graceStyleSettings);
    }

    /**
     * Set the GRACE style that the editor contains
     * @param graceStyleSettings the GRACE style
     */
    public setEditedGraceStyleSettings(graceStyleSettings: GraceStyleSettings) {
        this.editedGraceStyleSettings = graceStyleSettings;
    }

    /**
     * Update a single parameter of the edited GRACE style settings
     * @param editKey the key of the GRACE style settings
     * @param editVal the new value
     */
    public updateEditedGraceStyleSettings(editKey: string, editVal: string) {
        this.editedGraceStyleSettings[editKey] = editVal;
    }

    /**
     * Fetches the SLD_BODY parameter used to style a WMS request
     *
     * @method getGraceSld
     * @return style sheet in string form
     */
    public getGraceSld(): string {
        this.setCurrentGraceStyleSettings({...this.editedGraceStyleSettings});
        const xmlHeader = serialize(['?xml', { 'version': '1.0', 'encoding': 'UTF-8' }]);
        const styledLayerAttrs = {
            'version': '1.0.0',
            'xmlns:sld': 'http://www.opengis.net/sld',
            'xmlns:ogc': 'http://www.opengis.net/ogc',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd'
        };
        const styledLayerDesc = (body: any) => ['sld:StyledLayerDescriptor', styledLayerAttrs, body]
        const namedLayer = (body: string) => ['sld:NamedLayer', null, body];
        const name = (nameStr: string) => ['sld:Name', null, nameStr];
        const userStyle = (body: string) => ['sld:UserStyle', null, body];
        const body1 = serialize(name('grace_style')) + this.getFeatureTypeStyle(this.currentGraceStyleSettings);
        const body2 = serialize(name('grace:grace_view')) + serialize(userStyle(body1));
        return xmlHeader + serialize(styledLayerDesc(namedLayer(body2)));
    }

    /**
     * Assembles 'sld:FeatureTypeStyle' component of SLD_BODY parameter
     *
     * @method getFeatureTypeStyle
     * @param styleSettings - the GRACE style settings
     * @return XML 'sld:FeatureTypeStyle' string
     */
    private getFeatureTypeStyle(styleSettings: GraceStyleSettings): string {
        const polygonSymbolizer = this.getPolySymbolizer(styleSettings);
        const rule = ['sld:Rule', null, polygonSymbolizer];
        return serialize(['sld:FeatureTypeStyle', null, rule]);
    }

    /**
     * Assembles 'sld:PolygonSymbolizer' component of SLD_BODY parameter
     *
     * @method getPolySymbolizer
     * @param styleSettings - the GRACE style settings
     * @return XML 'sld:PolygonSymbolizer' string
     */
    private getPolySymbolizer(styleSettings: GraceStyleSettings): string {
        const propertyName = ['ogc:PropertyName', null, 'ewh'];
        const literalMinVal = ['ogc:Literal', null, styleSettings.minValue];
        const literalMinCol = ['ogc:Literal', null, styleSettings.minColor];
        const literalNeutralVal = ['ogc:Literal', null, styleSettings.neutralValue];
        const literalNeutralCol = ['ogc:Literal', null, styleSettings.neutralColor];
        const literalMaxVal = ['ogc:Literal', null, styleSettings.maxValue];
        const literalMaxCol = ['ogc:Literal', null, styleSettings.maxColor];
        const literalColorType = ['ogc:Literal', null, 'color'];
        const func = ['ogc:Function', { 'name': 'Interpolate' },
            [propertyName, literalMinVal, literalMinCol, literalNeutralVal,
                literalNeutralCol, literalMaxVal, literalMaxCol, literalColorType]];
        const fillCss = ['sld:CssParameter', { 'name': 'fill' }, func];

        let fillCssOpacity = [];
        if (styleSettings.transparentNeutralColor) {
            const literalOpaqueVal = ['ogc:Literal', null, 1];
            const literalTransparentVal = ['ogc:Literal', null, 0];
            const literalNumericType = ['ogc:Literal', null, 'numeric'];
            const opacityFillFunc = ['ogc:Function', { 'name': 'Interpolate' },
            [propertyName, literalMinVal, literalOpaqueVal, literalNeutralVal,
                literalTransparentVal, literalMaxVal, literalOpaqueVal, literalNumericType]];
            fillCssOpacity = ['sld:CssParameter', {'name': 'fill-opacity'}, opacityFillFunc];
        }
        const fill = ['sld:Fill', null, [fillCss, fillCssOpacity]];

        let stroke = [];
        if (styleSettings.transparentNeutralColor === false) {
            const strokeCss = ['sld:CssParameter', { 'name': 'stroke' }, func];
            const strokeWidthCss = ['sld:CssParameter', { 'name': 'stroke-width' }, 1];
            stroke = ['sld:Stroke', null, [strokeCss, strokeWidthCss]];
        }

        return serialize(['sld:PolygonSymbolizer', null, [fill, stroke]]);
    }

}
