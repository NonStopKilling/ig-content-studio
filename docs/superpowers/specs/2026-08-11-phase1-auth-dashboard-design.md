# Fase 1 · autenticacion, dashboard multi cliente y admin

## Objetivo

Transformar la app actual en un sistema con acceso autenticado, aislamiento estricto por cliente, dashboard persistente por cuenta y una capa admin para gestionar clientes, usuarios y galeria comun, manteniendo el stack actual Node.js + HTML/CSS/JavaScript y sin reescribir la app desde cero.

## Alcance de fase 1

### Incluye
- Pantalla inicial publica con presentacion breve de Area3.
- Logotipo real centrado como elemento principal de la portada.
- Login tradicional con usuario y contrasena.
- Dashboard autenticado para clientes.
- Mismo dashboard base para admin, con una seccion extra de administracion.
- Modelo multi cliente estricto: cada cliente solo accede a sus propios datos.
- CRUD de clientes desde admin.
- CRUD de usuarios desde admin.
- CRUD de proyectos y laminas por cliente.
- Biblioteca privada de fondos por cliente.
- Galeria comun de fondos genericos, administrada solo por admin.
- Persistencia de historial de trabajos para reabrir, editar y eliminar.
- Registro de exportaciones por cliente.
- Resumen admin por cliente con metricas operativas.
- Correos con plantillas estandar, limitados a eventos operativos basicos de fase 1.

### No incluye en fase 1
- Recuperacion de contrasena por correo.
- OAuth con Google o Microsoft.
- Roles intermedios adicionales dentro del cliente.
- Compartir proyectos entre clientes.
- Medicion de espacio ocupado en base de datos.
- Editor por capas estilo Canva.

## Decisiones cerradas

### Acceso y roles
- El acceso inicial sera por usuario y contrasena tradicional.
- El admin crea usuarios.
- El admin puede crear usuarios con clave temporal o definitiva.
- El usuario puede cambiar su propia clave desde su panel.
- En fase 1 existen solo dos roles:
  - `admin`
  - `cliente`

### Modelo de aislamiento
- Cada cliente funciona como tenant aislado.
- Un usuario cliente pertenece a un solo cliente.
- Un cliente nunca ve proyectos, bibliotecas, logos, exportaciones ni archivos de otros clientes.
- La unica excepcion compartida es la galeria comun de fondos genericos.
- La galeria comun solo puede ser administrada por admin.

### Navegacion
- La app tendra una portada publica inicial.
- Desde la portada se accede al login.
- Luego del login se entra al dashboard autenticado.
- Admin y cliente usan el mismo dashboard base.
- El admin ve una opcion extra para CRUD de clientes y resumen operativo.

### Resumen admin por cliente
- Cantidad total de laminas.
- Espacio usado en disco.
- Cantidad de exportaciones.
- Cantidad de inicios de sesion.
- Fecha y hora del ultimo inicio de sesion.
- El espacio usado en disco considera solo archivos fisicos: logos, fondos y exportaciones.

### Branding y dominio
- El dominio final previsto para produccion es `content-studio.area3.cl`.
- La portada publica tendra presentacion breve de Area3 antes del acceso.
- El logotipo real ira centrado y con protagonismo visual.
- El formulario de login tendra mayor jerarquia visual que los textos de apoyo.

## Enfoque recomendado

Se mantiene el stack actual y se evoluciona la app por capas.

### Opcion elegida
- Mantener Node.js + frontend actual.
- Separar experiencia publica y autenticada dentro del mismo proyecto.
- Reusar la mayor parte de la logica del editor existente donde sea viable.

### Justificacion
- Reduce riesgo tecnico frente a una reescritura completa.
- Es compatible con el entorno actual y con despliegue en cPanel.
- Permite agregar autenticacion, permisos y persistencia real sin frenar el avance del producto.

## Arquitectura funcional propuesta

### 1. Capa publica

Rutas publicas iniciales:
- `/`
- `/login`

Responsabilidades:
- Mostrar la portada institucional de Area3.
- Presentar valor general de la herramienta sin exponer datos internos.
- Recibir credenciales y dirigir al dashboard si el login es valido.

### 2. Capa autenticada

Ruta base sugerida:
- `/app`

Responsabilidades:
- Cargar contexto del usuario autenticado.
- Resolver su cliente asociado.
- Mostrar dashboard y herramientas solo segun rol.

### 3. Capa admin dentro del mismo dashboard

Seccion sugerida:
- `/app/admin/clients`
- `/app/admin/clients/:id`

Responsabilidades:
- Crear clientes.
- Editar clientes.
- Crear usuarios cliente.
- Asignar credenciales iniciales.
- Administrar galeria comun.
- Ver metricas por cliente.

