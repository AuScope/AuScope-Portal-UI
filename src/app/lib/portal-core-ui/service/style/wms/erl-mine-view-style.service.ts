import { Injectable } from '@angular/core';
import { OptionalFilter, StyleService } from './style.service';
import { serialize } from '@thi.ng/hiccup';

interface ErlMineViewStyleParams {
  optionalFilters?: OptionalFilter[];
  gsmlpNamespace: string;
}

@Injectable()
export class ErlMineViewStyleService {
  public static getSld(layerName: string, styleName: string, params: ErlMineViewStyleParams): string {
    const ns = {
      sld: 'http://www.opengis.net/sld',
      ogc: 'http://www.opengis.net/ogc',
      gml: 'http://www.opengis.net/gml',
      erl: 'http://xmlns.earthresourceml.org/earthresourceml-lite/2.0',
      gsmlp: 'urn:cgi:xmlns:CGI:GeoSciML:2.0',
      xsi: 'http://www.w3.org/2001/XMLSchema-instance'
    };

    const filter = StyleService.generateFilter(params.optionalFilters || []);

    return serialize(
      ['sld:StyledLayerDescriptor', {
        version: '1.0.0',
        'xmlns:sld': ns.sld,
        'xmlns:ogc': ns.ogc,
        'xmlns:gml': ns.gml,
        'xmlns:erl': ns.erl,
        'xmlns:gsmlp': ns.gsmlp,
        'xmlns:xsi': ns.xsi,
        'xsi:schemaLocation': [
          `${ns.sld} http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd`,
          `${ns.erl} http://schemas.earthresourceml.org/earthresourceml-lite/2.0/earthresourceml-lite.xsd`
        ].join(' ')
      },
        ['sld:NamedLayer', {},
          ['sld:Name', {}, layerName],
          ['sld:UserStyle', {},
            ['sld:Name', {}, styleName],
            ['sld:Title', {}, 'ERL Mine View Style'],
            ['sld:FeatureTypeStyle', {},
              ['sld:Rule', {},
                filter,
                StyleService.createSymbolizer('#a51f2f', 'circle', '1')
              ]
            ]
          ]
        ]
      ]
    );
  }
}
