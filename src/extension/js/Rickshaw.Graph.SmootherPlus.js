Rickshaw.namespace('Rickshaw.Graph.SmootherPlus');

Rickshaw.Graph.SmootherPlus = Rickshaw.Class.create({
    
    // Range is currently fixed at 0..100, may need to become variable later on
	initialize: function(args) {

		this.graph = args.graph;
		this.element = args.element;
		this.aggregationScale = 1;

		this.build();

		this.graph.stackData.hooks.data.push( {
			name: 'smoother',
			orderPosition: 50,
			f: this.transformer.bind(this)
		} );
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
					},
                    create: function( event, ui ) {
                        self.setSliderTicks(event.target);
                    }
				} );
			} );
		}
	},
    
    setSliderTicks: function(el) {
        var $ = jQuery;
        var $slider =  $(el);
        var max = 100;    
        var min = 0;
        var spacing =  100 / (max - min);
        $(self.element).find('.rickshaw_smoother_tick_mark').remove();
        $(self.element).find('.rickshaw_smoother_tick_num').remove();
            for (var i = 0; i <= max-min; i+=10) {
                $('<span class="rickshaw_smoother_tick_mark"></span>').css('left', (spacing*i) +  '%').appendTo($slider);
                $('<span class="rickshaw_smoother_tick_num">'+i+'</span>').css('left', (spacing*i-3) +  '%').appendTo($slider);
            }
            $('<span class="rickshaw_smoother_tick_num">m</span>').css('left', (spacing*106) +  '%').appendTo($slider);
    },

	setScale: function(scale) {

		if (scale < 1) {
			throw "scale out of range: " + scale;
		}

		this.aggregationScale = scale;
		this.graph.update();
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

