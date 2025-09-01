import { Injectable } from '@angular/core';

import { serialize } from '@thi.ng/hiccup';

import { StyleService } from './style.service';

/*
 * This is a static class designed to return WMS SLD_BODY style sheets for GeoSciML 4.1 borehole layers
 */
@Injectable()
export class GSML41StyleService {
     /**
      * Fetches the SLD_BODY parameter used to style a WMS request
      *
      * @method getSld
      * @param layerName - name of GeoServer WMS layer e.g.'gsmlbh:Borehole'
      * @param styleName - arbitrary name of style e.g. 'GSML41Style'
      * @param bhName - optional borehole name
      * @return style sheet in string form
      */
    public static getSld(layerName: string, styleName: string, bhName: string): string {
        const xmlHeader = serialize(['?xml', { 'version': '1.0', 'encoding': 'ISO-8859-1' }]);
        const styledLayerAttrs = {
            'version': '1.0.0',
            'xsi:schemaLocation': "http://www.opengis.net/sld StyledLayerDescriptor.xsd",
            'xmlns': "http://www.opengis.net/sld",
            'xmlns:ogc': "http://www.opengis.net/ogc",
            'xmlns:xlink': "http://www.w3.org/1999/xlink",
            'xmlns:xsi': "http://www.w3.org/2001/XMLSchema-instance",
            'xmlns:gml': "http://www.opengis.net/gml/3.2",
            'xmlns:gsmlbh': "http://www.opengis.net/gsml/4.1/Borehole",
            'xmlns:cit': "http://standards.iso.org/iso/19115/-3/cit/1.0",
            'xmlns:gco': "http://standards.iso.org/iso/19115/-3/gco/1.0"
        };
        const styledLayerDesc = (body: any) => ['StyledLayerDescriptor', styledLayerAttrs, body];
        const namedLayer = (body: string) => ['NamedLayer', null, body];
        const name = (nameStr: string) => ['Name', null, nameStr];
        const userStyle = (body: string) => ['UserStyle', null, body];
        const body1 = serialize(name(styleName)) + serialize(['Title', null, 'GeoSciML4.1 Borehole'])
                    + serialize(['IsDefault', null, '1']) + this.getFeatureTypeStyle(bhName);
        const body2 = serialize(name(layerName)) +  serialize(userStyle(body1));
        return xmlHeader + serialize(styledLayerDesc(namedLayer(body2)));
    }

    /**
     * Assembles 'FeatureTypeStyle' component of SLD_BODY parameter
     * searches for borehole name
     *
     * @method getFeatureTypeStyle
     * @param bhName - borehole name
     * @return XML 'sld:FeatureTypeStyle' string
     */
    private static getFeatureTypeStyle(bhName: string): string {
        let rule = StyleService.getRule('gml:name', bhName, '#FF7401', '#FF7401', true, false);
        return serialize(['FeatureTypeStyle', null, rule]);
    }

}
