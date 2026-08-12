# Bitacora de progreso

## 2026-08-08

### Cambios implementados
- Se mejoro el guardado en frontend para validar la respuesta de POST /api/state.
- Si el backend falla, ahora se muestra error real en vez de asumir que guardo bien.
- Se agrego logica para asegurar proyecto activo por cliente al cambiar o crear clientes.
- Se agrego control de ancho de logo por cliente en la UI.
- El ancho de logo ahora se aplica en preview y exportacion de imagen.
- En plantilla checklist, el texto final ya no queda fijo: usa CTA / firma editable.
- Se agrego soporte de persistencia logo_width en backend (MySQL + migracion compatible).
- Se normaliza logoWidth en migracion de estado para evitar valores nulos.

### Archivos tocados
- public/index.html
- public/styles.css
- public/app.js
- server.js

### Validaciones realizadas
- node --check server.js
- node --check public/app.js

### Nota operativa
- El workspace no tenia una bitacora de progreso formal antes de este archivo.
- Se recomienda continuar registrando cada bloque de cambios con fecha.

## 2026-08-11

### Descubrimientos operativos
- Se reviso el repositorio para ubicar URL temporal de pruebas.
- URL de desarrollo principal documentada: `http://localhost:4173`.
- Pista de ejecucion previa encontrada en logs: `http://localhost:4174` en `server-test.out`.
- No se encontraron otras URL temporales publicas (ngrok, subdominios temporales, etc.) en archivos del repo ni en sesiones locales indexadas.

### Nueva fase acordada (en diseno)
- Autenticacion con inicio de sesion por cuenta.
- Dashboard por usuario con biblioteca de imagenes y configuracion de marca propia.
- CRUD completo para guardar, editar y eliminar trabajos.
- Rol admin para crear clientes/cuentas.
- Sistema de notificaciones por correo con plantillas estandar.
- Dominio final de produccion: `content-studio.area3.cl`.

### Definicion de modelo (2026-08-11)
- Modelo de acceso estricto por cliente (tenant aislado): cada cliente solo ve sus propios archivos, proyectos, logos y bibliotecas.
- Se habilitara una galeria comun de fondos genericos compartidos para todos los clientes.
- La galeria comun solo puede ser administrada por usuarios con rol admin.
- El inicio de sesion inicial sera con usuario y contrasena tradicional (sin OAuth en la fase 1).
- El admin crea usuarios y puede definir clave temporal o clave definitiva al crear la cuenta.
- El usuario podra cambiar su propia clave desde su panel.
- Recuperacion de contrasena por correo se posterga para fase 2.
- Fase 1 prioriza el nucleo de la app (dashboard, CRUD, bibliotecas y permisos).
- Roles de fase 1: solo `admin` (administra clientes/cuentas/galeria comun) y `cliente` (usa su dashboard aislado).
- UX de fase 1: admin y cliente comparten el mismo dashboard base.
- Diferencia de admin: opcion extra para acceder al CRUD de clientes con resumen de informacion generada/almacenada por cliente.

### Metricas de resumen admin por cliente (fase 1)
- Cantidad total de laminas.
- Espacio usado en disco.
- Cantidad de exportaciones.
- Cantidad de inicios de sesion.
- Fecha y hora del ultimo inicio de sesion.
- Alcance de espacio en disco: solo archivos fisicos (exports, logos y fondos), sin incluir peso de base de datos.

### Navegacion base fase 1
- La app tendra una pantalla inicial publica.
- Desde esa pantalla el usuario entra al acceso/login.
- El dashboard queda detras de autenticacion.

### Direccion visual aprobada (2026-08-11)
- Se aprueba una portada publica con presentacion breve de Area3 antes del acceso.
- El logotipo real va centrado y como protagonista visual.
- Los textos deben mantenerse contenidos y secundarios frente al formulario de login.
- El formulario de acceso recibe el mayor enfasis visual de la portada.

### Documentacion generada
- Se escribio la especificacion formal de fase 1 en `docs/superpowers/specs/2026-08-11-phase1-auth-dashboard-design.md`.
- La especificacion queda pendiente de revision y aprobacion antes de pasar a implementacion.

### Avance rapido en herramienta de creacion
- Se priorizo la experiencia del creador por sobre seguir refinando arquitectura.
- Se agrego una biblioteca visible de carruseles guardados dentro del dashboard actual.
- Cada proyecto ahora se puede abrir, duplicar y eliminar desde una lista dedicada.
- Se muestra resumen simple de cantidad de proyectos guardados por cliente.

