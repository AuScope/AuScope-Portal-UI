import { serialize } from '@thi.ng/hiccup';

/**
 * Service for generating SLD styles for generic layers
 * This replaces the backend doGenericFilterStyle.do endpoint
 */
export class GenericStyleService {

  /**
   * Generate SLD for generic layers
   * @param layerName The name of the layer
   * @param styleName The style name
   * @param params Additional parameters including:
   *   - spatialPropertyName: The spatial property name
   *   - bbox: Bounding box information
   *   - styleType: Type of style (POINT, LINE, POLYGON)
   *   - styleColor: Color for the style
   *   - labelProperty: Optional property to use for labels
   *   - optionalFilters: Optional filters to apply
   * @returns SLD XML as a string
   */
  public static getSld(layerName: string, styleName: string, params: any): string {
    // Extract parameters
    const spatialPropertyName = params.spatialPropertyName || 'gsml:shape';
    const styleType = params.styleType || 'POINT';
    const styleColor = params.styleColor || '#FF0000';
    const labelProperty = params.labelProperty;
    const optionalFilters = params.optionalFilters;
    const bboxJson = params.bbox;

    // Debug log for IGSN layers
    if (layerName && (layerName.includes('igsn') || layerName.includes('IGSN'))) {
      console.log('IGSN layer detected:', layerName);
      console.log('Optional filters:', optionalFilters);
    }

    // Define namespaces for SLD
    const ns = {
      sld: 'http://www.opengis.net/sld',
      ogc: 'http://www.opengis.net/ogc',
      gml: 'http://www.opengis.net/gml',
      gsml: 'urn:cgi:xmlns:CGI:GeoSciML:2.0',
      gsmlp: 'http://xmlns.geosciml.org/geosciml-portrayal/4.0',
      xlink: 'http://www.w3.org/1999/xlink',
      xsi: 'http://www.w3.org/2001/XMLSchema-instance'
    };

    // Generate filter
    const filterXml = this.generateFilter(bboxJson, optionalFilters, spatialPropertyName);
    

    // Generate style with or without label
    const rule = this.generateRule(filterXml, styleType, styleColor, labelProperty);

    // Generate complete SLD
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
        'xsi:schemaLocation': `${ns.sld} http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd`
      },
        ['sld:NamedLayer', {},
          ['sld:Name', {}, layerName],
          ['sld:UserStyle', {},
            ['sld:Name', {}, 'portal-style'],
            ['sld:FeatureTypeStyle', {},
              rule
            ]
          ]
        ]
      ]
    );
  }

  /**
   * Generate filter based on bounding box and optional filters
   * @param bboxJson Bounding box as JSON string
   * @param optionalFilters Optional filters to apply
   * @param spatialPropertyName The spatial property name to use in the BBOX filter
   * @returns Filter XML structure
   */
  private static generateFilter(bboxJson: any, optionalFilters: any, spatialPropertyName: string): any {
    // Parse optional filters
    let parsedFilters: any[] = [];
    try {
      if (optionalFilters && typeof optionalFilters === 'string') {
        parsedFilters = JSON.parse(optionalFilters);
      } else if (Array.isArray(optionalFilters)) {
        parsedFilters = optionalFilters;
      }
    } catch (e) {
      console.error('Failed to parse optional filters', e);
    }

    // Parse bounding box
    let bbox: any = null;
    try {
      if (bboxJson && typeof bboxJson === 'string' && bboxJson.trim() !== '') {
        bbox = JSON.parse(bboxJson);
      } else if (bboxJson && typeof bboxJson === 'object') {
        bbox = bboxJson;
      }
    } catch (e) {
      console.error('Failed to parse bounding box', e);
    }

    // Build filter fragments
    const filterFragments: any[] = [];


    // Add optional filters if available
    if (parsedFilters && parsedFilters.length > 0) {
      for (const filter of parsedFilters) {
        // Skip disabled filters
        if (filter.enabled !== undefined && !filter.enabled) {
          continue;
        }

        let propertyFilter: any = null;
        
        // Handle different filter formats
        if (Array.isArray(filter)) {
          // This is likely the layers.yaml format: [label, field, null, operator]
          if (filter.length >= 4) {
            const [label, field, _, operator] = filter;
            
            // Check if this filter has a value (added by UI)
            const arrayFilter = filter as unknown as { value?: string };
            if (field && arrayFilter.value) {
              propertyFilter = this.generatePropertyFilter(field, arrayFilter.value, operator || '=');
            }
          }
        } 
        // Handle standard object format
        else if (typeof filter === 'object') {
          // Standard filter with field and value
          if (filter.field && filter.value) {
            propertyFilter = this.generatePropertyFilter(
              filter.field, 
              filter.value, 
              filter.operator || '='
            );
          }
          // UI filter format
          else if (filter.label && filter.value) {
            let field = filter.xpath || filter.field;
            let operator = filter.predicate || filter.operator || '=';
            
            // Special case for IGSN Identifier
            if (filter.label === 'IGSN Identifier' || filter.label.includes('IGSN')) {
              field = field || 'igsn';
              operator = operator || 'ISLIKE';
            }
            
            if (field) {
              propertyFilter = this.generatePropertyFilter(field, filter.value, operator);
            }
          }
        }

        if (propertyFilter) {
          filterFragments.push(propertyFilter);
        }
      }
    }

    // Combine filters
    if (filterFragments.length > 0) {
      if (filterFragments.length === 1) {
        return ['ogc:Filter', {}, filterFragments[0]];
      } else {
        return ['ogc:Filter', {}, ['ogc:And', {}, ...filterFragments]];
      }
    }

    return null;
  }


  /**
   * Generate property filter
   * @param field Field name
   * @param value Field value
   * @param operator Operator to use
   * @returns Property filter structure
   */
  private static generatePropertyFilter(field: string, value: string, operator: string): any {
    if (!field || value === undefined || value === null) return null;

    const operatorUpper = (operator || '=').toUpperCase();

    switch (operatorUpper) {
      case '=':
        return ['ogc:PropertyIsEqualTo', { matchCase: 'false' },
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, value]
        ];
      case '!=':
        return ['ogc:PropertyIsNotEqualTo', { matchCase: 'false' },
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, value]
        ];
      case '>':
        return ['ogc:PropertyIsGreaterThan', {},
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, value]
        ];
      case '>=':
        return ['ogc:PropertyIsGreaterThanOrEqualTo', {},
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, value]
        ];
      case '<':
        return ['ogc:PropertyIsLessThan', {},
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, value]
        ];
      case '<=':
        return ['ogc:PropertyIsLessThanOrEqualTo', {},
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, value]
        ];
      case 'LIKE':
      case 'ISLIKE':
        // Use % wildcards for GeoServer compatibility
        const formattedValue = value.includes('%') ? value : `%${value}%`;
        return ['ogc:PropertyIsLike', { wildCard: '%', singleChar: '_', escape: '!', matchCase: 'false' },
          ['ogc:PropertyName', {}, field],
          ['ogc:Literal', {}, formattedValue]
        ];
      default:
        return null;
    }
  }

  /**
   * Generate rule with symbolizer
   * @param filter Filter structure
   * @param styleType Style type (POINT, LINE, POLYGON)
   * @param styleColor Style color
   * @param labelProperty Optional property to use for label
   * @returns Rule structure
   */
  private static generateRule(filter: any, styleType: string, styleColor: string, labelProperty?: string): any {
    const rule = ['sld:Rule', {}];
    
    // Add filter if available
    if (filter) {
      rule.push(filter);
    }
    
    // Add symbolizer based on style type
    switch (styleType) {
      case 'POLYGON':
        rule.push(
          ['sld:PolygonSymbolizer', {},
            ['sld:Fill', {},
              ['sld:CssParameter', { name: 'fill' }, styleColor],
              ['sld:CssParameter', { name: 'fill-opacity' }, '0.1']
            ],
            ['sld:Stroke', {},
              ['sld:CssParameter', { name: 'stroke' }, styleColor],
              ['sld:CssParameter', { name: 'stroke-width' }, '0.1']
            ]
          ]
        );
        break;
      case 'LINE':
        rule.push(
          ['sld:LineSymbolizer', {},
            ['sld:Stroke', {},
              ['sld:CssParameter', { name: 'stroke' }, styleColor],
              ['sld:CssParameter', { name: 'stroke-width' }, '0.1']
            ]
          ]
        );
        break;
      case 'POINT':
      default:
        rule.push(
          ['sld:PointSymbolizer', {},
            ['sld:Graphic', {},
              ['sld:Mark', {},
                ['sld:WellKnownName', {}, 'circle'],
                ['sld:Fill', {},
                  ['sld:CssParameter', { name: 'fill' }, styleColor],
                  ['sld:CssParameter', { name: 'fill-opacity' }, '0.4']
                ]
              ],
              ['sld:Size', {}, '8']
            ]
          ]
        );
        break;
    }
    
    // Add label symbolizer if label property is specified
    if (labelProperty) {
      rule.push(
        ['sld:TextSymbolizer', {},
          ['sld:Label', {},
            ['ogc:PropertyName', {}, labelProperty]
          ],
          ['sld:Font', {},
            ['sld:CssParameter', { name: 'font-family' }, 'Arial'],
            ['sld:CssParameter', { name: 'font-size' }, '12'],
            ['sld:CssParameter', { name: 'font-style' }, 'normal'],
            ['sld:CssParameter', { name: 'font-weight' }, 'normal']
          ],
          ['sld:LabelPlacement', {},
            ['sld:PointPlacement', {},
              ['sld:Displacement', {},
                ['sld:DisplacementX', {}, '6'],
                ['sld:DisplacementY', {}, '-6']
              ]
            ]
          ],
          ['sld:Fill', {},
            ['sld:CssParameter', { name: 'fill' }, '#000000']
          ]
        ]
      );
    }
    
    return rule;
  }
} 