import { Injectable } from '@angular/core';
import { serialize } from '@thi.ng/hiccup';
import { OptionalFilter, StyleService } from './style.service';

// Add type for hiccup attributes
type HiccupAttrs = Record<string, string | number | boolean>;

interface MineralTenementStyleParams {
  ccProperty?: string;
  optionalFilters?: OptionalFilter[];
  serviceUrl?: string;
}

enum ServiceProviderType {
  GeoServer = 'GeoServer',
  ArcGIS = 'ArcGIS'
}

/**
 * MineralTenementStyleService
 * Not yet 100% refactored to use StyleService
 */
@Injectable()
export class MineralTenementStyleService {

  private static readonly TENEMENT_COLOUR_MAP = {
    // TenementType colors
    /*
    NT: 'Exploration Licence (EL)', 'Extractive Mineral Permit (EMP)', 'Mineral Lease (ML)',
        'Mineral Authority (MA)', 'Exploration Licence in Retention (ELR)', 'Mineral Lease (Northern) (MLN)',
        'Extractive Mineral Exploration Licence (EMEL)', 'Access Authority (AA)', 'Reserve Land (RL)',
        'Fossicking Area (s.131) (FA)', 'Mineral Lease (Central) (MLC)', 'Authorised Holdings (Central) (HLDC)',
        'Authorised Holdings (Southern) (HLDS)', 'Mineral Claim (Northern) (MCN)',
        'Extractive Mineral Permit (Northern) (EMPN)', Extractive Mineral Permit (Southern) (EMPS)'
    WA: 'EXPLORATION LICENCE', 'PROSPECTING LICENCE', 'MISCELLANEOUS LICENCE', 'MINING LEASE',
        'GENERAL PURPOSE LEASE', 'COAL MINING LEASE'
    Vic: 'Exploration Licence', 'Retention Licence', 'Work Authority', 'Mining Licence', 'Prospect Licence',
    NSW: 'Assessment Lease', 'Consolidated Mining Lease', 'Dredging Lease', 'Exploration Licence', 'Gold Lease',
         'Exploration Prospecting Lease', 'Mineral Claim converted to Lease', 'Mining (Mineral Owner) Lease',
         'Mining Purposes Lease', 'Private Lands (Mining Purposes) Lease', 'Special (Crown & Private Lands) Lease',
         'Special Lease'
    TAS: 'LICENCE', 'LEASE', 'ERA'
    */
    'exploration': '#0000FF',
    'prospect': '#00FFFF',
    'miscellaneous': '#00FF00',
    'mining': '#FF0040',
    'mineral': '#FF0040',
    'reserve': '#0080FF',
    'licence': '#995544',
    'lease': '#998899',
    /* TenementStatus colours
    NSW: "Granted" "Application"
    Vic: "Current" "Renewal" "Application" "Proposal"
    NT: "Application" "Grant" "Issued" "Reduction Retained" "Renew Retained" "Revised Application" "Ceased"
    Tas: "Pending Renewal" "Granted" "Application" "Pending Surrender" "Pending Partial Surrender" "Exploration Release Area"
    WA: "LIVE" "PENDING"
    */
    'LIVE': '#0000FF',
    'CURRENT': '#30FF50',
    'PENDING': '#FF0050',
    'APPLICATION': '#E05040',
    'PROPOSAL': '#E09000',
    'RENEWAL': '#C0C000',
    'GRANT':"#00F0F0",
    'ISSUED': '#30FF00',
    'CEASED': '#8000EE',
    'GRANTED': "#00F0F0",
    'REDUCTION RETAINED': "#0080FF",
    'RENEW RETAINED': "#C0C000",
    'REVISED APPLICATION': "#888888",
    'PENDING RENEWAL': "#C0C000",
    'PENDING SURRENDER': "#8000EE",
    'PENDING PARTIAL SURRENDER': "#A000AA",
    'EXPORATION RELEASE AREA': "#8888FF",
    /* ESRI QLD MinTens
     */
    /* Tenement Type */
    'Mining lease': "#0000FF",
    'Exploration permit minerals': "#883344",
    'Exploration permit coal': "#FF0000",
    /* Status */
    'Granted': "#00FF00",
    'Application': "#FFEE00",
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
      statusField: 'mt:status',
      providerType: ServiceProviderType.GeoServer
    },
    [ServiceProviderType.ArcGIS]: {
      featureType: 'MineralTenement',
      fillColour: '#77ff77',
      borderColour: '#99ff99',
      nameField: 'TENNAME',
      ownerField: 'TENOWNER',
      shapeField: 'SHAPE',
      typeField: 'TENTYPE',
      statusField: 'TENSTATUS',
      providerType: ServiceProviderType.ArcGIS
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
            ['sld:Name', null, styleName?styleName:layerName],
            ['sld:Title', null, styleName?styleName:layerName],
            ['sld:IsDefault', null, '1'],
            ['sld:FeatureTypeStyle', null,
              ...this.createRules(params.ccProperty, params.optionalFilters, config)
            ]
          ]
        ]
      ]
    );
  }

  private static createRules(ccProperty: string, optionalFilters: OptionalFilter[], config: any): any[] {
    const rules = [];
    if (config.providerType === ServiceProviderType.GeoServer) {
        if (ccProperty === 'TenementType') {
            ['exploration','prospect', 'miscellaneous', 'mining', 'mineral',
             'reserve', 'licence', 'lease'].forEach(type => {
                rules.push(...this.createRulePair(type, config, optionalFilters));
            });
        } else if (ccProperty === 'TenementStatus') {
            ['LIVE', 'CURRENT', 'PENDING','APPLICATION','PROPOSAL',
            'RENEWAL','GRANT','ISSUED','CEASED','GRANTED','REDUCTION RETAINED',
            'RENEW RETAINED','REVISED APPLICATION','PENDING RENEWAL',
                'PENDING SURRENDER','PENDING PARTIAL SURRENDER','EXPORATION RELEASE AREA'].forEach(status => {
                rules.push(...this.createRulePair(status, config, optionalFilters));
            });
        } else {
            rules.push(...this.createRulePair('Default', config, optionalFilters));
        }
    } else { // ArcGIS - cannot have too many because of length limitations of HTTP GET requests
        if (ccProperty === 'TenementType') {
            ['Mining lease', 'Exploration permit minerals', 'Exploration permit coal'].forEach(status => {
                rules.push(...this.createRulePair(status, config, optionalFilters))
            });
        } else if (ccProperty === 'TenementStatus') {
            ['Granted','Application'].forEach(status => {
                rules.push(...this.createRulePair(status, config, optionalFilters))
            });
        } else {
            rules.push(...this.createRulePair('Default', config, optionalFilters));
        }
    }

    return rules;
  }

  private static createRulePair(tenementType: string, config: any, optionalFilters?: OptionalFilter[]): any[] {
    const color = this.TENEMENT_COLOUR_MAP[tenementType] || config.fillColour;
    let retVal;
    // Only GeoServer can handle detailed view
    if (config.providerType === ServiceProviderType.GeoServer) {
        retVal = [
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
    } else {
        retVal = [
            // Rule for ArcGIS without labels
            [
                'sld:Rule', null,
                ['sld:Name', null, `${tenementType}-overview`],
                ['sld:Title', null, tenementType],
                this.createFilter(tenementType, config, optionalFilters),
                this.createSymbolizer(color)
            ]
        ]
    }
    return retVal;
  }

  private static createSymbolizer(color: string): any[] {
    return [
      'sld:PolygonSymbolizer', null,
      ['sld:Fill', null,
        ['sld:CssParameter', { name: 'fill' } as HiccupAttrs, color],
        ['sld:CssParameter', { name: 'fill-opacity' } as HiccupAttrs, '0.8']
      ],
      ['sld:Stroke', null,
        ['sld:CssParameter', { name: 'stroke' } as HiccupAttrs, color],
        ['sld:CssParameter', { name: 'stroke-width' } as HiccupAttrs, '1']
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

  /**
   * Create OGC filter XML
   *
   * tenementLiteral - the string to be used as filter
   */
  private static createFilter(tenementLiteral: string, config: any, optionalFilters?: OptionalFilter[] | string): any {
    // Build tenement type/status filter (if not Default)
    if (tenementLiteral === 'Default') {
      // If optional filters are present, prefer them
      const optFrag = StyleService.generateFilter(optionalFilters as any);
      if (optFrag) { return optFrag; }

      // fallback default wildcard name filter
      return ['ogc:Filter', null,
        ['ogc:PropertyIsLike', {
          wildCard: '*', singleChar: '#', escapeChar: '!', matchCase: 'false'
        } as HiccupAttrs,
          ['ogc:PropertyName', null, config.nameField],
          ['ogc:Literal', null, '*']
        ]
      ];
    }

    const propertyName = this.isTenementStatus(tenementLiteral) ? config.statusField : config.typeField;

    let typeFilter;
    if (config.providerType === ServiceProviderType.GeoServer) {
        typeFilter = ['ogc:PropertyIsLike', { wildCard: '*', singleChar: '#', escapeChar: '!', matchCase: 'false' } as HiccupAttrs,
            ['ogc:PropertyName', null, propertyName],
            // Use wildcards for tenement type as it has so many variations
            ['ogc:Literal', null, this.isTenementStatus(tenementLiteral) ? tenementLiteral : `*${tenementLiteral}*`]
        ];
    } else {
        typeFilter = ['ogc:PropertyIsEqualTo', null,
            ['ogc:PropertyName', null, propertyName],
            ['ogc:Literal', null, tenementLiteral ]
        ];
    }

    // Merge optional filters produced by StyleService (if any)
    const optFrag = StyleService.generateFilter(optionalFilters as any);
    if (!optFrag) {
      return ['ogc:Filter', null, typeFilter];
    }

    // optFrag is ['ogc:Filter', {}, innerFrag] -> extract inner fragment(s)
    const innerFrag = Array.isArray(optFrag) && optFrag.length >= 3 ? optFrag[2] : optFrag;
    if (Array.isArray(innerFrag) && innerFrag[0] === 'ogc:And') {
      // Combine typeFilter with innerFrag's children
      return ['ogc:Filter', null, ['ogc:And', null, typeFilter, ...innerFrag.slice(2)]];
    } else {
      return ['ogc:Filter', null, ['ogc:And', null, typeFilter, innerFrag]];
    }
  }

  private static isTenementStatus(value: string): boolean {
    return ['LIVE', 'CURRENT', 'PENDING','APPLICATION',
    'PROPOSAL','RENEWAL','GRANT','ISSUED','CEASED','GRANTED','REDUCTION RETAINED',
    'RENEW RETAINED','REVISED APPLICATION','PENDING RENEWAL',
    'PENDING SURRENDER','PENDING PARTIAL SURRENDER','EXPORATION RELEASE AREA',
    'Granted','Application'].includes(value);
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
