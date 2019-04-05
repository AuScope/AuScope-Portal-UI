// This file contains the static (mostly layer) config.


export const config = {
  csvSupportedLayer: [
    'mineral-tenements',
    'tima-geosample',
    'nvcl-v2-borehole',
    'tima-shrimp-geosample',
    'mscl-borehole',
    'pressuredb-borehole',
    'sf0-borehole-nvcl',
    'erl-mineview',
    'erl-mineraloccurrenceview',
    'erl-commodityresourceview'
  ],
  wcsSupportedLayer: {
    'aster-aloh': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-ferrous': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-opaque': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-ferric-oxide-content': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-feoh': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-ferric-oxide-comp': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-group-index': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-quartz-index': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-mgoh-content': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-green-veg': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-ferr-carb': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-mgoh-group-comp': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-aloh-group-content': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-gypsum-content': {
      downloadAreaMaxSize: 80000000000
    },
    'aster-silica-content': {
      downloadAreaMaxSize: 80000000000
    }
  },
  forceAddLayerViaProxy: [
    'erml-miningactivity',
    'erml-mine',
    'erml-mineraloccurrence'
  ],
  cswrenderer: [
    'portal-reports',
    'portal-pmd-crc-reports',
    'fina-repo-3d-geol-mode-of-the-east-yilg-crat-proj-pmd-y2-sept-2001-dece-2004',
    'portal-geo-models'
  ],
  supportOpenInNewWindow: [
    'nvcl-v2-borehole',
    'nvcl-borehole',
    'mineral-tenements',
    'tima-geosample',
    'tima-shrimp-geosample',
    'mscl-borehole',
    'pressuredb-borehole',
    'sf0-borehole-nvcl'
  ],
  clipboard: {
    'supportedLayersRegKeyword': '(ProvinceFullExtent)',
    'supportedLayersRegName': '(Geological Provinces)',
    'mineraltenement': {
      'srsName': 'EPSG:4326',
      'nameKeyword': 'name',
      'geomKeyword': 'shape'
    },
    'ProvinceFullExtent': {
      'srsName': 'EPSG:3857',
      'nameKeyword': 'NAME',
      'geomKeyword': 'the_geom'
    }
  }
};
