# Observatorio CSJN (sitio público)

Sitio estático (Hugo) con la sección de dictámenes del Observatorio CSJN: cuánto tarda la Corte Suprema en decidir
un caso después de que dictamina la Procuración General. Se publica en GitHub Pages
(`https://ramiroau.github.io/observatoriocsjn/`) en cada push a `main` (`.github/workflows/pages.yml`).

## Actualizar
```sh
./publicar.sh    # datos desde ../observatorio-csjn, archivos compartidos desde ../sitio-csjn, compila en public/
python3 -m http.server 1314 --directory public   # revisar en http://localhost:1314/observatoriocsjn/ (ver abajo)
git add -A && git commit -m "Datos al <fecha>" && git push
```
Para revisar localmente con la ruta base, compilar con `hugo --baseURL http://localhost:1314/` y servir `public/`.

## Qué hay
- `layouts/home.html`: la página de dictámenes (copia de `sitio-csjn/layouts/dictamenes/section.html`, sin el
  enlace a las páginas de los fallos, que este sitio no tiene).
- `content/_index.md`, `static/data/dictamenes.json` y `.csv`: los escribe `csjn dictamenes-sitio`.
- `static/js/dictamenes.js`, `d3.min.js` (v7.9.0) y `static/css/sitio.css`: copiados de `sitio-csjn` por
  `sincronizar.sh`; se editan allá.
- `content/acerca.md`: escrito a mano.
