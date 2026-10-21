# Instagram Content Studio

Editor local/web para crear contenido visual de Instagram con plantillas, clientes, logos, fondos, textos importados por JSON y exportación de imágenes `1080x1080`.

La app está pensada para trabajar primero en local y luego publicarse en un hosting con cPanel que soporte aplicaciones Node.js.

## Estado actual

- Tipo de app: Node.js + frontend HTML/CSS/JavaScript.
- Backend: `server.js`.
- Frontend: `public/`.
- Base de datos principal: MySQL.
- Fallback de respaldo: `data/state.json`.
- Exportaciones de imágenes: carpeta `exports/` y tabla `exports`.
- Recursos estáticos de marca: `resources/`.
- Puerto local por defecto: `4173`.

## Documentacion viva

- Bitacora de avances: `docs/bitacora-progreso.md`
- Mapa operativo de la app: `docs/mapa-app.md`

## Funciones principales

- Crear y editar clientes.
- Guardar colores de marca por cliente.
- Guardar logo por cliente.
- Guardar biblioteca de fondos por cliente.
- Crear proyectos/carruseles.
- Crear láminas `1080x1080`.
- Usar plantillas predefinidas:
  - `cover-tech`
  - `tip-editorial`
  - `checklist`
  - `cta`
  - `free`
- Ajustar tamaño de texto por lámina:
  - `compact`
  - `balanced`
  - `hero`
- Activar/desactivar decoraciones visuales por lámina.
- Importar textos desde JSON.
- Exportar proyecto actual como JSON.
- Exportar lámina actual como JPG/PNG.
- Exportar carrusel completo.
- Autoguardado de clientes, proyectos, logos, fondos y textos.

## Requisitos locales

- Node.js `18` o superior.
- MySQL o MariaDB.
- Navegador moderno.
- En Windows local, WAMP puede usarse para MySQL/phpMyAdmin, pero la app corre con Node.js, no con Apache directamente.

## Instalación local

Desde la carpeta de la app:

```bash
cd D:\wamp64\www\instagram-content-studio
npm install
npm start
```

Abrir:

```text
http://localhost:4173
```

## Variables de entorno

La app usa estas variables:

```bash
PORT=4173
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=content_studio
```

Valores por defecto en desarrollo:

- `PORT`: `4173`
- `DB_HOST`: `127.0.0.1`
- `DB_PORT`: `3306`
- `DB_USER`: `root`
- `DB_PASSWORD`: vacío
- `DB_NAME`: `content_studio`

En producción no usar `root` ni contraseña vacía.

## Base de datos

Nombre local actual:

```text
content_studio
```

El servidor crea automáticamente estas tablas si no existen:

- `clients`
- `projects`
- `app_settings`
- `exports`

### Tabla `clients`

Guarda:

- ID del cliente.
- Nombre.
- Logo embebido como Data URL.
- Ruta opcional de logo.
- Colores de marca.
- Biblioteca de fondos en JSON.

### Tabla `projects`

Guarda:

- ID del proyecto.
- Cliente asociado.
- Nombre del proyecto/carrusel.
- Láminas en JSON.
- Fecha de actualización.

### Tabla `app_settings`

Guarda:

- Cliente activo.
- Proyecto activo.

### Tabla `exports`

Guarda:

- Proyecto asociado.
- Nombre de archivo.
- Ruta física.
- Imagen exportada como Data URL.
- Fecha de creación.

## Formato JSON para importar textos

La app acepta cualquiera de estas formas:

```json
{
  "name": "Carrusel ejemplo",
  "slides": []
}
```

```json
{
  "nombre": "Carrusel ejemplo",
  "laminas": []
}
```

```json
{
  "name": "Carrusel ejemplo",
  "posts": []
}
```

O un arreglo directo:

```json
[
  {
    "templateId": "cover-tech",
    "eyebrow": "Desarrollo web",
    "title": "Tu web debe vender, no solo existir",
    "body": "Una buena página guía, explica y convierte visitas en oportunidades.",
    "cta": "Guarda este checklist",
    "textScale": "balanced",
    "showDecorations": false
  }
]
```

Campos soportados por lámina:

- `templateId`: `cover-tech`, `tip-editorial`, `checklist`, `cta`, `free`.
- `eyebrow` o `antetitulo`.
- `title`, `titulo` o `headline`.
- `body`, `text`, `texto`, `description` o `descripcion`.
- `cta`, `firma` o `callToAction`.
- `textScale` o `tamanoTexto`: `compact`, `balanced`, `hero`.
- `showDecorations` o `decoraciones`: `true` o `false`.
- `backgroundId`: ID de un fondo ya guardado en biblioteca.
- `backgroundDataUrl`: fondo embebido como Data URL.

Archivo de ejemplo:

```text
sample-content.json
```

## Estructura de carpetas

```text
instagram-content-studio/
├─ data/
│  └─ state.json
├─ exports/
├─ public/
│  ├─ app.js
│  ├─ index.html
│  └─ styles.css
├─ resources/
│  └─ img/
│     └─ area3.png
├─ package.json
├─ package-lock.json
├─ sample-content.json
└─ server.js
```

## Archivos importantes

- `server.js`: servidor HTTP, API, MySQL, exportaciones y estáticos.
- `public/app.js`: lógica del editor, render, autosave, import/export JSON e imágenes.
- `public/index.html`: interfaz.
- `public/styles.css`: estilos del editor y plantillas visuales.
- `resources/img/area3.png`: logo inicial de Area3.
- `data/state.json`: respaldo local y migración inicial.
- `exports/`: imágenes generadas.

## Endpoints internos

### `GET /api/state`

Devuelve el estado completo de la app:

- Clientes.
- Proyecto activo.
- Proyectos.
- Láminas.
- Fondos.

### `POST /api/state`

Guarda el estado completo en MySQL y en `data/state.json`.

### `POST /api/export`

Recibe una imagen en Data URL y la guarda en:

- Carpeta `exports/`.
- Tabla `exports`.

## Flujo de ejecución

1. El navegador carga `public/index.html`.
2. `public/app.js` pide estado con `GET /api/state`.
3. El servidor carga desde MySQL si está disponible.
4. Si MySQL no está disponible, usa `data/state.json`.
5. Cada cambio relevante programa autoguardado con `POST /api/state`.
6. Al exportar, el navegador renderiza la lámina en un `canvas` de `1080x1080`.
7. El servidor guarda la imagen en `exports/` y registra la exportación en MySQL.



