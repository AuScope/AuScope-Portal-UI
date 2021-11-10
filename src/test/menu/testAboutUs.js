describe('Menu: About Us', function() {
  it('should redirect to AuScope website', function() {
    var aboutUs = element(by.className('ti-home'));
    aboutUs.click();
    expect(browser.driver.getCurrentUrl()).toEqual("https://www.auscope.org.au/");
  });
});