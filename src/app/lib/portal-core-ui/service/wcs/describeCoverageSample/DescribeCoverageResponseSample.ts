
export const DescribeCoverageResponseSample = `
<CoverageDescription xmlns="http://www.opengis.net/wcs" xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wcs http://schemas.opengis.net/wcs/1.0.0/describeCoverage.xsd" version="1.0.0">
<CoverageOffering>
<description> 1. Band ratio: B5/B7 Blue is well ordered kaolinite, Al-rich muscovite/illite, paragonite, pyrophyllite Red is Al-poor (Si-rich) muscovite (phengite) useful for mapping: (1) exposed saprolite/saprock is often white mica or Al-smectite (warmer colours) whereas transported materials are often kaolin-rich (cooler colours); (2) clays developed over carbonates, especially Al-smectite (montmorillonite, beidellite) will produce middle to warmers colours. (2) stratigraphic mapping based on different clay-types; and (3) lithology-overprinting hydrothermal alteration, e.g. Si-rich and K-rich phengitic mica (warmer colours). Combine with Ferrous iron in MgOH and FeOH content products to look for evidence of overlapping/juxtaposed potassic metasomatism in ferromagnesian parents rocks (e.g. Archaean greenstone associated Au mineralisation) +/- associated distal propyllitic alteration (e.g. chlorite, amphibole). NCI Data Catalogue: https://dx.doi.org/10.25914/5f224f0797a66 </description>
<name>AlOH_Group_Composition</name>
<label> ASTER Map AlOH Group Composition </label>
<lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84">
<gml:pos>-180.0 -90.0</gml:pos>
<gml:pos>180.0 90.0</gml:pos>
<gml:timePosition>2012-06-01T00:00:00.000Z</gml:timePosition>
<gml:timePosition>2012-06-01T00:00:00.000Z</gml:timePosition>
</lonLatEnvelope>
<domainSet>
<spatialDomain>
<gml:EnvelopeWithTimePeriod srsName="urn:ogc:def:crs:OGC:1.3:CRS84">
<gml:pos dimension="2">-180.0 -90.0</gml:pos>
<gml:pos dimension="2">180.0 90.0</gml:pos>
<gml:timePosition>2012-06-01T00:00:00.000Z</gml:timePosition>
<gml:timePosition>2012-06-01T00:00:00.000Z</gml:timePosition>
</gml:EnvelopeWithTimePeriod>
<gml:RectifiedGrid srsName="EPSG:4326" dimension="2">
<gml:limits>
<gml:GridEnvelope>
<gml:low>0 0</gml:low>
<gml:high>3999 3999</gml:high>
</gml:GridEnvelope>
</gml:limits>
<gml:axisName>x</gml:axisName>
<gml:axisName>y</gml:axisName>
<gml:origin>
<gml:pos>-999.9875000000001 -1400.0125</gml:pos>
</gml:origin>
<gml:offsetVector>0.025 0.0</gml:offsetVector>
<gml:offsetVector>0.0 -0.025</gml:offsetVector>
</gml:RectifiedGrid>
</spatialDomain>
<temporalDomain>
<gml:timePosition>2012-06-01T00:00:00.000Z</gml:timePosition>
</temporalDomain>
</domainSet>
<rangeSet>
<RangeSet>
<description> 1. Band ratio: B5/B7 Blue is well ordered kaolinite, Al-rich muscovite/illite, paragonite, pyrophyllite Red is Al-poor (Si-rich) muscovite (phengite) useful for mapping: (1) exposed saprolite/saprock is often white mica or Al-smectite (warmer colours) whereas transported materials are often kaolin-rich (cooler colours); (2) clays developed over carbonates, especially Al-smectite (montmorillonite, beidellite) will produce middle to warmers colours. (2) stratigraphic mapping based on different clay-types; and (3) lithology-overprinting hydrothermal alteration, e.g. Si-rich and K-rich phengitic mica (warmer colours). Combine with Ferrous iron in MgOH and FeOH content products to look for evidence of overlapping/juxtaposed potassic metasomatism in ferromagnesian parents rocks (e.g. Archaean greenstone associated Au mineralisation) +/- associated distal propyllitic alteration (e.g. chlorite, amphibole). NCI Data Catalogue: https://dx.doi.org/10.25914/5f224f0797a66 </description>
<name>AlOH_Group_Composition</name>
<label> ASTER Map AlOH Group Composition </label>
<nullValues>
<singleValue>NaN</singleValue>
</nullValues>
</RangeSet>
</rangeSet>
<supportedCRSs>
<requestCRSs>EPSG:4326</requestCRSs>
<responseCRSs>EPSG:4326</responseCRSs>
</supportedCRSs>
<supportedFormats>
<formats>GeoTIFF</formats>
<formats>NetCDF</formats>
</supportedFormats>
<supportedInterpolations>
<interpolationMethod>none</interpolationMethod>
</supportedInterpolations>
</CoverageOffering>
</CoverageDescription>`