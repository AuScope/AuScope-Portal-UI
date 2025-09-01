import { Injectable } from '@angular/core';

interface OptionalFilter {
  value: string;
  label: string;
  xpath: string;
  predicate: string;
  type: string;
  added: boolean;
}

interface RemanentAnomaliesStyleParams {
  serviceUrl?: string;
  name?: string;
  ARRAMin?: number;
  ARRAMax?: number;
  decMin?: number;
  decMax?: number;
  incMin?: number;
  incMax?: number;
  modelCountMin?: number;
  modelCountMax?: number;
  styleSwitch?: 'ARRA' | 'inc' | 'dec' | 'models' | 'default';
  optionalFilters?: OptionalFilter[];
}

@Injectable()
export class RemanentAnomaliesStyleService {
  private static readonly REMANENT_ANOMALIES_TYPE = 'RemAnom:Anomaly';

  public static getSld(layerName: string, styleName: string, params: RemanentAnomaliesStyleParams): string {
    const styleSwitch = params.styleSwitch || 'default';
    const color = '#000000';

    // Create filter based on parameters
    const filter = this.generateFilter(params);

    // Generate style based on switch type
    switch (styleSwitch) {
      case 'ARRA':
        return this.generateARRAStyle(filter);
      case 'inc':
        return this.generateIncStyle(filter);
      case 'dec':
        return this.generateDecStyle(filter);
      case 'models':
        return this.generateModelsStyle(filter);
      default:
        return this.generateDefaultStyle(filter, color);
    }
  }

  private static generateFilter(params: RemanentAnomaliesStyleParams): string {
    const filterParts: string[] = [];

    // Handle optional filters first
    if (params.optionalFilters?.length > 0) {
      params.optionalFilters.forEach(filter => {
        if (filter.added) {
          switch (filter.type) {
            case 'OPTIONAL.TEXT':
              if (filter.predicate === 'ISLIKE') {
                filterParts.push(`
                  <ogc:PropertyIsLike wildCard="*" singleChar="#" escapeChar="!">
                    <ogc:PropertyName>${filter.xpath}</ogc:PropertyName>
                    <ogc:Literal>*${filter.value}*</ogc:Literal>
                  </ogc:PropertyIsLike>
                `);
              }
              break;
            // Add other filter type cases as needed
          }
        }
      });
    }

    // Handle name parameter if it exists and no optional name filter was added
    if (params.name && !params.optionalFilters?.some(f => f.xpath === 'RemAnom:AnomalyName')) {
      filterParts.push(`
        <ogc:Or>
          <ogc:PropertyIsLike wildCard="*" singleChar="#" escapeChar="!">
            <ogc:PropertyName>RemAnom:AnomalyName</ogc:PropertyName>
            <ogc:Literal>*${params.name}*</ogc:Literal>
          </ogc:PropertyIsLike>
          <ogc:FeatureId fid="anomaly.${params.name}"/>
        </ogc:Or>
      `);
    }

    if (params.ARRAMin !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:Apparent_resultant_rotation_angle</ogc:PropertyName>
          <ogc:Literal>${params.ARRAMin}</ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
      `);
    }

    if (params.ARRAMax !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsLessThanOrEqualTo>
          <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:Apparent_resultant_rotation_angle</ogc:PropertyName>
          <ogc:Literal>${params.ARRAMax}</ogc:Literal>
        </ogc:PropertyIsLessThanOrEqualTo>
      `);
    }

