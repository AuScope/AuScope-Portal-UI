import { Injectable } from '@angular/core';
import { serialize } from '@thi.ng/hiccup';

// Add type for hiccup attributes
type HiccupAttrs = Record<string, string | number | boolean> | null;

interface MineralTenementStyleParams {
  ccProperty?: string;
  optionalFilters?: OptionalFilter[];
  serviceUrl?: string;
}

interface OptionalFilter {
  value: string;
  label: string;
  xpath: string;
  predicate: string;
  type: string;
  added: boolean;
}

enum ServiceProviderType {
  GeoServer = 'GeoServer',
  ArcGIS = 'ArcGIS'
}

@Injectable()
export class MineralTenementStyleService {
  private static readonly TENEMENT_COLOUR_MAP = {
    // TenementType colors
    'exploration': '#0000FF',
    'prospecting': '#00FFFF',
    'miscellaneous': '#00FF00',
    'mining': '#FFFF00',
    'licence': '#FF0000',
    // TenementStatus colors
    'LIVE': '#0000FF',
    'CURRENT': '#00FF00',
    'PENDING': '#FF0000',
    // Default color
    'MineralTenement': '#0000FF'
  };

  private static readonly PROVIDER_CONFIG = {
    [ServiceProviderType.GeoServer]: {
      featureType: 'mt:MineralTenement',
      fillColour: '#66ff66',
      borderColour: '#4B6F44',
      nameField: 'mt:name',
      ownerField: 'mt:owner',
      shapeField: 'mt:shape',
      typeField: 'mt:tenementType',
      statusField: 'mt:status'
    },
    [ServiceProviderType.ArcGIS]: {
      featureType: 'MineralTenement',
      fillColour: '#00ff00',
      borderColour: '#66ff66',
      nameField: 'TENNAME',
      ownerField: 'TENOWNER',
      shapeField: 'SHAPE',
      typeField: 'TENTYPE',
      statusField: 'STATUS'
    }
  };

  public static getSld(layerName: string, styleName: string, params: MineralTenementStyleParams): string {
    const providerType = this.getProviderType(params.serviceUrl);
    const config = this.PROVIDER_CONFIG[providerType];

    return serialize(
      ['sld:StyledLayerDescriptor', {
        version: '1.0.0',
        'xmlns:sld': 'http://www.opengis.net/sld',
        'xmlns:ogc': 'http://www.opengis.net/ogc',
        'xmlns:gml': 'http://www.opengis.net/gml',
        'xmlns:mt': 'http://xmlns.geoscience.gov.au/mineraltenementml/1.0',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'http://www.opengis.net/sld StyledLayerDescriptor.xsd'
      } as HiccupAttrs,
        ['sld:NamedLayer', null,
          ['sld:Name', null, layerName],
          ['sld:UserStyle', null,
            ['sld:Name', null, styleName],
            ['sld:Title', null, styleName],
            ['sld:IsDefault', null, '1'],
            ['sld:FeatureTypeStyle', null,
              ...this.createRules(params.ccProperty, params.optionalFilters, config)
            ]
          ]
        ]
      ]
    );
  }

  private static createRules(ccProperty?: string, optionalFilters?: OptionalFilter[], config?: any): any[] {
    const rules = [];
    
    if (ccProperty === 'TenementType') {
      ['exploration', 'prospecting', 'miscellaneous', 'mining', 'licence'].forEach(type => {
        rules.push(...this.createRulePair(type, config, optionalFilters));
      });
    } else if (ccProperty === 'TenementStatus') {
      ['LIVE', 'CURRENT', 'PENDING'].forEach(status => {
        rules.push(...this.createRulePair(status, config, optionalFilters));
      });
    } else {
      rules.push(...this.createRulePair('Default', config, optionalFilters));
    }
    
    return rules;
  }

  private static createRulePair(tenementType: string, config: any, optionalFilters?: OptionalFilter[]): any[] {
    const color = this.TENEMENT_COLOUR_MAP[tenementType] || config.fillColour;
    return [
      // Rule for zoomed in view with labels
      [
        'sld:Rule', null,
        ['sld:Name', null, `${tenementType}-detailed`],
        ['sld:Title', null, tenementType],
        ['sld:MaxScaleDenominator', null, '4000000'],
        this.createFilter(tenementType, config, optionalFilters),
        this.createSymbolizer(color),
        this.createTextSymbolizer(config)
      ],
      // Rule for zoomed out view without labels
      [
        'sld:Rule', null,
        ['sld:Name', null, `${tenementType}-overview`],
        ['sld:Title', null, tenementType],
        ['sld:MinScaleDenominator', null, '4000000'],
        this.createFilter(tenementType, config, optionalFilters),
        this.createSymbolizer(color)
      ]
    ];
  }

  private static createSymbolizer(color: string): any[] {
    return [
      'sld:PolygonSymbolizer', null,
      ['sld:Fill', null,
        ['sld:CssParameter', { name: 'fill' } as HiccupAttrs, color],
        ['sld:CssParameter', { name: 'fill-opacity' } as HiccupAttrs, '0.4']
      ],
      ['sld:Stroke', null,
        ['sld:CssParameter', { name: 'stroke' } as HiccupAttrs, color],
        ['sld:CssParameter', { name: 'stroke-width' } as HiccupAttrs, '0.5']
      ]
    ];
  }

