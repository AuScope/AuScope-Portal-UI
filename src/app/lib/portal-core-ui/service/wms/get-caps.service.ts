import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { SimpleXMLService } from '../../utility/simplexml.service';
import { throwError as observableThrowError, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GetCapsService {

  constructor(private http: HttpClient, @Inject('env') private env) { }

  /**
   * Namespace resolver for version 1.3 'GetCapabilities' document
   * 
   * @param string namespace prefix
   * @returns URL of namespace
   */
   private nsResolver(prefix: string) {
    switch(prefix) {
      case 'xsi':
        return "http://www.opengis.net/wms";
      case 'xlink':
        return "http://www.w3.org/1999/xlink";
      case 'mdb':
        return "http://standards.iso.org/iso/19115/-3/mdb/1.0";
      case 'srv':
        return "http://standards.iso.org/iso/19115/-3/srv/2.0";
      case 'cit':
        return "http://standards.iso.org/iso/19115/-3/cit/1.0";
      case 'gco':
        return "http://standards.iso.org/iso/19115/-3/gco/1.0";
    }
    return "http://www.opengis.net/wms";
  }

  /**
   * Function used to detect various implementations of WMS server
   * 
   * @param doc Document interface of GetCapabilities response
   * @param nsResolver namespace resolver function
   * @returns applicationProfile string
   */
  private findApplicationProfile(doc: Document, nsResolver: (prefix: string) => string): string {
    const SCHEMA_LOCATION = "string(/xsi:WMS_Capabilities/@*[local-name()='schemaLocation'])";
    const SERVICE_TITLE = "string(/xsi:WMS_Capabilities/xsi:Service/xsi:Title)";
    
    const schemaLocation = SimpleXMLService.evaluateXPathString(doc, doc, SCHEMA_LOCATION, nsResolver);
    if (schemaLocation.includes('http://www.esri.com/wms')) {
      return "Esri:ArcGIS Server";
    }
    if (schemaLocation.includes('http://mapserver.gis.umn.edu/mapserver')) {
      return "OSGeo:MapServer";
    }
    const serviceTitle = SimpleXMLService.evaluateXPathString(doc, doc, SERVICE_TITLE, nsResolver);
    if (serviceTitle.includes('GSKY')) {
      return "NCI:GSKY";
    }
    return "OSGeo:GeoServer";
  }

  /**
   * Extracts online resources from GetCapabilities response
   * 
   * @param doc Document interface of GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns an object with the following property names: 'url', 'type', 'name', 'description', 'version'
   */
  private getOnlineResElems(doc: Document, node: Node, nsResolver: (prefix: string) => string): any {
    const URL_GET = "/xsi:WMS_Capabilities/xsi:Capability/xsi:Request/xsi:GetMap/xsi:DCPType/xsi:HTTP/xsi:Get/xsi:OnlineResource/@*[local-name()='href']";
    const URL_POST = "/xsi:WMS_Capabilities/xsi:Capability/xsi:Request/xsi:GetMap/xsi:DCPType/xsi:HTTP/xsi:Post/xsi:OnlineResource/@*[local-name()='href']";
    const NAME = './xsi:Name';
    const DESCRIPTION = './xsi:Title';
    const VERSION = "/xsi:WMS_Capabilities/@*[local-name()='version']";
    const onlineResElems = {
      url: "",
      type: "WMS",
      name: "",
      description: "",
      version: "",
      applicationProfile: "",
      protocolRequest: ""
    };
    // Use GET URL if possible, try POST if not
    // NOTE: The code originally only used the GET URL, but getViaProxy uses POST, so we try this first.
    //       On servers that do not accept POST the call with fail (Method not allowed).
    let url = SimpleXMLService.evaluateXPathString(doc, doc, URL_POST, nsResolver);
    if (!url || url === '') {
      url = SimpleXMLService.evaluateXPathString(doc, doc, URL_GET, nsResolver);
    }
    onlineResElems['url'] = url;
    onlineResElems['name'] = SimpleXMLService.evaluateXPathString(doc, node, NAME, nsResolver);
    onlineResElems['description'] = SimpleXMLService.evaluateXPathString(doc, node, DESCRIPTION, nsResolver);
    onlineResElems['version'] = SimpleXMLService.evaluateXPathString(doc, doc, VERSION, nsResolver);
    return onlineResElems;
  }

  /**
   * Retrieves a bounding box from GetCapabilities response
   * 
   * @param doc Document interface of GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns object with the following properties: 'westBoundLongitude', 'eastBoundLongitude', 'southBoundLatitude', 'northBoundLatitude'
   */
  private getGeoElems(doc: Document, node: Node, nsResolver: (prefix: string) => string): any {
    const GEO_ELEMS = {
      'westBoundLongitude': 'string(./xsi:EX_GeographicBoundingBox/xsi:westBoundLongitude)',
      'eastBoundLongitude': 'string(./xsi:EX_GeographicBoundingBox/xsi:eastBoundLongitude)',
      'southBoundLatitude': 'string(./xsi:EX_GeographicBoundingBox/xsi:southBoundLatitude)',
      'northBoundLatitude': 'string(./xsi:EX_GeographicBoundingBox/xsi:northBoundLatitude)'
    };
    const geoElems = {
      type: "bbox",
      eastBoundLongitude: 0.0,
      westBoundLongitude: 0.0,
      northBoundLatitude: 0.0,
      southBoundLatitude: 0.0,
    };
    // Get bounding box from node if present, if not check parent if it exists and is a Layer
    if (SimpleXMLService.evaluateXPathNodeArray(doc, node, './xsi:EX_GeographicBoundingBox', nsResolver).length !== 0) {
      for (const xpath of Object.keys(GEO_ELEMS)) {
        const flt = parseFloat(SimpleXMLService.evaluateXPathString(doc, node, GEO_ELEMS[xpath], nsResolver));
        if (!isNaN(flt)) {
          geoElems[xpath] = flt;
        }
      }
    } else if(node.parentNode && node.parentNode.nodeName === 'Layer') {
      return this.getGeoElems(doc, node.parentNode, nsResolver);
    }
    return geoElems;
  }

  /**
   * Fetches a list of map formats from GetCapabilities response
   * 
   * @param doc Document interface of GetCapabilities response
   * @param node Node class representing a part of the GetCapabilities response
   * @param nsResolver namespace resolver function
   * @returns a list of map format strings
   */
  private getMapFormats(doc: Document, node: Node, nsResolver: (prefix: string) => string): any[] {
    const MAP_FORMATS = '/xsi:WMS_Capabilities/xsi:Capability/xsi:Request/xsi:GetMap/xsi:Format';
    const mapFormats = [];
    const mapFormatElems: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, MAP_FORMATS, nsResolver);
    for (const elem of mapFormatElems) {
        mapFormats.push(elem.textContent);
    }
    return mapFormats;
  }

  /**
   * Fetches a list of a coordinate reference systems (CRS) supported by a layer
   * 
   * @param doc DOM's Document interface
   * @param node Node class representing a part of the GetCapabilities response
   * @param nsResolver namespace resolver function
   * @param the current SRS array
   * @returns list of layer CRS strings
   */
  private getLayerSRS(doc: Document, node: Node, nsResolver: (prefix: string) => string, layerSRS: string[]): any[] {
    const LAYER_SRS = './xsi:CRS';
    const layerSRSElems: Element[] = SimpleXMLService.evaluateXPathNodeArray(doc, node, LAYER_SRS, nsResolver);
    for (const elem of layerSRSElems) {
      // Add SRS if not already present
      if (layerSRS.indexOf(elem.textContent) == -1) {
        layerSRS.push(elem.textContent);
      }
    }
    // If parent is a Layer recurse and add any extra CRS defined there
    if (node.parentNode && node.parentNode.nodeName === 'Layer') {
      return this.getLayerSRS(doc, node.parentNode, nsResolver, layerSRS);
    }
    return layerSRS;
  }

  /**
   * Constructs a CSWRecord for a layer from the GetCapabilities response
   * 
   * @param doc DOM's Document interface
   * @param node Node class representing a part of the GetCapabilities response
   * @param nsResolver namespace resolver function
   * @returns a CSWRecord object with these property names: 'name', 'id', 'description', 'adminArea', 'contactOrg'
   */
  private getCSWRecElems(doc: Document, node: Node, nsResolver: (prefix: string) => string): any {
    const CSW_REC = {
      'name': 'string(./xsi:Title)',
      'id': 'string(./xsi:Name)',
      'description': 'string(./xsi:Abstract)',
      'adminArea': 'string(/xsi:WMS_Capabilities/xsi:Service/xsi:ContactInformation/xsi:ContactAddress/xsi:StateOrProvince)',
      'contactOrg': 'string(/xsi:WMS_Capabilities/xsi:Service/xsi:ContactInformation/xsi:ContactPersonPrimary/xsi:ContactOrganization)'
    };
    const cswRecElems = {};
    for (const xpath of Object.keys(CSW_REC)) {
        cswRecElems[xpath] = SimpleXMLService.evaluateXPathString(doc, node, CSW_REC[xpath], nsResolver);
    }
    return cswRecElems;
  }

  /**
   * Find all the dimensions of a certain kind
   * 
   * @param doc Document interface
   * @param node Node class representing a part of the GetCapabilities response
   * @param nsResolver namespace resolver function
   * @param dimName name of dimension e.g. 'time' 'elevation' ...
   * @returns a list of dimensions or null if nothing found
   */
  private findDims(doc: Document, node: Node, nsResolver: (prefix: string) => string, dimName: string): any[] {
    const DIM = "string(./xsi:Dimension[@name='" + dimName + "'])";
    // Should contain a comma separated list of dimension values
    const dims = SimpleXMLService.evaluateXPathString(doc, node, DIM, nsResolver);
    const retDims = [];
    if (dims.length > 0) {
      for (const dim of dims.split(',')) {
        retDims.push(dim.trim());
      }
      return retDims;
    }
    // Recurse any parent(s) Layer for dimensions if not found here
    if (dims.length === 0 && node.parentNode && node.parentNode.nodeName === 'Layer') {
      return this.findDims(doc, node.parentNode, nsResolver, dimName);
    }
    return null;
  }

  /**
   * Function used to detect Access Constraints
   *
   * @param doc Document interface of GetCapabilities response
   * @param nsResolver namespace resolver function
   * @returns AccessConstraints string
   */
    private findAccessConstraints(doc: Document, nsResolver: (prefix: string) => string): string[] {
    const mapFormats = "string(/xsi:WMS_Capabilities/xsi:Service/xsi:AccessConstraints)";
    const accessConstraints = [];
    accessConstraints.push( SimpleXMLService.evaluateXPathString(doc, doc, mapFormats, nsResolver));
    return accessConstraints;
  }

  /**
   * Get a layer Node's metadata URL
   *
   * @param doc the root Document for the GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns the metadata URL for the layer
   */
  private getMetadataUrl(doc: Document, node: Node, nsResolver: (prefix: string) => string): string {
    const METADATA_URL = "./xsi:MetadataURL/xsi:OnlineResource/@*[local-name()='href']";
    return SimpleXMLService.evaluateXPathString(doc, node, METADATA_URL, nsResolver);
  }

  /**
   * Get a layer Node's legend URL
   *
   * @param doc the root Document for the GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns the legend URL for th elayer
   */
  private getLegendUrl(doc: Document, node: Node, nsResolver: (prefix: string) => string): string {
    const LEGEND_URL = "./xsi:LegendURL/xsi:OnlineResource/@*[local-name()='href']";
    return SimpleXMLService.evaluateXPathString(doc, node, LEGEND_URL, nsResolver);
  }

  /**
   * Get a layer Node's MinScaleDenominator
   *
   * @param doc the root Document for the GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns the MinScaleDenomintor for the layer, or null if not present
   */
  private getMinScaleDenominator(doc: Document, node: Node, nsResolver: (prefix: string) => string): number {
    let minScaleDenominator = null;
    const METADATA_URL = './xsi:MinScaleDenominator';
    const stringVal = SimpleXMLService.evaluateXPathString(doc, node, METADATA_URL, nsResolver);
    if (stringVal && stringVal !== '') {
      minScaleDenominator = parseFloat(stringVal);
    }
    return minScaleDenominator;
  }

  /**
   * Get a layer Node's MaxScaleDenominator
   *
   * @param doc the root Document for the GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns the MaxScaleDenomintor for the layer, or null if not present
   */
  private getMaxScaleDenominator(doc: Document, node: Node, nsResolver: (prefix: string) => string): number {
    let maxScaleDenominator = null;
    const METADATA_URL = './xsi:MaxScaleDenominator';
    const stringVal = SimpleXMLService.evaluateXPathString(doc, node, METADATA_URL, nsResolver);
    if (stringVal && stringVal !== '') {
      maxScaleDenominator = parseFloat(stringVal);
    }
    return maxScaleDenominator;
  }

  /**
   * Test if the layer should use a post request.
   * NOTE: In the future if we parse styles this should also factor in the request length
   *
   * @param doc the root Document for the GetCapabilities response
   * @param node the layer Node
   * @param nsResolver namespace resolver function
   * @returns true if the layer has no GET URL but does have a POST URL, false otherwise
   */
  private getUsePost(doc: Document, node: Node, nsResolver: (prefix: string) => string): boolean {
    const URL_GET = "/xsi:WMS_Capabilities/xsi:Capability/xsi:Request/xsi:GetMap/xsi:DCPType/xsi:HTTP/xsi:Get/xsi:OnlineResource/@*[local-name()='href']";
    const URL_POST = "/xsi:WMS_Capabilities/xsi:Capability/xsi:Request/xsi:GetMap/xsi:DCPType/xsi:HTTP/xsi:Post/xsi:OnlineResource/@*[local-name()='href']";
    let url = SimpleXMLService.evaluateXPathString(doc, doc, URL_GET, nsResolver);
    if (!url || url === '') {
      url = SimpleXMLService.evaluateXPathString(doc, doc, URL_POST, nsResolver);
      if (url && url !== '') {
        return true;
      }
    }
    return false;
  }

  /**
   * Build layer CSW records and capability records from a GetCapabilities response
   *
   * @param getCapsResponse the GetCapabilities response as a string
   * @returns a response of the form:
   *            {
   *              data: {
   *                cswRecords: [ <CSW_records> ],
   *                capabilityRecords: [ <capability_records> ],
   *                 invalidLayerCount: <invalid_layer_count>
   *              },
   *              message: {},
   *              success: 'true'
   *            }
   */
  public getLayersFromGetCapabilities(getCapsResponse: any): any {
    const rootNode = SimpleXMLService.parseStringToDOM(getCapsResponse);
    // Root layers are all layers with an attribute "queryable=1"
    const ROOT_LAYERS = '//xsi:Layer[@queryable=1]';
    const rootLayers: Element[] = SimpleXMLService.evaluateXPathNodeArray(rootNode, rootNode, ROOT_LAYERS, this.nsResolver);
    const mapFormats = this.getMapFormats(rootNode, rootNode, this.nsResolver);
    const applicationProfile = this.findApplicationProfile(rootNode, this.nsResolver);
    const accessConstraints = this.findAccessConstraints(rootNode, this.nsResolver);
    
    const retVal = { data: { cswRecords: [], capabilityRecords: [], invalidLayerCount: 0 }, msg: '', success: true, serviceUrl: '' };

    if (rootLayers.length == 0) {
      // check for the element "mdb:identificationInfo"
      const SERVICE_GET_CAP = '//mdb:identificationInfo/srv:SV_ServiceIdentification/srv:containsOperations/srv:SV_OperationMetadata/srv:connectPoint';
      const serviceCapsUrl = SimpleXMLService.evaluateXPathString(rootNode, rootNode, SERVICE_GET_CAP, this.nsResolver);

      retVal.serviceUrl = serviceCapsUrl;
    }

    for (let i = 0; i < rootLayers.length; i++) {
      const layerNode = rootLayers[i];
      const cswRecElems = this.getCSWRecElems(rootNode, layerNode, this.nsResolver);
      const onlineResElems = this.getOnlineResElems(rootNode, layerNode, this.nsResolver);

      onlineResElems['applicationProfile'] = applicationProfile;
      const geoElems = this.getGeoElems(rootNode, layerNode, this.nsResolver);
      const timeExtent = this.findDims(rootNode, layerNode, this.nsResolver, 'time');
      const layerSRS = this.getLayerSRS(rootNode, layerNode, this.nsResolver, []);
      const metadataUrl = this.getMetadataUrl(rootNode, layerNode, this.nsResolver);
      const legendUrl = this.getLegendUrl(rootNode, layerNode, this.nsResolver);

      // Only some layers will have Min/MaxScaleDenominators, these can affect if a layer will display at some zoom levels
      const minScaleDenominator = this.getMinScaleDenominator(rootNode, layerNode, this.nsResolver);
      const maxScaleDenominator = this.getMaxScaleDenominator(rootNode, layerNode, this.nsResolver);

      // One cswRecord object per layer
      retVal.data.cswRecords.push({
        name: cswRecElems['name'],
        resourceProvider: null,
        id: cswRecElems['id'],
        recordInfoUrl: null,
        description: cswRecElems['description'],
        noCache: false,
        service: false,
        adminArea: cswRecElems['adminArea'],
        contactOrg: cswRecElems['contactOrg'],
        onlineResources: [ onlineResElems ],
        geographicElements: [ geoElems ],
        descriptiveKeywords: [],
        datasetURIs: [],
        constraints: [],
        useLimitConstraints: [],
        childRecords: [],
        date: '',
        minScale: null,
        maxScale: null
      });

      // Only add one GetCapabilities object
      if (i === 0) {
        retVal.data.capabilityRecords = [{
          serviceType: 'wms',
          organisation: cswRecElems['contactOrg'],
          mapUrl: '',
          metadataUrl: metadataUrl,
          isWFS: false,
          isWMS: true,
          version: onlineResElems['version'],
          layers: [],
          layerSRS: layerSRS,
          mapFormats: mapFormats,
          applicationProfile: applicationProfile,
          accessConstraints:accessConstraints
        }];
      }

      // Add layers within our GetCapabilities object
      retVal.data.capabilityRecords[0].layers.push({
          name: onlineResElems['name'],
          title: onlineResElems['description'],
          abstract: cswRecElems['description'],
          metadataUrl: metadataUrl,
          legendUrl: legendUrl,
          timeExtent: timeExtent,
          bbox: geoElems,
          minScaleDenominator: minScaleDenominator,
          maxScaleDenominator: maxScaleDenominator
      });
    }
    return retVal;
  }

  /**
   * setup the http params and the url for a get capabilities call
   *
   * @param serviceUrl The URL that is to be to be proxied
   * @param from If 'from' is defined then use the proxy
   * @returns A params and url
   */
  public setupCaps(serviceUrl: string, from?: string): any {
    // GetCaps parameters
    let version = '1.3.0';

    // Check for existing parameters in the URL, we only care about version
    const paramIndex = serviceUrl.indexOf('?');
    if (paramIndex !== -1) {
      const urlParams = new URLSearchParams(serviceUrl.toLowerCase());
      const pVersion = urlParams.get('version');
      if (pVersion) {
        version = pVersion;
      }
      serviceUrl = serviceUrl.substring(0, paramIndex);
    }

    // Add in 'http:' if it is missing
    if (serviceUrl.indexOf('http') !== 0) {
      serviceUrl = 'http://' + serviceUrl;
    }
    // Get the urls that need proxy
    const urls = this.env.hasOwnProperty('urlNeedProxy') ? this.env.urlNeedProxy : [];
    // Find the index of \ in url
    let index = serviceUrl.indexOf('\/');
    for (let i = 0; i < 2; i++) {
      // Find the third \ in url
      index = serviceUrl.indexOf('\/', index + 1);
    }

    let httpParams = new HttpParams().append('version', version);

    // Cut the url from the third \ so we can compare it.
    const tempUrl = serviceUrl.substring(0, index);
    if (from) {
      // If 'from' is defined then use the proxy
      httpParams = httpParams.append('url', serviceUrl).append('usewhitelist', false);
      serviceUrl = this.env.portalBaseUrl + 'getWMSCapabilitiesViaProxy.do';
    } else if (urls.indexOf(tempUrl) !== -1) {
      // If the url is in the 'urlNeedProxy' list then add proxy
      httpParams = httpParams.append('url', serviceUrl).append('usewhitelist', true);
      serviceUrl = this.env.portalBaseUrl + 'getWMSCapabilitiesViaProxy.do';
    } else {
      httpParams = httpParams.append('request', 'GetCapabilities').append('service', 'WMS');
    }

    const retVal = { capsUrl: '', params: new HttpParams() };
    retVal.capsUrl = serviceUrl;
    retVal.params = httpParams;

    return retVal;
  }


  /**
   * Retrieve the CSW record located at the WMS serviceurl endpoint.
   * Currently only supports v1.3.0
   *
   * @param serviceUrl The URL that is to be to be proxied
   * @param from If 'from' is defined then use the proxy
   * @returns A layer with the retrieved cswrecord wrapped in a layer model.
   */
  public getCaps(serviceUrl: string, from?: string): Observable<any> {

    const settings = this.setupCaps(serviceUrl, from);
    let httpParams = settings.params;
    let capsUrl = settings.capsUrl;

    return this.http.get(capsUrl, { params: httpParams, responseType: 'text' }).pipe(switchMap(
      (response) => {

        let ret;
        ret = this.getLayersFromGetCapabilities(response);

        if (ret.serviceUrl !== '') {
          let innerCapsUrl = ret.serviceUrl;
          
          const settings = this.setupCaps(innerCapsUrl, from);
          let httpParams = settings.params;
          let capsUrl = settings.capsUrl;
          
          return this.http.get(capsUrl, { params: httpParams, responseType: 'text' }).pipe(
            map(response => {
              let retInner;
              retInner = this.getLayersFromGetCapabilities(response);
              return retInner;
            }), catchError(
                (error: HttpResponse<any>) => {
                  return observableThrowError(error);
                })
          );

        } else {
          return of(ret);
        }
      }), catchError(
        (error: HttpResponse<any>) => {
          return observableThrowError(error);
        })
    );
  }

}
