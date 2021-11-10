var Proj4js = require('../../node_modules/proj4/dist/proj4-src');

exports.constants = {
    /**
     * Global constants
     */

    EC: protractor.ExpectedConditions,
    GA_VOCAB_URI: 'http://cgi.vocabs.ga.gov.au/object?uri=',
    GA_WFS_GETFEATURE_URL: 'http://services.ga.gov.au/earthresource/wfs?service=WFS&version=2.0.0&request=GetFeature'

}
exports.utils = {
    /**
     * Convert EPSG:4283 coordinates to pixels.
     * @param {*} long Longitude in EPSG:4283
     * @param {*} lat Latitude in EPSG:4283
     */
    WGS84ToMercator: function (long, lat) {
        var source = new Proj4js.Proj('EPSG:4326');
        var dest = new Proj4js.Proj('EPSG:3857');
        var p = new Proj4js.toPoint([long, lat]);

        return Proj4js.transform(source, dest, p);
    },

    /**
     * Works out how much pixels to move from the middle of canvas.
     * @param {*} long Destination longitude in WGS84
     * @param {*} lat  Destination latitude in WGS84
     * @param canvasWidth Canvas width
     * @param canvasHeight Canvas height
     * @returns point(x,y) representing pixels to move from the middle of canvas.
     */
    pixelsToMoveFromMiddle: function (long, lat, canvasWidth, canvasHeight) {
        // First we reproject to spherical mercator
        // This is the point we want to click on
        var dest = this.WGS84ToMercator(long, lat);
        // the centre of the canvas
        const middle = this.WGS84ToMercator(132.8467, -25.7603);
        // manual calculation based on the canvas size and map scale
        // tells us 1m = (171/(1000*1000)) px
        const pixelPerMeter = 171 / (1000 * 1000);
        // Mouse move is toRight
        var x = (dest.x - middle.x) * pixelPerMeter;
        // and toBottom
        var y = (middle.y - dest.y) * pixelPerMeter;

        console.log("point xy " + dest.x + "," + dest.y);
        console.log("middle xy " + middle.x + ", " + middle.y);
        console.log("Distance in pixels: " + x + ", " + y);

        return new Proj4js.toPoint([x, y]);
    },

    clickCanvas: function (canvas, toRight, toBottom) {
        browser.actions()
            .mouseMove(canvas)
            .mouseMove({ x: toRight, y: toBottom })
            .click()
            .perform();
    }
}