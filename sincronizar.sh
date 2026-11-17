#!/bin/sh
# Copia del sitio de trabajo (../sitio-csjn) los archivos que la página comparte con él.
set -e
SITIO="${SITIO:-../sitio-csjn}"
cp "$SITIO/static/js/dictamenes.js" "$SITIO/static/js/d3.min.js" static/js/
cp "$SITIO/static/css/sitio.css" static/css/
