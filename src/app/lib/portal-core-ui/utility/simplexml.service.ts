import { Injectable } from '@angular/core';

import { Constants } from './constants.service';
import { UtilitiesService } from './utilities.service';

declare let XPath: any;
declare let ActiveXObject: any;
declare let window: any;

/**
 * Port over from old portal-core extjs for dealing with xml in wfs.
 * Also contains some SLD_BODY XML parsing and manipulation.
 */

// @dynamic
@Injectable()
export class SimpleXMLService {

  // Constants
  public static XML_NODE = {
    XML_NODE_ELEMENT: 1,
    XML_NODE_ATTRIBUTE: 2,
    XML_NODE_TEXT: 3
  };

  // Public Static functions

  /**
   * Searches and retrieves a string value
   *
   * @method evaluateXPathString
   * @param document Document interface
   * @param domNode Node class, defines where to start looking
   * @param xPath XPATH string, defines what to look for
   * @param nsResolver [Optional] namespace resolver function
   * @returns string value
   */
  public static evaluateXPathString(document: Document, domNode: Node, xPath: string, nsResolver?: (prefix: string) => string): string {
    const xpathResult = this.evaluateXPath(document, domNode, xPath, Constants.XPATH_STRING_TYPE, nsResolver);
    return xpathResult.stringValue;
  }


  /**
   * A wrapper around the DOM defined Document.evaluate function
   * Because not every browser supports document.evaluate we need to have a pure javascript
   * backup in place
   *
   * @method evaluateXPath
   * @param document - Document interface
   * @param domNode - Node class, defines where to start looking
   * @param xPath - XPATH string, defines what to look for
   * @param resultType - https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate#Result_types
   * @param nsResolver [Optional] namespace resolver function
   * @return dom - the dom result
   */
  public static evaluateXPath(document: Document, domNode: Node, xPath: string, resultType: any,
                              nsResolver?: (prefix: string) => string): any {
    if (document.evaluate) {
      let result;
      try {
        if (typeof nsResolver === 'undefined') {
            result = document.evaluate(xPath, domNode, document.createNSResolver(domNode), resultType, null);
        } else {
            result = document.evaluate(xPath, domNode, nsResolver, resultType, null);
        }
        return result;
      } catch (e) {
        console.error('SimpleXMLService.evaluateXPath() Exception', e);
        // Return empty result
        switch (resultType) {
          case Constants.XPATH_STRING_TYPE:
            return {
              stringValue: ''
            };
          case Constants.XPATH_UNORDERED_NODE_ITERATOR_TYPE:
            return {
              _arr: [],
              _i: 0,
              iterateNext: function () {
                return null;
              }
            };
          default:
            throw new Error('Unrecognised resultType');
        }
      }

    } else {
      // This gets us a list of dom nodes
      let matchingNodeArray = XPath.selectNodes(xPath, domNode);
      if (!matchingNodeArray) {
        matchingNodeArray = [];
      }

      // we need to turn that into an XPathResult object (or an emulation of one)
      switch (resultType) {
        case Constants.XPATH_STRING_TYPE:
          let stringValue = null;
          if (matchingNodeArray.length > 0) {
            stringValue = this.getNodeTextContent(matchingNodeArray[0]);
          }
          return {
            stringValue: stringValue
          };
        case Constants.XPATH_UNORDERED_NODE_ITERATOR_TYPE:
          return {
            _arr: matchingNodeArray,
            _i: 0,
            iterateNext: function () {
              if (this._i >= this._arr.length) {
                return null;
              } else {
                return this._arr[this._i++];
              }
            }
          };

      }

      throw new Error('Unrecognised resultType');
    }
  }

