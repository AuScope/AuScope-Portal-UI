
import { throwError as observableThrowError, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Layout, Data } from 'plotly.js-dist-min';
import { SimpleXMLService } from '../../../lib/portal-core-ui/utility/simplexml.service';

// Elements detectable via XRF
const XRFElem = ['Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'As', 'Se', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo',
                      'Ag', 'Cd', 'Sn', 'Sb', 'W', 'Hg', 'Pb', 'Bi', 'Th', 'U', 'LE', 'Mg', 'Al', 'Si', 'P', 'S', 'K', 'Ca' ];

// Wavelengths detectable via Spectrophotometer
const ReflectWavelength = [ '400', '410',	'420',	'430',	'440',	'450',	'460',	'470',	'480',
                        	'490',	'500',	'510',	'520',	'530',	'540',	'550',	'560',	'570',	'580',
                            '590', '600',	'610',	'620',	'630',	'640',	'650',	'660',	'670',	'680',	'690',	'700'];

// This is a list of string enums. These are many of the dislayable metrics for MSCL data, others are added programmatically
export enum Metric { diameter = "diameter",
            pWaveAmp = "pWaveAmp",
            pWaveVel = "pWaveVel",
            density = "density",
            specificGravity = "specificGravity",
            magSuscPoint = "magSuscPoint",
            magSuscLoopVC = "magSuscLoopVC",
            magSuscLoopDC = "magSuscLoopDC",
            impedance = "impedance",
            naturalGamma = "naturalGamma",
            naturalGammaK = "naturalGammaK",
            naturalGammaU = "naturalGammaU",
            naturalGammaTh = "naturalGammaTh",
            resistivity = "resistivity",
            fracPorosity = "fracPorosity",
            XRFTotal = "XRFTotal",
            XRFLiveTime = "XRFLiveTime",
            temperature = "temperature",
            munsell = "munsell",
            cieColourL = "cieColourL",
            cieColourA = "cieColourA",
            cieColourB = "ciecolourB",
            cieColourX = "cieColourX",
            cieColourY = "cieColourY",
            cieColourZ = "cieColourZ",
            reflectRed = "reflectRed",
            reflectGreen = "reflectGreen",
            reflectBlue = "reflectBlue",
            unknown = "unknown"
}

// Interface used to store information about each metric
interface Info {
    pname: string, // Printable name
    group: string, // Name of group, if any
    desc: string, // Description
    units: string, // Units of measurement
    feat_elem: string // Attribute name in WFS GetFeature response
}

