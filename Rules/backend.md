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
    │   ├── middleware.js         # requireAuth, requireRole
    │   └── roles.js              # USER_ROLES, normalizeRoles, primaryRole
    ├── db/dynamodb.js            # documentClient (SDK v3)
    ├── errors/
    │   ├── AppError.js           # AppError + subclases (400/401/403/404/409)
    │   └── errorHandler.js       # notFoundHandler + errorHandler
    ├── repositories/             # usuarioRepository.js, vehiculoRepository.js
    ├── services/                 # usuarioService, vehiculoService, cognitoService, storageService
    ├── controllers/              # usuarioController, vehiculoController
    ├── routes/                   # publicRoutes, authRoutes, usuarioRoutes, vehiculoRoutes
    ├── validation/               # usuarioSchemas.js, vehiculoSchemas.js
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
- Roles del sistema (orden = precedencia): `['admin', 'vendedor', 'jefe_taller', 'mecanico']`.
  Rol por defecto: `mecanico`.

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
| `estado` | string | `disponible` \| `reservado` \| `vendido` \| `no_disponible` |
| `fotos` | string[] | claves (keys) de S3 |
| `createdAt`/`updatedAt` | string | ISO-8601 |

## Endpoints actuales

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/` | — | Bienvenida (ruta pública) |
| GET | `/info` | — | Estado de la API (pública) |
| GET | `/api/productos` | — | Lista demo (pública) |
| GET | `/api/auth/session` | token | Perfil del usuario autenticado |
| GET | `/api/usuarios` | admin | Listar usuarios |
| POST | `/api/usuarios` | admin | Crear usuario (Cognito + DynamoDB) |
| GET | `/api/usuarios/:userId` | admin | Obtener usuario |
| PATCH | `/api/usuarios/:userId` | admin | Actualizar usuario |
| PATCH | `/api/usuarios/:userId/estado` | admin | Activar/desactivar |
| GET | `/api/vehiculos` | token | Listar inventario |
| GET | `/api/vehiculos/:vehiculoId` | token | Obtener vehículo |
| POST | `/api/vehiculos` | admin/vendedor | Registrar vehículo |
| PATCH | `/api/vehiculos/:vehiculoId` | admin/vendedor | Actualizar vehículo |
| POST | `/api/vehiculos/fotos/presign` | admin/vendedor | URL prefirmada de subida |

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