  /**
   * Evaluates an XPath which will return an array of W3C DOM nodes
   *
   * @method evaluateXPathNodeArray
   * @param domNode - Node class, defines where to start looking
   * @param xPath - XPATH string, defines what to look for
   * @param nsResolver [Optional] namespace resolver function
   * @return dom - the dom result
   */
  public static evaluateXPathNodeArray(document: Document, domNode: Node, xPath: string, nsResolver?: (prefix: string) => string): any {
    let xpathResult = null;
    try {
      xpathResult = this.evaluateXPath(document, domNode, xPath, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, nsResolver);
    } catch (err) {
      return [];
    }
    const matchingNodes = [];
    let matchingNode;
    while (matchingNode = xpathResult.iterateNext()) {
      matchingNodes.push(matchingNode);
    }
    return matchingNodes;
  }

  /**
   * Utility for retrieving a W3C DOM Node 'localName' attribute across browsers.
   * The localName is the node name without any namespace prefixes
   *
   * @method getNodeLocalName
   * @param domNode - Node class, defines where to start looking
   * @return String - local name of the node or empty string upon error
   */
  public static getNodeLocalName(domNode: any): string {
    if (domNode) {
      return domNode.localName ? domNode.localName : domNode.baseName;
    }
    return '';
  }

  /**
   * Returns the set of classes this node belongs to as an array of strings
   *
   * @method getClassList
   * @param domNode - Node class, defines where to start looking
   * @return dom - the dom result
   */
  public static getClassList(domNode: any): any {
    if (domNode.classList) {
      return domNode.classList;
    } else if (domNode['class']) {
      return domNode['class'].split(' ');
    } else if (domNode.className) {
      return domNode.className.split(' ');
    }
    return [];
  }

  /**
   * Figure out if domNode is a leaf or not
   * (Leaves have no nodes from XML_NODE_ELEMENT)
   *
   * @method isLeafNode
   * @param domNode - Node class, defines where to start looking
   * @return boolean - is leaf or not
   */
  public static isLeafNode(domNode: any): boolean {
    let isLeaf = true;
    if (domNode && domNode.childNodes) {
      for (let i = 0; i < domNode.childNodes.length && isLeaf; i++) {
        isLeaf = domNode.childNodes[i].nodeType !== this.XML_NODE.XML_NODE_ELEMENT;
      }
    }
    return isLeaf;
  }

  /**
   * Filters an array of DOM Nodes according to the specified parameters
   * @method filterNodeArray
   * @param nodeArray An Array of DOM Nodes
   * @param nodeType An integer node type
   * @param namespaceUri String to compare against node namespaceURI
   * @param nodeName String to compare against the node localName
   * @return dom - return the result in a dom
   */
  public static filterNodeArray(nodeArray: any, nodeType: number, namespaceUri: string, nodeName: string): any {
    const matchingNodes = [];
    for (let i = 0; i < nodeArray.length; i++) {
      const node = nodeArray[i];

      if (nodeType && node.nodeType !== nodeType) {
        continue;
      }
      if (namespaceUri && namespaceUri !== node.namespaceURI) {
        continue;
      }
      if (nodeName && nodeName !== this.getNodeLocalName(node)) {
        continue;
      }
      matchingNodes.push(node);
    }
    return matchingNodes;
  }

  /**
   * Gets all children of domNode as an Array that match the specified filter parameters
   * @method getMatchingChildNodes
   * @param domNode - Node class, defines where to start looking
   * @param childNamespaceURI [Optional] The URI to lookup as a String
   * @param childNodeName [Optional] The node name to lookup as a String
   * @return dom - return the result in a dom
   */
  public static getMatchingChildNodes(domNode: any, childNamespaceURI?: string, childNodeName?: string): any {
    return this.filterNodeArray(domNode.childNodes, this.XML_NODE.XML_NODE_ELEMENT, childNamespaceURI, childNodeName);
  }

