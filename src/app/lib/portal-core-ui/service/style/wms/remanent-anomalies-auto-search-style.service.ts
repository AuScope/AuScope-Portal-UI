import { Injectable } from '@angular/core';
import { StyleService } from './style.service';
import { serialize } from '@thi.ng/hiccup';

interface RotationRule {
    min: number;
    max: number;
    color: string;
    name: string;
    title: string;
}

@Injectable()
export class RemanentAnomaliesAutoSearchStyleService {
    private static readonly LAYER_NAME = 'RemAnomAutoSearch:AutoSearchAnomalies';

    private static readonly ROTATION_RULES: RotationRule[] = [
        { min: 0, max: 30, color: '#0000FF', name: 'Rotation 0-30', title: 'Rotation between 0 and 30 degrees' },
        { min: 30, max: 60, color: '#00FFFF', name: 'Rotation 30-60', title: 'Rotation between 30 and 60 degrees' },
        { min: 60, max: 90, color: '#00FF00', name: 'Rotation 60-90', title: 'Rotation between 60 and 90 degrees' },
        { min: 90, max: 120, color: '#FFFF00', name: 'Rotation 90-120', title: 'Rotation between 90 and 120 degrees' },
        { min: 120, max: 150, color: '#FFA500', name: 'Rotation 120-150', title: 'Rotation between 120 and 150 degrees' },
        { min: 150, max: 180, color: '#FF0000', name: 'Rotation 150-180', title: 'Rotation between 150 and 180 degrees' }
    ];

    constructor(private styleService: StyleService) {}

    public static getSld(layerName: string, styleName: string): string {
        const rules = this.ROTATION_RULES.map(rule => this.createRotationRule(rule));

        return serialize(
            ['StyledLayerDescriptor', {
                version: '1.0.0',
                'xmlns': 'http://www.opengis.net/sld',
                'xmlns:ogc': 'http://www.opengis.net/ogc',
                'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                'xmlns:gml': 'http://www.opengis.net/gml',
                'xmlns:RemAnom': 'http://remanentanomalies.csiro.au',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xsi:schemaLocation': 'http://www.opengis.net/sld StyledLayerDescriptor.xsd http://remanentanomalies.csiro.au/schemas/anomaly.xsd'
            },
                ['NamedLayer', {},
                    ['Name', {}, this.LAYER_NAME],
                    ['UserStyle', {},
                        ['Name', {}, styleName],
                        ['Title', {}, styleName],
                        ['Abstract', {}, 'portal-style'],
                        ['IsDefault', {}, '1'],
                        ['FeatureTypeStyle', {},
                            ...rules
                        ]
                    ]
                ]
            ]
        );
    }

    private static createRotationRule(rule: RotationRule): any[] {
        return [
            'Rule', {},
            ['Name', {}, rule.name],
            ['Title', {}, rule.title],
            ['Abstract', {}, `Rotation of the magnetisation direction away from IGRF between ${rule.min} and ${rule.max} degrees`],
            ['ogc:Filter', {},
                ['ogc:And', {},
                    ['ogc:PropertyIsGreaterThanOrEqualTo', {},
                        ['ogc:PropertyName', {}, 'rotation_from_igrf'],
                        ['ogc:Literal', {}, rule.min.toString()]
                    ],
                    ['ogc:PropertyIsLessThan', {},
                        ['ogc:PropertyName', {}, 'rotation_from_igrf'],
                        ['ogc:Literal', {}, rule.max.toString()]
                    ]
                ]
            ],
            ['PolygonSymbolizer', {},
                ['Fill', {},
                    ['CssParameter', { name: 'fill' }, rule.color],
                    ['CssParameter', { name: 'fill-opacity' }, '0.5']
                ],
                ['Stroke', {},
                    ['CssParameter', { name: 'stroke' }, rule.color],
                    ['CssParameter', { name: 'stroke-width' }, '1']
                ]
            ]
        ];
    }
} 