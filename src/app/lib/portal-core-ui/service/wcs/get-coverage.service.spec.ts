import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GetCoverageService } from './get-coverage.service';
import { DescribeCoverageResponseSample } from './describeCoverageSample/DescribeCoverageResponseSample';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GetCoverageService', () => {
  let url = "https://gsky.nci.org.au/ows/aster?service=WCS&version=1.0.0&request=DescribeCoverage&coverage=AlOH_Group_Composition";
  let coverageName = "AlOH_Group_Composition";
 
  const expectedData = {
    data: [{
      description: ` 1. Band ratio: B5/B7 Blue is well ordered kaolinite, Al-rich muscovite/illite, paragonite, pyrophyllite Red is Al-poor (Si-rich) muscovite (phengite) useful for mapping: (1) exposed saprolite/saprock is often white mica or Al-smectite (warmer colours) whereas transported materials are often kaolin-rich (cooler colours); (2) clays developed over carbonates, especially Al-smectite (montmorillonite, beidellite) will produce middle to warmers colours. (2) stratigraphic mapping based on different clay-types; and (3) lithology-overprinting hydrothermal alteration, e.g. Si-rich and K-rich phengitic mica (warmer colours). Combine with Ferrous iron in MgOH and FeOH content products to look for evidence of overlapping/juxtaposed potassic metasomatism in ferromagnesian parents rocks (e.g. Archaean greenstone associated Au mineralisation) +/- associated distal propyllitic alteration (e.g. chlorite, amphibole). NCI Data Catalogue: https://dx.doi.org/10.25914/5f224f0797a66 `,
      name: "AlOH_Group_Composition",
      label: ` ASTER Map AlOH Group Composition `,
      supportedRequestCRSs: ["EPSG:4326"],
      supportedResponseCRSs: ["EPSG:4326"],
      supportedFormats: ["GeoTIFF", "NetCDF"],
      supportedInterpolations: ["none"],
      nativeCRSs: [],
      spatialDomain: {
        envelopes: [{
          srsName: "urn:ogc:def:crs:OGC:1.3:CRS84",
          type: "EnvelopeWithTimePeriod",
          southBoundLatitude: '-90.0',
          northBoundLatitude: '90.0',
          eastBoundLongitude: '180.0',
          westBoundLongitude: '-180.0',
          timePositionStart: "2012-06-01T00:00:00.000Z",
          timePositionEnd: "2012-06-01T00:00:00.000Z"
        }],
        rectifiedGrid: {
          srsName: "EPSG:4326",
          dimension: 2,
          envelopeLowValues: [0, 0],
          envelopeHighValues: [3999, 3999],
          origin: [-999.9875000000001, -1400.0125],
          offsetVectorVals: [[0.025, 0.0], [0.0, -0.025]],
          axisNamesStr: ["x", "y"]
        }
      },
      temporalDomain: [{
        timePosition: 1338508800000,
        type: "timePosition"
      }],
      rangeSet: {
        description: ` 1. Band ratio: B5/B7 Blue is well ordered kaolinite, Al-rich muscovite/illite, paragonite, pyrophyllite Red is Al-poor (Si-rich) muscovite (phengite) useful for mapping: (1) exposed saprolite/saprock is often white mica or Al-smectite (warmer colours) whereas transported materials are often kaolin-rich (cooler colours); (2) clays developed over carbonates, especially Al-smectite (montmorillonite, beidellite) will produce middle to warmers colours. (2) stratigraphic mapping based on different clay-types; and (3) lithology-overprinting hydrothermal alteration, e.g. Si-rich and K-rich phengitic mica (warmer colours). Combine with Ferrous iron in MgOH and FeOH content products to look for evidence of overlapping/juxtaposed potassic metasomatism in ferromagnesian parents rocks (e.g. Archaean greenstone associated Au mineralisation) +/- associated distal propyllitic alteration (e.g. chlorite, amphibole). NCI Data Catalogue: https://dx.doi.org/10.25914/5f224f0797a66 `,
        label: ` ASTER Map AlOH Group Composition `,
        name: "AlOH_Group_Composition",
        nullValues: [{
          type: "singleValue",
          value: "NaN"
        }],
        axisDescriptions: []
      }
    }],
    msg: "",
    success: true
  }
  let httpTestingController: HttpTestingController;
  let service: GetCoverageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [GetCoverageService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(GetCoverageService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('#testParser, the parser should return expected data', (done) => {
    service.testParser(DescribeCoverageResponseSample).subscribe(data => {
      expect(data).toEqual(expectedData);
      done();
    });
  });

  it('#getCoverage, should return expected data', (done) => {
    service.getCoverage(url, coverageName).subscribe(data => {
      expect(data).toEqual(expectedData);
      done();
    });
    const testRequest = httpTestingController.expectOne(url);
    expect(testRequest.request.method).toEqual('GET');
    testRequest.flush(DescribeCoverageResponseSample);
  });

  it('#getCoverage, should be OK returning no data', (done) => {
    service.getCoverage(url, coverageName).subscribe(data => {
      expect(data['data'].length).toEqual(0, 'should have empty data array');
      done();
    });
    const testRequest = httpTestingController.expectOne(url);
    expect(testRequest.request.method).toEqual('GET');
    testRequest.flush(null);
  });

});
