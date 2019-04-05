import 'hammerjs';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

if (environment.googleAnalyticsKey) {
  const gtagscript = document.createElement('script');
  gtagscript.src = 'https://www.googletagmanager.com/gtag/js?id=' + environment.googleAnalyticsKey;
  gtagscript.async = true;
  document.head.appendChild(gtagscript);
  const gtaginitscript = document.createElement('script');
  gtaginitscript.innerHTML = 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag(\'js\', new Date());gtag(\'config\', \'' +
  environment.googleAnalyticsKey + '\');';
  document.head.appendChild(gtaginitscript);
}


platformBrowserDynamic().bootstrapModule(AppModule);
