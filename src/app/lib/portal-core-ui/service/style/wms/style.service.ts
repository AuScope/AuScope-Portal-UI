import { Injectable } from '@angular/core';
import { serialize } from '@thi.ng/hiccup';

export interface OptionalFilter {
  value: string;
  label: string;
  xpath: string;
  predicate: string;
  type: string;
  added: boolean;
}

/*
 * This is a static class designed to create parts of WMS SLD_BODY style sheets
 */
@Injectable()
export class StyleService {
    /**
     * Assembles 'sld:Rule' component of SLD_BODY parameter
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
     * @param propName property name
     * @param litName literal name
     * @param noNS boolean if true will not output namespaces
     * @return XML 'sld:Filter' string
     */
    public static getFilter(propName: string, litName: string, noNS: boolean): string {
        const isEqualTo = (body: string) => [noNS?'PropertyIsEqualTo':'ogc:PropertyIsEqualTo', { 'matchCase': 'false' }, body];
        const propertyName = (propName: string) => [noNS?'PropertyName':'ogc:PropertyName', null, propName];
        const literal = (litName: string) => [noNS?'Literal':'ogc:Literal', null, litName];
        const body = serialize(propertyName(propName)) + serialize(literal(litName));
        return serialize([noNS?'Filter':'ogc:Filter', null, isEqualTo(body)]);
    }

    /**
     * Assembles 'sld:PolygonSymbolizer' or 'sld:PointSymbolizer' component of SLD_BODY parameter
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

        // Polygon or point?
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

    /** Static methods and helper functions for WMS style service classes */

    /** Private static methods */

    /**
     * Handle text filter
     * @param filter Filter object
     * @returns a text property filter
     */
    private static handleTextFilter(filter: any): any {
      if (!filter.xpath || !filter.value) {
        return null;
      }

      if (filter.predicate === 'ISLIKE') {
        return ['ogc:PropertyIsLike', { wildCard: '%', singleChar: '_', escape: '!', matchCase: 'false' },
          ['ogc:PropertyName', {}, filter.xpath],
          ['ogc:Literal', {}, `%${filter.value}%`]
        ];
      } else if (filter.predicate === 'ISEQUAL') {
        return ['ogc:PropertyIsEqualTo', { matchCase: 'false' },
          ['ogc:PropertyName', {}, filter.xpath],
          ['ogc:Literal', {}, filter.value]
        ];
      }

      return null;
    }

    /**
     * Handle dropdown filter
     * @param filter Filter object
     * @returns A dropdown property filter
     */
    private static handleDropdownFilter(filter: any): any {
      if (!filter.xpath || !filter.value) {
        return null;
      }

      if (filter.predicate === 'ISEQUAL') {
        return ['ogc:PropertyIsEqualTo', { matchCase: 'false' },
          ['ogc:PropertyName', {}, filter.xpath],
          ['ogc:Literal', {}, filter.value]
        ];
      }

      return null;
    }

    /**
     * Handle polygon/bbox filter
     * @param filter Filter object
     * @returns Property filter structure
     */
    private static handlePolygonFilter(filter: any): any {
      if (!filter.xpath || !filter.value) {
        return null;
      }

      if (filter.predicate === 'ISEQUAL') {
        return ['ogc:Intersects', {},
          ['ogc:PropertyName', {}, filter.xpath],
          filter.value // Should already be GML polygon string
        ];
      }

      return null;
    }

    /**
     * Handle date filter
     * @param filter Filter object
     * @returns A date property filter
     */
    private static handleDateFilter(filter: any): any {
      if (!filter.xpath || !filter.value) {
        return null;
      }

      if (filter.predicate === 'BIGGER_THAN') {
        return ['ogc:PropertyIsGreaterThan', {},
          ['ogc:PropertyName', {}, filter.xpath],
          ['ogc:Literal', {}, filter.value]
        ];
      } else if (filter.predicate === 'SMALLER_THAN') {
        return ['ogc:PropertyIsLessThan', {},
          ['ogc:PropertyName', {}, filter.xpath],
          ['ogc:Literal', {}, filter.value]
        ];
      }

      return null;
    }