// A map from a string enum to the 'Info' object
const metricMap: Map<string, Info> = new Map([
    [ Metric.diameter, { pname: 'Diameter', group: '', desc: 'Diameter', units: '', feat_elem: 'diameter' }],
    [ Metric.pWaveVel, { pname: 'P-Wave Vel.', group: 'P-Wave', desc: 'P-Wave Velocity', units: 'm/s', feat_elem: 'p_wave_velocity' }],
    [ Metric.pWaveAmp, { pname: 'P-Wave Amp.', group: 'P-Wave', desc: 'P-Wave Amplitude', units: '', feat_elem: 'p_wave_amplitude' }],
    [ Metric.density, { pname: 'Density', group: '', desc: 'Density', units: '', feat_elem: 'density' } ],
    [ Metric.specificGravity, { pname: 'Specific Gravity', group: '', desc: 'Specfic Gravity', units: '', feat_elem: 'specific_gravity' } ],
    [ Metric.magSuscPoint, { pname: 'Mag. Susc. Point', group: '', desc: 'Magnetic Susceptibility Point', units: 'SI x 10^-5', feat_elem: 'magnetic_susc_point' } ],
    [ Metric.magSuscLoopVC, { pname: 'Mag. Susc. LoopVC', group: '', desc: 'Magnetic Susceptibility Loop Volume Corrected', units: 'SI x 10^-5', feat_elem: 'magnetic_susceptibility' } ],
    [ Metric.magSuscLoopDC, { pname: 'Mag. Susc. LoopDC', group: '', desc: 'Magnetic Susceptibility Loop Density Corrected', units: 'SI x 10^-5', feat_elem: 'magnetic_susc_loop_dc' } ],
    [ Metric.impedance, { pname: 'Impedance', group: '', desc: 'Impedance', units: '', feat_elem: 'impedance' } ],
    [ Metric.naturalGamma, { pname: 'Natural Gamma', group: '', desc: 'Natural Gamma Total Count', units: 'cps', feat_elem: 'natural_gamma' } ],
    [ Metric.naturalGammaK, { pname: 'Natural Gamma K', group: '', desc: 'Natural Gamma Potassium', units: '%', feat_elem: 'natural_gamma_k' } ],
    [ Metric.naturalGammaU, { pname: 'Natural Gamma U', group: '', desc: 'Natural Gamma Uranium', units: 'ppm', feat_elem: 'natural_gamma_u' } ],
    [ Metric.naturalGammaTh, { pname: 'Natural Gamma Th', group: '', desc: 'Natural Gamma Thorium', units: 'ppm', feat_elem: 'natural_gamma_th' } ],
    [ Metric.resistivity, { pname: 'Resistivity', group: '', desc: 'Resistivity', units: 'Ohm.m', feat_elem: 'resistivity' } ],
    [ Metric.fracPorosity, { pname: 'Frac. Porosity', group: '', desc: 'Fractional Porosity', units:'', feat_elem: 'frac_porosity' }],
    [ Metric.temperature, { pname: 'Temperature', group: '', desc: 'Temperature', units: '°C', feat_elem: 'temperature' }],
    [ Metric.munsell, { pname: 'Munsell Val.', group: 'Spectrophot', desc: 'Spectrophotometer Munsell Value', units: '', feat_elem: 'sp_munsell' }],
    [ Metric.cieColourL, { pname: 'CIE Colour L*', group: 'Spectrophot', desc: 'Spectrophotometer Colour L*', units: '', feat_elem: 'sp_cie_colour_l' }],
    [ Metric.cieColourA, { pname: 'CIE Colour a*', group: 'Spectrophot', desc: 'Spectrophotometer Colour a*', units: '', feat_elem: 'sp_cie_colour_a' }],
    [ Metric.cieColourB, { pname: 'CIE Colour b*', group: 'Spectrophot', desc: 'Spectrophotometer Colour b*', units: '', feat_elem: 'sp_cie_colour_b' }],
    [ Metric.cieColourX, { pname: 'CIE Colour X', group: 'Spectrophot', desc: 'Spectrophotometer Colour X', units: '', feat_elem: 'sp_cie_colour_x' }],
    [ Metric.cieColourY, { pname: 'CIE Colour Y', group: 'Spectrophot', desc: 'Spectrophotometer Colour Y', units: '', feat_elem: 'sp_cie_colour_y' }],
    [ Metric.cieColourZ, { pname: 'CIE Colour Z', group: 'Spectrophot', desc: 'Spectrophotometer Colour Z', units: '', feat_elem: 'sp_cie_colour_z' }],
    [ Metric.reflectRed, { pname: 'Reflect. Red', group: 'Spectrophot', desc: 'Spectrophotometer Reflectance Red (595 - 700)', units: '', feat_elem: 'sp_refl_red' }],
    [ Metric.reflectRed, { pname: 'Reflect. Green', group: 'Spectrophot', desc: 'Spectrophotometer Reflectance Green (515 - 595)', units: '', feat_elem: 'sp_refl_green' }],
    [ Metric.reflectRed, { pname: 'Reflect. Blue', group: 'Spectrophot', desc: 'Spectrophotometer Reflectance Blue (400 - 515)', units: '', feat_elem: 'sp_refl_blue' }],
    [ Metric.unknown, { pname: 'Unknown', group: '', desc: 'Unrecognised metric', units: '', feat_elem: '' }]
])

// Smoothing window list - list of smoothing windows applied to smooth out graph lines
const SM_WINDOW_LIST = ['1', '5', '10', '25', '50', '100', '200'];

