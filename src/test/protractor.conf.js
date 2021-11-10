var env = require('./environment.js');
// conf.js
exports.config = {
  framework: 'jasmine',
  // if testing a single browser:
  // capabilities: {'browserName': 'chrome' },
  multiCapabilities: [{
    'browserName': 'firefox'
  }, {
    'browserName': "MicrosoftEdge"
  }, {
    'browserName': 'chrome'
  }],
  //If running locally, use webdriver-manager below
  seleniumAddress: 'http://localhost:4444/wd/hub',
  //If using remote selenium server, e.g. SauceLabs, enter credentials below:
  //Sauce Labs credentials
  //sauceUser: '',
  //sauceKey: '',
  // test everything by default
  specs: ['*/*'],
  
  onPrepare: function() {
    browser.driver.get(env.portalUrl);
  }
}