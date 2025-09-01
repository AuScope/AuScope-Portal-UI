import { Injectable } from '@angular/core';

import { serialize } from '@thi.ng/hiccup';


/*
 * This is a static class designed to create parts of WMS SLD_BODY style sheets
 */
@Injectable()
export class StyleService {
 
    /**
     * Assembles 'sld:Rule' component of SLD_BODY parameter
     *
     * @method getRule
     * @param propName property name, set to '' for blanket application of fill & stroke
     * @param litName literal name, set to '' for blanket application of fill & stroke
     * @param fillColour colour of fill in polygon e.g. '#AA4499'
     * @param strokeColour colour of stroke in polygon e.g. '#AA4499'
     * @param noNS boolean if true will not output namespaces
     * @param isPolygon boolean if true it is a polygon else a point
     * @return XML 'sld:Rule' string
     */
    public static getRule(propName: string, litName: string, fillColour: string, strokeColour: string, noNS: boolean, isPolygon: boolean): string {
        let filter = '';
        if (propName !== '' && litName !== '') {
            filter = this.getFilter(propName, litName, noNS);
        }
        const body = filter + this.getSymbolizer(fillColour, strokeColour, noNS, isPolygon);
        return serialize([noNS?'Rule':'sld:Rule', null, body]);
    }


    /**
     * Assembles 'sld:Filter' component of SLD_BODY parameter
     *
     * @method getFilter
     * @param propName property name
     * @param litName literal name
     * @param noNS boolean if true will not output namespaces
     * @return XML 'sld:Filter' string
     */
    public static getFilter(propName: string, litName: string, noNS: boolean): string {
        const isEqualTo = (body: string) => [noNS?'PropertyIsEqualTo':'ogc:PropertyIsEqualTo', {'matchCase': 'false'}, body];
        const propertyName = (propName: string) => [noNS?'PropertyName':'ogc:PropertyName', null, propName];
        const literal = (litName: string) => [noNS?'Literal':'ogc:Literal', null, litName];
        const body = serialize(propertyName(propName)) + serialize(literal(litName));
        return serialize([noNS?'Filter':'ogc:Filter', null, isEqualTo(body)]);
    }


    /**
     * Assembles 'sld:PolygonSymbolizer' or 'sld:PointSymbolizer' component of SLD_BODY parameter
     *
     * @method getSymbolizer
     * @param fillColour colour of fill in polygon e.g. '#AA4499'
     * @param strokeColour colour of stroke in polygon e.g. '#AA4499'
     * @param noNS boolean if true will not output namespaces
     * @param isPolygon boolean if true it is a polygon else a point
     * @return XML 'sld:PolygonSymbolizer' string
     */
    public static getSymbolizer(fillColour: string, strokeColour: string, noNS: boolean, isPolygon: boolean): string {
        const fillParams = (fillColour: string) => [[noNS?'CssParameter':'sld:CssParameter', { 'name': 'fill' }, fillColour],
                                            [noNS?'CssParameter':'sld:CssParameter', { 'name': 'fill-opacity' }, '1.0']];
        const fill = (fillColour: string) => [noNS?'Fill':'sld:Fill', null, fillParams(fillColour)];

        const strokeParams = (strokeColour: string) => [[noNS?'CssParameter':'sld:CssParameter', { 'name': 'stroke' }, strokeColour],
                                                [noNS?'CssParameter':'sld:CssParameter', { 'name': 'stroke-width' }, '1']];
        const stroke = (strokeColour: string) => [noNS?'Stroke':'sld:Stroke', null, strokeParams(strokeColour)];
        const graphic = (params: string) => [noNS?'Graphic':'sld:Graphic', null, params];
        const graphicParams = (mark: string, size: string) => [[noNS?'Mark':'sld:Mark', null, mark], [noNS?'Size':'sld:Size', null, size]];

        // Is polygon or point?
        if (isPolygon) {
            const body = serialize(fill(fillColour)) + serialize(stroke(strokeColour));
            return serialize([noNS?'PolygonSymbolizer':'sld:PolygonSymbolizer', null, body]);
        } else {
            const markBody = serialize([[noNS?'WellKnownName':'sld:WellKnownName', null, 'circle'],
                                        serialize(fill(fillColour))]);
            const graphicBody = serialize(graphicParams(markBody, '8'));
            return serialize([noNS?'PointSymbolizer':'sld:PointSymbolizer', null, graphic(graphicBody)]);
        }
    }

}