### Avance rapido en autenticacion
- Se implemento un primer corte de login real con usuario y contrasena.
- Se agregaron endpoints `auth/login`, `auth/logout` y `auth/me`.
- El dashboard actual queda bloqueado hasta iniciar sesion.
- Se agrego una portada publica inicial con branding Area3 y formulario de acceso.
- Se creo bootstrap de usuario admin local para desarrollo.
- `GET /api/state` y `POST /api/state` ahora requieren sesion activa.

### Siguiente paso inmediato
- Definir el modelo de cuentas y permisos (usuario, cliente, admin) antes de implementar backend y pantallas.

### Ajustes UI y cierre de jornada (2026-08-11)
- Se corrigio el solape visual entre portada/login y dashboard: ahora solo se muestra una pantalla segun el estado de sesion.
- Se estandarizo la ocultacion usando `hidden` para evitar doble render por estilos.
- Se ajusto el layout de acceso para centrar el formulario en la portada, alineado con la pantalla de pruebas aprobada.
- Se validaron archivos clave sin errores reportados en frontend.

### Estado para retomar manana
- Login minimo funcional y dashboard protegido por sesion.
- Formulario de acceso centrado en portada.
- Pendiente siguiente bloque: CRUD admin de clientes/usuarios y separacion completa de biblioteca privada vs comun.

## 2026-08-12

### Incidencias reales del dia
- Se detecto error inicial al ejecutar `npm run dev` porque el script no estaba definido en `package.json`.
- Se agrego el script `dev` para ejecutar `node server.js`.
- Hubo confusion de runtime por puerto ocupado y por una instancia previa activa.
- Con instancia limpia, el servidor levanta en `http://localhost:4173` y conecta en modo MySQL cuando DB responde.

### Trazabilidad de autenticacion
- El usuario bootstrap admin no se guarda en `data/state.json`; se guarda en `users`.
- Ubicacion de respaldo local de usuarios: `data/users.json`.
- Ubicacion principal en runtime MySQL: tabla `users` de la base `content_studio`.
- Credenciales por defecto para desarrollo si no hay variables de entorno:
	- usuario: `admin`
	- clave: `admin1234`
- Variables soportadas para sobreescribir bootstrap:
	- `CONTENT_STUDIO_ADMIN_USER`
	- `CONTENT_STUDIO_ADMIN_PASSWORD`

### Estado de desarrollo actual
- Login y sesion: operativo.
- Dashboard protegido por sesion: operativo.
- CRUD de proyectos del cliente: operativo.
- Biblioteca privada de fondos por cliente: operativa.
- Bloques pendientes para cerrar fase 1 completa:
	- CRUD admin de clientes y usuarios (UI + API dedicada).
	- Galeria compartida de fondos administrada por admin.
	- Cambio de clave desde panel de usuario.
	- Resumen admin por cliente con metricas completas.

### Accion de orden documental
- Se crea un mapa operativo en `docs/mapa-app.md` para centralizar arquitectura, rutas API, persistencia y pendientes.
- Desde hoy, cada bloque tecnico nuevo debe reflejarse en bitacora + mapa para no depender del chat.

### Ajuste de calidad de exportacion (2026-08-12)
- Se detecto diferencia visual entre preview y archivo exportado por usar dos motores distintos:
	- preview: HTML/CSS del dashboard.
	- exportacion: renderer canvas custom.
- Se cambio la exportacion principal a modo WYSIWYG desde el DOM renderizado (`postCanvas`) con snapshot SVG/foreignObject para conservar la composicion real del preview.
- Se dejo fallback al renderer canvas legado para navegadores donde el snapshot DOM falle.
- Criterio de calidad recomendado:
	- PNG: max fidelidad visual y texto nitido, mayor peso de archivo.
	- JPG: menor peso, pero con perdida por compresion (controlado por slider de calidad).

### Ajuste de UX admin y CRUD de clientes visible (2026-08-12)
- Se agrego CRUD de clientes explicito en la vista `Administrar clientes`:
	- listado de clientes en workspace admin,
	- accion de crear cliente,
	- accion de seleccionar/editar cliente,
	- accion de eliminar cliente.
- Se agrego boton `Eliminar` tambien en el panel lateral de cliente para acceso rapido.
- La vista admin ahora muestra claramente que la edicion de nombre, colores y logotipo se realiza sobre el cliente seleccionado.
- Se mantuvo validacion para evitar dejar la app sin clientes (minimo 1 cliente).

