Rickshaw.namespace('Rickshaw.Graph.MultiSmoother');

Rickshaw.Graph.MultiSmoother = Rickshaw.Class.create({

	initialize: function(args) {
		
		this.graphs = args.graph ? [ args.graph ] : args.graphs;
		this.element = args.element;
		this.aggregationScale = 1;

		this.build();

		this.graphs.forEach(function(graph) {
			graph.stackData.hooks.data.push( {
				name: 'smoother',
				orderPosition: 50,
				f: this.transformer.bind(this)
			} );
		}, this);
	},

	build: function() {

		var self = this;
		var $ = jQuery;

		if (this.element) {
			$( function() {
				$(self.element).slider( {
					min: 1,
					max: 100,
					slide: function( event, ui ) {
						self.setScale(ui.value);
					}
				} );
			} );
		}
	},

	setScale: function(scale) {

		if (scale < 1) {
			throw "scale out of range: " + scale;
		}

		this.aggregationScale = scale;
		this.graphs.forEach( function(graph) { graph.update(); });
	},

	transformer: function(data) {

		if (this.aggregationScale == 1) return data;

		var aggregatedData = [];

		data.forEach( function(seriesData) {

			var aggregatedSeriesData = [];

			while (seriesData.length) {

				var avgX = 0, avgY = 0;
				var slice = seriesData.splice(0, this.aggregationScale);

				slice.forEach( function(d) {
					avgX += d.x / slice.length;
					avgY += d.y / slice.length;
				} );

				aggregatedSeriesData.push( { x: avgX, y: avgY } );
			}

			aggregatedData.push(aggregatedSeriesData);

		}.bind(this) );

		return aggregatedData;
	}
});

