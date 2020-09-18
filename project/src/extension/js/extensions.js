/* This function is used to manage the controls of Rickshaw graphs
   used in NVCL Analytic tab in popup
 */ 
var RenderControls = function(args) {

	var $ = jQuery;

	this.initialize = function() {

		this.element = args.element;
		this.graph = args.graph;
		this.settings = this.serialize();

		this.inputs = {
			renderer: this.element.elements.renderer,
			interpolation: this.element.elements.interpolation,
			offset: this.element.elements.offset
		};

		/* This is called when the controls' state changes after a click event */
		this.element.addEventListener('change', function(e) {
			this.settings = this.serialize();

			/* Make sure the default offset is available when the selected renderer changes */
			if (e.target.name == 'renderer') {
				this.setDefaultOffset(e.target.value);
			}

			/* Change the set of offsets available each time the renderer changes */
			this.syncOptions();
			this.settings = this.serialize();

			var config = {
				renderer: this.settings.renderer,
				interpolation: this.settings.interpolation
			};

			if (this.settings.offset == 'value') {
				config.unstack = true;
				config.offset = 'zero';
			} else if (this.settings.offset == 'expand') {
				config.unstack = false;
				config.offset = this.settings.offset;
			} else {
				config.unstack = false;
				config.offset = this.settings.offset;
			}

			this.graph.configure(config);
			this.graph.render();

		}.bind(this), false);
	}

	this.serialize = function() {

		var values = {};
		var pairs = $(this.element).serializeArray();

		pairs.forEach( function(pair) {
			values[pair.name] = pair.value;
		} );

		return values;
	};

	this.syncOptions = function() {
		var options = this.rendererOptions[this.settings.renderer];

		Array.prototype.forEach.call(this.inputs.interpolation, function(input) {

			if (options.interpolation) {
				input.disabled = false;
			} else {
				input.disabled = true;
			}
		});

		/* When renderer is selected, make sure only the usable offset options are displayed */
		Array.prototype.forEach.call(this.inputs.offset, function(input) {
			if (options.offset.filter( function(o) { return o == input.value } ).length) {
				/* Make input & label appear */
				input.disabled = false;
				input.style.display = "inline-block";
				input.nextSibling.style.display = "inline-block"; 
			} else {
				/* Make input & label disappear */
				input.disabled = true;
				input.style.display = "none";
				input.nextSibling.style.display = "none";
			}

		}.bind(this));

	};

	/* Enables the default offset each time you change the renderer */
	this.setDefaultOffset = function(renderer) {
		var options = this.rendererOptions[renderer];

		if (options.defaults && options.defaults.offset) {

			Array.prototype.forEach.call(this.inputs.offset, function(input) {
				if (input.value == options.defaults.offset) {
					input.checked = true;
				} else {
					input.checked = false;
				}

			}.bind(this));
		}
	};

	/* 
	 * The user selects a renderer, and it will display the data as an 'area', 'bar', 'line' or 'scatter' graph
     * The 'offset' determines whether the data is displayed as 'stack', 'expand' or 'value'
     * Obviously not all renderers can display all kinds of offset e.g. 'scatterplot' only has 'value'
     */
	this.rendererOptions = {

		area: {
			interpolation: true,
			offset: ['zero', 'wiggle', 'expand', 'value'],
			defaults: { offset: 'zero' }
		},
		line: {
			interpolation: true,
			offset: ['expand', 'value'],
			defaults: { offset: 'value' }
		},
		bar: {
			interpolation: false,
			offset: ['zero', 'wiggle', 'expand', 'value'],
			defaults: { offset: 'zero' }
		},
		scatterplot: {
			interpolation: false,
			offset: ['value'],
			defaults: { offset: 'value' }
		}
	};

	this.initialize();
};