  /**
   * Gets all Attributes of domNode as an Array that match the specified filter parameters
   * @method getMatchingAttributes
   * @param domNode - Node class, defines where to start looking
   * @param childNamespaceURI [Optional] The URI to lookup as a String
   * @param childNodeName [Optional] The node name to lookup as a String
   * @return dom - return the result in a dom or null upon error
   */
  public static getMatchingAttributes(domNode: any, attributeNamespaceURI?: string, attributeName?: string): any {
    // VT: cannot find the _fitlerNodeArray, suspect bug
    // return this._filterNodeArray(domNode.attributes, XML_NODE_ATTRIBUTE, attributeNamespaceURI, attributeName);
    if (domNode.attributes) {
      return this.filterNodeArray(domNode.attributes, this.XML_NODE.XML_NODE_ATTRIBUTE, attributeNamespaceURI, attributeName);
    }
    return null;
  }

  /**
   * Given a DOM node, return its text content (however the browser defines it)
   *
   * @method getNodeTextContent
   * @param domNode - Node class, defines where to start looking
   * @return string - text content
   */
  public static getNodeTextContent(domNode: any): string {
    if (domNode) {
      return domNode.textContent ? domNode.textContent : domNode.text;
    }
    return '';
  }

  /**
   * Given a DOM node, return its text content (however the browser defines it)
   *
   * @method getNodeTextContent
   * @param domNode - Node class, defines where to start looking
   * @return string - text content
   */
  public static getNodeInnerHTML(domNode: any): string {
    if (domNode) {
      return domNode.innerHTML;
    }
    return '';
  }

  /**
   * Parse string to DOM
   *
   * @method parseStringToDOM
   * @param xmlString - xml string
   * @return dom - return the result in a dom
   */
  public static parseStringToDOM(xmlString: string): Document {
    const isIE11 = !!navigator.userAgent.match(/Trident.*rv[ :]*11\./);
    // Load our xml string into DOM
    let xmlDocument = null;
    if (window.DOMParser) {
      // browser supports DOMParser
      const parser = new DOMParser();
      xmlDocument = parser.parseFromString(xmlString, 'text/xml');
    } else if (window.ActiveXObject) {
      // IE
      xmlDocument = new ActiveXObject('Microsoft.XMLDOM');
      xmlDocument.async = 'false';
      xmlDocument.loadXML(xmlString);
    } else {
      return null;
    }
    this.removeEmptyNodes(xmlDocument);
    return xmlDocument;
  }

  /**
   * Cleanup empty text nodes.
   *
   * @method removeEmptyNodes
   * @param node - Node class, defines where to start cleaning
   */
  public static removeEmptyNodes(node: Node) {
    if (node.nodeType === SimpleXMLService.XML_NODE.XML_NODE_TEXT && node.nodeName === '#text' && node.nodeValue.trim().length === 0) {
        node.parentNode.removeChild(node);
    } else {
        for (let i = node.childNodes.length - 1 ; i >= 0; i--) {
          this.removeEmptyNodes(node.childNodes.item(i));
        }
    }
  }