    /**
     * Generate a property filter
     * @param field Field name
     * @param value Field value
     * @param operator Operator to use
     * @returns a property filter
     */
    private static generatePropertyFilter(field: string, value: string, operator: string): any {
      if (!field || value === undefined || value === null) return null;

      const operatorUpper = (operator || 'ISEQUAL').toUpperCase();

      switch (operatorUpper) {
        case 'ISEQUAL':
        case '=':
          return ['ogc:PropertyIsEqualTo', { matchCase: 'false' },
            ['ogc:PropertyName', {}, field],
            ['ogc:Literal', {}, value]
          ];
        case 'ISNOTEQUAL':
        case '!=':
          return ['ogc:PropertyIsNotEqualTo', { matchCase: 'false' },
            ['ogc:PropertyName', {}, field],
            ['ogc:Literal', {}, value]
          ];
        case 'BIGGER_THAN':
        case '>':
          return ['ogc:PropertyIsGreaterThan', {},
            ['ogc:PropertyName', {}, field],
            ['ogc:Literal', {}, value]
          ];
        case 'SMALLER_THAN':
        case '<':
          return ['ogc:PropertyIsLessThan', {},
            ['ogc:PropertyName', {}, field],
            ['ogc:Literal', {}, value]
          ];
        case 'ISLIKE':
        case 'LIKE':
          // Use % wildcards for GeoServer compatibility
          const formattedValue = value.includes('%') ? value : `%${value}%`;
          return ['ogc:PropertyIsLike', { wildCard: '%', singleChar: '_', escape: '!', matchCase: 'false' },
            ['ogc:PropertyName', {}, field],
            ['ogc:Literal', {}, formattedValue]
          ];
        default:
          return ['ogc:PropertyIsEqualTo', { matchCase: 'false' },
            ['ogc:PropertyName', {}, field],
            ['ogc:Literal', {}, value]
          ];
      }
    }

    private static parseOptionalFilters(optionalFilters: any): any[] {
      if (!optionalFilters) { return []; }
      if (Array.isArray(optionalFilters)) { return optionalFilters; }
      if (typeof optionalFilters === 'string') {
        try { return JSON.parse(optionalFilters) || []; }
        catch (e) { console.error('Failed to parse optional filters', e); return []; }
      }
      return [];
    }

    private static isDisabledFilter(f: any): boolean {
      return f && typeof f === 'object' && f.enabled !== undefined && !f.enabled;
    }

    private static handleLegacyArrayFilter(filter: any): any | null {
      if (!Array.isArray(filter) || filter.length < 4) { return null; }
      const [ , field ] = filter;
      const arrayFilter = filter as unknown as { value?: string; };
      if (field && arrayFilter.value) {
        return this.generatePropertyFilter(field, arrayFilter.value, filter[3] || 'ISEQUAL');
      }
      return null;
    }

    private static handleStandardObjectFilter(filter: any): any | null {
      if (!filter || typeof filter !== 'object') { return null; }
      if (filter.xpath && filter.value && filter.label) {
        const op = filter.predicate || 'ISEQUAL';
        return this.generatePropertyFilter(filter.xpath, filter.value, op);
      }
      if (filter.field && filter.value) {
        return this.generatePropertyFilter(filter.field, filter.value, filter.operator || 'ISEQUAL');
      }
      return null;
    }

    /**
     * Handle filter depending on type
     * @param filter the filter
     * @returns a property filter
     */
    private static handleByType(filter: any): any | null {
      if (!filter || !filter.type) { return null; }
      const handlers: Record<string, (f: any) => any | null> = {
        'OPTIONAL.TEXT': (f) => this.handleTextFilter(f),
        'OPTIONAL.DROPDOWNREMOTE': (f) => this.handleDropdownFilter(f),
        'OPTIONAL.POLYGONBBOX': (f) => this.handlePolygonFilter(f),
        'OPTIONAL.DATE': (f) => this.handleDateFilter(f),
        // Handled elsewhere
        'OPTIONAL.PROVIDER': (_) => null,
      };
      const filterHandler = handlers[filter.type];
      if (filterHandler) { return filterHandler(filter); }
      // fallback for other typed filters that supply xpath/value
      if (filter.xpath && filter.value) {
        return this.generatePropertyFilter(filter.xpath, filter.value, filter.predicate || 'ISEQUAL');
      }
      return null;
    }

    /**
     * Build a filter fragment list
     * @param parsedFilters list of parsed filters
     * @returns list of filter fragments
     */
    private static buildFilterFragmentList(parsedFilters: any[]): any[] {
      const fragments: any[] = [];
      for (const filter of parsedFilters) {
        if (this.isDisabledFilter(filter)) { continue; }

        let fragment = this.handleByType(filter);
        if (fragment) { fragments.push(fragment); continue; }

        fragment = this.handleLegacyArrayFilter(filter);
        if (fragment) { fragments.push(fragment); continue; }

        fragment = this.handleStandardObjectFilter(filter);
        if (fragment) { fragments.push(fragment); continue; }
      }
      return fragments;
    }

    /** Public static methods */

    /**
     * Generate a default name filter
     * @returns default name filter as an XML string
     */
    static generateDefaultFilter(): string {
      return `<ogc:Filter><ogc:PropertyIsLike wildCard="*" singleChar="#" escapeChar="!">
                <ogc:PropertyName>gsmlp:name</ogc:PropertyName>
                <ogc:Literal>*</ogc:Literal>
              </ogc:PropertyIsLike></ogc:Filter>`;
    }

