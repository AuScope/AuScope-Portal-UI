# This Dockerfile builds a docker image of AuScope Portal API
# A static Angular website served by apache2
#
# First image, build angular app
FROM node:14.17.6-alpine as node

ENV appdir /usr/src/app

WORKDIR ${appdir}

# Build type. Can be one of: build-dev, build-prod, build-test
ARG BUILDTYPE=build-dev
# Build tag for the portal-core-ui-app repository
ARG PCUIBUILDTAG=master

# Install git to download portal-core-ui
RUN apk update && \
    apk upgrade && \
    apk add git python2 g++ make

RUN npm install -g npm@7

RUN npm --version && node --version

RUN git clone https://github.com/AuScope/portal-core-ui-app.git && \
    cd portal-core-ui-app && \
    echo "Checking out: $PCUIBUILDTAG" && \
    git checkout $PCUIBUILDTAG && \
    npm install && \
    npm run build portal-core-ui && \
    cd dist/portal-core-ui && \
    npm link

# Copy in auscope-portal-ui repository
COPY . ./

# Install required npm packages
RUN npm install

# Alter panel to show build date & time
COPY docker/make_timestamp.sh make_timestamp.sh
RUN ./make_timestamp.sh $BUILDTYPE > ./src/app/menupanel/portal-details-panel/portal-details-panel.component.html

# Link in correct version of portal-core-ui and build Angular's static website files
RUN npm link @auscope/portal-core-ui && npm run $BUILDTYPE

# Second image, install website
FROM debian:bullseye-20230227

ENV appdir /usr/src/app

WORKDIR ${appdir}

# Copy in the static website files from first image
COPY --chown=www-data:www-data --from=node /usr/src/ng /var/www/html/

# Website set up
COPY docker/000-default.conf /etc/apache2/sites-enabled/

## Install apache2
RUN apt update && \
    apt upgrade -y && \
    apt install -y apache2


CMD ["/usr/sbin/apache2ctl","-D","FOREGROUND"]

EXPOSE 80