## Modelo de datos propuesto

### Entidades nuevas

#### `users`
- `id`
- `client_id` nullable para permitir admin global
- `role` (`admin` o `cliente`)
- `username`
- `email` opcional en fase 1 pero recomendado
- `password_hash`
- `password_mode` (`temporary` o `permanent`)
- `must_change_password` boolean
- `is_active` boolean
- `last_login_at`
- `login_count`
- `created_at`
- `updated_at`

#### `sessions` o mecanismo equivalente
- `id`
- `user_id`
- `token` o session id
- `created_at`
- `expires_at`
- `last_seen_at`
- `ip` opcional
- `user_agent` opcional

#### `shared_backgrounds`
- `id`
- `name`
- `file_path`
- `file_size_bytes`
- `mime_type`
- `created_by_user_id`
- `created_at`
- `updated_at`

### Entidades existentes que deben evolucionar

#### `clients`
Agregar o ajustar soporte para:
- metadatos de branding
- logo fisico o logo actual transitorio
- estado activo/inactivo
- resumen calculable desde tablas relacionadas

#### `projects`
Mantener `client_id` como clave principal de aislamiento.

Agregar si falta:
- `created_by_user_id`
- `deleted_at` opcional si se desea borrado logico

#### `exports`
Mantener asociacion a `project_id`.

Agregar o confirmar:
- `client_id`
- `created_by_user_id`
- `file_size_bytes`

### Almacenamiento de archivos

Direccion objetivo de fase 1:
- logos por cliente en archivo fisico
- fondos privados por cliente en archivo fisico
- fondos comunes en archivo fisico
- exportaciones en archivo fisico

Estructura sugerida:

```text
storage/
  clients/
    {clientId}/
      logos/
      backgrounds/
      exports/
  shared/
    backgrounds/
```

Nota:
- La app hoy usa Data URL en varios puntos.
- En fase 1 se puede mantener compatibilidad transitoria con datos existentes, pero el flujo nuevo debe favorecer archivos fisicos y metadatos en MySQL.

## Reglas de permisos

### Cliente
- Puede iniciar sesion.
- Puede ver y editar solo sus propios proyectos.
- Puede crear, editar y eliminar sus laminas.
- Puede gestionar su biblioteca privada.
- Puede usar su configuracion de marca.
- Puede ver y usar la galeria comun.
- Puede exportar y revisar sus exportaciones.
- Puede cambiar su propia clave.

### Admin
- Tiene todo lo del cliente en su propio dashboard.
- Puede ver listado de clientes.
- Puede crear y editar clientes.
- Puede crear y editar usuarios cliente.
- Puede activar o desactivar cuentas.
- Puede definir clave temporal o definitiva.
- Puede administrar la galeria comun.
- Puede ver resumen operativo por cliente.

### Restricciones
- Ningun usuario cliente puede ver informacion de otro cliente por URL, por API ni por archivos.
- Ninguna consulta debe depender solo de datos enviados desde frontend; el backend debe validar `user.role` y `user.client_id` en cada operacion protegida.

## Experiencia de usuario propuesta

### Portada publica
- Hero con logo real centrado.
- Texto breve de apoyo.
- Formulario o CTA de acceso con mayor jerarquia visual.
- Tono sobrio y premium.

### Login
- Usuario.
- Contrasena.
- Mensajes claros de error.
- Posibilidad de redirigir luego al dashboard segun rol.

### Dashboard cliente
Bloques minimos:
- resumen rapido
- proyectos recientes
- crear nuevo proyecto
- biblioteca privada de fondos
- acceso a galeria comun
- branding del cliente
- exportaciones recientes
- cambio de contrasena

### Dashboard admin
Mismos bloques base mas:
- acceso al CRUD de clientes
- acceso al CRUD de usuarios
- acceso a galeria comun
- tarjetas de resumen por cliente

## Flujos principales

### 1. Login
1. Usuario ingresa credenciales.
2. Backend valida usuario activo y hash de contrasena.
3. Se crea sesion.
4. Se incrementa `login_count` y se actualiza `last_login_at`.
5. Se redirige a `/app`.

### 2. Creacion de cliente por admin
1. Admin crea cliente.
2. Admin define branding inicial opcional.
3. Admin crea al menos un usuario cliente.
4. Usuario cliente recibe credenciales por canal operativo definido.

### 3. Uso de galeria comun
1. Admin carga fondo generico.
2. El fondo queda disponible para todos los clientes.
3. El cliente lo puede seleccionar en sus proyectos, pero no editar ni borrar desde su rol.

### 4. Guardado de trabajos
1. Cliente crea o abre proyecto.
2. Cambios se guardan bajo su `client_id`.
3. Puede editar y eliminar dentro de su tenant.

