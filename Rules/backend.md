# Backend — Convenciones y arquitectura

API REST de Concesionaria BMW: **Node.js + Express 5** (CommonJS), **Zod** para
validación, **DynamoDB** para persistencia, **S3** para archivos y **Cognito** para
autenticación (verificación de JWT).

## Principios rectores

El backend sigue una arquitectura **MVC por capas** con separación estricta de
responsabilidades y aplica **SOLID** y **clean code**.

### Flujo de una petición

```text
HTTP → routes → controller → service → repository → DynamoDB/S3/Cognito
                     ↑            ↑
                 validation    AppError → errorHandler → respuesta HTTP
```

### Responsabilidad de cada capa

| Capa | Carpeta | Responsabilidad | NO debe |
| --- | --- | --- | --- |
| Rutas | `src/routes` | Definir endpoints, middlewares de auth/rol y montar controllers. | Contener lógica de negocio. |
| Controladores | `src/controllers` | Traducir HTTP ↔ dominio: leer `req`, validar, llamar al servicio, responder. | Acceder a DynamoDB/S3 directamente. |
| Servicios | `src/services` | Lógica de negocio y orquestación; lanzan errores de dominio (`AppError`). | Conocer `req`/`res` ni el SDK de AWS directamente (salvo integración encapsulada). |
| Repositorios | `src/repositories` | Único punto de acceso a DynamoDB. | Contener reglas de negocio. |
| Validación | `src/validation` | Esquemas Zod + helper `validate`. | Contener lógica de negocio. |
| Auth | `src/auth` | Verificar JWT, extraer roles, middlewares `requireAuth`/`requireRole`. | — |
| Errores | `src/errors` | Clases de error + `errorHandler` central. | — |
| Utilidades | `src/utils` | Helpers genéricos (`asyncHandler`). | — |
| Config | `src/config.js` | Leer variables de entorno y validar lo mínimo. | — |
| DB | `src/db/dynamodb.js` | Cliente DynamoDB compartido. | — |

### Arquitectura de archivos

```text
backend/
├── server.js                     # Arranque: valida config y levanta el servidor
└── src/
    ├── app.js                    # createApp(): middlewares + montaje de rutas
    ├── config.js                 # Variables de entorno + assertAuthConfig()
    ├── auth/
    │   ├── verify.js             # Verificador de ID token (aws-jwt-verify)
    │   ├── middleware.js         # requireAuth, requireRole, optionalAuth
    │   └── roles.js              # USER_ROLES, normalizeRoles, primaryRole
    ├── db/dynamodb.js            # documentClient (SDK v3)
    ├── errors/
    │   ├── AppError.js           # AppError + subclases (400/401/403/404/409)
    │   └── errorHandler.js       # notFoundHandler + errorHandler
    ├── repositories/             # usuarioRepository, vehiculoRepository, repuestoRepository, movimientoRepository, clienteComercialRepository, cotizacionRepository, reservaRepository, ventaRepository, pruebaManejoRepository, notificacionRepository, citaTallerRepository (HU13/HU14/HU15)
    ├── services/                 # usuarioService, vehiculoService (incluye catálogo), cognitoService, storageService, repuestoService, movimientoService, clienteComercialService, cotizacionService, reservaService, ventaService, pruebaManejoService, notificacionService (HU12), plantillasCorreo (HU12), citaTallerService (HU13/HU14/HU15)
    ├── controllers/              # usuarioController, vehiculoController, catalogoController, clienteController, clienteComercialController, cotizacionController, reservaController, ventaController, pruebaManejoController, notificacionController, citaTallerController (HU13/HU14/HU15), ...
    ├── routes/                   # publicRoutes, authRoutes, usuarioRoutes, clienteRoutes, catalogoRoutes, vehiculoRoutes, clienteComercialRoutes, cotizacionRoutes, reservaRoutes, ventaRoutes, pruebaManejoRoutes, notificacionRoutes, citaTallerRoutes (HU13/HU14/HU15), ...
    ├── validation/               # usuarioSchemas.js, clienteSchemas.js, vehiculoSchemas.js, repuestoSchemas.js, clienteComercialSchemas.js, cotizacionSchemas.js, reservaSchemas.js, ventaSchemas.js, pruebaManejoSchemas.js, notificacionSchemas.js, citaTallerSchemas.js (HU13/HU14/HU15)
    └── utils/asyncHandler.js
```

## SOLID en la práctica

- **S** — Responsabilidad única: cada archivo/capa hace una cosa (repositorio solo
  habla con DynamoDB; servicio solo aplica reglas; controlador solo HTTP).
- **O** — Abierto/cerrado: se agregan endpoints o servicios sin modificar los
  existentes; `AppError` se extiende para nuevos tipos.
- **L** — Sustitución de Liskov: las subclases de `AppError` se tratan siempre como
  `AppError` en el `errorHandler`.
- **I** — Segregación de interfaces: módulos pequeños y específicos (p. ej.
  `storageService` solo expone operaciones de archivos).
- **D** — Inversión de dependencias: los servicios dependen de abstracciones
  (repositorios/servicios) y no del SDK de AWS directamente.

## Clean code

- Nombres descriptivos en español para el dominio (`createVehiculo`, `listUsuarios`).
- Funciones cortas, una responsabilidad, con JSDoc breve cuando aporta valor.
- Sin números/strings mágicos: usa constantes (`USER_ROLES`, `ESTADOS`, `DEFAULT_ROLE`).
- Sin código muerto ni duplicado.
- Un módulo exporta un objeto de funciones o `{ nombre }`; se importa con `require`.

