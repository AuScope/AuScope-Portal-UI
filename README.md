[![Build status](https://github.com/AuScope/AuScope-Portal-UI/actions/workflows/build-prod-release.yml/badge.svg)](https://github.com/AuScope/AuScope-Portal-UI/actions/workflows/build-prod-release.yml)
# AuScope-Portal-UI

User Interface component for the [AuScope Discovery Portal](http://portal.auscope.org.au/) 

This project was generated with the [Angular CLI](https://github.com/angular/angular-cli).  It is now on version 20 of Angular.  For best results compile with Angular 20, node 24.10 and npm 11.6

## Prerequisites

Install node v24.10 https://nodejs.org/en/download/ 
Install npm v11.6 `npm install -g npm@11` 
install the Angular CLI v20 `npm install -g @angular/cli@20`

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running Integration/Regression Tests

### Setup
```
npm install
npx playwright install chromium   # installs the Playwright browser
```

### Run end-to-end

* Uses headless Playwright/Chromium to open the portal UI and verify layers load on the map

```
npm run test:live:e2e           # tests dev portal
npm run test:live:e2e:prod      # tests prod portal

# Test a single layer by ID
npm run test:live:e2e -- --layer <layerId>

# Headed browser (visible window)
npm run test:live:e2e -- --headed

# Stop on first failure
npm run test:live:e2e -- --failfast

# Adjust concurrency / timeout
npm run test:live:e2e -- --concurrency 1 --timeout 30000
```

### Run WMS/WFS tests

* Tests WMS/WFS endpoints by making HTTP requests directly (no browser needed)

```
# Against the dev portal
npm run test:live

# Against production
npm run test:live:prod

# Useful flags
npm run test:live -- --layer nvcl-v2-borehole     # test one layer
npm run test:live -- --type wms --concurrency 10  # WMS only, faster
npm run test:live -- --failfast --timeout 10000   # stop on first failure
```


## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