// Marker size
const MARKER_SZ = { size: 2 };

@Injectable()
export class MSCLService {
    private http = inject(HttpClient);


    constructor() {

        // Setup the map with the numerous XRF elements
        for (const elem of XRFElem) {
            metricMap.set("XRF_" + elem, { pname: 'XRF ' + elem,
                                        group: 'XRF',
                                        desc: 'XRF measurement of ' + elem,
                                        units: '',
                                        feat_elem: 'xrf_' + elem });
            metricMap.set("XRF_" + elem + "_Error", { pname: 'XRF ' + elem + ' Error',
                                        group: 'XRF',
                                        desc: 'XRF measurement of ' + elem + ' Error',
                                        units: '',
                                        feat_elem: 'xrf_' + elem + '_error' });
        }

        // Setup the map with the spectrophotometer reflectance wavelengths
        for (const w of ReflectWavelength) {
            metricMap.set("Reflect_" + w, { pname: 'Reflect. '+ w,
                                            group: 'Spectrophot',
                                            desc: 'Spectrophotometer Reflectance at wavelength ' + w + 'nm',
                                            units: 'nm',
                                            feat_elem: 'sp_refl_' + w });
        }
    }


    /**
     * Returns a complete list of printable metric name if no parameter supplied
     * or converts a list of feature element names to printable names
     *
     * @featList optional list of features to convert to printable names
     * @returns a list of printable metric names for MSCL data service
     */
    public getMetricPNameList(featList?: string[]): string[] {
        const retList = [];
        if (featList) {
            // Convert feature name list to a list of names and group names
            for (const featElem of featList) {
                for (const mm of metricMap.values()) {
                    if (mm.feat_elem === featElem.replace(/ /g, '_')) {
                        if (!retList.includes(mm.pname)) {
                            retList.push(mm.pname);
                        }
                    }
                }
            }
        } else {
            // Return full list of names and group names
            for (const mm of metricMap.values()) {
                if (mm.group === '') {
                    retList.push(mm.pname);
                } else if (!retList.includes(mm.group)) {
                    retList.push(mm.group);
                }
            }
        }
        return retList;
    }


    /**
     * Returns true if the input string is a metric group name
     *
     * @param name
     * @returns True or false
     */
    public isMetricGroup(name: string) {
        for (const mm of metricMap.values()) {
            if (mm.group === name) {
                return true;
            }
        }
        return false;
    }


    /**
     * Gets a list of 'Info' attributes for a group
     *
     * @param groupName group name string
     * @param attr requested 'Info' attribute
     * @returns list of WFS feature element names
     */
    public getInfoAttrsForGrp(groupName: string, attr: string): string[] {
        const retList = [];
        for (const mm of metricMap.values()) {
            if (mm.group === groupName) {
                retList.push(mm[attr]);
            }
        }
        return retList;
    }


    /**
     * Converts WFS feature attribute from string to Metric
     *
     * @param featAttr  WFS feature representation of a metric, e.g. 'p_wave_amplitude'
     * @returns Metric representation of apiString
     */
    public toMetricEnum(featAttr: string): string {
        for (const m of metricMap.keys()) {
            if (metricMap.get(m).feat_elem === featAttr) {
                return m;
            }
        }
        return Metric.unknown;
    }

    /**
     * Given a printable metric name returns its group name, returns '' if not found
     *
     * @param pName printable metric name
     * @returns group name
     */
    public pNameToGroup(pName: string): string {
        for (const mm of metricMap.values()) {
            if (mm.pname == pName) {
                return mm.group;
            }
        }
        return "";
    }


    /**
     * Converts from printable metric name to Info member string
     *
     * @param metricPName Printable name of metric to be converted
     * @param attr 'Info' attribute to be retrieved
     * @returns string representation of metric
     */
    public getMetricInfoAttr(metricPName: string, attr: string): string {
        for (const info of metricMap.values()) {
            if (info.pname === metricPName) {
                return info[attr];
            }
        }
        return "";
    }