    /**
     * Create a rule as a JSON object
     * @param name name
     * @param filter filter
     * @param color colour
     * @param mark mark type
     * @param strokeWidth stroke width
     * @returns rule as a JSON object
     */
    static createRule(
      name: string,
      filter: string,
      color: string,
      mark: string,
      strokeWidth: string
    ): any[] {
    const filterXml = filter
      ? filter.includes('<ogc:Filter>')
        ? filter
        : ['ogc:Filter', {}, filter]
      : StyleService.generateDefaultFilter();
    return [
      'sld:FeatureTypeStyle',
      {},
      [
        'sld:Rule',
        {},
        ['sld:Name', {}, name],
        ['sld:MaxScaleDenominator', {}, '4000000'],
        typeof filterXml === 'string' ? filterXml : filterXml,
        this.createSymbolizer(color, mark, strokeWidth),
        this.createLabelSymbolizer(),
      ],
      [
        'sld:Rule',
        {},
        ['sld:MinScaleDenominator', {}, '4000000'],
        typeof filterXml === 'string' ? filterXml : filterXml,
        this.createSymbolizer(color, mark, strokeWidth),
      ],
    ];
  }

  /**
   * Create a symbolizer as a JOSN object
   * @param colour colour
   * @param mark marker type (default 'circle')
   * @returns point symbolizer as a JSON object
   */
  static createSymbolizer(colour: string, mark = 'circle', strokeWidth: string): any[] {
    return [
      'sld:PointSymbolizer',
      {},
      [
        'sld:Graphic',
        {},
        [
          'sld:Mark',
          {},
          ['sld:WellKnownName', {}, mark],
          [
            'sld:Fill',
            {},
            ['sld:CssParameter', { name: 'fill' }, colour],
            ['sld:CssParameter', { name: 'fill-opacity' }, '0.4'],
          ],
          [
            'sld:Stroke',
            {},
            ['sld:CssParameter', { name: 'stroke' }, colour],
            ['sld:CssParameter', { name: 'stroke-width' }, strokeWidth],
          ],
        ],
        ['sld:Size', {}, '8'],
      ],
    ];
  }

  /**
   * Create a polygon symbolizer
   * @param color fill and stroke color (hex)
   * @param strokeWidth stroke width as string (default '0.5')
   * @param fillOpacity fill opacity as string (default '0.4')
   * @returns polygon symbolizer as JSON object
   */
  public static createPolygonSymbolizer(color: string, strokeWidth = '0.5', fillOpacity = '0.4'): any[] {
    return [
      'sld:PolygonSymbolizer',
      {},
      [
        'sld:Fill',
        {},
        ['sld:CssParameter', { name: 'fill' }, color],
        ['sld:CssParameter', { name: 'fill-opacity' }, fillOpacity]
      ],
      [
        'sld:Stroke',
        {},
        ['sld:CssParameter', { name: 'stroke' }, color],
        ['sld:CssParameter', { name: 'stroke-width' }, strokeWidth]
      ]
    ];
  }

  /**
   * Create a label/text symbolizer for a given property name
   *
   * @param propertyName property used for label (default 'gsmlp:name')
   * @param fontFamily optional font family (default 'Arial')
   * @param fontSize optional font size as string (default '12')
   * @param displacementX optional X displacement as string (default '6')
   * @param displacementY optional Y displacement as string (default '-6')
   * @returns text symbolizer object
   */
  public static createLabelSymbolizer(
      propertyName = 'gsmlp:name',
      fontFamily = 'Arial',
      fontSize = '12',
      displacementX = '6',
      displacementY = '-6'): any[] {
    return [
      'sld:TextSymbolizer',
      {},
      [
        'sld:Label',
        {},
        [
          'ogc:Function',
          { name: 'strSubstringStart' },
          ['ogc:PropertyName', {}, propertyName],
          ['ogc:Function', { name: 'parseInt' }, ['ogc:Literal', {}, '27']],
        ],
      ],
      [
        'sld:Font',
        {},
        ['sld:CssParameter', { name: 'font-family' }, fontFamily],
        ['sld:CssParameter', { name: 'font-size' }, fontSize],
      ],
      [
        'sld:LabelPlacement',
        {},
        [
          'sld:PointPlacement',
          {},
          [
            'sld:Displacement',
            {},
            ['sld:DisplacementX', {}, displacementX],
            ['sld:DisplacementY', {}, displacementY],
          ],
        ],
      ],
      ['sld:Fill', {}, ['sld:CssParameter', { name: 'fill' }, '#000000']],
    ];
  }

  /**
   * Generate filter based on optional filters
   * @param optionalFilters Array of optional filters
   * @returns Filter XML structure or null if no filters
   */
  static generateFilter(optionalFilters: any[]): any {
    const parsed = this.parseOptionalFilters(optionalFilters);
    const fragments = this.buildFilterFragmentList(parsed);

    if (!fragments.length) { return null; }

    const result = fragments.length === 1
      ? ['ogc:Filter', {}, fragments[0]]
      : ['ogc:Filter', {}, ['ogc:And', {}, ...fragments]];
    return result;
  }
}
