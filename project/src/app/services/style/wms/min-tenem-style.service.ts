import { Injectable } from '@angular/core';

import { serialize } from '@thi.ng/hiccup';

/*
 * This is a static class designed to return style sheets for ArcGIS server Mineral Tenements layer
 */
@Injectable()
export class MinTenemStyleService {
     /**
      * Fetches the SLD_BODY parameter used to style a WMS request
      *
      * @method getMineralTenementsSld
      * @param layerName - name of ArcGIS WMS layer e.g.'MineralTenement'
      * @param styleName - arbitrary name of style e.g. 'mineralTenementStyle'
      * @param ccProperty - colour code property: either 'TenementType' or 'TenementStatus'
      * @return style sheet in string form
      */
    public static getMineralTenementsSld(layerName: string, styleName: string, ccProperty: string): string {
        const xmlHeader = serialize(['?xml', { 'version': '1.0', 'encoding': 'UTF-8' }]);
        const styledLayerAttrs = {
            'version': '1.0.0',
            'xmlns': 'http://www.opengis.net/ogc',
            'xmlns:sld': 'http://www.opengis.net/sld',
            'xmlns:ogc': 'http://www.opengis.net/ogc',
            'xmlns:gml': 'http://www.opengis.net/gml',
            'xmlns:xsi' : 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd'
        }
        const styledLayerDesc = (body: any) => ['sld:StyledLayerDescriptor', styledLayerAttrs, body]
        const namedLayer = (body: string) => ['sld:NamedLayer', null, body];
        const name = (nameStr: string) => ['sld:Name', null, nameStr];
        const userStyle = (body: string) => ['sld:UserStyle', null, body];
        const body1 = serialize(name(styleName)) + this.getFeatureTypeStyle(ccProperty);
        const body2 = serialize(name(layerName)) + serialize(userStyle(body1));
        return xmlHeader + serialize(styledLayerDesc(namedLayer(body2)));
    }


    /**
     * Assembles 'sld:FeatureTypeStyle' component of SLD_BODY parameter
     *
     * @method getFeatureTypeStyle
     * @param ccProperty - colour code property: either 'TenementType' or 'TenementStatus' or ''
     * @return XML 'sld:FeatureTypeStyle' string
     */
    private static getFeatureTypeStyle(ccProperty: string): string {
        let rule1 = '';
        let rule2 = '';
        switch (ccProperty) {
            case 'TenementType':
                rule1 = this.getRule('TENTYPE', 'exploration permit', '#0000FF', '#0000AA');
                rule2 = this.getRule('TENTYPE', 'mining lease', '#00AA00', '#00FF00');
                break;
            case 'TenementStatus':
                rule1 = this.getRule('TENSTATUS', 'granted', '#22FF22', '#00FF00');
                rule2 = this.getRule('TENSTATUS', 'application', '#FF66666', '#FF0000');
                break;
            default:
                // Same colour everywhere regardless of property values
                rule1 = this.getRule('', '', '#77DD77', '#336633');
        }
        return serialize(['sld:FeatureTypeStyle', null, rule1 + rule2]);
    }


    /**
     * Assembles 'sld:Rule' component of SLD_BODY parameter
     *
     * @method getRule
     * @param propName property name, set to '' for blanket application of fill & stroke
     * @param litName literal name, set to '' for blanket application of fill & stroke
     * @param fillColour colour of fill in polygon e.g. '#AA4499'
     * @param strokeColour colour of stroke in polygon e.g. '#AA4499'
     * @return XML 'sld:Rule' string
     */
    private static getRule(propName: string, litName: string, fillColour: string, strokeColour: string): string {
        let filter = '';
        if (propName !== '' && litName !== '') {
            filter = this.getFilter(propName, litName);
        }
        const body = filter + this.getPolySymbolizer(fillColour, strokeColour);
        return serialize(['sld:Rule', null, body]);
    }


    /**
     * Assembles 'sld:Filter' component of SLD_BODY parameter
     *
     * @method getFilter
     * @param propName property name
     * @param litName literal name
     * @return XML 'sld:Filter' string
     */
    private static getFilter(propName: string, litName: string): string {
        const isEqualTo = (body: string) => ['ogc:PropertyIsEqualTo', null, body];
        const propertyName = (propName: string) => ['ogc:PropertyName', null, propName];
        const literal = (litName: string) => ['ogc:Literal', null, litName];
        const body = serialize(propertyName(propName)) + serialize(literal(litName));
        return serialize(['ogc:Filter', null, isEqualTo(body)]);
    }


    /**
     * Assembles 'sld:PolygonSymbolizer' component of SLD_BODY parameter
     *
     * @method getPolySymbolizer
     * @param fillColour colour of fill in polygon e.g. '#AA4499'
     * @param strokeColour colour of stroke in polygon e.g. '#AA4499'
     * @return XML 'sld:PolygonSymbolizer' string
     */
    private static getPolySymbolizer(fillColour: string, strokeColour: string): string {
        const fillParams = (fillColour: string) => [['sld:CssParameter', { 'name': 'fill' }, fillColour],
                                            ['sld:CssParameter', { 'name': 'fill-opacity' }, '1.0']];
        const fill = (fillColour: string) => ['sld:Fill', null, fillParams(fillColour)];

        const strokeParams = (strokeColour: string) => [['sld:CssParameter', { 'name': 'stroke' }, strokeColour],
                                                ['sld:CssParameter', { 'name': 'stroke-width' }, '1']];
        const stroke = (strokeColour: string) => ['sld:Stroke', null, strokeParams(strokeColour)];

        const body = serialize(fill(fillColour)) + serialize(stroke(strokeColour));
        return serialize(['sld:PolygonSymbolizer', null, body]);
    }


    // constructor() { }

}
