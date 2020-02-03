
import {throwError as observableThrowError, Observable } from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Layout, Data } from 'plotly.js-basic-dist-min';

// This is the complete list of metrics for MSCL data
// If you change this, then must also modify 'toMetric()' and 'fromMetric()'
export enum Metric { diameter = 'Diameter',
            pWaveAmp = 'P-Wave Amp.',
            pWaveVel = 'P-Wave Vel.',
            density = 'Density',
            magneticSusc = 'Magnetic Susc.',
            impedance = 'Impedance',
            naturalGamma = 'Natural Gamma',
            resistivity = 'Resistivity',
            unknown = 'Unknown'
}

// Smoothing window list - list of smoothing windows applied to smooth out graph lines
const SM_WINDOW_LIST = ['1', '5', '10', '25', '50', '100', '200'];

// Marker size
const MARKER_SZ = { size: 2};

@Injectable()
export class MSCLService {

    constructor(private http: HttpClient) {
    }

    /**
     @returns a complete list of metrics for MSCL data service
     */
    public getMetricList(): Metric[] {
        return [ Metric.diameter, Metric.pWaveAmp, Metric.pWaveVel, Metric.density,
                 Metric.magneticSusc, Metric.impedance, Metric.naturalGamma, Metric.resistivity]
    }

    /**
      Converts from string to Metric
      @param apiString string representation of a metric, e.g. 'p_wave_amplitude'
      @returns Metric representation of apiString
     */
    public toMetric(apiString: string): Metric {
        switch (apiString) {
            case 'diameter':
                return Metric.diameter;
            case 'p_wave_amplitude':
                return Metric.pWaveAmp;
            case 'p_wave_velocity':
                return Metric.pWaveVel;
            case 'density':
                return Metric.density;
            case 'magnetic_susceptibility':
                return Metric.magneticSusc;
            case 'impedance':
                return Metric.impedance;
            case 'natural_gamma':
                return Metric.naturalGamma;
            case 'resistivity':
                return Metric.resistivity;
        }
        return Metric.unknown;
    }


    /**
      Converts from Metric to string
      @param metric Metric to be converted
      @returns string representation of metric
     */
    public fromMetric(metric: Metric): string {
        switch (metric) {
            case Metric.diameter:
                return 'diameter';
            case Metric.pWaveAmp:
                return 'p_wave_amplitude';
            case Metric.pWaveVel:
                return 'p_wave_velocity';
            case Metric.density:
                return 'density';
            case Metric.magneticSusc:
                return 'magnetic_susceptibility';
            case Metric.impedance:
                return 'impedance';
            case Metric.naturalGamma:
                return 'natural_gamma';
            case Metric.resistivity:
                return 'resistivity';
        }
        return 'unknown';
    }


    /**
     Smooths an array of numbers to a particular window size
     @param arr array of numbers
     @param windowSize integer representing smoothing window size
     @returns array of smoothed numbers
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
     Smooth out x-values
     @param metricList list of metrics
     @param xLists lists of x-values in associative array, key is metric string
     @return smoothed x-values in same format as 'xLists'
     */
    private smoothOut(metricList: Metric[], xLists: {}, windowSize: number) {
        const xLists_out = {};
        for (const metric of metricList) {
            xLists_out[metric] = [];
            for (let i = 0; i < xLists[metric].length; i++) {
                xLists_out[metric] = this.smooth(xLists[metric], windowSize);
            }
        }
        return xLists_out;
    }


    /**
     Creates layout for several plots in one area
     @param metricList list of Metrics to plot
     @returns plot layout
     */
    public getGraphLayout(metricList: Metric[], xLists: {}): Partial<Layout> {
        const layout: Partial<Layout> = {
            hovermode: 'closest',
            grid: {rows: 1, columns: metricList.length, pattern: 'independent'},
            sliders: [
                // This slider is used for toggling between lines and markers
                { steps: [], pad: {l: 0, t: 0}, len: 0.1, currentvalue: {
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
                { steps: [], pad: {l: 120, t: 0 }, len: 0.45, currentvalue: {
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
            if (metric !== Metric.naturalGamma) {
                for (let i = 0; i < SM_WINDOW_LIST.length; i++) {
                    lineIndexList.push(idx + i);
                }
            }
            idx += SM_WINDOW_LIST.length;
        }
        layout['sliders'][0]['steps'].push({ label: 'lines', method: 'restyle', args: [{'mode': 'lines'}, lineIndexList] });
        layout['sliders'][0]['steps'].push({ label: 'markers', method: 'restyle', args: [{'mode': 'markers', 'marker': MARKER_SZ }] });

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
            layout[xAxisName] = { title: metric,
                                  showline: true,
                                  ticks: 'outside',
                                  side: 'top',
                                  autorange: false,
                                  range: this.getRange(xLists[metric])
                                };
            layout[yAxisName] = { autorange: 'reversed', title: yTitle, showline: true,
                                 ticks: 'outside' };
            switch (metric) {
                // Logarithmic x-axis for these
                case Metric.magneticSusc:
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
     * @param xList array of numbers
     * @returns min and max values as two element array [min, max]
     */
    private getRange(xList: []): [number, number] {
        const xFiltered = xList.filter(val => isFinite(val));
        return [Math.min(...xFiltered), Math.max(...xFiltered)]
    }


    /**
     Create plot data for plotly graphs
     @param metricList list of metrics to create plot data
     @param xLists list of x-axis data
     @param yList y-axis data
     @return plotly 'Data' object containing plot data
     */
    public getGraphTraceList(metricList: Metric[], xLists: {}, yList: number[]): Data[] {
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
            const trace_sm: { string: Data } | {} = {};
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
                if (metric === Metric.naturalGamma) {
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
     Contacts the MSCL data service and retrieves plot data
     @param serviceUrl the URL for the MSCL service
     @param boreholeHeaderId borehole identifier
     @param startDepth retrieve plot data starting at this depth
     @param endDepth retrieve plot data ending at this depth
     @param metricList list of metrics for which plotting data is required
     @return Observable for waiting on
     */
    public getMSCLDownload(serviceUrl: string, boreholeHeaderId: string, startDepth: number, endDepth: number, metricList: Metric[]): Observable<any> {
        let httpParams = new HttpParams();
        httpParams = httpParams.append('serviceUrl', serviceUrl);
        httpParams = httpParams.append('boreholeHeaderId', boreholeHeaderId);
        httpParams = httpParams.append('startDepth', startDepth.toString());
        httpParams = httpParams.append('endDepth', endDepth.toString());
        for (const metric of metricList) {
            httpParams = httpParams.append('observationsToReturn', this.fromMetric(metric));
        }
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
            (error: Response) => {
                return observableThrowError(error);
            }
        ), );
    }
}