## Manejo de errores

- Los servicios lanzan errores de dominio de `src/errors/AppError.js`:
  `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403),
  `NotFoundError` (404), `ConflictError` (409), `AppError` (500).
- Los controladores **no** manejan errores: se envuelven con `asyncHandler` y el
  `errorHandler` central los convierte a JSON `{ error, code, details? }`.
- `errorHandler` también traduce excepciones de Cognito (p. ej.
  `UsernameExistsException` → 409).

## Validación

- Cada recurso tiene su archivo de esquemas Zod en `src/validation`.
- Se valida en el controlador con `validate(schema, req.body)`; si falla lanza
  `ValidationError` con `details: [{ field, message }]`.
- El frontend consume `details` para errores por campo (`getFieldErrors`).

## Autenticación y autorización

- `requireAuth`: exige `Authorization: Bearer <ID token>` y valida el JWT contra el
  User Pool (`src/auth/verify.js`). Deja `req.auth` (payload) y `req.authRoles`.
- `requireRole('admin', 'vendedor', ...)`: exige al menos uno de los roles.
- `optionalAuth` (HU11): válida el token **si viene** y deja `req.auth`/`req.authRoles`;
  si no hay token la petición sigue como pública. Se usa en `POST /api/pruebas-man`
  (solicitud desde el catálogo con sesión opcional).
- Roles del sistema (orden = precedencia): `['admin', 'vendedor', 'jefe_taller', 'mecanico', 'cliente']`.
  Rol por defecto: `mecanico`.
- `STAFF_ROLES` (admin/vendedor/jefe_taller/mecanico) son los roles internos gestionables
  por un administrador. Los **clientes** se autorregistran en `POST /api/clientes/registro`
  (ruta pública) y no pueden crearse ni cambiar de rol desde la gestión de usuarios.

## Cómo agregar un nuevo endpoint (paso a paso)

Ejemplo: recurso `clientes`.

1. **Validación** — crea/edita `src/validation/clienteSchemas.js` con esquemas Zod.
2. **Repositorio** — `src/repositories/clienteRepository.js` con las operaciones
   DynamoDB necesarias (`findById`, `listAll`, `save`, ...).
3. **Servicio** — `src/services/clienteService.js` con la lógica de negocio; lanza
   `AppError` cuando corresponde.
4. **Controlador** — `src/controllers/clienteController.js`: valida, llama al
   servicio y responde; envuelve con `asyncHandler`.
5. **Rutas** — `src/routes/clienteRoutes.js`: define endpoints y aplica
   `requireAuth` / `requireRole`.
6. **Montaje** — registra la ruta en `src/app.js` (`app.use('/api/clientes', ...)`).
7. **Recursos AWS** — si necesitas una tabla nueva, defínela en CDK (`infra/lib`)
   y agrega la variable de entorno en `src/config.js` y en `.env`/`.env.example`.

## Modelos de datos (DynamoDB)

### Tabla `Usuarios` (AuthStack)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `userId` (PK) | string | `sub` del ID token de Cognito |
| `email` | string | índice secundario `email-index` |
| `nombre` | string | |
| `rol` | string | uno de `USER_ROLES` |
| `estado` | string | `activo` \| `inactivo` |
| `createdAt`/`updatedAt` | string | ISO-8601 |

### Tabla `Vehiculos` (InventarioStack)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `vehiculoId` (PK) | string | UUID |
| `vin` | string | índice secundario `vin-index`; 17 alfanum. sin I/O/Q |
| `marca`,`modelo`,`version`,`color` | string | |
| `anio` | number | |
| `kilometraje` | number | |
| `precio` | number | |
| `condicion` | string | `nuevo` \| `seminuevo` |
| `tipo` | string | `sedan` \| `suv` \| `coupe` \| `cabrio` \| `touring` \| `hatchback` \| `deportivo` \| `otros` |
| `estado` | string | `disponible` \| `reservado` \| `vendido` \| `no_disponible` |
| `descripcion` | string | texto libre para el catálogo (opcional) |
| `caracteristicas` | string[] | características principales (opcional) |
| `publicado` | boolean | si es `false`, no aparece en el catálogo web (por defecto `true`) |
| `fotos` | string[] | claves (keys) de S3 de las fotografías |
| `documentos` | object[] | documentos autorizados (HU06): `{ key, nombre, contentType, size, uploadedAt, uploadedBy }` |
| `createdAt`/`updatedAt` | string | ISO-8601 |
| `createdBy`/`updatedBy` | string | `sub` de Cognito |

El **catálogo web (HU05)** es una proyección pública del inventario: expone solo los
vehículos con `publicado !== false` y omite datos internos (VIN, `createdBy`, **documentos**).

### Gestión de archivos (HU06) — `storageService`

- Todo archivo vive en el bucket **privado**; el backend genera **URLs prefirmadas**
  (`createUploadUrl`, `createViewUrl`) y nunca expone el bucket.
- Categorías y reglas (`REGLAS_ARCHIVO`): `foto` (JPG/PNG/WEBP/GIF, ≤ 5 MB) y
  `documento` (PDF/Word/Excel/TXT, ≤ 10 MB).
- La URL de subida firma el `Content-Length` exacto → S3 rechaza tamaños distintos.
- `assertArchivo(key, categoria)` verifica con `HeadObject` que el objeto exista y cumpla
  las reglas; se ejecuta al crear/actualizar el vehículo (guarda la metadata real).
- `deleteObject(key)` elimina el objeto cuando se quita de la lista (solo admin/vendedor).
- Solo `admin`/`vendedor` suben/eliminan; cualquier usuario autenticado puede consultar
  (las URLs de lectura también son prefirmadas y expiran en 1 hora).

### Tabla `Repuestos` (RepuestosStack)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `repuestoId` (PK) | string | UUID |
| `codigo` | string | índice secundario `codigo-index`; único |
| `nombre`,`descripcion` | string | |
| `precio` | number | |
| `cantidad` | number | existencias actuales (solo cambian con movimientos) |
| `cantidadMinima` | number | umbral de reposición |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Regla de negocio: `requiereReposicion = cantidad <= cantidadMinima` (lo calcula el servicio).

### Tabla `MovimientosInventario` (RepuestosStack)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `movimientoId` (PK) | string | UUID |
| `repuestoId` | string | índice secundario `repuesto-index` (+ `createdAt`) |
| `repuestoCodigo`,`repuestoNombre` | string | desnormalizado para mostrar |
| `tipo` | string | `entrada` \| `salida` |
| `cantidad` | number | siempre positivo |
| `cantidadResultante` | number | existencias después del movimiento |
| `motivo` | string | opcional |
| `usuarioId`/`usuarioNombre` | string | autor del movimiento |
| `createdAt` | string | ISO-8601 |

La salida se registra con un `UpdateItem` condicional (atómico): si el stock
resultante sería negativo, DynamoDB lanza `ConditionalCheckFailedException` y el
servicio responde `409 Conflict`.

### Tabla `ClientesComerciales` (RepuestosStack, HU07)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `clienteId` (PK) | string | UUID |
| `nombres`,`apellidos` | string | |
| `documento` | string | índice secundario `documento-index`; único |
| `telefono` | string | |
| `email` | string | índice secundario `email-index`; único, en minúsculas |
| `consultas` | object[] | historial: `{ fecha, vehiculo?, interes, observacion? }` |
| `notas` | string | notas internas del seguimiento (opcional) |
| `estadoSeguimiento` | string | `nuevo` \| `contactado` \| `cotizando` \| `reservado` \| `vendido` \| `cerrado` |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Regla de negocio (HU07): no se admiten dos clientes con el mismo `documento` ni con
el mismo `email`; el servicio verifica con `Query` sobre los GSIs y responde
`409 Conflict` si existe (anti-duplicados en creación y actualización). Cada
interacción se registra como consulta en el historial (`POST .../consultas`).

### Tabla `Cotizaciones` (RepuestosStack, HU08)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `cotizacionId` (PK) | string | UUID (o `secuencia#<año>` para el contador interno) |
| `numero` | string | `COT-AAAA-######`; índice secundario `numero-index`; único |
| `clienteId` | string | índice secundario `cliente-index` (+ `createdAt`) |
| `cliente` | object | snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `items` | object[] | snapshot de vehículos: `{ vehiculoId, marca, modelo, version, anio, vin, precioUnitario, subtotal }` |
| `subtotal`,`descuentoMonto`,`total` | number | importes calculados en el servicio |
| `descuentoPorcentaje` | number | 0–20 (política comercial) |
| `observaciones` | string | opcional |
| `estado` | string | `pendiente` \| `aceptada` \| `rechazada` \| `vencida` |
| `vigenciaDias` | number | días de validez (1–90; por defecto 15) |
| `fechaVencimiento` | string | ISO-8601 (`createdAt` + `vigenciaDias`) |
| `createdBy`/`createdByName` | string | autor (`sub`/nombre del token) |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Reglas de negocio (HU08):
- Se guarda un **snapshot** del vehículo con su precio vigente: las cotizaciones
  históricas no cambian si el precio del vehículo se actualiza después.