### Ajuste de flujo cliente vs usuario (2026-08-12)
- Se aclaro etiqueta del formulario de usuarios: `Cliente del usuario`.
- Al seleccionar `Editar` sobre un cliente en el CRUD admin, el formulario de usuarios se sincroniza automaticamente con ese cliente.
- Al crear usuario cliente, si no se elige cliente manualmente, se usa el cliente activo en edicion para evitar pasos redundantes.

### Rediseño admin horizontal + CRUD convencional (2026-08-12)
- Se reordeno la vista `Administrar clientes` para pantallas ultra wide con estructura horizontal:
	- columna izquierda: listado CRUD de clientes,
	- columna derecha: formulario dedicado de edicion de cliente,
	- bloque inferior: CRUD de usuarios del cliente seleccionado.
- Se elimino la dependencia del panel lateral para editar clientes en modo admin (se evita duplicidad de selectores).
- El flujo de clientes ahora es convencional: seleccionar en lista -> editar formulario -> guardar cliente.
- El selector `Cliente del usuario` queda bloqueado por defecto al cliente activo en edicion para reducir confusion.

### Ajuste de feedback y simplificacion de usuarios (2026-08-12)
- Se agrego estado visible de operaciones dentro del panel admin (`adminOpsStatus`) para confirmar guardados.
- Se agrego preview del logo actual en el formulario de cliente y miniatura/logo en el listado de clientes.
- Se elimino la seleccion manual redundante de `Cliente del usuario`:
	- ahora el usuario cliente se asocia automaticamente al cliente activo en edicion,
	- para rol admin se conserva comportamiento global (sin cliente).
- Se filtro el listado de usuarios en admin para priorizar los usuarios del cliente seleccionado (manteniendo admins visibles).

### Ajuste de cuentas cliente y confirmaciones visuales (2026-08-12)
- Se restauro la visibilidad del panel de cliente fuera de vistas admin/export para cuentas cliente.
- Usuarios cliente pueden editar su marca (colores y logo) desde su flujo normal.
- Se implemento feedback visual estandar en estados con iconografia:
	- exito: check,
	- error: cruz,
	- informativo: indicador neutral.
- El estado se refleja tanto en panel del editor como en panel admin para evitar acciones "sin respuesta".

### Mejora de fidelidad de exportacion (2026-08-12)
- Se integro `html2canvas` como motor principal de exportacion WYSIWYG.
- Pipeline nuevo de exportacion:
	1. `html2canvas` (principal, mayor fidelidad del DOM real),
	2. snapshot SVG/foreignObject (fallback 1),
	3. renderer canvas legacy (fallback 2).
- Objetivo: reducir diferencias entre preview en app y JPG/PNG final exportado.

### Correccion de escala preview vs export (2026-08-12)
- Se detecto causa de desalineacion: la captura se estaba regenerando a 1080 directo, alterando proporciones relativas respecto al preview visible.
- Se cambio el enfoque:
	- capturar primero el `postCanvas` al tamano real visible en pantalla,
	- luego reescalar bitmap final a 1080x1080 para exportar.
- Se elimino fallback al renderer legacy para evitar exportaciones que no coinciden con el preview cuando fallan motores DOM.

### Fix de exportacion sin descarga visible (2026-08-12)
- Se detecto escenario donde `Exportar` podia parecer que no hacia nada por bloqueo/limitacion del navegador sobre descarga `data:` URL.
- Se agrego endpoint autenticado `GET /api/export/file/:fileName` para descargar el archivo guardado desde backend.
- Frontend ahora descarga usando URL de backend en vez de `data:` URL.
- Se agregaron logs de error en consola para export actual y export masivo para diagnostico rapido.

### Ajuste de resiliencia en exportacion (2026-08-12)
- Se reintrodujo fallback de seguridad al renderer legacy si fallan motores WYSIWYG (html2canvas o snapshot SVG).
- Objetivo: evitar que el boton `Exportar actual` quede sin resultado cuando falla la captura fiel.
- Se agrego `public/favicon.ico` para eliminar el 404 recurrente en consola del navegador.

### Correccion de descarga confiable (2026-08-12)
- Se detecto que la descarga por enlace directo al endpoint podia disparar el mensaje del navegador `File wasn't available on site`.
- Se cambio la descarga a flujo `fetch -> blob -> objectURL` para hacerla mas estable y compatible con Chrome/Edge.
- El endpoint backend se mantiene para servir el archivo exportado, pero la descarga ya no depende de navegar a esa ruta.