### 5. Cambio de contrasena
1. Usuario autenticado entra a su panel.
2. Ingresa contrasena actual y nueva contrasena.
3. Backend valida y actualiza hash.
4. Si era clave temporal, se desmarca `must_change_password`.

## API propuesta para fase 1

### Publica
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Cuenta autenticada
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/backgrounds/private`
- `POST /api/backgrounds/private`
- `DELETE /api/backgrounds/private/:id`
- `GET /api/backgrounds/shared`
- `GET /api/exports`
- `POST /api/export`
- `PUT /api/account/password`

### Admin
- `GET /api/admin/clients`
- `POST /api/admin/clients`
- `GET /api/admin/clients/:id`
- `PUT /api/admin/clients/:id`
- `GET /api/admin/clients/:id/summary`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PUT /api/admin/users/:id/password`
- `PUT /api/admin/users/:id/status`
- `GET /api/admin/backgrounds/shared`
- `POST /api/admin/backgrounds/shared`
- `DELETE /api/admin/backgrounds/shared/:id`

## Calculo de metricas admin

### Cantidad de laminas
- Suma de slides en proyectos del cliente.

### Exportaciones
- Conteo de registros en `exports` por `client_id`.

### Inicios de sesion
- Valor acumulado en `users.login_count` o agregado por cliente.

### Ultimo inicio de sesion
- Maximo `last_login_at` entre usuarios del cliente.

### Espacio usado en disco
- Suma de `file_size_bytes` de:
  - logos del cliente
  - fondos privados del cliente
  - exportaciones del cliente

No incluye:
- espacio de MySQL
- fondos de galeria comun

## Correos fase 1

Se usaran plantillas estandar y sobrias.

Usos recomendados en fase 1:
- correo de alta de cuenta
- aviso de credenciales iniciales si se define email como canal
- aviso operativo simple de activacion de cuenta

No se implementa todavia:
- flujo de recuperacion de contrasena

## Manejo de errores y seguridad

### Seguridad
- Hash seguro de contrasenas con algoritmo moderno.
- Sesiones httpOnly.
- Validacion de rol y `client_id` en backend en cada endpoint protegido.
- Validacion de MIME y tamano al subir archivos.
- Sanitizacion de nombres de archivo.
- No exponer rutas internas reales al cliente sin control.

### Errores funcionales
- Error de login invalido sin revelar si falla usuario o contrasena.
- Error de permisos al acceder a recursos de otro cliente.
- Error claro si un archivo no se puede guardar.
- Error claro si la sesion expira.

## Compatibilidad y migracion

### Compatibilidad con estado actual
- Mantener lectura del estado actual mientras se migra.
- Migrar progresivamente desde `data/state.json` y estructuras actuales hacia tablas y archivos mas delimitados por cliente.

### Migracion sugerida
1. Incorporar tablas de usuarios y sesiones.
2. Incorporar tabla de fondos compartidos.
3. Confirmar `client_id` en exportaciones.
4. Empezar a guardar nuevos archivos en filesystem estructurado.
5. Mantener fallback temporal para datos legados.

## Testing propuesto

### Backend
- Login exitoso y fallido.
- Cliente no puede leer recursos de otro cliente.
- Admin puede crear cliente y usuario.
- Cliente puede CRUD de proyectos propios.
- Cliente puede ver fondos compartidos pero no editarlos.
- Calculo correcto de resumen admin por cliente.

### Frontend
- Portada publica carga correctamente.
- Login redirige al dashboard.
- UI de admin muestra opcion extra.
- UI de cliente no muestra secciones admin.
- Guardado, edicion y borrado de proyectos funcionan dentro del tenant.

### Integracion
- Exportaciones se registran en el cliente correcto.
- Ultimo login y contador se actualizan.
- Espacio en disco se recalcula con archivos fisicos.

## Riesgos y notas

### Riesgos principales
- Hoy parte de los assets viven como Data URL, lo que mezcla almacenamiento logico y visual.
- El server actual concentra varias responsabilidades y puede crecer rapido.
- Si no se define pronto el esquema de archivos fisicos, el resumen admin de disco quedara incompleto.

### Mitigaciones
- Mantener cambios incrementales.
- Encapsular autenticacion y permisos en nuevas funciones/modulos claros.
- Introducir almacenamiento fisico nuevo sin romper lectura de datos antiguos.

## Recomendacion final

Construir fase 1 en iteraciones pequenas:
1. portada publica + login
2. sesiones + roles
3. aislamiento por cliente
4. dashboard cliente persistente
5. seccion admin y galeria comun
6. metricas y correos operativos