- Solo se pueden cotizar vehículos en estado `disponible` o `reservado`; si está
  `vendido`/`no_disponible` el servicio responde `409 Conflict`.
- El **número** se reserva de forma atómica (`UpdateItem` con `ADD` sobre la partición
  `secuencia#<año>`), garantizando que no se repita.
- `subtotal = Σ precioUnitario`, `descuentoMonto = subtotal × % / 100`,
  `total = subtotal − descuentoMonto` (redondeado a 2 decimales).
- Solo las cotizaciones `pendiente` pueden modificarse (`PATCH`); cualquier otro estado
  responde `409 Conflict`. Una cotización `pendiente` cuya `fechaVencimiento` ya pasó se
  presenta como `vencida` (estado derivado, sin escritura en lectura).

### Tabla `Reservas` (RepuestosStack, HU09)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `reservaId` (PK) | string | UUID (o `secuencia#<año>` para el contador interno) |
| `numero` | string | `RES-AAAA-######`; índice secundario `numero-index`; único |
| `clienteId` | string | índice secundario `cliente-index` (+ `createdAt`) |
| `cliente` | object | snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `vehiculoId` | string | índice secundario `vehiculo-index` (+ `createdAt`) |
| `vehiculo` | object | snapshot: `{ vehiculoId, marca, modelo, version, anio, vin, precio }` |
| `condiciones` | string | opcional (≤ 1000 caracteres) |
| `monto` | number | opcional (monto de la reserva) |
| `estado` | string | `activa` \| `cancelada` \| `vencida` \| `convertida` |
| `vigenciaDias` | number | días de validez (1–365; por defecto 30) |
| `fechaVencimiento` | string | ISO-8601 (`createdAt` + `vigenciaDias`) |
| `observaciones` | string | opcional (notas de la conversión en venta) |
| `historial` | object[] | `{ estado, fecha, usuario?, motivo? }` |
| `createdBy`/`createdByName` | string | autor (`sub`/nombre del token) |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Reglas de negocio (HU09):
- Solo se puede reservar un vehículo en estado `disponible`; si está `vendido`,
  `no_disponible` o ya tiene una reserva activa, el servicio responde `409 Conflict`.
