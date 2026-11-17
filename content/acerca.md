+++
title = "Acerca"
+++

El **Observatorio CSJN** reúne datos públicos sobre la Corte Suprema de Justicia de la Nación. Esta primera
sección reconstruye una parte de su agenda: cuánto tarda la Corte en decidir un caso después de que dictamina la
Procuración General de la Nación.

## Por qué los dictámenes

La Corte no publica qué casos tiene pendientes. Antes de decidir muchos de ellos, da vista a la Procuración
General, que opina por escrito en un dictamen público y fechado. Un dictamen muestra que el caso está en la Corte y
en condiciones de ser decidido. Uniendo cada dictamen con la decisión de la Corte que le siguió en el mismo
expediente se puede medir la demora y ver qué casos siguen esperando.

## De dónde vienen los datos

- **Dictámenes:** el buscador de dictámenes del Ministerio Público Fiscal (`www.mpf.gob.ar`), desde 2015: fecha,
  expediente, carátula, quién lo firmó, voces y el PDF.
- **Decisiones:** el buscador de jurisprudencia de la Corte (`sjconsulta.csjn.gov.ar`): fecha, expediente,
  resultado y si la Corte remite al dictamen o a sus precedentes.

Los datos se recogieron con un programa propio, a un ritmo pausado, y se unieron por el número de expediente o,
cuando hace falta, por el texto de las decisiones y las copias de los dictámenes que la Corte guarda con ellas.
Cómo leerlos y qué significa cada categoría, en la [página principal](../#categorias).

## Límites

- «Esperando» quiere decir que no encontramos la decisión, no necesariamente que no exista: las demoras son, si
  acaso, cotas superiores.
- No es toda la agenda de la Corte: los casos que decide sin dar vista a la Procuración no aparecen.
- Los años recientes están incompletos por definición.

## Datos abiertos

Todos los datos de la página se pueden descargar en un solo archivo: [dictamenes.csv](../data/dictamenes.csv), una
fila por dictamen, con los enlaces al dictamen y a la decisión.
