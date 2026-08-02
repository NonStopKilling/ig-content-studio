# Biblioteca lateral de fondos y rediseño de láminas

## Contexto

Instagram Content Studio ya permite guardar fondos por cliente, asignarlos a una lámina y exportar posts cuadrados `1080x1080`. Hoy esa biblioteca se expone como un `select`, por lo que las imágenes no son visibles durante la edición. Además, las plantillas actuales cumplen la función básica, pero el diseño puede sentirse más utilitario que publicable.

La dirección aprobada es hacer que los fondos sean protagonistas: la biblioteca debe ser visible, compuesta solo por imágenes subidas por cliente, y las plantillas deben verse más atractivas sin perder la estructura actual del editor.

## Objetivos

- Mostrar una biblioteca lateral de fondos visibles para el cliente activo.
- Permitir aplicar un fondo a la lámina actual desde miniaturas, sin depender de un `select`.
- Mantener la biblioteca limitada a fondos subidos por el usuario para cada cliente.
- Rediseñar las láminas para que las imágenes de fondo tengan más presencia.
- Mantener consistencia entre la previsualización DOM y la exportación canvas.
- Conservar las plantillas existentes: `cover-tech`, `tip-editorial`, `checklist`, `cta` y `free`.

## Fuera de alcance

- Biblioteca inicial de imágenes incluidas con la app.
- Categorías, etiquetas, búsqueda o filtros avanzados de fondos.
- Drag and drop entre fondos y láminas.
- Rediseño completo del backend o cambio de almacenamiento a archivos físicos.
- Plantillas nuevas por rubro.
- Autenticación, permisos o multiusuario.

## Diseño de interfaz

La zona central del editor pasará a tener cuatro áreas principales:

- Barra/lista de láminas del proyecto.
- Biblioteca lateral de fondos del cliente activo.
- Escenario central con la lámina actual.
- Inspector de ajustes de la lámina.

La biblioteca lateral mostrará una grilla de miniaturas cuadradas. Cada miniatura debe indicar si está aplicada a la lámina activa. El estado vacío debe invitar a subir el primer fondo sin agregar texto explicativo largo dentro de la app.

El control actual de carga de fondo se moverá o duplicará dentro de esa biblioteca. El inspector puede conservar un control mínimo para quitar fondo, pero la selección principal debe ocurrir visualmente desde las miniaturas.

## Diseño visual de láminas

La estética base será "imagen protagonista": fotos o fondos visibles, con overlays para legibilidad, marco o detalle de marca, y jerarquía tipográfica más fuerte. Las tres líneas visuales aprobadas se combinarán así:

- Imagen protagonista como base para todas las plantillas con fondo.
- Editorial premium para plantillas educativas como `tip-editorial` y `checklist`.
- Tech con autoridad para `cover-tech` y `cta`.

Los fondos deben verse más que en la versión actual. En vez de cubrirlos con opacidad muy baja, cada plantilla aplicará overlays selectivos: degradados laterales, bandas, marcos, tintes de marca y sombras de texto controladas.

## Comportamiento

Al hacer click en una miniatura de fondo:

- Se asigna `slide.backgroundId` al ID de ese fondo.
- Se limpia `slide.backgroundDataUrl`.
- Se actualizan previsualización, lista/estado de biblioteca y autoguardado.

Al subir un nuevo fondo:

- Se agrega a `client.backgrounds`.
- Se asigna automáticamente a la lámina activa.
- La miniatura aparece seleccionada.
- El estado se guarda como hoy mediante `POST /api/state`.

Al quitar fondo:

- Se limpian `backgroundId` y `backgroundDataUrl`.
- La lámina vuelve a su fondo gráfico de plantilla.

## Arquitectura

La implementación debe mantenerse en los archivos actuales:

- `public/index.html`: nueva región para la biblioteca lateral.
- `public/app.js`: render de biblioteca, eventos de selección, estado activo y sincronización con lámina.
- `public/styles.css`: layout del editor, miniaturas de fondos y refresh visual de plantillas.

No se requiere cambiar `server.js` para esta versión, porque el modelo `client.backgrounds` ya existe y el endpoint `/api/state` guarda el estado completo.

Para reducir diferencias entre vista y exportación, los cambios visuales deben tener equivalentes en:

- `renderCanvas()` para DOM.
- `renderSlideToImage()` y funciones `draw*Slide()` para canvas.

## Datos

Se mantiene el modelo existente:

```json
{
  "id": "background-...",
  "name": "nombre-del-archivo",
  "dataUrl": "data:image/..."
}
```

No se agregan campos nuevos en esta etapa. Si en el futuro se necesitan categorías o metadatos, deben agregarse en otra iteración.

## Estados y errores

- Sin fondos: mostrar biblioteca vacía con acción para subir.
- Fondo seleccionado eliminado o inexistente: tratarlo como sin fondo.
- Archivo no seleccionado: no cambiar estado.
- Error de lectura de archivo: mostrar mensaje en `statusBox`.
- Error de guardado: conservar el mensaje de autoguardado existente.

## Validación

La validación mínima debe incluir:

- `node --check server.js`
- `node --check public/app.js`
- Revisión manual en navegador de:
  - Cliente sin fondos.
  - Subir fondo.
  - Aplicar fondo desde miniatura.
  - Quitar fondo.
  - Cambiar de lámina y ver selección correcta.
  - Exportar lámina actual y comparar con previsualización.

## Riesgos

- Las imágenes en Data URL pueden hacer crecer `data/state.json` o MySQL; este riesgo ya existe y no se amplía más allá de hacer la biblioteca más usable.
- La consistencia DOM/canvas exige duplicar parte del lenguaje visual. Si una plantilla se mejora solo en CSS, la exportación no coincidirá.
- En pantallas pequeñas, la biblioteca lateral debe colapsar o moverse bajo la lámina para no apretar el escenario.

## Criterios de aceptación

- El usuario puede ver los fondos del cliente activo como miniaturas.
- El usuario puede aplicar un fondo haciendo click en una miniatura.
- La miniatura activa se distingue claramente.
- El usuario puede subir un fondo y queda aplicado a la lámina actual.
- El usuario puede quitar el fondo de la lámina actual.
- Las láminas se ven más atractivas, con fondos más visibles y textos legibles.
- La imagen exportada conserva la misma intención visual que la previsualización.
