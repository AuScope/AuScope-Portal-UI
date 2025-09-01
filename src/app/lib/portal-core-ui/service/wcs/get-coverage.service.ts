import { SimpleXMLService } from './../../utility/simplexml.service';
import { UtilitiesService } from './../../utility/utilities.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from '../../utility/constants.service';

@Injectable({
  providedIn: 'root'
})
export class GetCoverageService {

  constructor(private http: HttpClient,
              @Inject('env') private env) { }

  /**
 * Test 
 * @Return a single <CoverageOffering> element from a WCS DescribeCoverage response.
 */
  public testParser(CoverageDescriptionTest3: any): Observable<any> {
    let response = of(CoverageDescriptionTest3);
    return response.pipe(map(
      (res) => {
        let result = this.parseCoverageRes(res);
        return result;
      }));
  }
  /**
   * Retrieve the wcs record located at the WMS serviceurl endpoint 
   * Currently only supports v1.0.0
   * @param serviceUrl URL of the WCS
   * @param coverageName name of coverage
   * @Return a single <CoverageOffering> element from a WCS DescribeCoverage response.
   */
  public getCoverage(serviceUrl: string, coverageName: string, useProxy: boolean): Observable<any> {

    // If the proxy needs to be used because of CORS, for example
    if (useProxy) {
      // Add in 'https:' if it is missing
      if (serviceUrl.indexOf("http") != 0) {
        serviceUrl = "https://" + serviceUrl;
      }

      let httpParams = new HttpParams()
          .set('request', "DescribeCoverage")
          .append('version', "1.0.0")
          .append('service', "WCS")
          .append('coverage', coverageName)
          .append('url', serviceUrl);

      // Use proxy to send 'DescribeCoverage' request
      serviceUrl = this.env.portalBaseUrl + Constants.PROXY_API;
      return this.http.post(serviceUrl, httpParams, 
          { responseType: 'text' }).pipe(map(
        (response) => {
          return this.parseCoverageRes(response);
        }));
    } else {
      // Use a GET request without a proxy, also GSKY does not accept POST requests
      serviceUrl = UtilitiesService.setUpdateParameter(serviceUrl, 'request', "DescribeCoverage");
      serviceUrl = UtilitiesService.setUpdateParameter(serviceUrl, 'version', "1.0.0");
      serviceUrl = UtilitiesService.setUpdateParameter(serviceUrl, 'service', "WCS");
      serviceUrl = UtilitiesService.setUpdateParameter(serviceUrl, 'coverage', coverageName);
  
      let httpParams = new HttpParams();
  
      // Add in 'https:' if it is missing
      if (serviceUrl.indexOf("http") != 0) {
        serviceUrl = "https://" + serviceUrl;
      }
      return this.http.get(serviceUrl, { params: httpParams, responseType: "text" }).pipe(map(
        (response) => {
          return this.parseCoverageRes(response);;
        }));  
    }
  }

