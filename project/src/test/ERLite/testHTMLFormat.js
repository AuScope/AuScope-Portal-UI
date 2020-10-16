var Utils = require('../utils.js');

describe('ERLite: MineView', function() {
  it('should add MineView layer to map', function() {
    var EC = protractor.ExpectedConditions;
    var ERLite = element(by.cssContainingText('.layerGroup', 'Earth Resources Lite(new)'));
    // wait for layers to load up
    browser.wait(EC.visibilityOf(ERLite), 30 * 1000);
    // Click on ERML Lite 
    ERLite.click();
    // expect to see the list of layers
    let list = ERLite.all(by.className('layer'));
    expect(list.count()).toBe(3); 
    var mineView = list.get(0);
    expect(mineView.getText()).toBe('Mine View');
    expect(list.get(1).getText()).toBe('Mineral Occurrence');
    expect(list.get(2).getText()).toBe('Commodity Resource');
    // click on MineView layer
    mineView.click();
    // find "Add Layer" button and click
    var addLayerButton =  mineView.element(by.buttonText('Add Layer'));
    browser.wait(EC.visibilityOf(addLayerButton), 5 * 1000);
    addLayerButton.click();
    // click on a pixel in WA
    // the point to test: lon lat = 115.3181226988 -26.646237226 in EPSG:4283
    // Get dimension of the canvas and then convert to pixel (x,y)
    var canvas = $('canvas');
    let canvasWidth = canvas.getAttribute('width');
    let canvasHeight = canvas.getAttribute('height');

    protractor.promise.all([canvasWidth, canvasHeight]).then(function(canvasSize) {
      // let pixel = Utils.utils.pixelsToMoveFromMiddle(115.3181226988, -26.646237226, 
      //   canvasSize[0], canvasSize[1]) 
      Utils.utils.clickCanvas(canvas, -202, 8);
    });    
    browser.sleep(30000);
    

    // check that pop up appears
    // check the pop up contents
    // click on a WFS link on the pop up
    // check that another pop up appears
    // check the contents of the second pop up
    // click on a couple of links on the second pop up
    // click on a third party link on the pop up
    // check that it redirects
    
  });
});