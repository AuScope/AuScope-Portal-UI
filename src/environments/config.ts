// This file contains the static (mostly layer) config.


export const config = {
  nvclUrl: 'https://nvclwebservices.csiro.au/NVCLDataServices',
  // Layers that support downloading WFS feature data as zipped CSV files
  csvSupportedLayer: [
    'mineral-tenements',
    'tima-geosample',
    'nvcl-v2-borehole',
    'tima-shrimp-geosample',
    'pressuredb-borehole',
    'sf0-borehole-nvcl',
    'erl-mineview',
    'erl-mineraloccurrenceview',
    'erl-commodityresourceview'
  ],

  // Layers that download zipped datasets using 'datasetURL' feature name in the WFS response
  datasetUrlSupportedLayer: {
    'mscl-borehole': {
      datasetURL: 'datasetURL'
    },
  },

  // Layers that download 
  datasetUrlAussPassLayer: {
    'passive seismic': {
      'serviceType': {
        'Station': {
          isGeometryOptional: true,
        },
        'Dataselect': {
          isGeometryOptional: false,
        }
      }
    },
  },
  // Layers that support downloads of an area bounded by a polygon
  polygonSupportedLayer: [
    'mineral-tenements',
    'tima-geosample',
    'nvcl-v2-borehole',
    'tima-shrimp-geosample',
    'erl-mineview',
    'erl-mineraloccurrenceview',
    'erl-commodityresourceview'
  ],
  // Layers that support downloading datasets via WCS
  // (Set 'downloadAreaMaxSize' to Number.MAX_SAFE_INTEGER to disable area download limits)
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
    },
    'ga-geophys-1': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-2': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-3': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-4': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-5': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-6': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-7': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-8': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-9': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-10': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-11': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-12': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-13': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-14': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-15': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-16': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-17': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-18': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    },
    'ga-geophys-19': {
      downloadAreaMaxSize: Number.MAX_SAFE_INTEGER
    }
  },
  // Layers that require the proxy service to add layers
  forceAddLayerViaProxy: [
    'erml-miningactivity',
    'erml-mine',
    'erml-mineraloccurrence',
    'mineral-tenements',
    'tima-geosample',
    'tima-shrimp-geosample',
    'mineral-occ-view',
    'gsv-geological-unit-250k-',
    'gsv-geological-unit-contact-250k-',
    'gsv-geological-unit-contact-50k-',
    'gsv-geological-unit-250k-age',
    'gsv-shear-displacement-structure-250k-',
    'gsv-geological-unit-250k-lithology',
    'gsv-geological-unit-50k-lithology',
    'gsv-geological-unit-50k-',
    'gsv-shear-displacement-structure-50k-',
    'gsv-geological-unit-50k-age',
    'Octopus-Crn-Aus-Basins',
    'Octopus-Crn-Aus-Outlets',
    'Octopus-Crn-Int-Basins',
    'Octopus-Crn-Int-Outlets',
    'Octopus-Crn-XXL-Basins',
    'Octopus-Crn-XXL-Outlets',
    'Octopus-Crn-Basin-BBoxes',
    'Octopus-Sahul-Arch-Radicarbon',
    'Octopus-Sahul-Arch-OSL',
    'Octopus-Sahul-Arch-TL',
    'Octopus-Sahul-Sed-Archives-Aeolian-Osl',
    'Octopus-Sahul-Sed-Archives-Aeolian-Tl',
    'Octopus-Sahul-Sed-Archives-Fluvial-Osl',
    'Octopus-Sahul-Sed-Archives-Fluvial-Tl',
    'Octopus-Sahul-Sed-Archives-Lacustrine-Osl',
    'Octopus-Sahul-Sed-Archives-Lacustrine-Tl'
  ],
  // Layers that use CSW records to display a simple rectangle on map
  cswrenderer: [
    'pmd-crc-project-a1-presentations',
    'pmd-crc-project-c1-final-report',
    'pmd-crc-project-c2-final-report',
    'pmd-crc-project-c6-final-report',
    'pmd-crc-project-c7-final-report',
    'pmd-crc-project-i1-appendix1',
    'pmd-crc-project-i1-appendix5',
    'pmd-crc-project-i2-presentations',
    'pmd-crc-project-i5-final-report',
    'pmd-crc-project-i6-final-report',
    'pmd-crc-project-i9-final-report',
    'pmd-crc-project-t1-final-report',
    'pmd-crc-project-t3-final-report',
    'pmd-crc-project-t67-final-report',
    'pmd-crc-project-t11-final-report',
    'pmd-crc-project-y2-appendix',
    'pmd-crc-project-y4-final-report',
    'leme-crc-maps',
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
