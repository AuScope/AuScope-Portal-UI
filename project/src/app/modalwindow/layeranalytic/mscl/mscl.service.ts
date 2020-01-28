
import {throwError as observableThrowError, Observable } from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Layout } from 'plotly.js';

// This is the complete list of metrics for MSCL data
export enum Metric { diameter = 'Diameter',
            pWaveAmp = 'P-Wave Amp.',
            pWaveVel = 'P-Wave Vel.',
            density = 'Density',
            magneticSusc = 'Magnetic Susc.',
            impedance = 'Impedance',
            naturalGamma = 'Natural Gamma',
            resistivity = 'Resistivity',
            unknown = 'Unknown'
};

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
     Creates layout for several plots in one area
     @param metricList list of Metrics to plot
     @returns plot layout
     */
    public getMetricGraphLayout(metricList: Metric[]): Partial<Layout> {
        const layout: Partial<Layout> = {
            grid: {rows: 1, columns: metricList.length, pattern: 'independent'}
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
            layout[xAxisName] = { title: metric, showline: true, ticks: 'outside', side: 'top', /*sliders: ??*/ };
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
     Contacts the MSCL data service and retrieves plot data
     @param serviceUrl  URL of MSCL data service
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