    /**
     * Smooths an array of numbers to a particular window size
     *
     * @param arr array of numbers
     * @param windowSize integer representing smoothing window size
     * @returns array of smoothed numbers
     */
    private smooth(arr: number[], windowSize: number) {
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const leftOffset = i - windowSize;
            const from = leftOffset >= 0 ? leftOffset : 0;
            const to = i + windowSize + 1;

            let count = 0;
            let sum = 0;
            for (let j = from; j < to && j < arr.length; j++) {
                if (isFinite(arr[j])) {
                    sum += arr[j];
                    count++;
                }
            }
            result[i] = sum / count;
        }
        return result
    }


    /**
     * Smooth out x-values
     *
     * @param metricList list of metrics
     * @param xLists lists of x-values in associative array, key is metric string
     * @return smoothed x-values in same format as 'xLists'
     */
    private smoothOut(metricList: string[], xLists: object, windowSize: number) {
        const xLists_out = {};
        for (const metric of metricList) {
            xLists_out[metric] = this.smooth(xLists[metric], windowSize);
        }
        return xLists_out;
    }


    /**
     * Creates layout for several plots in one area
     *
     * @param metricList list of Metrics to plot
     * @returns plot layout
     */
    public getGraphLayout(metricList: string[], xLists: object): Partial<Layout> {
        const layout: Partial<Layout> = {
            hovermode: 'closest',
            grid: { rows: 1, columns: metricList.length, pattern: 'independent' },
            sliders: [
                // This slider is used for toggling between lines and markers
                { steps: [], pad: { l: 0, t: 0 }, len: 0.1, currentvalue: {
                    xanchor: 'left',
                    prefix: 'style: ',
                    font: {
                      color: '#000',
                      size: 12
                    },
                    visible: true,
                    offset: 0,
                    suffix: ''
                  }
                },
                // This slider is used for smoothing
                { steps: [], pad: { l: 120, t: 0 }, len: 0.45, currentvalue: {
                    xanchor: 'left',
                    prefix: 'smoothing: ',
                    font: {
                      color: '#000',
                      size: 12
                    },
                    visible: true,
                    offset: 0,
                    suffix: ''
                  }
                }
            ]
        }
        // Set up the line/marker toggle
        const lineIndexList = [];
        let idx = 0;
        for (const metric of metricList) {
            // Natural gamma always has points instead of lines
            if (metric as Metric !== Metric.naturalGamma) {
                for (let i = 0; i < SM_WINDOW_LIST.length; i++) {
                    lineIndexList.push(idx + i);
                }
            }
            idx += SM_WINDOW_LIST.length;
        }
        layout['sliders'][0]['steps'].push({ label: 'lines', method: 'restyle', args: [{ 'mode': 'lines' }, lineIndexList] });
        layout['sliders'][0]['steps'].push({ label: 'markers', method: 'restyle', args: [{ 'mode': 'markers', 'marker': MARKER_SZ }] });

        // Make the slider steps for the plot line smoothing
        // Set up a 'visibleList' to only show one smoothed line at a time
        for (let i = 0; i < SM_WINDOW_LIST.length; i++) {
            const visibleList = [];
            for (let j = 0; j < SM_WINDOW_LIST.length; j++) {
                if (i !== j) {
                    visibleList.push(false);
                } else {
                    visibleList.push(true);
                }
            }
            layout['sliders'][1]['steps'].push({ label: SM_WINDOW_LIST[i], method: 'restyle', args: ['visible', visibleList] });
        }
        let axisNum = 1;
        for (const metric of metricList) {
            let xAxisName = 'xaxis';
            let yAxisName = 'yaxis';
            let yTitle = 'Depth (m)';
            if (axisNum > 1) {
                xAxisName += axisNum.toString();
                yAxisName += axisNum.toString();
                yTitle = '';
            }
            layout[xAxisName] = {
                title: {
                    text: metric
                },
                showline: true,
                ticks: 'outside',
                side: 'top',
                autorange: false,
                range: this.getRange(xLists[metric])
            };
            layout[yAxisName] = {
                autorange: 'reversed',
                title: {
                    text: yTitle
                },
                showline: true,
                ticks: 'outside'
            };
            switch (metric as Metric) {
                // Logarithmic x-axis for these
                case Metric.magSuscPoint:
                case Metric.resistivity:
                    layout[xAxisName]['type'] = 'log';
                    layout[xAxisName]['autorange'] = true;
                    break;
            }
            axisNum++;
        }
        return layout;
    }

    /**
     * Find the max and min values of array of numbers
     *
     * @param xList array of numbers
     * @returns min and max values as two element array [min, max]
     */
    private getRange(xList: []): [number, number] {
        const xFiltered = xList.filter(val => isFinite(val));
        return [Math.min(...xFiltered), Math.max(...xFiltered)]
    }

    /**
     * Create plot data for plotly graphs
     *
     * @param metricList list of metrics to create plot data
     * @param xLists list of x-axis data
     * @param yList y-axis data
     * @return plotly 'Data' object containing plot data
     */
    public getGraphTraceList(metricList: string[], xLists: object, yList: number[]): Data[] {
        const traceList: Data[] = [];
        const xLists_sm = {};
        xLists_sm[SM_WINDOW_LIST[0]] = xLists;
        for (let i = 1; i < SM_WINDOW_LIST.length; i++) {
            xLists_sm[SM_WINDOW_LIST[i]] = this.smoothOut(metricList, xLists, parseInt(SM_WINDOW_LIST[i], 10));
        }
        let metricNum = 1;
        // A new plot for each metric
        for (const metric of metricList) {
            // Draw lines of varying degrees of smoothing in each plot
            const trace_sm: object = {};
            for (const win of SM_WINDOW_LIST) {
                trace_sm[win] = {
                    x: xLists_sm[win][metric],
                    y: yList,
                    xaxis: 'x' + metricNum.toString(),
                    yaxis: 'y' + metricNum.toString(),
                    type: 'scatter',
                    showlegend: false,
                    name: metric,
                    hovertemplate: '%{xaxis.title.text}: %{x}<br>Depth: %{y:.2f}m<extra></extra>',
                    visible: false
                };
                // Only the unsmoothed line is visible at first
                if (win === SM_WINDOW_LIST[0]) {
                    trace_sm[win]['visible'] = true;
                }
                // Natural gamma has points instead of lines
                if (metric as Metric === Metric.naturalGamma) {
                    trace_sm[win]['mode'] = 'markers';
                    trace_sm[win]['marker'] = MARKER_SZ;
                }
                traceList.push(trace_sm[win]);
            }
            metricNum++;
        }
        return traceList;
    }

    /**
    * Checks to see if there are petrophysics observation sample values
    * Assumes GeoSciML v4.1 WFS response format
    *
    * @param XML string WFS response
    * @returns true if values could be found
    */
    public usesGMLObs(xmlStr: string): boolean {
        const obsIdx = xmlStr.search(/<om:OM_Observation (gml:)?id="om.observation.petrophysicalproperty/);
        return (obsIdx > 0);
    }

    /**
    * Namespace resolver for XPATH parsing of GeoSciML v4.1 WFS response
    */
    private nsResolver(prefix: any) {
        switch (prefix) {
          case 'wfs':
            return "http://www.opengis.net/wfs";
          case "xs":
            return "http://www.w3.org/2001/XMLSchema";
          case "swe":
            return "http://www.opengis.net/swe/2.0";
          case "sams":
            return "http://www.opengis.net/samplingSpatial/2.0";
          case "gsmlp":
            return "http://xmlns.geosciml.org/geosciml-portrayal/4.0";
          case "gml":
            return "http://www.opengis.net/gml";
          case "mt":
            return "http://xmlns.geoscience.gov.au/mineraltenementml/1.0";
          case "cit":
            return "http://standards.iso.org/iso/19115/-3/cit/1.0";
          case "gco2":
            return "http://www.isotc211.org/2005/gco";
          case "gsmlb":
            return "http://www.opengis.net/gsml/4.1/GeoSciML-Basic";
          case "gsml":
            return "urn:cgi:xmlns:CGI:GeoSciML:2.0";
          case "gsmlbh":
            return "http://www.opengis.net/gsml/4.1/Borehole";
          case "erl":
            return "http://xmlns.earthresourceml.org/earthresourceml-lite/2.0";
          case "om":
            return "http://www.opengis.net/om/2.0";
          case "sam":
            return "http://www.opengis.net/sampling/2.0";
          case "xlink":
            return "http://www.w3.org/1999/xlink";
          case "gmd":
            return "http://www.isotc211.org/2005/gmd";
          case "xsi":
            return "http://www.w3.org/2001/XMLSchema-instance";
        }
        return "http://www.http://www.w3.org/2001/XMLSchema-instance.net/wcs";
      }

      /**
       * Parses an XML WFS response to find the set of metric types available
       * Applies only to GeoSciML v4.1
       *
       * @param xmlStr WFS response
       * @returns a list of strings or empty list if not found
      */
      public findMetricTypes(xmlStr: string): any[] {
        const rootNode = SimpleXMLService.parseStringToDOM(xmlStr);
        const METRICS = '//gsmlbh:specification/om:OM_Observation/om:result/swe:Quantity/swe:label';
        const nodeList = SimpleXMLService.evaluateXPathNodeArray(rootNode, rootNode, METRICS, this.nsResolver.bind(this));
        const metricVals = [];
        for (const node of nodeList) {
            metricVals.push(node.textContent);
        }
        const metricSet = new Set(metricVals);
        const uniqueMetrics = [ ... metricSet ];
        return uniqueMetrics;
    }


    /**
     * Contacts the MSCL data service and retrieves plot data
     *
     * @param serviceUrl the URL for the MSCL service
     * @param boreholeHeaderId borehole identifier
     * @param startDepth retrieve plot data starting at this depth
     * @param endDepth retrieve plot data ending at this depth
     * @param useGMLObs if true then observations are hidden in complete GeoSciML data model
     * @param metricList list of metrics for which plotting data is required
     * @return Observable for waiting on
     */
    public getMSCLDownload(serviceUrl: string, boreholeHeaderId: string, startDepth: number, endDepth: number,
        useGMLObs: boolean, metricList: string[]): Observable<any> {
        let httpParams = new HttpParams();
        httpParams = httpParams.append('serviceUrl', serviceUrl);
        httpParams = httpParams.append('boreholeHeaderId', boreholeHeaderId);
        httpParams = httpParams.append('startDepth', startDepth.toString());
        httpParams = httpParams.append('endDepth', endDepth.toString());
        // Assemble list of observations to send in the request
        for (const metric of metricList) {
            const feat_elem = this.getMetricInfoAttr(metric, 'feat_elem');
            if (feat_elem != '') {
                const std_feat_elem = (useGMLObs) ? feat_elem.replace('_',' '): feat_elem;
                httpParams = httpParams.append('observationsToReturn', std_feat_elem);
            // If user requested a group name, append all members of group
            } else if (this.isMetricGroup(metric)) {
                const gMetricList = this.getInfoAttrsForGrp(metric, 'feat_elem');
                for (const gMet of gMetricList) {
                    const cleanMetric = (useGMLObs) ? gMet.replace('_',' '): gMet;
                    httpParams = httpParams.append('observationsToReturn', cleanMetric);
                }
            }
        }
        // Observations are hidden in complete GeoSciML data model
        if (useGMLObs) {
            httpParams = httpParams.append('useGMLObs', 'true');
        }
        // Send HTTP request for observations for a borehole
        return this.http.post(environment.portalBaseUrl + 'getMsclObservationsForGraph.do', httpParams.toString(), {
            headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
            responseType: 'json'
        }).pipe(map(response => {
            if (response['success'] === true) {
                return response['data']['series'];
            } else {
                return observableThrowError(response['msg']);
            }
        }), catchError(
            (error: HttpResponse<any>) => {
                return observableThrowError(error);
            }
        ),);
    }

}
