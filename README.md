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

## Producción en cPanel

Esta app requiere soporte de Node.js en cPanel. No basta con subirla a `public_html` como si fuera PHP o HTML estático.

En cPanel, buscar una opción similar a:

- `Setup Node.js App`
- `Node.js Selector`
- `Application Manager`
- `NodeJS`

El nombre exacto depende del proveedor de hosting.

## Producción con SSH

### 1. Crear base de datos MySQL

En cPanel:

1. Crear base de datos, por ejemplo:

```text
cpaneluser_content_studio
```

2. Crear usuario MySQL, por ejemplo:

```text
cpaneluser_content_user
```

3. Asignar el usuario a la base de datos con permisos completos.

No usar `root` en producción.

### 2. Subir archivos

Ruta recomendada:

```text
/home/USUARIO/nodeapps/instagram-content-studio
```

Evitar poner `server.js`, `node_modules`, datos internos o credenciales directamente dentro de `public_html`.

### 3. Instalar dependencias

Por SSH:

```bash
cd /home/USUARIO/nodeapps/instagram-content-studio
npm install --omit=dev
```

### 4. Configurar variables de entorno

En el panel Node.js de cPanel o por entorno:

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=cpaneluser_content_user
DB_PASSWORD=CLAVE_SEGURA
DB_NAME=cpaneluser_content_studio
NODE_ENV=production
```

En cPanel normalmente no debes fijar manualmente el puerto público. El panel Node.js asigna el puerto interno y crea el proxy.

### 5. Configurar aplicación Node.js en cPanel

Ejemplo de configuración:

- Node.js version: `18`, `20` o superior.
- Application mode: `production`.
- Application root: `nodeapps/instagram-content-studio`.
- Application URL: subdominio o ruta pública elegida.
- Application startup file: `server.js`.
- Passenger log file: opcional, según hosting.

Luego ejecutar:

```bash
npm install
```

Y reiniciar la app desde cPanel.

### 6. Verificar logs

Revisar:

- Logs de Node.js/Passenger desde cPanel.
- `stderr.log` o logs equivalentes del proveedor.
- Consola del navegador.

Al arrancar correctamente debería verse algo equivalente a:

```text
Storage: MySQL cpaneluser_content_studio
Instagram Content Studio: http://localhost:PUERTO
```

## Producción sin SSH

Si el hosting no permite SSH pero sí tiene `Setup Node.js App`:

### 1. Preparar ZIP local

Comprimir el proyecto sin carpetas pesadas o temporales:

Incluir:

- `server.js`
- `package.json`
- `package-lock.json`
- `public/`
- `resources/`
- `sample-content.json`
- `README.md`

Opcional:

- `data/state.json` si quieres migrar estado inicial.
- `exports/` si quieres subir exportaciones existentes.

Excluir:

- `node_modules/`
- `server-test.out`
- `server-test.err`
- archivos temporales.

### 2. Subir por File Manager

En cPanel:

1. Abrir `File Manager`.
2. Crear carpeta fuera de `public_html`, por ejemplo:

```text
/home/USUARIO/nodeapps/instagram-content-studio
```

3. Subir el `.zip`.
4. Extraerlo.

### 3. Crear app Node.js

En `Setup Node.js App`:

- Application root: `nodeapps/instagram-content-studio`.
- Startup file: `server.js`.
- Node version: `18+`.
- Application mode: `production`.

### 4. Instalar dependencias desde cPanel

Muchos cPanel tienen botón:

```text
Run NPM Install
```

Usarlo para instalar `mysql2`.

Si tu cPanel no tiene esa opción y tampoco SSH, debes subir `node_modules/` desde tu PC. No es ideal, pero funciona si el servidor usa una plataforma compatible con tu instalación local.

### 5. Configurar variables de entorno

En la pantalla de la app Node.js, agregar:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=cpaneluser_content_user
DB_PASSWORD=CLAVE_SEGURA
DB_NAME=cpaneluser_content_studio
NODE_ENV=production
```

No subir credenciales dentro del código.

### 6. Reiniciar app

Usar:

```text
Restart App
```

Luego abrir la URL configurada en cPanel.

## Configuración de dominio o subdominio

Recomendado:

