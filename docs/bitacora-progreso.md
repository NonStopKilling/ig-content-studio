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
