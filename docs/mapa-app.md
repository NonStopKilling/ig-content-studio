# Mapa operativo de la app

## Objetivo
Documento vivo para no perder contexto tecnico y reducir dependencia del historial de chat.

## Stack
- Backend: Node.js (archivo principal `server.js`).
- Frontend: HTML/CSS/JS vanilla en `public/`.
- Persistencia principal: MySQL (`content_studio`).
- Fallback y respaldo local: archivos JSON en `data/`.

## Estructura clave
- `server.js`: servidor HTTP, API, autenticacion, sesiones, persistencia y exportaciones.
- `public/index.html`: portada de acceso + dashboard.
- `public/app.js`: flujo UI, login, editor, guardado, import/export.
- `public/styles.css`: layout y estilos.
- `data/state.json`: estado funcional de clientes/proyectos.
- `data/users.json`: respaldo local de usuarios.
- `exports/`: archivos de salida PNG/JPG.

## Arranque local
- Comando recomendado: `npm run dev`.
- Alternativa: `npm start`.
- URL local: `http://localhost:4173`.

## Autenticacion y sesiones
- Endpoints activos:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Cookie de sesion: `content_studio_session`.
- Sesiones en memoria de proceso (`Map` en backend).

## Usuario admin bootstrap
- Se crea automaticamente si no hay usuarios.
- Defaults de desarrollo:
  - usuario: `admin`
  - clave: `admin1234`
- Variables para sobreescribir:
  - `CONTENT_STUDIO_ADMIN_USER`
  - `CONTENT_STUDIO_ADMIN_PASSWORD`

## Donde vive cada dato
- Usuarios:
  - principal: tabla MySQL `users` (si DB activa).
  - respaldo: `data/users.json`.
- Estado editor (clientes/proyectos/laminas):
  - principal: MySQL (`clients`, `projects`, `app_settings`).
  - respaldo: `data/state.json`.
- Exportaciones:
  - archivos: `exports/`.
  - metadata: tabla `exports`.

## API activa hoy
- `GET /api/state` (requiere sesion).
- `POST /api/state` (requiere sesion).
- `POST /api/export` (requiere sesion).
- `GET /api/export/file/:fileName` (requiere sesion, descarga archivo exportado).
- `POST /api/auth/login`.
- `POST /api/auth/logout`.
- `GET /api/auth/me`.

## Estado funcional actual
- Implementado:
  - Login y bloqueo de dashboard por sesion.
  - Editor de laminas y proyectos por cliente.
  - Biblioteca privada de fondos por cliente.
  - Exportacion de imagenes y registro.
  - Exportacion WYSIWYG alineada al preview visual (snapshot del DOM) con fallback legacy.
  - CRUD visual de clientes en vista admin (crear, listar, seleccionar/editar y eliminar).
  - CRUD visual de usuarios con correo y rol en vista admin.
  - Sincronizacion UX: al editar cliente en admin, el formulario de usuarios hereda ese cliente por defecto.
  - Layout admin horizontal para ultra wide: lista de clientes + formulario de cliente en paralelo, usuarios debajo.
  - Feedback visible en panel admin para confirmar guardados.
  - Preview y miniatura de logo en CRUD de clientes.
  - Usuario cliente asignado automaticamente al cliente activo (sin selector manual redundante).
  - Cuenta cliente con edicion de marca habilitada (colores y logotipo).
  - Sistema de estados visuales con check/cruz para acciones exitosas o fallidas.
  - Pipeline de exportacion con `html2canvas` como primer motor para mayor fidelidad visual.
  - Captura al tamano visible del `postCanvas` y reescalado final a 1080x1080 para alinear preview/export.
  - Fallback final al renderer legacy para continuidad operativa cuando fallan motores de captura DOM.
  - `favicon.ico` local para evitar 404 de recurso en navegador.
  - Descarga de exportaciones via `fetch -> blob -> objectURL` para evitar el aviso `File wasn't available on site`.
- Pendiente para cierre fase 1:
  - CRUD admin de clientes.
  - CRUD admin de usuarios.
  - Galeria comun de fondos administrada por admin.
  - Cambio de clave desde panel de usuario.
  - Resumen admin por cliente con metricas.

## Regla de mantenimiento documental
- Cada bloque de cambios debe actualizar:
  - `docs/bitacora-progreso.md` (que paso hoy).
  - `docs/mapa-app.md` (estado estructural vigente).
- Si un cambio afecta autenticacion, almacenamiento o API, actualizar ambos documentos en el mismo bloque de trabajo.

## Nota de calidad de exportacion
- Si prioridad es fidelidad: usar PNG.
- Si prioridad es peso de archivo: usar JPG con calidad alta (>= 0.92).
- Diferencias visuales fuertes entre preview y exportado deben tratarse como bug de fidelidad y corregirse en el pipeline de exportacion.
