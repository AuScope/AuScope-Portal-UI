
import {throwError as observableThrowError,  Observable } from 'rxjs';

import {timeoutWith, map, catchError} from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { Bbox } from '../../../portal-core-ui/model/data/bbox.model';
import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';

declare var d3: any;

@Injectable()
export class CapdfAnalyticService {


  constructor(private http: HttpClient) {

  }


  public doGetGroupOfInterest(serviceUrl: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);

    return this.http.post(environment.portalBaseUrl + 'doGetGroupOfInterest.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public doGetAOIParam(serviceUrl: string, featureType: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);
    httpParams = httpParams.append('featureType', featureType);

    return this.http.post(environment.portalBaseUrl + 'doGetAOIParam.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }

  public doCapdfHydroBoxPlotList(bbox: Bbox, box1: string, box2: string, featureType: string, obbox: Bbox, serviceUrl: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);
    httpParams = httpParams.append('featureType', featureType);
    httpParams = httpParams.append('box1', box1);
    httpParams = httpParams.append('box2', box2);
    httpParams = httpParams.append('bbox', JSON.stringify(bbox));
    httpParams = httpParams.append('obbox', JSON.stringify(obbox));

    return this.http.post(environment.portalBaseUrl + 'doCapdfHydroBoxPlotList.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }


  public doCapdfHydroScatterPlotList(bbox: Bbox, xaxis: string, yaxis: string, featureType: string, obbox: Bbox, serviceUrl: string): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);
    httpParams = httpParams.append('featureType', featureType);
    httpParams = httpParams.append('xaxis', xaxis);
    httpParams = httpParams.append('yaxis', yaxis);
    httpParams = httpParams.append('bbox', JSON.stringify(bbox));
    httpParams = httpParams.append('obbox', JSON.stringify(obbox));

    return this.http.post(environment.portalBaseUrl + 'doCapdfHydroScatterPlotList.do', httpParams.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      responseType: 'json'
    }).pipe(map(response => {
      if (response['success'] === true) {
        return response['data'];
      } else {
        return observableThrowError(response['msg']);
      }
    }), catchError(
      (error: Response) => {
        return observableThrowError(error);
      }
      ), );
  }


