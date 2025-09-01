import { serialize } from '@thi.ng/hiccup';

interface OptionalFilter {
  type: string;
  xpath: string;
  value: string;
  // Add other properties as needed from the sample input
  label?: string;
  predicate?: string;
  added?: boolean;
}

interface GeologicalProvincesStyleParams {
  name?: string;
  optionalFilters?: OptionalFilter[];
  gsmlpNamespace: string;
}

export class GeologicalProvincesStyleService {
  public static getSld(layerName: string, styleName: string, params: GeologicalProvincesStyleParams): string {
    const ns = {
      sld: 'http://www.opengis.net/sld',
      ogc: 'http://www.opengis.net/ogc',
      gml: 'http://www.opengis.net/gml',
      gsml: 'urn:cgi:xmlns:CGI:GeoSciML:2.0',
      gsmlp: 'http://xmlns.geosciml.org/geosciml-portrayal/4.0',
      xlink: 'http://www.w3.org/1999/xlink',
      xsi: 'http://www.w3.org/2001/XMLSchema-instance'
    };

    return serialize(
      ['sld:StyledLayerDescriptor', { 
        version: '1.0.0',
        'xmlns:sld': ns.sld,
        'xmlns:ogc': ns.ogc,
        'xmlns:gml': ns.gml,
        'xmlns:gsml': ns.gsml,
        'xmlns:gsmlp': ns.gsmlp,
        'xmlns:xlink': ns.xlink,
        'xmlns:xsi': ns.xsi,
        'xsi:schemaLocation': `${ns.sld} StyledLayerDescriptor.xsd`
      },
        ['sld:NamedLayer', {},
          ['sld:Name', {}, layerName],
          ['sld:UserStyle', {},
            ['sld:Name', {}, styleName],
            ['sld:Title', {}, 'Geological Province Style'],
            ['sld:IsDefault', {}, '1'],
            ['sld:FeatureTypeStyle', {},
              ['sld:Rule', {},
                this.generateFilter(params),
                ['sld:PolygonSymbolizer', {},
                  ['sld:Fill', {},
                    this.createColorRecode(),
                    ['sld:CssParameter', { name: 'fill-opacity' }, '0.4']
                  ],
                  ['sld:Stroke', {},
                    ['sld:CssParameter', { name: 'stroke' }, '#000000'],
                    ['sld:CssParameter', { name: 'stroke-width' }, '0.5']
                  ]
                ],
                this.createTextSymbolizer()
              ]
            ]
          ]
        ]
      ]
    );
  }

  private static generateFilter(params: GeologicalProvincesStyleParams): any[] {
    const filters: any[] = [];

    // Handle name filter (matches Java's GeologicalProvincesFilter)
    if (params.name) {
      filters.push(
        ['ogc:PropertyIsLike', { wildCard: '*', singleChar: '#', escapeChar: '!' },
          ['ogc:PropertyName', {}, 'NAME'],
          ['ogc:Literal', {}, `*${params.name}*`]
        ]
      );
    }

    // Handle polygon filter (matches Java's BBOX handling)
    if (params.optionalFilters?.length) {
      params.optionalFilters.forEach(filter => {
        if (filter.type === 'OPTIONAL.POLYGONBBOX') {
          filters.push(
            ['ogc:Intersects', {},
              ['ogc:PropertyName', {}, filter.xpath],
              filter.value
            ]
          );
        } else if (filter.type === 'OPTIONAL.TEXT') {
          filters.push(
            ['ogc:PropertyIsLike', { wildCard: '*', singleChar: '#', escapeChar: '!' },
              ['ogc:PropertyName', {}, filter.xpath],
              ['ogc:Literal', {}, `*${filter.value}*`]
            ]
          );
        }
      });
    }

    return filters.length > 0 
      ? ['ogc:Filter', {}, ['ogc:And', {}, ...filters]]
      : ['ogc:Filter', {}, ['ogc:PropertyIsLike', { wildCard: '*', singleChar: '#', escapeChar: '!' },
          ['ogc:PropertyName', {}, 'NAME'],
          ['ogc:Literal', {}, '*']
        ]];
  }

  private static createColorRecode(): any[] {
    return ['sld:CssParameter', { name: 'fill' },
      ['ogc:Function', { name: 'Recode' },
        ['ogc:Function', { name: 'IEEERemainder' },
          ['ogc:PropertyName', {}, 'OBJECTID'],
          ['ogc:Literal', {}, '9']
        ],
        // Value/Color pairs
        ['ogc:Literal', {}, '-4'], ['ogc:Literal', {}, '#8dd3c7'],
        ['ogc:Literal', {}, '-3'], ['ogc:Literal', {}, '#ffffb3'],
        ['ogc:Literal', {}, '-2'], ['ogc:Literal', {}, '#bebada'],
        ['ogc:Literal', {}, '-1'], ['ogc:Literal', {}, '#fb8072'],
        ['ogc:Literal', {}, '0'],  ['ogc:Literal', {}, '#80b1d3'],
        ['ogc:Literal', {}, '1'],  ['ogc:Literal', {}, '#fdb462'],
        ['ogc:Literal', {}, '2'],  ['ogc:Literal', {}, '#b3de69'],
        ['ogc:Literal', {}, '3'],  ['ogc:Literal', {}, '#fccde5'],
        ['ogc:Literal', {}, '4'],  ['ogc:Literal', {}, '#d9d9d9']
      ]
    ];
  }

  private static createTextSymbolizer(): any[] {
    return ['sld:TextSymbolizer', {},
      ['sld:Label', {},
        ['ogc:PropertyName', {}, 'NAME']
      ],
      ['sld:Font', {},
        ['sld:CssParameter', { name: 'font-family' }, 'Arial'],
        ['sld:CssParameter', { name: 'font-size' }, '12']
      ],
      ['sld:LabelPlacement', {},
        ['sld:PointPlacement', {},
          ['sld:AnchorPoint', {},
            ['sld:AnchorPointX', {}, '0.5'],
            ['sld:AnchorPointY', {}, '0.5']
          ]
        ]
      ],
      ['sld:Fill', {},
        ['sld:CssParameter', { name: 'fill' }, '#000000']
      ]
    ];
  }
} 