    if (params.decMin !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:resultant_declination</ogc:PropertyName>
          <ogc:Literal>${params.decMin}</ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
      `);
    }

    if (params.decMax !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsLessThanOrEqualTo>
          <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:resultant_declination</ogc:PropertyName>
          <ogc:Literal>${params.decMax}</ogc:Literal>
        </ogc:PropertyIsLessThanOrEqualTo>
      `);
    }

    if (params.incMin !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:resultant_inclination</ogc:PropertyName>
          <ogc:Literal>${params.incMin}</ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
      `);
    }

    if (params.incMax !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsLessThanOrEqualTo>
          <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:resultant_inclination</ogc:PropertyName>
          <ogc:Literal>${params.incMax}</ogc:Literal>
        </ogc:PropertyIsLessThanOrEqualTo>
      `);
    }

    if (params.modelCountMin !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsGreaterThanOrEqualTo>
          <ogc:Function name="attributeCount">
            <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member/RemAnom:Model</ogc:PropertyName>
          </ogc:Function>
          <ogc:Literal>${params.modelCountMin}</ogc:Literal>
        </ogc:PropertyIsGreaterThanOrEqualTo>
      `);
    }

    if (params.modelCountMax !== undefined) {
      filterParts.push(`
        <ogc:PropertyIsLessThanOrEqualTo>
          <ogc:Function name="attributeCount">
            <ogc:PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member/RemAnom:Model</ogc:PropertyName>
          </ogc:Function>
          <ogc:Literal>${params.modelCountMax}</ogc:Literal>
        </ogc:PropertyIsLessThanOrEqualTo>
      `);
    }

    const filterContent = filterParts.length > 0
      ? `<ogc:And>${filterParts.join('')}</ogc:And>`
      : `<ogc:PropertyIsLike wildCard="*" singleChar="#" escapeChar="!">
           <ogc:PropertyName>RemAnom:AnomalyName</ogc:PropertyName>
           <ogc:Literal>*</ogc:Literal>
         </ogc:PropertyIsLike>`;

    return `<ogc:Filter>${filterContent}</ogc:Filter>`;
  }

  private static generateARRAStyle(filter: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <StyledLayerDescriptor version="1.0.0" 
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd http://remanentanomalies.csiro.au/schemas/anomaly.xsd"
        xmlns:ogc="http://www.opengis.net/ogc" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        xmlns:gml="http://www.opengis.net/gml" 
        xmlns="http://www.opengis.net/sld" 
        xmlns:RemAnom="http://remanentanomalies.csiro.au" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <NamedLayer>
          <Name>${this.REMANENT_ANOMALIES_TYPE}</Name>
          <UserStyle>
            <Name>ARRARemAnomStyle</Name>
            <Title>ARRARemAnomStyle</Title>
            <Abstract>ARRARemAnomStyle</Abstract>
            <IsDefault>1</IsDefault>
            <FeatureTypeStyle>
              <Rule>
                <Name>Anomaly</Name>
                ${filter}
                <PointSymbolizer>
                  <Graphic>
                    <Mark>
                      <WellKnownName>circle</WellKnownName>
                      <Fill>
                        <CssParameter name="fill">
                          <Function name="Categorize">
                            <PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:Apparent_resultant_rotation_angle</PropertyName>
                            <Literal>#0000ff</Literal>
                            <Literal>45</Literal>
                            <Literal>#00ff00</Literal>
                            <Literal>90</Literal>
                            <Literal>#ffff00</Literal>
                            <Literal>135</Literal>
                            <Literal>#ff0000</Literal>
                          </Function>
                        </CssParameter>
                      </Fill>
                    </Mark>
                    <Size>8</Size>
                  </Graphic>
                </PointSymbolizer>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;
  }

  private static generateIncStyle(filter: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <StyledLayerDescriptor version="1.0.0" 
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd http://remanentanomalies.csiro.au/schemas/anomaly.xsd"
        xmlns:ogc="http://www.opengis.net/ogc" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        xmlns:gml="http://www.opengis.net/gml" 
        xmlns="http://www.opengis.net/sld" 
        xmlns:RemAnom="http://remanentanomalies.csiro.au" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <NamedLayer>
          <Name>${this.REMANENT_ANOMALIES_TYPE}</Name>
          <UserStyle>
            <Name>incRemAnomStyle</Name>
            <Title>incRemAnomStyle</Title>
            <Abstract>incRemAnomStyle</Abstract>
            <IsDefault>1</IsDefault>
            <FeatureTypeStyle>
              <Rule>
                <Name>Anomaly</Name>
                ${filter}
                <PointSymbolizer>
                  <Graphic>
                    <Mark>
                      <WellKnownName>circle</WellKnownName>
                      <Fill>
                        <CssParameter name="fill">
                          <Function name="Categorize">
                            <PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:resultant_inclination</PropertyName>
                            <Literal>#0000ff</Literal>
                            <Literal>-45</Literal>
                            <Literal>#00ff00</Literal>
                            <Literal>0</Literal>
                            <Literal>#ffff00</Literal>
                            <Literal>45</Literal>
                            <Literal>#ff0000</Literal>
                          </Function>
                        </CssParameter>
                      </Fill>
                    </Mark>
                    <Size>8</Size>
                  </Graphic>
                </PointSymbolizer>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;
  }

  private static generateDecStyle(filter: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <StyledLayerDescriptor version="1.0.0" 
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd http://remanentanomalies.csiro.au/schemas/anomaly.xsd"
        xmlns:ogc="http://www.opengis.net/ogc" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        xmlns:gml="http://www.opengis.net/gml" 
        xmlns="http://www.opengis.net/sld" 
        xmlns:RemAnom="http://remanentanomalies.csiro.au" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <NamedLayer>
          <Name>${this.REMANENT_ANOMALIES_TYPE}</Name>
          <UserStyle>
            <Name>decRemAnomStyle</Name>
            <Title>decRemAnomStyle</Title>
            <Abstract>decRemAnomStyle</Abstract>
            <IsDefault>1</IsDefault>
            <FeatureTypeStyle>
              <Rule>
                <Name>Anomaly</Name>
                ${filter}
                <PointSymbolizer>
                  <Graphic>
                    <Mark>
                      <WellKnownName>circle</WellKnownName>
                      <Fill>
                        <CssParameter name="fill">
                          <Function name="Categorize">
                            <PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member[1]/RemAnom:Model/RemAnom:resultant_declination</PropertyName>
                            <Literal>#0000ff</Literal>
                            <Literal>90</Literal>
                            <Literal>#00ff00</Literal>
                            <Literal>180</Literal>
                            <Literal>#ffff00</Literal>
                            <Literal>270</Literal>
                            <Literal>#ff0000</Literal>
                          </Function>
                        </CssParameter>
                      </Fill>
                    </Mark>
                    <Size>8</Size>
                  </Graphic>
                </PointSymbolizer>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;
  }

  private static generateModelsStyle(filter: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <StyledLayerDescriptor version="1.0.0" 
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd http://remanentanomalies.csiro.au/schemas/anomaly.xsd"
        xmlns:ogc="http://www.opengis.net/ogc" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        xmlns:gml="http://www.opengis.net/gml" 
        xmlns="http://www.opengis.net/sld" 
        xmlns:RemAnom="http://remanentanomalies.csiro.au" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <NamedLayer>
          <Name>${this.REMANENT_ANOMALIES_TYPE}</Name>
          <UserStyle>
            <Name>modelsRemAnomStyle</Name>
            <Title>modelsRemAnomStyle</Title>
            <Abstract>modelsRemAnomStyle</Abstract>
            <IsDefault>1</IsDefault>
            <FeatureTypeStyle>
              <Rule>
                <Name>Anomaly</Name>
                ${filter}
                <PointSymbolizer>
                  <Graphic>
                    <Mark>
                      <WellKnownName>circle</WellKnownName>
                      <Fill>
                        <CssParameter name="fill">
                          <Function name="Categorize">
                            <Function name="attributeCount">
                              <PropertyName>RemAnom:modelCollection/RemAnom:ModelCollection/RemAnom:member/RemAnom:Model</PropertyName>
                            </Function>
                            <Literal>#000000</Literal>
                            <Literal>1</Literal>
                            <Literal>#0000ff</Literal>
                            <Literal>2</Literal>
                            <Literal>#00ff00</Literal>
                            <Literal>3</Literal>
                            <Literal>#ffff00</Literal>
                            <Literal>4</Literal>
                            <Literal>#ff0000</Literal>
                          </Function>
                        </CssParameter>
                      </Fill>
                    </Mark>
                    <Size>8</Size>
                  </Graphic>
                </PointSymbolizer>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;
  }

  private static generateDefaultStyle(filter: string, color: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <StyledLayerDescriptor version="1.0.0" 
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd http://remanentanomalies.csiro.au/schemas/anomaly.xsd"
        xmlns:ogc="http://www.opengis.net/ogc" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        xmlns:gml="http://www.opengis.net/gml" 
        xmlns="http://www.opengis.net/sld" 
        xmlns:RemAnom="http://remanentanomalies.csiro.au" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <NamedLayer>
          <Name>${this.REMANENT_ANOMALIES_TYPE}</Name>
          <UserStyle>
            <Name>defaultRemAnomStyle</Name>
            <Title>defaultRemAnomStyle</Title>
            <Abstract>defaultRemAnomStyle</Abstract>
            <IsDefault>1</IsDefault>
            <FeatureTypeStyle>
              <Rule>
                <Name>Anomaly</Name>
                ${filter}
                <PointSymbolizer>
                  <Graphic>
                    <Mark>
                      <WellKnownName>circle</WellKnownName>
                      <Fill>
                        <CssParameter name="fill">${color}</CssParameter>
                      </Fill>
                    </Mark>
                    <Size>8</Size>
                  </Graphic>
                </PointSymbolizer>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;
  }
} 