  /**
     * Plot a scatter plot graph into the divId selected
     * @method plotScatter
     * @param data - the data for plotting in an array
     * @param divId - the id of the div for rendering the graph
     * @param height - the height of the graph
     * @param xaxis - x-axis
     * @param yaxis - y-axis
     *
     */
    public plotScatter(data, divId, targetHeight, xaxis, yaxis) {
        this.clearPlot(divId);
        const margin = {top: 15, right: 5, bottom: 20, left: 40};

        const targetWidth = $('#' + divId).width();


        const width = targetWidth - margin.left - margin.right,
        height = targetHeight - margin.top - margin.bottom;

        const container = d3.select('#' + divId);
        let svg = container.append('svg');

        /*
         * value accessor - returns the value to encode for a given data object.
         * scale - maps value to a visual display encoding, such as a pixel position.
         * map function - maps from data value to display value
         * axis - sets up axis
         */

        // setup x
        const xValue = function(d) { return d.xaxis; }, // data -> value
            xScale = d3.scale.linear().range([0, width]), // value -> display
            xMap = function(d) { return xScale(xValue(d)); }, // data -> display
            xAxis = d3.svg.axis().scale(xScale).orient('bottom');

            const yValue = function(d) { return d['yaxis']; }, // data -> value
            yScale = d3.scale.linear().range([height, 0]), // value -> display
            yMap = function(d) { return yScale(yValue(d)); }, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient('left');

        // setup fill color
        const cValue = function(d) { return d.highlight; },
            color = d3.scale.category10();

        svg = svg
            .attr('width', targetWidth)
            .attr('height', targetHeight)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // add the tooltip area to the webpage
        const tooltip = d3.select('body').append('div')
            .attr('class', 'graphTooltip')
            .style('opacity', 0);


          // change string (from CSV) into number format
          data.forEach(function(d) {
            d.xaxis = +d.xaxis
            d['yaxis'] = +d['yaxis'];
    //        console.log(d);
          });

          // don't want dots overlapping axis, so add in buffer to data domain
          xScale.domain([d3.min(data, xValue) - 1, d3.max(data, xValue) + 1]);
          yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

          // x-axis
          svg.append('g')
              .attr('class', 'x axis')
              .attr('transform', 'translate(0,' + height + ')')
              .call(xAxis)
            .append('text')
              .attr('class', 'label')
              .attr('x', width)
              .attr('y', -6)
              .style('text-anchor', 'end')
              .text(xaxis);

          // y-axis
          svg.append('g')
              .attr('class', 'y axis')
              .call(yAxis)
            .append('text')
              .attr('class', 'label')
              .attr('transform', 'rotate(-90)')
              .attr('y', 6)
              .attr('dy', '.71em')
              .style('text-anchor', 'end')
              .text(yaxis);

          // draw dots
          svg.selectAll('.dot')
              .data(data)
            .enter().append('circle')
              .attr('class', 'dot')
              .attr('r', 3.5)
              .attr('cx', xMap)
              .attr('cy', yMap)
              .style('fill', function(d) { return color(d.highlight); })
              .on('mouseover', function(d) {
                  tooltip.transition()
                       .duration(200)
                       .style('opacity', .9);
                  tooltip.html(d['tooltip'] + '<br/> (x:' + xValue(d)
                    + ', y:' + yValue(d) + ')')
                       .style('left', (d3.event.pageX + 5) + 'px')
                       .style('top', (d3.event.pageY - 28) + 'px');
              })
              .on('mouseout', function(d) {
                  tooltip.transition()
                       .duration(500)
                       .style('opacity', 0);
              });

          // draw legend
          const legend = svg.selectAll('.legend')
              .data(color.domain())
            .enter().append('g')
              .attr('class', 'legend')
              .attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; });

          // draw legend colored rectangles
          legend.append('rect')
              .attr('x', width - 18)
              .attr('width', 18)
              .attr('height', 18)
              .style('fill', color);

          // draw legend text
          legend.append('text')
              .attr('x', width - 24)
              .attr('y', 9)
              .attr('dy', '.35em')
              .style('text-anchor', 'end')
              .text(function(d) { return d; });
        };

     /**
      * Plot a boxPlot graph into the divId selected
      * @method plotBox
      * @param data - the data for plotting in an array
      * @param id - the id of the div for rendering the graph
      * @param height - the height of the graph
      * @param x - x-axis
      * @param y - y-axis
      *
      */
     public plotBox(csv, id, targetHeight, xaxis, yaxis) {
         this.clearPlot(id);
         const divId = '#' + id;
         const targetWidth = $(divId).width();
         const container = d3.select(divId);
         const preserveAspectRatio = true;
         const d3svg = container.append('svg')
             .attr('preserveAspectRatio', preserveAspectRatio ? 'xMidYMid' : 'none')
             .attr('viewBox',  '0 0 ' + targetWidth + ' ' + targetHeight);



         const labels = true; // show the text labels beside individual boxplots?

         const margin = {top: 15, right: 5, bottom: 45, left: 40};
         const width = targetWidth - margin.left - margin.right;
         const height = targetHeight - margin.top - margin.bottom;

         let min = Infinity,
             max = -Infinity;



             // using an array of arrays with
             // data[n][2]
             // where n = number of columns in the csv file
             // data[i][0] = name of the ith column
             // data[i][1] = array of values of ith column

             const data = [];
             data[0] = [];
             data[1] = [];
             data[2] = [];
             data[3] = [];

             // add more rows if your csv file has more columns

             // add here the header of the csv file
             data[0][0] = xaxis;
             data[1][0] = yaxis;
             data[2][0] = xaxis + '-bounded';
             data[3][0] = yaxis + '-bounded';

             // add more rows if your csv file has more columns

             data[0][1] = [];
             data[1][1] = [];
             data[2][1] = [];
             data[3][1] = [];


             csv.forEach(function(x) {
                 const v1 = Math.floor(x.x1),
                     v2 = Math.floor(x.y1),
                     v3 = Math.floor(x.x2),
                     v4 = Math.floor(x.y2)



                 let rowMax = -2147483646
                 for (let i = 0; i < 4; i++) {
                     if (v1 > rowMax && v1 !== 2147483646) {
                         rowMax = v1;
                     }
                     if (v2 > rowMax && v2 !== 2147483646) {
                         rowMax = v2;
                     }
                     if (v3 > rowMax && v3 !== 2147483646) {
                         rowMax = v3;
                     }
                     if (v4 > rowMax && v4 !== 2147483646) {
                         rowMax = v4;
                     }
                 }


                 let rowMin = 2147483646
                 for (let i = 0; i < 4; i++) {
                     if (v1 < rowMin && v1 !== 2147483646) {
                         rowMin = v1;
                     }
                     if (v2 < rowMin && v2 !== 2147483646) {
                         rowMin = v2;
                     }
                     if (v3 < rowMin && v3 !== 2147483646) {
                         rowMin = v3;
                     }
                     if (v4 < rowMin && v4 !== 2147483646) {
                         rowMin = v4;
                     }
                 }



                 data[0][1].push(v1);
                 data[1][1].push(v2);
                 data[2][1].push(v3);
                 data[3][1].push(v4);

                  // add more rows if your csv file has more columns

                 if (rowMax > max) {
                    max = rowMax;
                 }
                 if (rowMin < min) {min = rowMin; }
             });

             const chart = d3.box()
                 .whiskers(iqr(1.5))
                 .height(height)
                 .domain([min, max])
                 .showLabels(labels);

             let svg = d3svg;

             svg = svg
                 .attr('width', width + margin.left + margin.right)
                 .attr('height', height + margin.top + margin.bottom)
                 .attr('class', 'box')
                 .append('g')
                 .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

             // the x-axis
             const x = d3.scale.ordinal()
                 .domain( data.map(function(d) { return d[0] } ) )
                 .rangeRoundBands([0 , width], 0.7, 0.3);

             const xAxis = d3.svg.axis()
                 .scale(x)
                 .orient('bottom');

             // the y-axis
             const y = d3.scale.linear()
                 .domain([min, max])
                 .range([height + margin.top, 0 + margin.top]);

             const yAxis = d3.svg.axis()
             .scale(y)
             .orient('left');

             // draw the boxplots
             svg.selectAll('.box')
               .data(data)
               .enter().append('g')
                 .attr('transform', function(d) { return 'translate(' +  x(d[0])  + ',' + margin.top + ')'; } )
               .call(chart.width(x.rangeBand()));


             // add a title
             svg.append('text')
                 .attr('x', (width / 2))
                 .attr('y', 0 + (margin.top / 2))
                 .attr('text-anchor', 'middle')
                 .style('font-size', '8px')
                 .text('Box Plot');

              // draw y axis
             svg.append('g')
                 .attr('class', 'y axis')
                 .call(yAxis)
                 .append('text') // and text1
                   .attr('transform', 'rotate(-90)')
                   .attr('y', 6)
                   .attr('dy', '.71em')
                   .style('text-anchor', 'end')
                   .style('font-size', '8px')
                   .text('Values');

             // draw x axis
             svg.append('g')
               .attr('class', 'x axis')
               .attr('transform', 'translate(0,' + (height  + margin.top + 10) + ')')
               .call(xAxis)

         // Returns a function to compute the interquartile range.
         function iqr(k) {
           return function(d) {
             const q1 = d.quartiles[0],
                 q3 = d.quartiles[2],
                 iqr = (q3 - q1) * k
             let i = -1,
                 j = d.length;
             while (d[++i] < q1 - iqr) {};
             while (d[--j] > q3 + iqr) {};
             return [i, j];
           };
         }

         const text = svg.selectAll('text')
         .attr('font-size', '10px');

     };


     /**
      * Clear the div of any graph plotting
      * @param - divId the id of the div to remove the graph.
      */
     public clearPlot(id) {
         const divId = '#' + id;
         let container = d3.select(divId);
         container.select('*').remove();
         container = null;
     };


  public downloadCapdfCSV(serviceUrl: string, featureType: string, north: string, south: string, east: string, west: string) {

    let httpParams = new HttpParams();
    httpParams = httpParams.append('serviceUrl', serviceUrl);
    httpParams = httpParams.append('featureType', featureType);
    httpParams = httpParams.append('north', north);
    httpParams = httpParams.append('south', south);
    httpParams = httpParams.append('east', east);
    httpParams = httpParams.append('west', west);

    return this.http.get(environment.portalBaseUrl + 'getCapdfCSVDownload.do', {
      params: httpParams,
      responseType: 'blob'
    }).pipe(timeoutWith(360000, observableThrowError(new Error('Request have timeout out after 5 minutes'))),
      map((response) => { // download file
      return response;
    }), catchError((error: Response) => {
        return observableThrowError(error);
    }), )
  }

}