- Al reservar, el vehículo pasa a `reservado` con un **update condicional atómico**
  (`cambiarEstadoCondicional` en `vehiculoRepository`): la condición `estado = disponible`
  evita que dos reservas tomen la misma unidad.
- El **número** se reserva de forma atómica (`UpdateItem` con `ADD` sobre la partición
  `secuencia#<año>`), garantizando que no se repita.
- Una reserva `activa` cuya `fechaVencimiento` ya pasó se presenta como `vencida`; al
  detectarlo se **libera la unidad** (`reservado → disponible`) y se registra la entrada en
  el historial.
- Cancelar solo procede sobre reservas `activa` (libera la unidad); convertir en venta deja
  la reserva `convertida` y el vehículo `vendido` (update condicional sobre `reservado`).

### Tabla `Ventas` (RepuestosStack, HU10)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `ventaId` (PK) | string | UUID (o `secuencia#<año>` para el contador interno) |
| `numero` | string | `VTA-AAAA-######`; índice secundario `numero-index`; único |
| `clienteId` | string | índice secundario `cliente-index` (+ `createdAt`) |
| `cliente` | object | snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `vehiculoId` | string | índice secundario `vehiculo-index` (+ `createdAt`); control de doble venta |
| `vehiculo` | object | snapshot: `{ vehiculoId, marca, modelo, version, anio, vin, precio }` |
| `reservaId` / `numeroReserva` | string | opcionales: reserva vigente que originó la venta |
| `precioLista` | number | precio vigente del vehículo al vender |
| `descuentoPorcentaje` | number | descuento autorizado (0–20) |
| `descuentoMonto` | number | descuento calculado |
| `precioFinal` | number | `precioLista - descuentoMonto` |
| `observaciones` | string | opcional (≤ 1000 caracteres) |
| `fechaVenta` | string | ISO-8601 (por defecto la fecha de registro) |
| `createdBy`/`createdByName` | string | autor de la operación (`sub`/nombre del token) |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Reglas de negocio (HU10):
- Solo se vende un vehículo en estado `disponible` o `reservado` con una **reserva vigente**;
  si está `vendido`, `no_disponible` o reservado sin reserva válida, responde `409 Conflict`.
- Antes de confirmar se **verifica de nuevo la disponibilidad** y se aparta la unidad con un
  **update condicional atómico** (`cambiarEstadoCondicional`: `estado → vendido`). Si otro
  proceso la vendió antes, la operación falla con `409` (imposible vender la misma unidad dos veces).
- El **número** se reserva de forma atómica (`UpdateItem` con `ADD` sobre `secuencia#<año>`).
- El descuento máximo autorizado es `20%`; `precioFinal = precioLista - descuentoMonto`
  (se validan en Zod y en el servicio).
- Si la unidad estaba reservada, la venta queda **vinculada** (`reservaId`/`numeroReserva`) y la
  reserva pasa a `convertida` con el número de venta.
- La `fechaVenta` no puede ser futura; el vehículo pasa a `vendido` al confirmar.
- Los datos se validan con Zod antes de crear la operación (principio de validar antes de confirmar).
- El comprobante se genera en el **frontend con jsPDF** (sin servicios de pago).

### Tabla `PruebasManejo` (RepuestosStack, HU11)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `pruebaId` (PK) | string | UUID (o `secuencia#<año>` para el contador interno) |
| `numero` | string | `PRB-AAAA-######`; índice secundario `numero-index`; único |
| `vehiculoId` | string | índice secundario `vehiculo-index` (+ `fechaHora`), agenda y conflictos |
| `vehiculo` | object | snapshot: `{ vehiculoId, marca, modelo, version, anio, precio, color? }` |
| `clienteId` | string | índice secundario `cliente-index` (+ `createdAt`); `'anonimo'` en solicitudes públicas |
| `cliente` | object \| null | snapshot `{ clienteId, nombres, apellidos, email, telefono }` si hay vínculo |
| `contacto` | object | `{ nombre, telefono, email? }` datos del solicitante |
| `fechaHora` | string | ISO-8601 de inicio (hora local, futura, 08:00–18:00, pasos de 15 min) |
| `duracionMinutos` | number | 15–180 (por defecto 60) |
| `estado` | string | `pendiente` \| `confirmada` \| `realizada` \| `cancelada` |
| `origen` | string | `catalogo` \| `cliente` \| `interno` |
| `observaciones` | string | opcional (≤ 1000 caracteres) |
| `historial` | object[] | `{ estado, fecha, usuario?, motivo?, observaciones? }` |
| `createdBy`/`createdByName` | string | autor (`sub`/nombre del token) o vacío en solicitud pública |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Reglas de negocio (HU11):
- Solicitud **pública** (`POST` sin token vía `optionalAuth`), de un **cliente autenticado**
  o registrada por **vendedor/admin**; la gestión (listado, detalle, transiciones) es
  solo `admin`/`vendedor`.
- Solo se prueban vehículos `disponible`/`reservado` con `publicado !== false`; en otro
  caso responde `409 Conflict` (404 si no existe).
- **Conflicto de agenda**: mismo vehículo con ventanas solapadas en estados
  `pendiente`/`confirmada` → `409 Conflict` (query al GSI `vehiculo-index` + solape en memoria).
- Validaciones de tiempo en Zod: fecha **futura**, inicio entre **08:00 y 18:00** y
  alineado a **pasos de 15 minutos**; duración 15–180 min.
