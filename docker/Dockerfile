# This Dockerfile builds a docker image of AuScope Portal API
# A static Angular website served by apache2
#
# First image, build angular app
FROM node:12.18-alpine as node

ENV appdir /usr/src/app

WORKDIR ${appdir}

# Build type. Can be one of: build-dev, build-prod, build-test
ARG BUILDTYPE=build-dev

# Install git to download portal-core-ui
RUN apk update && \
    apk upgrade && \
    apk add git

# Copy in npm package file
COPY project/package.json ./

# Install required npm packages
RUN npm install

# Copy all the other files
COPY project ./

# Alter panel to show build date & time
COPY docker/make_timestamp.sh make_timestamp.sh
RUN ./make_timestamp.sh $BUILDTYPE > ./src/app/menupanel/portal-details-panel/portal-details-panel.component.html

# Build Angular's static website files
RUN npm run $BUILDTYPE

# Second image, install website
FROM debian:10


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