  /**
   * Parse the response from a given XML <CoverageOffering> Node
   * Currently only supports v1.1.0
   * @param response URL of the WCS
   * @Return a single <CoverageOffering> element from a WCS DescribeCoverage response.
   */
  public parseCoverageRes(response: string) {
    let rootNode;
    let nodes: Node[];
    let node: Node;
    let MAP_FORMATS;
    rootNode = SimpleXMLService.parseStringToDOM(response);
    MAP_FORMATS = '/wcs:CoverageDescription/wcs:CoverageOffering';
    nodes = SimpleXMLService.evaluateXPathNodeArray(rootNode, rootNode, MAP_FORMATS, this.nsResolver);
    node = nodes[0];
    if (!node) {
      const retVal = { data: [], msg: "", success: false };
      return retVal;
    }
    else {
      const wcsRecElems = this.getWCSRecElems(rootNode, node, this.nsResolver);
      const { supportedRequestCRSs, supportedResponseCRSs } = this.getSupportedReqRes(rootNode, node, this.nsResolver);

      MAP_FORMATS = 'wcs:supportedFormats/wcs:formats';
      const supportedFormats = this.getNodeArray(rootNode, node, this.nsResolver, MAP_FORMATS);

      MAP_FORMATS = 'wcs:supportedInterpolations/wcs:interpolationMethod';
      const supportedInterpolations = this.getNodeArray(rootNode, node, this.nsResolver, MAP_FORMATS);

      MAP_FORMATS = 'wcs:supportedCRSs/wcs:nativeCRSs';
      const nativeCRSs = this.getNodeArray(rootNode, node, this.nsResolver, MAP_FORMATS);

      MAP_FORMATS = 'wcs:domainSet/wcs:spatialDomain';
      const spatialDomainNode = SimpleXMLService.evaluateXPathNodeArray(rootNode, node, MAP_FORMATS, this.nsResolver);
      const spatialDomain = this.getSpatialDomain(rootNode, spatialDomainNode[0], this.nsResolver);

      const temporalDomain = this.getTemporalDomain(rootNode, node, this.nsResolver);
      const rangeSet = this.getRangeSet(rootNode, node, this.nsResolver);

      const retVal = { data: [], msg: "", success: true };
      retVal.data.push({
        description: wcsRecElems["description"],
        label: wcsRecElems["label"],
        name: wcsRecElems["name"],
        supportedRequestCRSs: supportedRequestCRSs,
        supportedResponseCRSs: supportedResponseCRSs,
        supportedFormats: supportedFormats,
        supportedInterpolations: supportedInterpolations,
        nativeCRSs: nativeCRSs,
        spatialDomain: spatialDomain,
        temporalDomain: temporalDomain,
        rangeSet: rangeSet
      });
      return retVal;
    }
  }

  /**
   * Represents the namespace context of a generic WCS response to a DescribeCoverage request.
   * 
   * @param string namespace prefix
   * @returns URL of namespace
   */
  private nsResolver(prefix: any) {
    switch (prefix) {
      case 'wcs':
        return "http://www.opengis.net/wcs";
      case "gml":
        return "http://www.opengis.net/gml";
      case "xlink":
        return "http://www.w3.org/1999/xlink";
      case "ows":
        return "http://www.opengis.net/ows";
    }
    return "http://www.opengis.net/wcs";
  }

  /**
   * Constructs a  WCSRecord from the DescribeCoverage response
   * 
   * @param doc DOM's Document interface
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns a WCSRecord object with these property names: 'name', 'label', 'description'
   */
  private getWCSRecElems(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    const wcs_REC = {
      'name': 'wcs:name',
      'label': 'wcs:label',
      'description': 'wcs:description',
    };
    const wcsRecElems = {};
    for (const xpath of Object.keys(wcs_REC)) {
      wcsRecElems[xpath] = SimpleXMLService.evaluateXPathString(doc, node, wcs_REC[xpath], nsResolver);
    }
    return wcsRecElems;
  }

  /**
   * Fetches a list of <requestResponseCRSs> or a list of <requestCRSs> and <responseCRSs> from DescribeCoverage response
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns a list of supported Request and Respond CRSs
  */
  private getSupportedReqRes(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let MAP_FORMATS = 'wcs:supportedCRSs/wcs:requestResponseCRSs';
    let tempNodeList: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let supportedRequestCRSs = [];
    let supportedResponseCRSs = [];

    if (tempNodeList.length > 0) {
      tempNodeList.forEach(elem => {
        supportedRequestCRSs.push(elem.textContent);
        supportedResponseCRSs.push(elem.textContent);
      })
    } else {
      MAP_FORMATS = 'wcs:supportedCRSs/wcs:requestCRSs';
      tempNodeList = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
      tempNodeList.forEach(elem => supportedRequestCRSs.push(elem.textContent));
      MAP_FORMATS = 'wcs:supportedCRSs/wcs:responseCRSs';
      tempNodeList = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
      tempNodeList.forEach(elem => supportedResponseCRSs.push(elem.textContent))
    }
    return { supportedRequestCRSs, supportedResponseCRSs };
  }