- El **número** se reserva de forma atómica (`UpdateItem` con `ADD` sobre `secuencia#<año>`).
- Transiciones: `pendiente → confirmada | cancelada`; `confirmada → realizada | cancelada`.
  Reprogramar solo sobre `pendiente`/`confirmada` (conserva el estado y registra la entrada
  en el historial); cualquier otra transición responde `409 Conflict`.
- En solicitudes públicas el `clienteId` se ignora (queda `'anonimo'`); solo el personal
  puede vincular la prueba a un cliente comercial.

### Tabla `Notificaciones` (RepuestosStack, HU12)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `eventoId` (PK) | string | clave única `tipo:recursoId:evento:destinatario`; el `Put` condicional (`attribute_not_exists`) garantiza un registro por evento + destinatario |
| `tipo` | string | `reserva` \| `cotizacion` \| `prueba_manejo` \| `venta` \| `cita_taller` |
| `evento` | string | `reserva_alta`, `cotizacion_envio`, `prueba_confirmada`, `venta_confirmada`, `cita_solicitada`, `cita_asignada`, `cita_reasignada`, etc. |
| `recursoId` | string | índice secundario `recurso-index` (+ `createdAt`) |
| `numero` | string | número del documento (RES/COT/PRB/VTA) |
| `destinatario` | string \| null | correo del cliente/contacto; `null` si la operación no tenía correo |
| `destinatarioNombre` | string \| null | nombre para el saludo |
| `asunto` / `cuerpo` | string | mensaje redactado por `plantillasCorreo` (texto plano) |
| `estado` | string | `pendiente` \| `intentado` \| `fallido` \| `omitido` |
| `intentos` / `maxIntentos` | number | reintentos controlados (máx. 5) |
| `ultimoResultado` / `ultimoIntentoAt` | string | último intento registrado |
| `historial` | object[] | `{ fecha, resultado, detalle? }` |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Reglas de negocio (HU12):
- **Transporte `mailto:`**: los servicios de negocio (reserva, cotización, prueba,
  venta, cita del taller) registran la notificación con el mensaje ya redactado; el
  endpoint de envío
  devuelve el enlace `mailto:` y el frontend abre el cliente de correo del usuario.
  No se usa Amazon SES ni ningún servicio de pago (regla de capa gratuita).
- **Anti-duplicados**: cada evento + destinatario genera un solo registro (PK única +
  `Put` condicional); los reenvíos reutilizan el registro y solo incrementan
  `intentos` (máximo 5; luego `409 Conflict`).
- **Sin romper la operación de negocio**: el registro de notificaciones se ejecuta
  con `registrarSinFallo` (un fallo al guardar la notificación no revierte la
  reserva/venta/etc.).
- Si la operación no tenía correo de contacto válido, la notificación se crea en
  estado `omitido` y `enviar` responde `400`.
- Los correos nunca incluyen contraseñas ni datos internos (VIN, `createdBy`, etc.).

### Tabla `CitasTaller` (RepuestosStack, HU13/HU14/HU15)

| Atributo | Tipo | Notas |
| --- | --- | --- |
| `citaId` (PK) | string | UUID (o `secuencia#<año>` para el contador interno) |
| `numero` | string | `CIT-AAAA-######`; índice secundario `numero-index`; único |
| `vehiculoId` | string | índice secundario `vehiculo-index` (+ `fechaHora`), agenda y conflictos |
| `vehiculo` | object | snapshot: `{ vehiculoId, marca, modelo, version, anio, vin, precio }` |
| `clienteId` | string | índice secundario `cliente-index` (+ `createdAt`); obligatorio |
| `cliente` | object | snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `tipoServicio` | string | `mantenimiento` \| `reparacion` \| `diagnostico` \| `revision` \| `otro` |
| `fechaHora` | string | ISO-8601 de inicio (hora local, futura, 08:00–18:00, pasos de 15 min) |
| `duracionMinutos` | number | 15–480 (por defecto 60) |
| `estado` | string | `solicitada` \| `confirmada` \| `en_atencion` \| `finalizada` \| `cancelada` |
| `observaciones` | string | opcional (≤ 1000 caracteres) |
| `motivo` | string | motivo de cancelación (≤ 500 caracteres) |
| `historial` | object[] | `{ estado, fecha, usuario?, motivo?, observaciones? }` |
| `mecanicoId` | string | índice secundario `mecanico-index` (+ `fechaHora`); mecánico responsable (HU14) |
| `mecanico` | object \| null | snapshot `{ userId, nombre, email }` del mecánico asignado (HU14) |
| `asignadoAt` | string | ISO-8601 de la última asignación (HU14) |
| `asignaciones` | object[] | historial de asignaciones: `{ mecanicoId, mecanicoNombre, tipo: 'asignada'\|'reasignada', fecha, usuario?, observaciones? }` (HU14) |
| `diagnostico` | string | diagnóstico técnico del vehículo (≤ 2000 caracteres, HU15) |
| `tareas` | object[] | tareas registradas: `{ descripcion, realizada, fecha, usuario? }` (HU15) |
| `repuestosUtilizados` | object[] | repuestos consumidos: `{ repuestoId, codigo, nombre, cantidad, precioUnitario, cantidadResultante }` (HU15) |
| `observacionesTecnicas` | string | observaciones técnicas (≤ 2000 caracteres, HU15) |
| `archivos` | object[] | archivos técnicos: `{ key, nombre, categoria: 'taller_foto'\|'taller_documento', contentType, size, uploadedAt, uploadedBy }` (HU15) |
| `fechaInicioReal` | string | ISO-8601 real de inicio (se fija al pasar a `en_atencion`, HU15) |
| `fechaFinReal` | string | ISO-8601 real de fin (se fija al pasar a `finalizada`, HU15) |
| `ultimoAvanceAt` | string | ISO-8601 del último avance registrado (HU15) |
| `createdBy`/`createdByName` | string | autor (`sub`/nombre del token) |
| `createdAt`/`updatedAt` | string | ISO-8601 |

