const { exitCode } = require('process');
const { browser } = require('protractor');
const { updateArrayBindingPattern } = require('typescript');
var Utils = require('../utils.js');

describe('ERLite: MineView', function () {

  const MINEVIEW_ID = 'http://pid.geoscience.gov.au/id/feature/ga/erl/mineview/334127';
  const MINEVIEW_FEATURE_ID = 'ga.erl.mineview.334127';
  const MINE_STATUS = 'http://resource.geosciml.org/classifier/cgi/mine-status/retention';
  const MINE_ID = 'http://pid.geoscience.gov.au/id/feature/ga/er/mine/334127';
  const POINT_COORD = '115.3181226988 -26.646237226';
  const POINT_GEOM = 'POINT (-26.646237226 115.3181226988)';
  
  /**
   *  This function checks the contents of ERLite: MineView popup.
   *  We do this twice so I made a function to check MineView pop up
   */
  var checkMineViewPopup = function () {
    element.all(by.className('our_row')).then(function (arr) {
      expect(arr.length).toBe(16);
      // wait for pop up to finish loading
      browser.wait(Utils.constants.EC.visibilityOf(arr[15]), 5 * 1000);

      expect(arr[0].getText()).toBe('Identifier');
      expect(arr[1].getText()).toBe(MINEVIEW_ID);

      expect(arr[2].getText()).toBe('Name');
      expect(arr[3].getText()).toBe('Talisker');

      expect(arr[4].getText()).toBe('Status');
      expect(arr[5].getText()).toBe('mineral deposit');

      expect(arr[6].getText()).toBe('Observation Method');
      expect(arr[7].getText()).toBe('method unknown');

      expect(arr[8].getText()).toBe('Positional Accuracy');
      expect(arr[9].getText()).toBe('999 metres');

      expect(arr[10].getText()).toBe('Status');
      expect(arr[11].getText()).toBe(MINE_STATUS);

      expect(arr[12].getText()).toBe('Specification');
      expect(arr[13].getText()).toBe(MINE_ID);

      expect(arr[14].getText()).toBe('Shape');
    });
  }
  it('should test MineView layer and HTML pop ups', function () {
    var ERLite = element(by.cssContainingText('.layerGroup', 'Earth Resources Lite(new)'));
    // wait for layers to load up
    browser.wait(Utils.constants.EC.visibilityOf(ERLite), 10 * 1000);
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
    var addLayerButton = mineView.element(by.buttonText('Add Layer'));
    browser.wait(Utils.constants.EC.visibilityOf(addLayerButton), 5 * 1000);
    addLayerButton.click();
    // click on a pixel in WA
    // the point to test: lon lat = 115.3181226988 -26.646237226 in EPSG:4283
    var canvas = $('canvas');
    Utils.utils.clickCanvas(canvas, -202, 8);

    // let canvasWidth = canvas.getAttribute('width');
    // let canvasHeight = canvas.getAttribute('height');

    // protractor.promise.all([canvasWidth, canvasHeight]).then(function(canvasSize) {
    //   // let pixel = Utils.utils.pixelsToMoveFromMiddle(115.3181226988, -26.646237226, 
    //   //   canvasSize[0], canvasSize[1]) 
    // });  

    // check that pop up appears
    // there are 2 app-querier-modal-window. The first one seems to be a placeholder and 
    // is empty. So you get the second one.
    let popup = element.all(by.tagName('app-querier-modal-window')).get(1);
    expect(popup.isDisplayed()).toBe(true);
    // expand the pop up
    var rows = popup.all(by.className('accordion-link'));
    // there should only be 1 feature
    expect(rows.count()).toBe(1);
    expect(rows.get(0).getText()).toBe(MINEVIEW_FEATURE_ID);
    rows.get(0).click();
    // wait for the pop up to finish loading
    browser.wait(Utils.constants.EC.visibilityOf(
      popup.all(by.className('our_row')).get(15), true), 5000);
    // check pop up contents    
    checkMineViewPopup();
    // for some reason the SHAPE format is different     
    expect(element.all(by.className('our_row')).get(15).getText())
      .toBe(POINT_COORD);
    // check "View As EarthResourceML"
    let viewAsXML = popup.element(by.linkText('EarthResourceML Lite'));
    viewAsXML.click();
    browser.getAllWindowHandles().then(function (popups) {
      browser.waitForAngularEnabled(false);
      browser.switchTo().window(popups[1]);
      expect(browser.getCurrentUrl()).toBe(
        Utils.constants.GA_WFS_GETFEATURE_URL.concat('&typeName=erl:MineView&featureId=')
            .concat(MINEVIEW_FEATURE_ID));
      browser.close();
      browser.waitForAngularEnabled(true);
      browser.switchTo().window(popups[0]);
    });

    // check normal pop up
    let status = popup.element(by.linkText(MINE_STATUS));
    status.click();
    browser.getAllWindowHandles().then(function (popups) {
      browser.waitForAngularEnabled(false);
      browser.switchTo().window(popups[1]);
      expect(browser.getCurrentUrl()).toBe(Utils.constants.GA_VOCAB_URI.concat(MINE_STATUS));
      browser.close();
      browser.waitForAngularEnabled(true);
      browser.switchTo().window(popups[0]);
    });

    // check WFS pop up
    let identifier = popup.element(by.linkText(MINEVIEW_ID));
    identifier.click();
    browser.getAllWindowHandles().then(function (popups) {
      browser.waitForAngularEnabled(false);
      browser.switchTo().window(popups[1]);
      checkMineViewPopup();
      expect(element.all(by.className('our_row')).get(15).getText())
        .toBe(POINT_GEOM);
      // now click on the er:Mine link on the second pop up
      let specification = element(by.linkText(MINE_ID));
      specification.click();
    }).then(function (popups) {
      // er:Mine popup shows er:Mine and er:MiningFeatureOccurrence
      let tables = element.all(by.tagName('table'));
      tables.then(function (arr) {
        expect(arr.length).toBe(2);
      });
      // ERML Mine table
      tables.get(0).all(by.tagName('td')).then(function (arr) {
        expect(arr.length).toBe(10);
        expect(arr[0].getText()).toBe('EarthResourceML - Mine');
        expect(arr[1].getText()).toBe('View As: EarthResourceML');
        expect(arr[2].getText()).toBe('Mine Name:');
        expect(arr[3].getText()).toBe('Talisker');
        expect(arr[4].getText()).toBe('Mine Id:');
        expect(arr[5].getText()).toBe(MINE_ID);
        expect(arr[6].getText()).toBe('Status:');
        expect(arr[7].getText()).toBe('undeveloped');
        expect(arr[8].getText()).toBe('Source Reference:');
        expect(arr[9].getText()).toBe('');
      });
      // ERML Mining Feature Occurrence table
      tables.get(1).all(by.tagName('td')).then(function (arr) {
        expect(arr.length).toBe(8);
        expect(arr[0].getText()).toBe('EarthResourceML - Mining Feature Occurrence');
        expect(arr[1].getText()).toBe('');
        expect(arr[2].getText()).toBe('Observation Method:');
        expect(arr[3].getText()).toBe('method unknown');
        expect(arr[4].getText()).toBe('Positional Accuracy:');
        expect(arr[5].getText()).toBe('999.0 (m)');
        expect(arr[6].getText()).toBe('Shape:');
        expect(arr[7].getText()).toBe(POINT_COORD);
      });
    });
  })
})