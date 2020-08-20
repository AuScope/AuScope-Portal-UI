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
  // Set 'downloadAreaMaxSize' to Number.MAX_SAFE_INTEGER
  // to disable area download limits
  wcsSupportedLayer: {
    'aster-aloh': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-ferrous': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-opaque': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-ferric-oxide-content': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-feoh': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-ferric-oxide-comp': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-group-index': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-quartz-index': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-mgoh-content': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-green-veg': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-ferr-carb': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-mgoh-group-comp': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-aloh-group-content': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-gypsum-content': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'aster-silica-content': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
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