Reglas de negocio (HU13):
- Gestión **interna** en los 9 endpoints (todos con `requireAuth`; no hay solicitud
  pública): `GET /` y `GET /:citaId` admiten `admin`/`jefe_taller`/`mecanico` (este
  último solo sus propias citas, HU14) y el resto —incluido `POST /:citaId/asignar`—
  es solo `admin`/`jefe_taller`.
- El vehículo debe existir en `Vehiculos` (404 si no), **sin restricción de estado**:
  también los autos ya vendidos van al taller. El cliente es obligatorio y debe existir
  en `ClientesComerciales` (404 si no).
- **Conflicto de agenda**: mismo vehículo con ventanas solapadas en estados
  `solicitada`/`confirmada`/`en_atencion` → `409 Conflict` (query al GSI
  `vehiculo-index` + solape en memoria, `assertSinConflicto`).
- Validaciones de tiempo en Zod: fecha **futura**, inicio entre **08:00 y 18:00** y
  alineado a **pasos de 15 minutos**; duración 15–480 min (defecto 60).
- El **número** se reserva de forma atómica (`UpdateItem` con `ADD` sobre la partición
  `secuencia#<año>`).
- Transiciones: alta → `solicitada`; `confirmar` (`solicitada → confirmada`);
  `reprogramar` (sobre `solicitada`/`confirmada`, conserva el estado y registra en el
  historial); `iniciar` (`confirmada → en_atencion`); `finalizar`
  (`en_atencion → finalizada`); `cancelar` (sobre `solicitada`/`confirmada`, con motivo).
  Cualquier otra transición responde `409 Conflict` (`assertEstado`).
- Snapshots de vehículo y cliente; `historial` de estados y autor de la operación
  (`createdBy`/`createdByName`).
- **Notificaciones (HU12)**: se registra con `registrarSinFallo` en alta, confirmar,
  reprogramar, cancelar y finalizar (**no** en iniciar); tipo `cita_taller` con eventos
  `cita_solicitada`, `cita_confirmada`, `cita_reprogramada`, `cita_cancelada` y
  `cita_finalizada`, destinatario = email del cliente (snapshot), transporte `mailto:`.

Reglas de negocio (HU14 — asignación de trabajos a mecánicos):
- Reutiliza esta misma tabla como **órdenes de trabajo** (sin tabla nueva ni variables
  de entorno adicionales); el GSI `mecanico-index` (`mecanicoId` + `fechaHora`) permite
  consultar la carga de trabajo por mecánico (`findByMecanico`).
- `POST /:citaId/asignar` (solo `admin`/`jefe_taller`) asigna o reasigna el mecánico
  responsable sobre citas en estado `confirmada`/`en_atencion`
  (`ESTADOS_CITA_ASIGNABLES`); cualquier otro estado responde `409 Conflict`
  (`assertEstado`).
- El mecánico debe existir (404), tener rol `mecanico` (409) y estar `activo` (409:
  «no se asignan trabajos a usuarios inactivos»); si la cita ya está asignada al mismo
  mecánico responde `409 Conflict`.
- Al asignar se registran `mecanicoId`, snapshot `mecanico` (`{ userId, nombre, email }`),
  `asignadoAt` y una entrada en `asignaciones` (`tipo: 'asignada' | 'reasignada'`, con
  autor y `observaciones` opcionales); se notifica al mecánico con `registrarSinFallo`
  (eventos `cita_asignada`/`cita_reasignada`, destinatario = email del mecánico,
  transporte `mailto:`).
- `listCitas` acepta el filtro `mecanicoId` (tiene prioridad al elegir el GSI).
- El rol `mecanico` puede listar y ver citas (`GET /` y `GET /:citaId`), pero **solo las
  suyas**: el controlador fuerza `filtros.mecanicoId = req.auth.sub` en el listado y
  lanza `ForbiddenError` (403) en el detalle si la cita no es suya.
- **Endpoint de apoyo**: `GET /api/usuarios/mecanicos` (`admin`/`jefe_taller`, declarado
  en `usuarioRoutes.js` **antes** del `router.use(requireAuth, requireRole('admin'))`)
  devuelve `{ total, mecanicos }` con los usuarios de rol `mecanico` y estado `activo`
  ordenados por nombre (`usuarioService.listMecanicos`).

Reglas de negocio (HU15 — registro de mantenimiento y reparaciones):
- Reutiliza la tabla `CitasTaller` añadiendo campos de avance (sin tabla ni variables de
  entorno nuevas). Los avances se registran con `registrarAvance` vía
  `POST /api/citas-taller/:citaId/avances` (un solo POST aplica lo enviado).
- **Autoría**: solo el **mecánico asignado** (`cita.mecanicoId === actor.sub`) puede
  documentar; los gestores (`admin`/`jefe_taller`) pueden hacerlo sobre cualquier orden.
  Cualquier otro usuario recibe `403 Forbidden` (`assertPuedeRegistrar`). El controlador
  construye el actor como `{ ...req.auth, roles: req.authRoles }` para que la comprobación
  de roles funcione.