```text
studio.tudominio.cl
```

O:

```text
tudominio.cl/content-studio
```

Subdominio suele ser más limpio para aplicaciones Node.js en cPanel.

## Seguridad en producción

Obligatorio:

- No usar usuario MySQL `root`.
- No usar contraseña vacía.
- Usar HTTPS.
- No publicar `data/`, `exports/` o backups si contienen información privada.
- Restringir acceso si la herramienta será interna.
- Usar contraseñas fuertes en MySQL.
- Hacer backups de base de datos y carpeta `exports/`.

Pendiente recomendado:

- Agregar login de usuario.
- Agregar roles por cliente.
- Mover logos/fondos grandes a archivos físicos en vez de Data URL en MySQL.
- Limitar tamaño máximo de imágenes cargadas.
- Validar tipos MIME de imágenes.
- Agregar limpieza de exportaciones antiguas.

## Limitaciones actuales

- No hay autenticación de usuarios.
- Los logos y fondos pueden guardarse como Data URL en MySQL, lo que puede hacer crecer la base de datos.
- La edición es por plantillas, no por capas libres tipo Canva.
- La exportación está orientada a posts cuadrados `1080x1080`.
- El fallback `data/state.json` existe para seguridad, pero en producción la fuente principal debe ser MySQL.

## Recomendaciones para siguiente versión

- Login básico con sesión.
- Panel de clientes.
- CRUD completo de fondos y logos.
- Borrado/duplicado/reordenamiento de láminas.
- Exportación ZIP de carrusel completo.
- Plantillas por rubro.
- Guardar assets como archivos físicos:

```text
storage/clients/{clientId}/logos/
storage/clients/{clientId}/backgrounds/
storage/exports/
```

- Usar MySQL solo para metadatos y rutas.
- Agregar endpoint de subida de archivos.
- Agregar modo historia `1080x1920`.
- Agregar autenticación si se publica en internet.

## Troubleshooting

### La app carga pero no guarda cambios

Revisar:

- Que MySQL esté activo.
- Que las variables `DB_*` estén correctas.
- Que el usuario tenga permisos sobre la base.
- Logs de Node.js en cPanel.

### En F5 se pierde todo

Significa que `POST /api/state` no está guardando correctamente.

Revisar:

- Consola del navegador.
- Respuesta de `/api/state`.
- Logs del servidor.
- Que la tabla `clients` y `projects` tenga registros.

### `mysql2 dependency not installed`

Ejecutar:

```bash
npm install
```

O en cPanel usar:

```text
Run NPM Install
```

### `MySQL unavailable, using file storage`

La app no pudo conectar a MySQL y volvió a `data/state.json`.

Revisar:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

### Exportar imagen no funciona

Revisar:

- Consola del navegador.
- Caja de estado dentro de la app.
- Permisos de escritura en carpeta `exports/`.
- Que el servidor esté corriendo con Node.js.

### Error por tamaño de imagen o payload

Actualmente el backend limita payloads a aproximadamente `60 MB`.

Si se cargan fondos muy pesados:

- Reducir imagen antes de subir.
- Usar JPG optimizado.
- Evitar fondos de varios MB.

## Comandos útiles

### Desarrollo local

```bash
npm install
npm start
```

### Probar conexión MySQL desde Node

```bash
node -e "const mysql=require('mysql2/promise');(async()=>{const db=await mysql.createConnection({host:'127.0.0.1',user:'root',password:'',database:'content_studio'}); console.log('ok'); await db.end();})().catch(e=>{console.error(e.message); process.exit(1);})"
```

### Validar sintaxis

```bash
node --check server.js
node --check public/app.js
```

## Checklist antes de producción

- [ ] Crear base MySQL en cPanel.
- [ ] Crear usuario MySQL con clave segura.
- [ ] Configurar variables `DB_*`.
- [ ] Instalar dependencias con `npm install`.
- [ ] Confirmar que cPanel ejecuta `server.js`.
- [ ] Confirmar que `/api/state` responde.
- [ ] Confirmar que clientes/proyectos se guardan.
- [ ] Confirmar que exportaciones se generan.
- [ ] Activar HTTPS.
- [ ] Restringir acceso o agregar login antes de uso público.