  /**
   * Parses XML document fetching feature information
   *
   * @param rootNode XML document root node
   * @param feature feature information
   * @returns list of objects, property values are: 'key', 'layer', 'onlineResource', 'value', 'format'
   */
  public static parseTreeCollection(rootNode: Document, feature: any): any[] {
    const docs: any[] = [];
    if (rootNode) {
      let features = null;
      const wfsFeatureCollection = SimpleXMLService.getMatchingChildNodes(rootNode, null, 'FeatureCollection');
      if (UtilitiesService.isEmpty(wfsFeatureCollection)) {
        // Check for error reports - some WMS servers mark their error reports with <ServiceExceptionReport>, some with <html>
        const exceptionNode = SimpleXMLService.getMatchingChildNodes(rootNode, null, 'ServiceExceptionReport');
        const serviceErrorNode = SimpleXMLService.evaluateXPath(rootNode, rootNode, 'html', Constants.XPATH_UNORDERED_NODE_ITERATOR_TYPE);
        const nextNode = serviceErrorNode.iterateNext();
        if (!UtilitiesService.isEmpty(exceptionNode) || nextNode != null) {
          // There is an error report from the server;
          docs.push({
            key: 'Server Error - ' + feature.onlineResource.url,
            layer: feature.layer,
            onlineResource: feature.onlineResource,
            value: (document.createTextNode('Sorry - server has returned an error message. See browser console for more information')),
            format: 'XML'
          });
          return docs;
        }
        const featureInfoNode = SimpleXMLService.getMatchingChildNodes(rootNode, null, 'FeatureInfoResponse');
        if (UtilitiesService.isEmpty(featureInfoNode)) {
          // Assume the node to be a feature node.
          features = [rootNode];
        } else {
          // 'text/xml'
          const fieldNodes = SimpleXMLService.getMatchingChildNodes(featureInfoNode[0], null, 'FIELDS');
          if (UtilitiesService.isEmpty(fieldNodes)) {
            features = featureInfoNode;
            // Skip the empty tenement feature from esri server.
            if (featureInfoNode[0] !== null && featureInfoNode[0].outerHTML.indexOf('esri_wms=\"http://www.esri.com/wms\"') >= 0) {
              features = null;
            }
          } else {
            features = fieldNodes;
            for (let i = 0; i < features.length; i++) {
              let name = features[i].getAttribute('identifier');
              if (!name) {
                name = features[i].getAttribute('OBJECTID');
                if (!name) {
                  name = feature.onlineResource.name;
                }
              }
              // QLD Mineral Tenements ArcGIS has "Null" identifier, use name instead
              if (name == "Null") {
                name = features[i].getAttribute('name');
              }
              if (name.indexOf('http://') === 0) {
                name = name.substring(name.lastIndexOf('/') + 1, name.length);
              }
              docs.push({
                key: name,
                layer: feature.layer,
                onlineResource: feature.onlineResource,
                value: features[i],
                format: 'XML'
              });
            }
            return docs;
          }
        }
      } else {
        let featureMembers = SimpleXMLService.getMatchingChildNodes(wfsFeatureCollection[0], null, 'featureMembers');
        if (UtilitiesService.isEmpty(featureMembers)) {
          featureMembers = SimpleXMLService.getMatchingChildNodes(wfsFeatureCollection[0], null, 'featureMember');
          features = featureMembers;
        } else {
          features = featureMembers[0].childNodes;
        }
      }
      if (features) {
        for (const featureNode of features) {
          // VT: We will try get the name either via gml:id, gml:name or fid
          let name = featureNode.getAttribute('gml:id');
          if (UtilitiesService.isEmpty(name)) {
            name = SimpleXMLService.evaluateXPath(rootNode, featureNode, 'gml:name', Constants.XPATH_STRING_TYPE).stringValue;
            if (UtilitiesService.isEmpty(name)) {
              // VT: geological province Is there a better way to do this? If this gets tiresome, we will default it to just using name
              if (featureNode.childNodes !== undefined &&
                featureNode.childNodes[0] !== undefined &&
                featureNode.childNodes[0].hasOwnProperty('getAttribute')) {
                name = featureNode.childNodes[0].getAttribute('fid');
              }
              if (UtilitiesService.isEmpty(name)) {
                name = feature.onlineResource.name + '.' + Math.floor(Math.random() * 60) + 1;
              }
            }
          }
          if (typeof name === 'string' && name.length > 0) {
            docs.push({
              key: name,
              layer: feature.layer,
              onlineResource: feature.onlineResource,
              value: featureNode,
              format: 'XML'
            });
          }
        }
      }
    }

    return docs;
  }