- **Estados**: los avances solo se admiten en `confirmada`/`en_atencion`
  (`ESTADOS_CITA_AVANCE`); otros estados → `409 Conflict`. El mecánico asignado puede
  `iniciar` (`confirmada → en_atencion`) y `finalizar` (`en_atencion → finalizada`) su
  propia orden (también validadas con `assertPuedeRegistrar`).
- **Fechas reales**: `fechaInicioReal` se fija al iniciar (si aún no existe) y
  `fechaFinReal` al finalizar.
- El cuerpo debe incluir al menos uno de: diagnóstico, tarea, repuesto, observación técnica
  o archivo (`registrarAvanceSchema`, refine) → `400` si viene vacío.
- **Repuestos utilizados**: cada repuesto se descuenta de inmediato registrando un
  **movimiento de salida** atómico (`movimientoService.registrarMovimiento` + `adjustStock`,
  HU04) con motivo «Consumo en orden de taller». `404` si el repuesto no existe y `409` si
  no hay existencias suficientes. Se guarda snapshot con `cantidadResultante`.
- **Archivos técnicos**: `POST /api/citas-taller/:citaId/archivos/presign` firma la subida
  (categorías `taller_foto` → `taller/fotos` ≤ 5 MB y `taller_documento` →
  `taller/documentos` ≤ 10 MB, reutilizando el bucket de HU06 vía `storageService`); al
  registrar el avance se verifica en S3 con `assertArchivo`. `toResponse` expone cada
  archivo con URL prefirmada de lectura.

