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

## Los dictámenes que esperan: *separar la paja del trigo*

Evaluación del 19/11/2026, sobre la base de `observatorio-csjn` con dictámenes hasta el 27/10/2026. Hay **5.075
dictámenes** de la Procuración General (2015–2026) para los que no encontramos una decisión posterior de la Corte.

Muchos de ellos no son casos de fondo que la Corte tenga sin resolver. Son contiendas de competencia, quejas del
Ministerio Público Fiscal en series penales tributarias, causas repetidas o trámites menores. Lo que la Corte
resuelve en esos casos rara vez llega a la base de fallos, así que contarlos como «esperando», si bien técnicamente cierto, no describe adecuadamente a los casos más importantes.

### Cómo se clasificaron

Cada dictamen va al **primer** grupo cuya regla cumple, en este orden. Las reglas miran las voces del dictamen, la
carátula y la cámara de origen. 

1. **Competencia.** La primera voz menciona «competencia» o «inhibitoria». Incluye las contiendas entre tribunales
   y la competencia originaria de la Corte.
2. **Mantenimiento, penal tributario.** Las voces dicen «mantenimiento del recurso»: la Procuración mantiene la
   queja de un fiscal. Además se cumple alguna de estas condiciones:
   - la carátula menciona las leyes 24.769 o 27.430, lo tributario, un contribuyente, contrabando o aduana, o un
     legajo de apelación o casación;
   - la causa viene de la Cámara en lo Penal Económico (CPE).
3. **Mantenimiento, otros.** El resto de los «mantenimiento del recurso».
4. **Series del mismo día.** Cinco o más dictámenes firmados el mismo día con las mismas tres primeras voces. Por
   ejemplo, 335 dictámenes de 2026 sobre el aumento de cuotas de prepagas y obras sociales por decreto de necesidad y
   urgencia.
5. **Trámite menor.** Las voces son medidas para mejor proveer, cuestión abstracta, inoficiosidad, desistimiento,
   caducidad, recusación o excusación, o beneficio de litigar sin gastos. También cuando la única voz es
   «recurso extraordinario».
6. **Penal, otros.** La carátula habla de imputados, incidentes, legajos, hábeas corpus, excarcelación, prisión,
   estupefacientes o contrabando.
7. **Resto.**

### Resultado

| Grupo | Dictámenes | Firmados hace menos de un año | Hace más de un año |
|---|---:|---:|---:|
| Competencia | 1.796 | 808 | 988 |
| Mantenimiento, penal tributario | 748 | 13 | 735 |
| Mantenimiento, otros | 566 | 110 | 456 |
| Series del mismo día | 568 | 452 | 116 |
| Trámite menor | 324 | 120 | 204 |
| Penal, otros | 74 | 44 | 30 |
| Resto | 999 | 330 | 669 |
| **Total** | **5.075** | **1.877** | **3.198** |

- **Inflación: 4.002 dictámenes** (79 %), los grupos 1 a 5.
  - Las series no son paja del todo, pero basta con seguir un caso por serie: su caso testigo (ver abajo).
- **Dudosos: 74 dictámenes**, el grupo «Penal, otros». Pueden ser casos de fondo, pero la regla sólo mira la
  carátula.
- **Casos de fondo sin decisión: 999.**
  - 330 se firmaron hace menos de un año, una espera normal.
  - **669 llevan más de un año.** Son los candidatos a revisar a mano en el PJN.
  - Por motivo: 455 sin rastro en la base de decisiones; 128 con decisiones anteriores al dictamen, pero ninguna
    posterior; 86 con alguna voz de competencia que no es la primera.
  - Por año de firma: 2015, 26; 2016, 26; 2017, 46; 2018, 26; 2019, 31; 2020, 23; 2021, 47; 2022, 46; 2023, 94;
    2024, 149; 2025, 155.

### Series y casos testigo

Las series se calculan sobre **todos** los dictámenes, decididos o no (`pgn.series` en `observatorio-csjn`). La
regla es la del grupo 4: cinco o más dictámenes del mismo día con las mismas tres primeras voces. Cada serie se
identifica por la fecha y un número de orden: `2026-06-19-1` es la primera serie del 19/06/2026.

De cada serie se elige un **caso testigo**, el que hay que seguir:

1. el primer caso de la serie que la Corte decidió;
2. si no decidió ninguno, el de número de expediente más antiguo (año y número).

| | |
|---|---:|
| Series | 585 |
| Dictámenes en alguna serie | 7.543 |
| De ellos, sin decisión encontrada | 1.995 |
| Series cuyo testigo ya fue decidido | 524 |
| Series cuyo testigo sigue esperando | 61 |

En 524 series la Corte ya decidió al menos un caso. Los 1.995 dictámenes de series que siguen sin decisión se reducen
a **61 casos testigo** para seguir. El resto probablemente se decidió igual que su testigo, o se decidirá así.

**En el sitio:**

- cada caso de una serie dice «serie de N dictámenes del dd/mm/aaaa»; un clic deja sólo esa serie, con un recuadro
  que la describe;
- el testigo dice «caso testigo de la serie»;
- los demás tienen un enlace «caso testigo: <expediente>», que lo abre;
- el filtro **Series** ofrece «un caso por serie» (cada serie cuenta una vez, por su testigo), «solo los de una serie»
  y «fuera de las series».

En los CSV, las columnas son `serie`, `serie_n` y `serie_testigo`.

**Límite:** una misma cuestión firmada en días distintos forma series distintas. Los amparos por el aumento de
cuotas por decreto son seis series de 2026: 162 dictámenes el 19/06, 16 el 08/07, 26 el 11/08, 60 el 15/09, 41
el 07/10 y 13 el 15/10.

### Límites

- **Las reglas no se controlaron a mano.** De la revisión manual sólo hay 2 resultados cargados, así que no hay una
  medida de cuántos dictámenes de cada grupo están mal clasificados. Antes de citar las cifras conviene revisar
  una muestra de cada grupo.
- **«Paja» no quiere decir «decidido».** Quiere decir que no es un caso de fondo cuya espera interese medir.
  Algunos de esos expedientes pueden seguir abiertos.
- **De esta clasificación, sólo las series están en el sitio y en los CSV.** Los demás grupos no: ahí cada dictamen
  tiene su motivo («Por qué espera»).
