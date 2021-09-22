/**
 * Detects IE
 * @return version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
    const ua = window.navigator.userAgent;
    // Test values; Uncomment to check result …
    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
    // IE 12 / Spartan
    // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) '
    // 'Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
    // Edge (IE 12+)
    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
    // 'Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';
    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        const rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    return false;
}

if (detectIE()) {
    const html =
        '<div style="position: absolute; top: 0; left: 0; bottom: 0; right: 0; background-color: black; opacity: .85; z-index: 1000; padding-top: 150px;">' +
        '	<div class="coming-soon">' +
        '		<div class="coming-soon-content">' +
        '			<div style="text-align: center;">' +
        '				<img src="template/img/kisspng-dinosaur.png" width="250">' +
        '			</div>' +
        '			<p style="font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; font-size: 36px;">' +
        '				Sorry! Your Internet Explorer browser is not supported.' +
        '			</p>' +
        '			<p>' +
        '				<a class="btn btn-primary" href="https://www.google.com/chrome/" target="_blank" role="button">Chrome</a> &nbsp;' +
        '				<a class="btn btn-primary" href="https://www.mozilla.org/en-US/firefox/new/" target="_blank" role="button">Firefox</a> &nbsp;' +
        '				<a class="btn btn-primary" href="https://www.microsoft.com/en-au/windows/microsoft-edge" target="_blank" role="button">Edge</a>' +
        '			</p>' +
        '		</div>' +
        '	</div>' +
        '</div>';
    jQuery(document.body).append(html);
}