  /**
   * Extract all ogc:Intersects filters from an SLD_BODY string
   *
   * @param sldBody the SLD_BODY as a string
   * @returns the SLD_BODY with all ogc:Intersects filters removed
   */
  public static extractIntersectsFiltersFromSld(sldBody: string): string {
    let newSldBody = sldBody;
    try {
      const sldParser = new DOMParser();
      const sldDoc = sldParser.parseFromString(sldBody, 'text/xml');

      // Intersects will be inside Filters...
      const filterNodes = sldDoc.evaluate('//ogc:Filter', sldDoc, SimpleXMLService.namespaceResolver,
                                          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let f = 0; f < filterNodes.snapshotLength; f++) {
        const currentFilterNode = filterNodes.snapshotItem(f);
        const childFilters = SimpleXMLService.getAllNonOgcAndChildNodes(sldDoc, currentFilterNode);
        SimpleXMLService.addChildFiltersToParent(sldDoc, currentFilterNode, childFilters);
      }

      // Serialize XML to string
      const s = new XMLSerializer();
      newSldBody = s.serializeToString(sldDoc);
    } catch (e) {
      console.log(e);
      return sldBody;
    }
    return newSldBody;
  }

  /**
   * For an ogc:Filter or ogc:And parent Node, recursively return all non-ogc:And Nodes and then remove all Nodes from parentNode
   *
   * @param sldDoc the XML Document
   * @param parentNode the parent ogc:Filter or ogc:And Node
   * @returns an array of all non-ogc:And Nodes found under parentNode
   */
  public static getAllNonOgcAndChildNodes(sldDoc: Document, parentNode: Node): Node[] {
    let filterNodes: Node[] = [];

    // Get non-And (Filter) nodes of parent that are not Intersects
    const childOtherNodes = sldDoc.evaluate('./*[not(self::ogc:And)]', parentNode,
                                            SimpleXMLService.namespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < childOtherNodes.snapshotLength; i++) {
      const currentOtherNode = childOtherNodes.snapshotItem(i);
      if (currentOtherNode.nodeName !== 'ogc:Intersects') {
        filterNodes.push(currentOtherNode);
        parentNode.removeChild(currentOtherNode);
      }
    }

    // Recurse any And nodes
    const childAndNodes = sldDoc.evaluate('ogc:And', parentNode, SimpleXMLService.namespaceResolver,
                                          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < childAndNodes.snapshotLength; i++) {
      const currentAndNode = childAndNodes.snapshotItem(i);
      filterNodes = [...filterNodes, ...SimpleXMLService.getAllNonOgcAndChildNodes(sldDoc, currentAndNode)];
      parentNode.removeChild(currentAndNode);
    }

    return filterNodes;
  }

  /**
   * Construct an ogc:Filter Node based on the children it is to contain.
   *
   * @param sldDoc the XML Document
   * @param parentNode the parent ogc:Filter (or ogc:And if recursing) node
   * @param childFilters a list of child Filters
   */
  public static addChildFiltersToParent(sldDoc: Document, parentNode: Node, childFilters: Node[]) {
    if (childFilters.length === 1) {
      // Simply add a single child
      parentNode.appendChild(childFilters[0]);
    } else if (childFilters.length === 2) {
      // Two children will require an ogc:And parent
      const andNode = sldDoc.createElement('ogc:And');
      andNode.appendChild(childFilters[0]);
      andNode.appendChild(childFilters[1]);
      parentNode.appendChild(andNode);
    } else if (childFilters.length > 2) {
      // More than 2 and we need to add new ogc:And to parent, and add the first child to this and then recurse
      const andNode = sldDoc.createElement('ogc:And');
      parentNode.appendChild(andNode);
      andNode.appendChild(childFilters[0]);
      childFilters = childFilters.slice(1);
      SimpleXMLService.addChildFiltersToParent(sldDoc, andNode, childFilters);
    }
  }

  /**
   * Simple namepsace resolver for modifying SLD_BODYs.
   * Currently only cares about ogc, can be expanded as neccessary
   *
   * @param prefix namespace prefix
   */
  public static namespaceResolver(prefix: string) {
    if (prefix === 'ogc') {
      return 'http://www.opengis.net/ogc';
    } else {
      return null;
    }
  }

}