## Endpoints actuales

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/` | — | Bienvenida (ruta pública) |
| GET | `/info` | — | Estado de la API (pública) |
| GET | `/api/auth/session` | token | Perfil del usuario autenticado |
| POST | `/api/clientes/registro` | — | Autorregistro público de clientes |
| GET | `/api/catalogo` | — | Catálogo web público (solo publicados) |
| GET | `/api/catalogo/:vehiculoId` | — | Detalle público de un vehículo publicado |
| GET | `/api/usuarios` | admin | Listar usuarios |
| POST | `/api/usuarios` | admin | Crear usuario (Cognito + DynamoDB) |
| GET | `/api/usuarios/:userId` | admin | Obtener usuario |
| PATCH | `/api/usuarios/:userId` | admin | Actualizar usuario |
| PATCH | `/api/usuarios/:userId/estado` | admin | Activar/desactivar |
| GET | `/api/usuarios/mecanicos` | admin/jefe_taller | Mecánicos activos para asignar (`{ total, mecanicos }`, HU14) |
| GET | `/api/vehiculos` | token | Listar inventario |
| GET | `/api/vehiculos/:vehiculoId` | token | Obtener vehículo |
| POST | `/api/vehiculos` | admin/vendedor | Registrar vehículo |
| PATCH | `/api/vehiculos/:vehiculoId` | admin/vendedor | Actualizar vehículo |
| POST | `/api/vehiculos/archivos/presign` | admin/vendedor | URL prefirmada de subida (foto/documento) |
| GET | `/api/repuestos` | token | Listar repuestos (con `requiereReposicion`) |
| GET | `/api/repuestos/:repuestoId` | token | Obtener repuesto |
| POST | `/api/repuestos` | admin/vendedor/jefe_taller | Registrar repuesto |
| PATCH | `/api/repuestos/:repuestoId` | admin/vendedor/jefe_taller | Actualizar datos (no `cantidad`) |
| GET | `/api/movimientos` | token | Historial (`?repuestoId=&tipo=`) |
| POST | `/api/movimientos` | admin/vendedor/jefe_taller | Registrar entrada o salida |
| GET | `/api/clientes-comerciales` | admin/vendedor | Listar clientes comerciales |
| POST | `/api/clientes-comerciales` | admin/vendedor | Registrar cliente (anti-duplicados, 409) |
| GET | `/api/clientes-comerciales/:clienteId` | admin/vendedor | Obtener cliente con historial |
| PATCH | `/api/clientes-comerciales/:clienteId` | admin/vendedor | Actualizar datos o `estadoSeguimiento` |
| POST | `/api/clientes-comerciales/:clienteId/consultas` | admin/vendedor | Registrar una consulta en el historial |
| GET | `/api/cotizaciones` | admin/vendedor | Listar cotizaciones (`?clienteId=&estado=`) |
| POST | `/api/cotizaciones` | admin/vendedor | Generar cotización (número único, 201) |
| GET | `/api/cotizaciones/:cotizacionId` | admin/vendedor | Obtener cotización |
| PATCH | `/api/cotizaciones/:cotizacionId` | admin/vendedor | Actualizar descuento, observaciones o estado |
| POST | `/api/cotizaciones/:cotizacionId/enviar-correo` | admin/vendedor | Envío solicitado por el vendedor: registra el intento y devuelve `mailto:` |
| GET | `/api/reservas` | admin/vendedor | Listar reservas (`?clienteId=&vehiculoId=&estado=`) |
| POST | `/api/reservas` | admin/vendedor | Registrar reserva (número único, 201) |
| GET | `/api/reservas/:reservaId` | admin/vendedor | Obtener reserva |
| POST | `/api/reservas/:reservaId/cancelar` | admin/vendedor | Cancelar reserva y liberar vehículo |
| POST | `/api/reservas/:reservaId/convertir` | admin/vendedor | Convertir en venta (vehículo `vendido`) |
| GET | `/api/ventas` | admin/vendedor | Historial de ventas (`?clienteId=&vehiculoId=`) |
| POST | `/api/ventas` | admin/vendedor | Registrar venta (número único, vehículo `vendido`, 201) |
| GET | `/api/ventas/:ventaId` | admin/vendedor | Obtener el detalle de una venta |
| POST | `/api/pruebas-man` | público (token opcional) | Solicitar prueba de manejo (201, número único) |
| GET | `/api/pruebas-man` | admin/vendedor | Listar pruebas (`?clienteId=&vehiculoId=&estado=`) |
| GET | `/api/pruebas-man/:pruebaId` | admin/vendedor | Obtener prueba con historial |
| POST | `/api/pruebas-man/:pruebaId/confirmar` | admin/vendedor | Confirmar una prueba pendiente |
| POST | `/api/pruebas-man/:pruebaId/reprogramar` | admin/vendedor | Cambiar fecha/hora (revalida conflicto) |
| POST | `/api/pruebas-man/:pruebaId/cancelar` | admin/vendedor | Cancelar una prueba (motivo opcional) |
| POST | `/api/pruebas-man/:pruebaId/realizar` | admin/vendedor | Marcar como realizada |
| GET | `/api/notificaciones` | admin/vendedor | Listar notificaciones (`?tipo=&estado=&recursoId=`) |
| GET | `/api/notificaciones/:eventoId` | admin/vendedor | Obtener una notificación con su historial |
| POST | `/api/notificaciones/:eventoId/enviar` | admin/vendedor | Registrar el intento de envío y devolver el enlace `mailto:` |
| GET | `/api/citas-taller` | admin/jefe_taller/mecanico | Listar citas (`?clienteId=&vehiculoId=&estado=&fechaDesde=&fechaHasta=&mecanicoId=`); el rol `mecanico` solo ve las suyas |
| GET | `/api/citas-taller/:citaId` | admin/jefe_taller/mecanico | Obtener cita con historial (404 si no existe; 403 al `mecanico` si no es suya) |
| POST | `/api/citas-taller` | admin/jefe_taller | Registrar cita (número único, 201) |
| POST | `/api/citas-taller/:citaId/confirmar` | admin/jefe_taller | Confirmar una cita solicitada |
| POST | `/api/citas-taller/:citaId/reprogramar` | admin/jefe_taller | Cambiar fecha/hora (revalida conflicto) |
| POST | `/api/citas-taller/:citaId/iniciar` | admin/jefe_taller/mecanico | Marcar como en atención (el `mecanico` solo su orden asignada, HU15) |
| POST | `/api/citas-taller/:citaId/finalizar` | admin/jefe_taller/mecanico | Finalizar una cita en atención (el `mecanico` solo su orden asignada, HU15) |
| POST | `/api/citas-taller/:citaId/cancelar` | admin/jefe_taller | Cancelar una cita (motivo opcional) |
| POST | `/api/citas-taller/:citaId/asignar` | admin/jefe_taller | Asignar o reasignar el mecánico responsable (HU14) |
| POST | `/api/citas-taller/:citaId/avances` | admin/jefe_taller/mecanico | Registrar avance: diagnóstico, tareas, repuestos (descuenta), observaciones y archivos (HU15) |
| POST | `/api/citas-taller/:citaId/archivos/presign` | admin/jefe_taller/mecanico | URL prefirmada de archivo técnico (`taller_foto`/`taller_documento`, HU15) |

## Variables de entorno

Ver `backend/.env.example`:

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (por defecto 3000) |
| `AWS_REGION` | Región AWS (por defecto `us-east-2`) |
| `USER_POOL_ID` | ID del User Pool de Cognito |
| `USER_POOL_CLIENT_ID` | ID del App Client de Cognito |
| `USUARIOS_TABLE_NAME` | Tabla DynamoDB de usuarios |
| `VEHICULOS_TABLE_NAME` | Tabla DynamoDB de vehículos |
| `REPUESTOS_TABLE_NAME` | Tabla DynamoDB de repuestos |
| `MOVIMIENTOS_TABLE_NAME` | Tabla DynamoDB de movimientos de inventario |
| `CLIENTES_COMERCIALES_TABLE_NAME` | Tabla DynamoDB de clientes comerciales (HU07) |
| `COTIZACIONES_TABLE_NAME` | Tabla DynamoDB de cotizaciones (HU08) |
| `RESERVAS_TABLE_NAME` | Tabla DynamoDB de reservas (HU09) |
| `VENTAS_TABLE_NAME` | Tabla DynamoDB de ventas (HU10) |
| `PRUEBAS_MANEJO_TABLE_NAME` | Tabla DynamoDB de pruebas de manejo (HU11) |
| `NOTIFICACIONES_TABLE_NAME` | Tabla DynamoDB de notificaciones (HU12) |
| `CITAS_TALLER_TABLE_NAME` | Tabla DynamoDB de citas del taller (HU13) |
| `FOTOS_BUCKET_NAME` | Bucket S3 de fotografías |
| `CORS_ORIGIN` | Origen permitido (Vite: `http://localhost:5173`) |

## Comandos

```bash
cd backend
npm install          # instalar dependencias
npm start            # levantar la API en http://localhost:3000
node --check src/app.js   # verificación rápida de sintaxis
```

## Reglas al modificar el backend

- No agregues lógica de negocio en rutas ni controladores.
- Toda entrada externa se valida con Zod antes de usarse.
- Usa los errores de `AppError`; nunca devuelvas `res.status(...)` dispersos con lógica
  de negocio propia salvo en el controlador.
- No instancies clientes AWS dentro de controladores: usa `db/dynamodb.js`,
  `storageService` o los repositorios.
- No loguees tokens, contraseñas ni credenciales.
