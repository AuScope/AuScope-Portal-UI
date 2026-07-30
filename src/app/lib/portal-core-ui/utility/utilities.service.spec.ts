import { UtilitiesService } from './utilities.service';

describe('UtilitiesService', () => {
  describe('filterProviderSkip', () => {
    it('skips providers that do not support a selected JORC filter', () => {
      const optionalFilters: any[] = [
        { label: 'JORC Category', xpath: 'erl:resourcesCategory_uri', value: 'http://resource.geosciml.org/classifier/cgi/reserve-assessment-category/proved-ore-reserves', type: 'OPTIONAL.DROPDOWNREMOTE' }
      ];

      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://services.ga.gov.au/gis/earthresource/ows?SERVICE=WMS&', 'erl-commodityresourceview')).toBeTrue();
      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://gs.geoscience.nsw.gov.au/geoserver/ows?SERVICE=WMS&', 'erl-commodityresourceview')).toBeTrue();
      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://www.mrt.tas.gov.au/web-services/ows?SERVICE=WMS&', 'erl-commodityresourceview')).toBeFalse();
    });

    it('skips providers that do not support a selected Geologic Timescale filter', () => {
      const optionalFilters: any[] = [
        { label: 'Geologic Timescale', xpath: 'erl:representativeAge_uri', value: 'http://resource.geosciml.org/classifier/ics/ischart/Devonian', type: 'OPTIONAL.DROPDOWNREMOTE' }
      ];

      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://services.ga.gov.au/gis/earthresource/ows?SERVICE=WMS&', 'erl-mineraloccurrenceview')).toBeTrue();
      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://gs.geoscience.nsw.gov.au/geoserver/ows?SERVICE=WMS&', 'erl-mineraloccurrenceview')).toBeTrue();
      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://sarigdata.pir.sa.gov.au/geoserver/ows?SERVICE=WMS&', 'erl-mineraloccurrenceview')).toBeTrue();
      expect(UtilitiesService.filterProviderSkip(optionalFilters, 'https://www.mrt.tas.gov.au/web-services/ows?SERVICE=WMS&', 'erl-mineraloccurrenceview')).toBeFalse();
    });
  });

  describe('collateParam', () => {
    it('remaps Commodity Resource filters for Geoscience Australia', () => {
      const layer: any = { id: 'erl-commodityresourceview', filterCollection: {} };
      const onlineResource: any = { url: 'https://services.ga.gov.au/gis/earthresource/ows?SERVICE=WMS&', name: 'erl:CommodityResourceView' };
      const param: any = {
        optionalFilters: [
          { label: 'Commodity', xpath: 'erl:commodityClassifier_uri', value: 'x', type: 'OPTIONAL.DROPDOWNREMOTE' },
          { label: 'JORC Category', xpath: 'erl:resourcesCategory_uri', value: 'y', type: 'OPTIONAL.DROPDOWNREMOTE' }
        ]
      };

      const collated = UtilitiesService.collateParam(layer, onlineResource, param);

      expect(collated.optionalFilters).toEqual([
        jasmine.objectContaining({
          label: 'Commodity',
          xpath: 'erl:commodity_uri'
        })
      ]);
    });

    it('remaps Commodity Resource mine name for NSW', () => {
      const layer: any = { id: 'erl-commodityresourceview', filterCollection: {} };
      const onlineResource: any = { url: 'https://gs.geoscience.nsw.gov.au/geoserver/ows?SERVICE=WMS&', name: 'erl:CommodityResourceView' };
      const param: any = {
        optionalFilters: [
          { label: 'Mine Name', xpath: 'erl:mineName', value: 'Adamooka', type: 'OPTIONAL.TEXT' }
        ]
      };

      const collated = UtilitiesService.collateParam(layer, onlineResource, param);

      expect(collated.optionalFilters).toEqual([
        jasmine.objectContaining({
          label: 'Mine Name',
          xpath: 'erl:mineralOccurrenceName'
        })
      ]);
    });

    it('drops unsupported Geologic Timescale filters for providers without representative age', () => {
      const layer: any = { id: 'erl-mineraloccurrenceview', filterCollection: {} };
      const onlineResource: any = { url: 'https://services.ga.gov.au/gis/earthresource/ows?SERVICE=WMS&', name: 'erl:MineralOccurrenceView' };
      const param: any = {
        optionalFilters: [
          { label: 'Geologic Timescale', xpath: 'erl:representativeAge_uri', value: 'age-uri', type: 'OPTIONAL.DROPDOWNREMOTE' },
          { label: 'Name', xpath: 'erl:name', value: 'Test', type: 'OPTIONAL.TEXT' }
        ]
      };

      const collated = UtilitiesService.collateParam(layer, onlineResource, param);

      expect(collated.optionalFilters).toEqual([
        jasmine.objectContaining({
          label: 'Name',
          xpath: 'erl:name'
        })
      ]);
    });
  });
});
