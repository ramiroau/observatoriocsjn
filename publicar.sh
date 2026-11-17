#!/bin/sh
# Regenera los datos desde la base del observatorio, copia los archivos compartidos y compila el sitio en public/
# para comprobarlo. No publica: después, revisar y hacer commit y push (GitHub Pages compila y publica solo).
set -e
OBS="${OBS:-../observatorio-csjn}"
"$OBS/.venv/bin/csjn" dictamenes-sitio --db "$OBS/data/csjn.db" --out .
./sincronizar.sh
hugo --gc --minify --cleanDestinationDir
git status --short