  /**
   * Fetches a list of maped array from DescribeCoverage response
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @param MAP_FORMATS 
   * @returns a list of maped array
   */
  private getNodeArray(doc: Document, node: Node, nsResolver: (prefix: string) => string, MAP_FORMATS: string) {
    let tempNodeList: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let nodeArray = [];
    tempNodeList.forEach(elem => nodeArray.push(elem.textContent));
    return nodeArray;
  }

  /**
   * Parse the spatial domain (only grab gml:Envelopes and wcs:EnvelopeWithTimePeriod
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns  spatial domain object
   */
  private getSpatialDomain(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let MAP_FORMATS = 'wcs:Envelope ' +
      '| gml:Envelope ' +
      '| gml:EnvelopeWithTimePeriod';

    let tempNodeList: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);

    let envelopes = [];
    tempNodeList.forEach(elem => envelopes.push(this.simpleEnvelope(doc, elem, nsResolver)));

    MAP_FORMATS = 'gml:RectifiedGrid';
    let gridNode = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let rectifiedGrid = (gridNode != null) ? this.rectifiedGrid(doc, gridNode[0], nsResolver) : {};

    return { envelopes, rectifiedGrid };
  }

  /**
   * Parse the XML in 'node' and create a 'SimpleEnvelope' object
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node can be one of: 'wcs:Envelope' or 'gml:Envelope' or 'gml:EnvelopeWithTimePeriod'
   * @param nsResolver namespace resolver function
   * @returns SimpleEnvelope object
  */
  public simpleEnvelope(doc: Document, node: Node, nsResolver: (prefix: string) => string) {

    let retVal = {
      eastBoundLongitude: null,
      southBoundLatitude: null,
      westBoundLongitude: null,
      northBoundLatitude: null,
      timePositionStart: null,
      timePositionEnd: null,
      srsName: null,
      type: null
    };

    let MAP_FORMATS = 'gml:pos';

    let tempNodeList: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    if (tempNodeList.length != 2) {
      console.log("does not have two gml:pos nodes");
      return retVal;
    }
    tempNodeList[0]
    let southWestPoints = tempNodeList[0].textContent.split(" ");
    let northEastPoints = tempNodeList[1].textContent.split(" ");
    if (southWestPoints.length < 2 || northEastPoints.length < 2) {
      console.log("wcs:lonLatEnvelope gml:pos elements don't contain enough Lon/Lat pairs");
      return retVal;
    }

    let eastBoundLongitude = northEastPoints[0];
    let southBoundLatitude = southWestPoints[1];
    let westBoundLongitude = southWestPoints[0];
    let northBoundLatitude = northEastPoints[1];

    //Get our SRS name (can be null)
    let srsName = SimpleXMLService.evaluateXPathString(doc, node, "@srsName", nsResolver);

    let type = SimpleXMLService.getNodeLocalName(node);
    let timePositionStart;
    let timePositionEnd;
    // Parse any time position nodes if parent was "gml:EnvelopeWithTimePeriod"
    if (type == "EnvelopeWithTimePeriod") {
      tempNodeList = SimpleXMLService.evaluateXPathNodeArray(doc, node, "gml:timePosition", nsResolver);
      if (tempNodeList.length != 2) {
        console.log(`does not have 2 gml:timePosition nodes in ${SimpleXMLService.getNodeLocalName(node)}`);
        return retVal;
      }
      timePositionStart = tempNodeList[0].textContent;
      timePositionEnd = tempNodeList[1].textContent;
    }
    retVal = {
      eastBoundLongitude: eastBoundLongitude,
      southBoundLatitude: southBoundLatitude,
      westBoundLongitude: westBoundLongitude,
      northBoundLatitude: northBoundLatitude,
      timePositionStart: timePositionStart,
      timePositionEnd: timePositionEnd,
      srsName: srsName,
      type: type
    };
    return retVal;
  }

  /**
   * Creates a rectifiedGrid from a DOM node representing a gml:RectifiedGrid element
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node can be one of: 'wcs:Envelope' or 'gml:Envelope' or 'gml:EnvelopeWithTimePeriod'
   * @param nsResolver namespace resolver function
   * @returns rectifiedGrid object
   */


  public rectifiedGrid(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let rectifiedGrid = {};

    const srsName = SimpleXMLService.evaluateXPathString(doc, node, "@srsName", nsResolver);
    const dimensionStr = SimpleXMLService.evaluateXPathString(doc, node, "@dimension", nsResolver);
    const dimension = parseInt(dimensionStr, 10);
    if (isNaN(dimension)) {
      console.log(`Unable to parse dimension ${dimensionStr} to int`);
    }
    const envelopeLowValuesStr = SimpleXMLService.evaluateXPathString(doc, node, "gml:limits/gml:GridEnvelope/gml:low", nsResolver);
    const envelopeHighValuesStr = SimpleXMLService.evaluateXPathString(doc, node, "gml:limits/gml:GridEnvelope/gml:high", nsResolver);

    const envelopeLowValues: number[] = UtilitiesService.stringToIntVector(envelopeLowValuesStr, ' ');
    const envelopeHighValues: number[] = UtilitiesService.stringToIntVector(envelopeHighValuesStr, ' ');

    const originValues = SimpleXMLService.evaluateXPathString(doc, node, "gml:origin/gml:pos", nsResolver);
    const origin: number[] = UtilitiesService.stringToFloatVector(originValues, ' ');

    const offsetVectorNodes: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, "gml:offsetVector", nsResolver);
    const offsetVectorVals = [];
    for (const elem of offsetVectorNodes) {
      offsetVectorVals.push(UtilitiesService.stringToFloatVector(elem.textContent, ' '))
    }

    const axisNameNodes: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, "gml:axisName", nsResolver);
    const axisNamesStr = [];
    for (const elem of axisNameNodes) {
      axisNamesStr.push(elem.textContent)
    }

    rectifiedGrid = {
      srsName: srsName,
      dimension: dimension,
      envelopeLowValues: envelopeLowValues,
      envelopeHighValues: envelopeHighValues,
      origin: origin,
      offsetVectorVals: offsetVectorVals,
      axisNamesStr: axisNamesStr
    };
    return rectifiedGrid;
  }

  /**
  * Get the temporal range (which is optional)
  * 
  * @param doc Document interface of DescribeCoverage response
  * @param node Node class representing a part of the DescribeCoverage response
  * @param nsResolver namespace resolver function
  * @returns Get the temporal range
  */
  private getTemporalDomain(doc: Document, node: Node, nsResolver: (prefix: string) => string) {

    let MAP_FORMATS = 'wcs:domainSet/wcs:temporalDomain';
    let tempNode = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let temporalDomain = [];
    if (tempNode != null && tempNode.length > 0) {
      MAP_FORMATS = 'wcs:domainSet/wcs:temporalDomain/*';
      let tempNodeList = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
      tempNodeList.forEach(elem => {
        let name = SimpleXMLService.getNodeLocalName(elem);
        if (name == "timePosition") {
          temporalDomain.push(this.simpleTimePosition(elem, nsResolver));
        } else if (name == "timePeriod") {
          temporalDomain.push(this.simpleTimePeriod(doc, elem, nsResolver));
        } else {
          console.log("Unable to parse " + SimpleXMLService.getNodeLocalName(node));
        }
      })
    }
    return temporalDomain;
  }

  /**
   * Create a simplified instance of the <gml:timePosition> element from a
   * WCS DescribeCoverage or GetCapabilities response * 
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns Get the timePosition
   */

  private simpleTimePosition(node: Node, nsResolver: (prefix: string) => string) {
    let timePosition = Date.parse(node.textContent)
    return {
      timePosition: timePosition,
      type: SimpleXMLService.getNodeLocalName(node)
    };
  }

  /**
   * Create a simplified instance of the <gml:timePeriod> element from a
   * WCS DescribeCoverage or GetCapabilities response * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns Get the timePeriod
   */
  private simpleTimePeriod(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let beginPositionNode = SimpleXMLService.evaluateXPathString(doc, node, "beginPosition", nsResolver);
    let endPositionNode = SimpleXMLService.evaluateXPathString(doc, node, "endPosition", nsResolver);

    let beginPosition = Date.parse(beginPositionNode);
    let endPosition = Date.parse(endPositionNode);
    let type = SimpleXMLService.getNodeLocalName(node);

    return {
      beginPosition: beginPosition,
      endPosition: endPosition,
      type: type
    }
  }

  /**
   * Fetches a RangeSetImpl instance from DescribeCoverage response
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns RangeSetImpl instance
  */
  private getRangeSet(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let MAP_FORMATS = 'wcs:rangeSet/wcs:RangeSet/wcs:description';
    let tempNode: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let description;
    if (tempNode != null && tempNode.length > 0) {
      description = SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver);
    }

    MAP_FORMATS = 'wcs:rangeSet/wcs:RangeSet/wcs:name';
    let name = SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver);

    MAP_FORMATS = 'wcs:rangeSet/wcs:RangeSet/wcs:label';
    let label = SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver);

    let axisDescriptions = [];
    MAP_FORMATS = 'wcs:rangeSet/wcs:RangeSet/wcs:axisDescription/wcs:AxisDescription';
    let tempNodeList: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    tempNodeList.forEach(elem => {
      axisDescriptions.push(this.axisDescriptionImpl(doc, elem, nsResolver));
    });

    let nullValues = [];
    MAP_FORMATS = 'wcs:rangeSet/wcs:RangeSet/wcs:nullValues/wcs:*';
    tempNodeList = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    tempNodeList.forEach(elem => {
      nullValues.push(this.valueEnumTypeFactory(doc, elem, nsResolver));
    });

    return {
      description: description,
      name: name,
      label: label,
      axisDescriptions: axisDescriptions,
      nullValues: nullValues
    }
  }

  /**
   * Fetches a simple (partial) implementation of the entire AxisDescription (Doesn't parse attributes)
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns AxisDescription
  */
  private axisDescriptionImpl(doc: Document, node: Node, nsResolver: (prefix: string) => string) {

    let MAP_FORMATS = 'wcs:description';
    let tempNode: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let description: string;
    if (tempNode != null && tempNode.length > 0) {
      description = SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver);
    }

    MAP_FORMATS = 'wcs:name';
    let name = SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver);

    MAP_FORMATS = 'wcs:label';
    let label = SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver);

    let values = [];
    MAP_FORMATS = 'wcs:values/wcs:*';
    let tempNodeList: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    tempNodeList.forEach(elem => {
      values.push(this.valueEnumTypeFactory(doc, elem, nsResolver));
    });

    return {
      description: description,
      name: name,
      label: label,
      values: values
    }
  }

  /**
   * Fetches a RangeSetImpl instance from DescribeCoverage response
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns RangeSetImpl instance
  */
  private valueEnumTypeFactory(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let name = SimpleXMLService.getNodeLocalName(node);
    if (name == "singleValue") {
      return {
        type: name,
        value: node.textContent,
      };
    } else if (name == "interval") {
      return this.getInterval(doc, node, nsResolver);
    } else {
      console.log("Unable to parse" + name);
    }
  }

  /**
   * Fetches a <wcs:interval> element from a WCS DescribeCoverage response
   * 
   * @param doc Document interface of DescribeCoverage response
   * @param node Node class representing a part of the DescribeCoverage response
   * @param nsResolver namespace resolver function
   * @returns <wcs:interval> element
  */
  private getInterval(doc: Document, node: Node, nsResolver: (prefix: string) => string) {
    let type = SimpleXMLService.getNodeLocalName(node);

    let MAP_FORMATS = 'wcs:min';
    let tempNode: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let min: number;
    if (tempNode != null && tempNode.length > 0) {
      min = parseFloat(SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver));
    }

    MAP_FORMATS = 'wcs:max';
    tempNode = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let max: number;
    if (tempNode != null && tempNode.length > 0) {
      max = parseFloat(SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver));
    }

    MAP_FORMATS = 'wcs:resolution';
    tempNode = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    let resolution: number;
    if (tempNode != null && tempNode.length > 0) {
      resolution = parseFloat(SimpleXMLService.evaluateXPathString(doc, node, MAP_FORMATS, nsResolver));
    }

    return {
      type: type,
      min: min,
      max: max,
      resolution: resolution
    }
  }
}
