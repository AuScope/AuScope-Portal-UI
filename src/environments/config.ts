// This file contains the static (mostly layer) config.


export const config = {
  nvclUrl: 'https://nvclwebservices.csiro.au/NVCLDataServices',

  // Layers that download zipped datasets using 'datasetURL' feature name in the WFS response
  // For GADDS 2.0 and other layers where including gsmlp:shape in the filter will cause problems, add:
  //  omitGsmlpShapeProperty: true
  datasetUrlSupportedLayer: {
    'mscl-borehole': {
      datasetURL: 'datasetURL'
    }
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
    'Octopus-Sahul-Sed-Archives-Lacustrine-Tl',
    'mscl-gssa-borehole',
    '2_5m_interpgeop15',
    '2m_linear_structures',
    '500k_faults_4326',
    '500k_geol_28350',
    '500k_geol_4326',
    'bulkdensitypoint_4326',
    'waroxi_wa_4326_bed'
  ],
  // Layers that require a JSON response for WMS GetFeature requests
  wmsGetFeatureJSON: [
    // ASTER is served by GSKY which only returns JSON
    'aster-aloh', 'aster-ferrous', 'aster-opaque', 'aster-ferric-oxide-content',
    'aster-feoh', 'aster-ferric-oxide-comp', 'aster-group-index',
    'aster-quartz-index', 'aster-mgoh-content', 'aster-green-veg',
    'aster-ferr-carb', 'aster-mgoh-group-comp', 'aster-aloh-group-content',
    'aster-silica-content',
    // Loop3D has XML formatting issues on some layers issues due to incorrectly defined namespaces
    '2m_linear_structures', '2_5m_interpgeop15', '500k_geol_4326',
    '500k_geol_28350', '500k_faults_4326',
    // GA/NCI National Geophysical Compilations is GSKY which only returns JSON
    'ga-geophys-1', 'ga-geophys-2', 'ga-geophys-3', 'ga-geophys-4', 'ga-geophys-5',
    'ga-geophys-6', 'ga-geophys-7', 'ga-geophys-8', 'ga-geophys-9', 'ga-geophys-10',
    'ga-geophys-11', 'ga-geophys-12', 'ga-geophys-13', 'ga-geophys-14', 'ga-geophys-15',
    'ga-geophys-16', 'ga-geophys-17', 'ga-geophys-18', 'ga-geophys-19'
  ],
  supportOpenInNewWindow: [
    'nvcl-v2-borehole',
    'nvcl-borehole',
    'mineral-tenements',
    'tima-geosample',
    'tima-shrimp-geosample',
    'mscl-borehole',
    'mscl-gssa-borehole',
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
  },
  // If a layer has time periods that can be queried via GetCapabilities, add it here
  queryGetCapabilitiesTimes: [
    'grace-mascons', 'aster-aloh', 'aster-ferrous', 'aster-opaque', 'aster-ferric-oxide-content',
    'aster-feoh', 'aster-ferric-oxide-comp', 'aster-group-index',
    'aster-quartz-index', 'aster-mgoh-content', 'aster-green-veg',
    'aster-ferr-carb', 'aster-mgoh-group-comp', 'aster-aloh-group-content',
    'aster-silica-content', 'ga-geophys-1', 'ga-geophys-2', 'ga-geophys-3', 'ga-geophys-4', 'ga-geophys-5',
    'ga-geophys-6', 'ga-geophys-7', 'ga-geophys-8', 'ga-geophys-9', 'ga-geophys-10',
    'ga-geophys-11', 'ga-geophys-12', 'ga-geophys-13', 'ga-geophys-14', 'ga-geophys-15',
    'ga-geophys-16', 'ga-geophys-17', 'ga-geophys-18', 'ga-geophys-19'
  ]
};