  private static createTextSymbolizer(config: any): any[] {
    return [
      'sld:TextSymbolizer', null,
      ['sld:Label', null,
        ['ogc:PropertyName', null, config.nameField]
      ],
      ['sld:Font', null,
        ['sld:CssParameter', { name: 'font-family' } as HiccupAttrs, 'Arial'],
        ['sld:CssParameter', { name: 'font-size' } as HiccupAttrs, '12'],
        ['sld:CssParameter', { name: 'font-style' } as HiccupAttrs, 'normal'],
        ['sld:CssParameter', { name: 'font-weight' } as HiccupAttrs, 'normal']
      ],
      ['sld:LabelPlacement', null,
        ['sld:PointPlacement', null,
          ['sld:AnchorPoint', null,
            ['sld:AnchorPointX', null, '0.5'],
            ['sld:AnchorPointY', null, '0.5']
          ]
        ]
      ],
      ['sld:Fill', null,
        ['sld:CssParameter', { name: 'fill' } as HiccupAttrs, '#000000']
      ],
      ['sld:VendorOption', { name: 'autoWrap' } as HiccupAttrs, '60'],
      ['sld:VendorOption', { name: 'maxDisplacement' } as HiccupAttrs, '150']
    ];
  }

  private static createFilter(tenementType: string, config: any, optionalFilters?: OptionalFilter[]): any[] {
    if (tenementType === 'Default') {
      // If we have optional filters but no color coding, use those filters
      if (optionalFilters?.length > 0) {
        const filters = optionalFilters.map(filter => this.createOptionalFilter(filter, config));
        return [
          'ogc:Filter', null,
          filters.length > 1 ? ['ogc:And', null, ...filters] : filters[0]
        ];
      }

      // Default filter when no options selected
      return [
        'ogc:Filter', null,
        ['ogc:PropertyIsLike', {
          wildCard: '*',
          singleChar: '#',
          escapeChar: '!',
          matchCase: 'false'
        } as HiccupAttrs,
          ['ogc:PropertyName', null, config.nameField],
          ['ogc:Literal', null, '*']
        ]
      ];
    }

    // Keep the existing type/status filter logic for color coding
    const typeFilter = [
      'ogc:PropertyIsLike', {
        wildCard: '*',
        singleChar: '#',
        escapeChar: '!',
        matchCase: 'false'
      } as HiccupAttrs,
      ['ogc:PropertyName', null,
        config.featureType === 'MineralTenement' 
          ? (this.isTenementStatus(tenementType) ? config.statusField : config.typeField)
          : (this.isTenementStatus(tenementType) ? 'mt:status' : 'mt:tenementType')
      ],
      ['ogc:Literal', null, 
        this.isTenementStatus(tenementType) ? tenementType : `*${tenementType}*`
      ]
    ];

    // Add optional filters if present
    const filters = [typeFilter];
    if (optionalFilters?.length > 0) {
      optionalFilters.forEach(filter => {
        filters.push(this.createOptionalFilter(filter, config));
      });
    }

    // Combine all filters
    return [
      'ogc:Filter', null,
      filters.length > 1 ? ['ogc:And', null, ...filters] : filters[0]
    ];
  }

  private static createOptionalFilter(filter: OptionalFilter, config: any): any[] {
    // Handle different filter types
    switch (filter.type) {
      case 'OPTIONAL.DROPDOWNSELECTLIST':
        // Handle dropdown selections (like Tenement Type)
        const fieldName = config.featureType === 'MineralTenement'
          ? filter.xpath.replace('mt:', '').toUpperCase()
          : filter.xpath;

        // Map the display value to the actual value if needed
        let filterValue = filter.value;
        if (filter.value === 'Mining Lease') {
          filterValue = 'mining';
        }

        return [
          'ogc:PropertyIsLike', {
            wildCard: '*',
            singleChar: '#',
            escapeChar: '!',
            matchCase: 'false'
          } as HiccupAttrs,
          ['ogc:PropertyName', null, fieldName],
          ['ogc:Literal', null, `*${filterValue}*`]
        ];

      case 'OPTIONAL.TEXT':
        // Handle text inputs (like Owner)
        const textFieldName = config.featureType === 'MineralTenement'
          ? filter.xpath.replace('mt:', '').toUpperCase()
          : filter.xpath;

        return [
          'ogc:PropertyIsLike', {
            wildCard: '*',
            singleChar: '#',
            escapeChar: '!',
            matchCase: 'false'
          } as HiccupAttrs,
          ['ogc:PropertyName', null, textFieldName],
          ['ogc:Literal', null, `*${filter.value}*`]
        ];

      case 'OPTIONAL.POLYGONBBOX':
        return [
          'ogc:Intersects', null,
          ['ogc:PropertyName', null, config.shapeField],
          ['gml:Polygon', { srsName: 'EPSG:4326' } as HiccupAttrs,
            filter.value.replace('gsmlp:shape', config.shapeField)
          ]
        ];

      case 'OPTIONAL.DATE':
        const operator = filter.predicate === 'BIGGER_THAN' 
          ? 'PropertyIsGreaterThan' 
          : 'PropertyIsLessThan';
        return [
          `ogc:${operator}`, null,
          ['ogc:PropertyName', null, 
            config.featureType === 'MineralTenement' 
              ? 'EXPIREDATE' 
              : 'mt:expireDate'
          ],
          ['ogc:Literal', null, filter.value]
        ];

      default:
        return [];
    }
  }

  private static isTenementStatus(value: string): boolean {
    return ['LIVE', 'CURRENT', 'PENDING'].includes(value);
  }

  private static getProviderType(serviceUrl?: string): ServiceProviderType {
    if (serviceUrl && (
      serviceUrl.toUpperCase().includes('MAPSERVER/WFSSERVER') ||
      serviceUrl.toUpperCase().includes('MAPSERVER/WMSSERVER')
    )) {
      return ServiceProviderType.ArcGIS;
    }
    return ServiceProviderType.GeoServer;
  }
} 