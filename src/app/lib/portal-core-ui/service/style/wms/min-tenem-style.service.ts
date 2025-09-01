import { Injectable } from '@angular/core';

import { serialize } from '@thi.ng/hiccup';

import { StyleService } from './style.service';

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
    public static getSld(layerName: string, styleName: string, ccProperty: string): string {
        const xmlHeader = serialize(['?xml', { 'version': '1.0', 'encoding': 'UTF-8' }]);
        const styledLayerAttrs = {
            'version': '1.0.0',
            'xmlns': 'http://www.opengis.net/ogc',
            'xmlns:sld': 'http://www.opengis.net/sld',
            'xmlns:ogc': 'http://www.opengis.net/ogc',
            'xmlns:gml': 'http://www.opengis.net/gml',
            'xmlns:xsi' : 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd'
        };
        const styledLayerDesc = (body: any) => ['sld:StyledLayerDescriptor', styledLayerAttrs, body];
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
                rule1 = StyleService.getRule('TENTYPE', 'exploration permit', '#0000FF', '#0000AA', false, true);
                rule2 = StyleService.getRule('TENTYPE', 'mining lease', '#00AA00', '#00FF00', false, true);
                break;
            case 'TenementStatus':
                rule1 = StyleService.getRule('TENSTATUS', 'granted', '#22FF22', '#00FF00', false, true);
                rule2 = StyleService.getRule('TENSTATUS', 'application', '#FF66666', '#FF0000', false, true);
                break;
            default:
                // Same colour everywhere regardless of property values
                rule1 = StyleService.getRule('', '', '#77DD77', '#336633', false, true);
        }
        return serialize(['sld:FeatureTypeStyle', null, rule1 + rule2]);
    }

}
