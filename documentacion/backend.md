# Documentación técnica del backend — Concesionaria BMW

> Documento amplio y detallado del backend del proyecto **Concesionaria BMW**.
> Recorre los 13 puntos solicitados, adaptando a la tecnología real del proyecto los
> que originalmente estaban pensados para PostgreSQL/ORM (ver equivalencias en el
> [README](./README.md)). Los diagramas están en [`diagramas.md`](./diagramas.md).

---

## Índice

1. [Estructura del proyecto backend](#1-estructura-del-proyecto-backend)
2. [Implementación con JavaScript (Node.js) y TypeScript](#2-implementación-con-javascript-nodejs-y-typescript)
3. [Arquitectura del backend (MVC por capas)](#3-arquitectura-del-backend-mvc-por-capas)
4. [Configuración de Amazon DynamoDB (base NoSQL)](#4-configuración-de-amazon-dynamodb-base-nosql)
5. [Modelo de datos y tablas de DynamoDB](#5-modelo-de-datos-y-tablas-de-dynamodb)
6. [Acceso a datos mediante repositorios y el cliente de documentos de AWS SDK](#6-acceso-a-datos-mediante-repositorios-y-el-cliente-de-documentos-de-aws-sdk)
7. [Aprovisionamiento del esquema con Infraestructura como Código (AWS CDK)](#7-aprovisionamiento-del-esquema-con-infraestructura-como-código-aws-cdk)
8. [Operaciones CRUD](#8-operaciones-crud)
9. [Validación de datos con Zod](#9-validación-de-datos-con-zod)
10. [Manejo de errores](#10-manejo-de-errores)
11. [Endpoints REST](#11-endpoints-rest)
12. [JSON y códigos HTTP](#12-json-y-códigos-http)
13. [Documentación básica de API](#13-documentación-básica-de-api)

---

## 1. Estructura del proyecto backend

Para organizar el backend me basé en el patrón por capas: cada carpeta dentro de `src/`
tiene una única responsabilidad y las dependencias siempre van en el mismo sentido, desde
las rutas hacia los repositorios. Todo comienza en `server.js`, que primero revisa que no
falte ninguna variable de entorno y, si está todo bien, llama a `createApp()`. Ahí es donde
realmente se arma la aplicación: registro los middlewares (`cors` y `express.json`) y voy
montando cada router en su prefijo (`/api/vehiculos`, `/api/repuestos`, etc.), dejando al
final el manejador de rutas no encontradas y el de errores. Organizarlo así me resulta muy
cómodo porque siempre sé dónde está cada cosa: la lógica en `services/`, el acceso a datos
en `repositories/` y la validación en `validation/`. Además, para agregar algo nuevo no
toco lo que ya funciona, solo sumo los archivos de esa funcionalidad.

El backend es una API REST en **Node.js + Express 5**. Sigue una organización por
**capas** (routes → controllers → services → repositories) y agrupa el código de
negocio bajo `src/`.

```text
backend/
├── server.js                 # Punto de entrada: valida config y levanta Express
├── package.json              # Dependencias y scripts (start)
├── .env.example              # Plantilla de variables de entorno (NO secretos)
├── .env                      # Variables reales (NO versionado)
└── src/
    ├── app.js                # Crea la app Express, registra middlewares y rutas
    ├── config.js             # Lee .env, expone `config` y `assertAuthConfig()`
    ├── auth/                 # Autenticación y autorización
    │   ├── middleware.js     # requireAuth / optionalAuth / requireRole / extractBearerToken
    │   ├── verify.js         # Verificación del ID token de Cognito (JWT)
    │   └── roles.js          # Roles, STAFF_ROLES, normalizeRoles, primaryRole
    ├── db/
    │   └── dynamodb.js       # Cliente de documentos de DynamoDB (compartido)
    ├── routes/               # Definición de rutas y middlewares por recurso
    │   ├── publicRoutes.js
    │   ├── authRoutes.js
    │   ├── usuarioRoutes.js
    │   ├── clienteRoutes.js
    │   ├── catalogoRoutes.js
    │   ├── vehiculoRoutes.js
    │   ├── repuestoRoutes.js
    │   ├── movimientoRoutes.js
    │   ├── clienteComercialRoutes.js
    │   ├── cotizacionRoutes.js
    │   ├── reservaRoutes.js
    │   ├── ventaRoutes.js
    │   ├── pruebaManejoRoutes.js     (HU11: POST público con token opcional)
    │   └── notificacionRoutes.js     (HU12)
    ├── controllers/          # Reciben HTTP, validan y delegan en services
    │   ├── usuarioController.js
    │   ├── clienteController.js
    │   ├── catalogoController.js
    │   ├── vehiculoController.js
    │   ├── repuestoController.js
    │   ├── movimientoController.js
    │   ├── clienteComercialController.js
    │   ├── cotizacionController.js
    │   ├── reservaController.js
    │   ├── ventaController.js
    │   ├── pruebaManejoController.js
    │   └── notificacionController.js
    ├── services/             # REGLAS DE NEGOCIO (aquí vive la lógica)
    │   ├── usuarioService.js
    │   ├── cognitoService.js
    │   ├── catalogoService.js        (lógica del catálogo, si aplica)
    │   ├── vehiculoService.js
    │   ├── storageService.js         # S3: presign, validación, borrado, URLs
    │   ├── repuestoService.js
    │   ├── movimientoService.js
    │   ├── clienteComercialService.js
    │   ├── cotizacionService.js
    │   ├── reservaService.js
    │   ├── ventaService.js
    │   ├── pruebaManejoService.js    # agenda, conflictos de horario y estados
    │   ├── notificacionService.js     # HU12: registro, dedup e intentos de correo
    │   └── plantillasCorreo.js        # HU12: textos de los correos (texto plano)
    ├── repositories/         # ÚNICO lugar que habla con DynamoDB
    │   ├── usuarioRepository.js
    │   ├── vehiculoRepository.js
    │   ├── repuestoRepository.js
    │   ├── movimientoRepository.js
    │   ├── clienteComercialRepository.js
    │   ├── cotizacionRepository.js
    │   ├── reservaRepository.js
    │   ├── ventaRepository.js
    │   ├── pruebaManejoRepository.js
    │   └── notificacionRepository.js
    ├── validation/           # Esquemas Zod + helper `validate`
    │   ├── usuarioSchemas.js
    │   ├── clienteSchemas.js
    │   ├── vehiculoSchemas.js
    │   ├── repuestoSchemas.js
    │   ├── movimientoSchemas.js
    │   ├── clienteComercialSchemas.js
    │   ├── cotizacionSchemas.js
    │   ├── reservaSchemas.js
    │   ├── ventaSchemas.js
    │   ├── pruebaManejoSchemas.js    # horario 08:00–18:00 en pasos de 15 min
    │   └── notificacionSchemas.js    # HU12: tipos, estados y MAX_INTENTOS
    ├── errors/               # Jerarquía de errores y manejador central
    │   ├── AppError.js
    │   └── errorHandler.js
    └── utils/
        └── asyncHandler.js   # Envuelve handlers async y delega errores a next()
```

### Principios de la organización

- **Responsabilidad única por carpeta.** Las rutas solo definen caminos y permisos;
  los controladores solo traducen HTTP ↔ servicio; los servicios contienen la lógica
  de negocio; los repositorios son el único punto de contacto con la base de datos.
- **Sin lógica de negocio en controladores ni rutas.** Esto se verifica en el código:
  por ejemplo, `vehiculoController.js` valida y delega, pero no decide reglas de negocio.
- **Un único manejador de errores** (`errors/errorHandler.js`) traduce excepciones a
  respuestas HTTP.
- **Configuración centralizada** en `src/config.js` (nunca se leen variables `process.env`
  sueltas por el código).

---

## 2. Implementación con JavaScript (Node.js) y TypeScript

Hice el backend en JavaScript sobre Node.js usando módulos CommonJS, así no necesito
ningún paso de compilación: los archivos usan `require()` y `module.exports`, y el servidor
se levanta directamente con `node server.js`. Esto hace que desarrollar y desplegar sea más
rápido, aunque a cambio pierdo el tipado que da TypeScript. Para compensarlo validé todos
los datos de entrada con Zod y, en el frontend, definí los tipos espejo en `types/`
(`types/vehiculo.ts`, `types/usuario.ts`, …), de manera que el cliente y el servidor
siempre trabajan con la misma forma de datos. La sintaxis del backend la reviso con
`node --check`, que forma parte de la verificación del proyecto.

El enunciado pedía "JavaScript/TypeScript". En este repositorio conviven ambos lenguajes,
**por capa**:

| Parte del proyecto | Lenguaje | Motivo |
| --- | --- | --- |
| **Backend** (`backend/`) | **JavaScript** (CommonJS) | Simplicidad y arranque directo con Node; sin paso de compilación. |
| **Frontend** (`frontend/`) | **TypeScript** | Tipado fuerte en componentes React + `types/`. |
| **Infraestructura** (`infra/`) | **TypeScript** (AWS CDK) | Los constructos de CDK se benefician del tipado. |

### Detalles del backend en JavaScript

- Se usa `"type": "commonjs"` (ver `backend/package.json`) y por tanto
  `require(...)`/`module.exports`.
- No hay transpilación: el servidor se ejecuta con `node server.js`.
- La verificación de sintaxis del proyecto se hace con `node --check <archivo>`.

```javascript
// backend/server.js
const { config, assertAuthConfig } = require('./src/config');
const { createApp } = require('./src/app');

assertAuthConfig();                 // Falla rápido si faltan variables de entorno

const app = createApp();
app.listen(config.port, () => {
  console.log(`Servidor de Concesionaria BMW ejecutándose en http://localhost:${config.port}`);
});
```

### Tipado en los bordes

Aunque el backend es JavaScript, el contrato de datos está **tipado de forma explícita**
gracias a:

1. **Zod** en el backend (validación en tiempo de ejecución, ver punto 9).
2. **TypeScript** en el frontend (`frontend/src/types/vehiculo.ts`, `types/usuario.ts`, …),
   cuyos tipos espejo mantienen el contrato alineado entre cliente y servidor.

Esta es la estrategia "**validación en los bordes**": el backend no confía en el payload,
lo valida con Zod y devuelve datos normalizados.

---

## 3. Arquitectura del backend (MVC por capas)

El backend está pensado como un MVC por capas. Cada petición sigue siempre el mismo
recorrido: primero el **router**, que define la ruta y revisa la autenticación y el rol;
luego el **controlador**, que valida los datos con Zod y llama al servicio; después el
**servicio**, donde coloqué toda la lógica de negocio; y al final el **repositorio**, que es
el único que se comunica con la base de datos. Lo que buscaba era que la lógica no se
mezclara ni con el transporte ni con el acceso a datos: por ejemplo,
`vehiculoController.create` solo valida y delega, mientras que las reglas (unicidad de VIN,
verificación de archivos) están en `vehiculoService`. Los temas transversales (errores,
autenticación, validación y configuración) los resolví en módulos aparte que cualquier capa
puede usar. Gracias a esto, el código es fácil de probar y, si algún día tengo que cambiar
la base de datos, solo tendría que reescribir los repositorios.

El backend implementa una variante de **MVC en capas**, con separación estricta entre
transporte (HTTP), lógica de negocio y acceso a datos.

```text
Petición HTTP
     │
     ▼
┌─────────────┐   Express Router: define ruta + middlewares de auth/rol
│   routes    │
└─────────────┘
     │
     ▼
┌─────────────┐   Valida con Zod, traduce HTTP ↔ servicio, define status codes
│ controllers │
└─────────────┘
     │
     ▼
┌─────────────┐   Reglas de negocio, orquestación, compensaciones, mapeo a respuesta
│  services   │
└─────────────┘
     │
     ▼
┌──────────────┐  Único acceso a DynamoDB (AWS SDK v3)
│ repositories │
└──────────────┘
     │
     ▼
 Amazon DynamoDB / Amazon S3

Transversal: errors/ (AppError + errorHandler), auth/ (JWT), validation/ (Zod), config
```

### Flujo de una petición (ejemplo real `POST /api/vehiculos`)

1. **Ruta** (`vehiculoRoutes.js`): pasa por `requireAuth` (JWT válido) y
   `requireRole('admin','vendedor')`.
2. **Controlador** (`vehiculoController.create`): valida el cuerpo con
   `createVehiculoSchema` y llama al servicio.
3. **Servicio** (`vehiculoService.createVehiculo`): aplica reglas de negocio
   (unicidad de VIN, verificación de archivos en S3, construcción del registro).
4. **Repositorio** (`vehiculoRepository`): ejecuta `PutCommand`/`QueryCommand` en DynamoDB.
5. **Respuesta**: el controlador devuelve `201` con `{ message, vehiculo }`.

### Ventajas de esta arquitectura

- **Testeable**: los servicios pueden probarse sin HTTP y los repositorios son el único
  punto a simular (mock) para aislar la base de datos.
- **Intercambiable**: si se cambiara DynamoDB por otra base, solo se reescriben los
  repositorios; los servicios y controladores no cambian.
- **Mantenible**: cada capa tiene una única razón para cambiar (SRP / SOLID).

> Diagrama de capas: ver **Diagrama 1** en [`diagramas.md`](./diagramas.md).

---

## 4. Configuración de Amazon DynamoDB (base NoSQL)

En vez de PostgreSQL usé Amazon DynamoDB, porque el proyecto debía mantenerse en la capa
gratuita y una base relacional administrada implicaría un servidor (RDS/EC2) con costo.
DynamoDB es un servicio NoSQL totalmente administrado que se usa en modo on-demand (pago
por uso), así que no hay capacidad que aprovisionar. Toda la configuración la dejé en
`src/config.js`: ahí cargo el archivo `.env` con `dotenv` y expongo el objeto `config`
(región, nombres de tablas y bucket), mientras el AWS SDK v3 toma automáticamente las
credenciales y la región del entorno. De esta forma ningún módulo lee `process.env` por su
cuenta y cambiar de región o de tabla es tan simple como editar `.env`, sin tocar el código.

> **Punto adaptado.** El enunciado pedía "Configuración de PostgreSQL". Este proyecto
> **no usa base de datos relacional**; usa **Amazon DynamoDB**, una base **NoSQL**
> de tipo clave-valor/documento, totalmente administrada y dentro de la **capa gratuita**.

### ¿Por qué DynamoDB y no PostgreSQL?

| Criterio | PostgreSQL (relacional) | DynamoDB (lo usado) |
| --- | --- | --- |
| Costo en capa gratuita | Requiere servidor (RDS/EC2) → **con costo** | **On-demand**, capa gratuita, sin servidor |
| Esquema | Rígido (DDL, migraciones) | Flexible (esquema por ítem) |
| Administración | Parcheo, backups, escalado manual | Totalmente administrado |
| Integración AWS | Manual | Nativa con IAM/Cognito/S3 |

Como el proyecto exige **solo capa gratuita** (ver [`../Rules/aws.md`](../Rules/aws.md)),
una base relacional administrada (RDS) **generaría costo**, por lo que se eligió
**DynamoDB en modo on-demand**, que entra en la capa gratuita.

### Parámetros de la configuración

La conexión se centraliza en `src/config.js`, que lee `.env`:

```javascript
// backend/src/config.js (extracto)
const config = {
  port: process.env.PORT || 3000,
  awsRegion: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-2',
  userPoolId: process.env.USER_POOL_ID,
  userPoolClientId: process.env.USER_POOL_CLIENT_ID,
  usuariosTableName: process.env.USUARIOS_TABLE_NAME || 'Usuarios',
  vehiculosTableName: process.env.VEHICULOS_TABLE_NAME || 'Vehiculos',
  repuestosTableName: process.env.REPUESTOS_TABLE_NAME || 'Repuestos',
  movimientosTableName: process.env.MOVIMIENTOS_TABLE_NAME || 'MovimientosInventario',
  fotosBucketName: process.env.FOTOS_BUCKET_NAME,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
```

Variables relacionadas con la base de datos y archivos:

| Variable | Para qué sirve |
| --- | --- |
| `AWS_REGION` | Región de AWS (por defecto `us-east-2`). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credenciales del usuario IAM (Van en `.env`, **nunca** en el repositorio). |
| `USUARIOS_TABLE_NAME` | Nombre de la tabla de usuarios en DynamoDB. |
| `VEHICULOS_TABLE_NAME` | Tabla de vehículos. |
| `REPUESTOS_TABLE_NAME` | Tabla de repuestos. |
| `MOVIMIENTOS_TABLE_NAME` | Tabla de movimientos de inventario. |
| `CLIENTES_COMERCIALES_TABLE_NAME` | Tabla de clientes comerciales (HU07). |
| `COTIZACIONES_TABLE_NAME` | Tabla de cotizaciones (HU08). |
| `RESERVAS_TABLE_NAME` | Tabla de reservas (HU09). |
| `VENTAS_TABLE_NAME` | Tabla de ventas (HU10). |
| `PRUEBAS_MANEJO_TABLE_NAME` | Tabla de pruebas de manejo (HU11). |
| `NOTIFICACIONES_TABLE_NAME` | Tabla de notificaciones por correo (HU12). |
| `FOTOS_BUCKET_NAME` | Bucket S3 de fotografías y documentos. |

### Modo de capacidad y región

- **Modo:** *On-demand* (PAY_PER_REQUEST). Escala automáticamente y no requiere
  aprovisionar capacidad de lectura/escritura (evita cargos por capacidad ociosa).
- **Región:** `us-east-2` (misma región para tablas, bucket S3 y Cognito, para evitar
  costos de transferencia y latencia).

### Credenciales

El AWS SDK v3 toma las credenciales del **entorno** (variables `AWS_ACCESS_KEY_ID` y
`AWS_SECRET_ACCESS_KEY` en `.env`, cargadas con `dotenv`). En el repositorio **solo se
versiona `.env.example`**; los valores reales nunca se suben (regla de `AGENTS.md`).

---

## 5. Modelo de datos y tablas de DynamoDB

Con DynamoDB definí diez tablas: `Usuarios`, `Vehiculos`, `Repuestos`,
`MovimientosInventario`, `ClientesComerciales`, `Cotizaciones`, `Reservas`, `Ventas`,
`PruebasManejo` y `Notificaciones`. Cada una tiene
su propia clave primaria y, cuando necesitaba
buscar por otro campo, le agregué un índice secundario (GSI): `email-index` para el correo,
`vin-index` para el VIN y `codigo-index`/`repuesto-index` para los repuestos y su historial;
en `ClientesComerciales` usé `email-index` y `documento-index` para buscar y evitar
duplicados, en `Cotizaciones` usé `cliente-index` (historial por cliente) y `numero-index`
(unicidad del número), en `Reservas` usé `vehiculo-index` (detectar reservas activas de una
unidad), `cliente-index` (historial por cliente) y `numero-index` (unicidad del número), en
`Ventas` usé `vehiculo-index` (control de doble venta), `cliente-index` (historial por cliente)
y `numero-index` (unicidad del número), en `PruebasManejo` usé `vehiculo-index`
(consulta la agenda por vehículo para detectar solapes), `cliente-index` (historial por
cliente) y `numero-index` (unicidad del número), y en `Notificaciones` (HU12) usé
`recurso-index` (historial de correos de una operación), con la clave primaria compuesta
por evento + destinatario como anti-duplicados.
Como DynamoDB es *schemaless*, cada ítem guarda solo los atributos que necesita y no hay
claves foráneas ni un esquema rígido; las relaciones las manejo por convención (por
ejemplo, `MovimientosInventario.repuestoId` apunta a `Repuestos.repuestoId`). Por eso la
integridad referencial la controlo desde la capa de servicios, verificando que el recurso
relacionado exista antes de operar.

DynamoDB es **schemaless** (sin esquema fijo): cada ítem guarda solo los atributos que
necesita. Cada tabla se define en la infraestructura (CDK, ver punto 7) con una **clave
primaria** y, cuando hace falta, **índices secundarios (GSI)**.

### Tabla `Usuarios`

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `userId` | string | **Clave de partición (PK)** — `sub` de Cognito |
| `email` | string | GSI `email-index` (búsqueda por correo) |
| `nombre` | string | Nombre completo |
| `rol` | string | `admin` \| `vendedor` \| `jefe_taller` \| `mecanico` \| `cliente` |
| `estado` | string | `activo` \| `inactivo` |
| `fechaNacimiento` / `carnetIdentidad` / `celular` | string | Opcionales (clientes) |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |
| `createdBy` / `updatedBy` | string | `sub` del actor |

> **GSI `email-index`:** permite `findByEmail` sin recorrer toda la tabla, clave para el
> login y el autorregistro de clientes.

### Tabla `Vehiculos`

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `vehiculoId` | string (UUID) | **PK** |
| `vin` | string | GSI `vin-index` (unicidad / búsqueda por VIN) |
| `marca`, `modelo`, `version`, `color` | string | Datos del vehículo |
| `anio` | number | Año |
| `kilometraje` | number | Kilometraje |
| `precio` | number | Precio |
| `condicion` | string | `nuevo` \| `seminuevo` |
| `tipo` | string | `sedan`, `suv`, … |
| `estado` | string | `disponible` \| `reservado` \| `vendido` \| `no_disponible` |
| `descripcion` | string | Texto libre |
| `caracteristicas` | list&lt;string&gt; | Lista de características |
| `publicado` | boolean | Visible en el catálogo público |
| `fotos` | list&lt;string&gt; | Claves S3 de fotos |
| `documentos` | list&lt;objeto&gt; | `{ key, nombre, contentType, size, uploadedAt, uploadedBy }` |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |
| `createdBy` / `updatedBy` | string | `sub` del actor |

> **GSI `vin-index`:** garantiza la búsqueda/unicidad del VIN de forma eficiente.

### Tabla `Repuestos`

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `repuestoId` | string (UUID) | **PK** |
| `codigo` | string | GSI `codigo-index` (único) |
| `nombre`, `descripcion` | string | Datos |
| `precio` | number | Precio |
| `cantidad` | number | Stock actual |
| `cantidadMinima` | number | Umbral de reposición |
| `createdAt` / `updatedAt`, `createdBy` / `updatedBy` | string | Auditoría |

> `requiereReposicion` **no se almacena**: se calcula en el servicio
> (`cantidad <= cantidadMinima`) y se agrega en la respuesta.

### Tabla `MovimientosInventario`

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `movimientoId` | string (UUID) | **PK** |
| `repuestoId` | string | GSI `repuesto-index` (historial por repuesto) |
| `tipo` | string | `entrada` \| `salida` |
| `cantidad` | number | Unidades movidas |
| `motivo` | string | Justificación |
| `createdAt` | string (ISO) | Fecha del movimiento |
| `createdBy` | string | `sub` del actor |

### Tabla `ClientesComerciales` (HU07)

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `clienteId` | string (UUID) | **PK** |
| `nombres`, `apellidos` | string | Datos del cliente |
| `documento` | string | GSI `documento-index` (único) |
| `telefono` | string | Teléfono de contacto |
| `email` | string | GSI `email-index` (único, guardado en minúsculas) |
| `consultas` | list&lt;objeto&gt; | Historial: `{ fecha, vehiculo?, interes, observacion? }` |
| `notas` | string | Notas internas del seguimiento |
| `estadoSeguimiento` | string | `nuevo` \| `contactado` \| `cotizando` \| `reservado` \| `vendido` \| `cerrado` |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |

> **Anti-duplicados:** antes de crear o de modificar el correo/documento, el servicio
> consulta los GSIs `documento-index` y `email-index`; si el dato ya pertenece a otro
> cliente, responde `409 Conflict`. El historial de consultas vive como lista anidada en
> el propio ítem (no hace falta una tabla extra) y crece con cada interacción que
> registra el vendedor desde el frontend.

### Tabla `Cotizaciones` (HU08)

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `cotizacionId` | string (UUID) | **PK** (también guarda la partición `secuencia#<año>`) |
| `numero` | string | GSI `numero-index`; formato `COT-AAAA-######` (único) |
| `clienteId` | string | GSI `cliente-index` (+ `createdAt`); historial por cliente |
| `cliente` | objeto | Snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `items` | list&lt;objeto&gt; | Snapshot de vehículos: `{ vehiculoId, marca, modelo, version, anio, vin, precioUnitario, subtotal }` |
| `subtotal`, `descuentoMonto`, `total` | number | Importes calculados en el servicio |
| `descuentoPorcentaje` | number | 0–20 (política comercial) |
| `observaciones` | string | Opcional |
| `estado` | string | `pendiente` \| `aceptada` \| `rechazada` \| `vencida` |
| `vigenciaDias` | number | Validez en días (1–90; por defecto 15) |
| `fechaVencimiento` | string (ISO) | `createdAt` + `vigenciaDias` |
| `createdBy` / `createdByName` | string | Autor (sub / nombre del token) |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |

> **Snapshot de precios:** cada ítem guarda el precio vigente del vehículo al momento de
> cotizar, así una cotización histórica no cambia aunque luego se actualice el vehículo.
> **Numeración atómica:** el contador se reserva con un `UpdateItem` (`ADD`) sobre la
> partición `secuencia#<año>` (identificada por el prefijo `secuencia#`), lo que evita
> números repetidos sin necesidad de bloqueos. **Estado derivado:** una cotización
> `pendiente` cuya `fechaVencimiento` ya pasó se responde como `vencida` sin escribir nada.

### Tabla `Reservas` (HU09)

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `reservaId` | string (UUID) | **PK** (también guarda la partición `secuencia#<año>`) |
| `numero` | string | GSI `numero-index`; formato `RES-AAAA-######` (único) |
| `clienteId` | string | GSI `cliente-index` (+ `createdAt`); historial por cliente |
| `cliente` | objeto | Snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `vehiculoId` | string | GSI `vehiculo-index` (+ `createdAt`); detección de reservas activas |
| `vehiculo` | objeto | Snapshot: `{ vehiculoId, marca, modelo, version, anio, vin, precio }` |
| `condiciones` | string | Opcional (≤ 1000 caracteres) |
| `monto` | number | Opcional (monto de la reserva) |
| `estado` | string | `activa` \| `cancelada` \| `vencida` \| `convertida` |
| `vigenciaDias` | number | Validez en días (1–365; por defecto 30) |
| `fechaVencimiento` | string (ISO) | `createdAt` + `vigenciaDias` |
| `observaciones` | string | Opcional (notas de la conversión en venta) |
| `historial` | list&lt;objeto&gt; | `{ estado, fecha, usuario?, motivo? }` |
| `createdBy` / `createdByName` | string | Autor (sub / nombre del token) |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |

> **Apartado atómico:** al reservar, el vehículo pasa a `reservado` con un update condicional
> (`estado = disponible` como `ConditionExpression`); si otra reserva lo tomó primero, la
> operación falla con `409`. **Numeración atómica:** igual que en cotizaciones, el contador se
> reserva con `ADD` sobre la partición `secuencia#<año>`. **Estado derivado y liberación:** una
> reserva `activa` cuya `fechaVencimiento` ya pasó se responde como `vencida` y, al detectarlo,
> la unidad vuelve a `disponible` y se registra la entrada en el `historial`.

### Tabla `Ventas` (HU10)

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `ventaId` | string (UUID) | **PK** (también guarda la partición `secuencia#<año>`) |
| `numero` | string | GSI `numero-index`; formato `VTA-AAAA-######` (único) |
| `clienteId` | string | GSI `cliente-index` (+ `createdAt`); historial por cliente |
| `cliente` | objeto | Snapshot: `{ clienteId, nombres, apellidos, documento, email, telefono }` |
| `vehiculoId` | string | GSI `vehiculo-index` (+ `createdAt`); control de doble venta |
| `vehiculo` | objeto | Snapshot: `{ vehiculoId, marca, modelo, version, anio, vin, precio }` |
| `reservaId` / `numeroReserva` | string | Opcionales: reserva vigente que originó la venta |
| `precioLista` | number | Precio vigente del vehículo al vender |
| `descuentoPorcentaje` | number | Descuento autorizado (0–20) |
| `descuentoMonto` | number | Descuento calculado |
| `precioFinal` | number | `precioLista - descuentoMonto` |
| `observaciones` | string | Opcional (≤ 1000 caracteres) |
| `fechaVenta` | string (ISO) | Fecha de la operación (no puede ser futura) |
| `createdBy` / `createdByName` | string | Autor de la operación (sub / nombre del token) |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |

> **Verificación previa y apartado atómico:** antes de confirmar, el servicio vuelve a leer el
> vehículo y exige estado `disponible` o `reservado` con reserva vigente; luego lo pasa a
> `vendido` con un update condicional (`estado = <estado_leído>` como `ConditionExpression`).
> Si otro proceso vendió la unidad primero, la operación falla con `409`, así **un mismo
> vehículo no puede quedar en dos operaciones activas**. **Numeración atómica:** igual que en
> cotizaciones y reservas, el contador se reserva con `ADD` sobre la partición `secuencia#<año>`.
> **Vínculo con reservas:** si la unidad estaba reservada, la venta guarda `reservaId`/
> `numeroReserva` y la reserva pasa a `convertida` con el número de venta.

### Tabla `PruebasManejo` (HU11)

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `pruebaId` | string (UUID) | **PK** (también guarda la partición `secuencia#<año>`) |
| `numero` | string | GSI `numero-index`; formato `PRB-AAAA-######` (único) |
| `vehiculoId` | string | GSI `vehiculo-index` (+ `fechaHora`); agenda por vehículo y detección de solapes |
| `vehiculo` | objeto | Snapshot: `{ vehiculoId, marca, modelo, version, anio, precio, color }` |
| `clienteId` | string | GSI `cliente-index` (+ `createdAt`); historial por cliente (`'anonimo'` si es solicitud pública) |
| `cliente` | objeto \| null | Snapshot del cliente cuando el registro lo vincula |
| `contacto` | objeto | `{ nombre, telefono, email? }` — siempre presente, incluso sin cliente |
| `fechaHora` | string (ISO) | Inicio de la prueba (futuro, 08:00–18:00, pasos de 15 min) |
| `duracionMinutos` | number | 15–180 (por defecto 60) |
| `estado` | string | `pendiente` \| `confirmada` \| `realizada` \| `cancelada` |
| `origen` | string | `catalogo` (visitante) \| `cliente` (sesión de cliente) \| `interno` (staff) |
| `observaciones` | string | Opcional (≤ 1000 caracteres) |
| `historial` | list&lt;objeto&gt; | `{ estado, fecha, usuario?, motivo?, observaciones? }` |
| `createdBy` / `createdByName` | string \| null | Autor (sub / nombre del token; `null` en solicitudes anónimas) |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |

> **Conflictos de agenda:** al crear (y al reprogramar) el servicio consulta el GSI
> `vehiculo-index` y descarta las pruebas `cancelada`/`realizada`; si la ventana
> `[fechaHora, fechaHora + duración)` se solapa con otra del mismo vehículo, responde `409`
> con la prueba en conflicto. **Numeración atómica:** igual que en las demás operaciones
> comerciales, el contador se reserva con `ADD` sobre la partición `secuencia#<año>`.
> **Transiciones de estado:** `pendiente → confirmada | cancelada`,
> `confirmada → realizada | cancelada`; cualquier otra combinación responde `409` y toda
> transición (incluida la reprogramación, que conserva el estado) agrega una entrada al
> `historial`. **Sin cambio de estado del vehículo:** a diferencia de reservas y ventas, la
> prueba no modifica el vehículo; solo exige que esté `disponible` o `reservado` y
> publicado.

### Tabla `Notificaciones` (HU12)

| Atributo | Tipo | Rol |
| --- | --- | --- |
| `eventoId` (PK) | string | Clave única `tipo:recursoId:evento:destinatario`; el `Put` condicional (`attribute_not_exists`) garantiza un solo registro por evento + destinatario |
| `tipo` | string | `reserva` \| `cotizacion` \| `prueba_manejo` \| `venta` |
| `evento` | string | `reserva_alta`, `cotizacion_envio`, `prueba_confirmada`, `venta_confirmada`, … |
| `recursoId` | string | GSI `recurso-index` (+ `createdAt`); historial de correos de una operación |
| `numero` | string | Número del documento (RES/COT/PRB/VTA) |
| `destinatario` | string \| null | Correo del cliente/contacto; `null` si la operación no tenía correo |
| `destinatarioNombre` | string \| null | Nombre para el saludo |
| `asunto` / `cuerpo` | string | Mensaje redactado por `plantillasCorreo` (texto plano, sin VIN ni contraseñas) |
| `estado` | string | `pendiente` \| `intentado` \| `fallido` \| `omitido` |
| `intentos` / `maxIntentos` | number | Reintentos controlados (máximo 5; el 6.º responde `409`) |
| `ultimoResultado` / `ultimoIntentoAt` | string | Último intento registrado |
| `historial` | list&lt;objeto&gt; | `{ fecha, resultado, detalle? }` |
| `createdAt` / `updatedAt` | string (ISO) | Auditoría |

> **Transporte `mailto:` (decisión de diseño).** La HU12 original planteaba Amazon SES,
> pero SES cobra por mensaje y el proyecto está limitado a la **capa gratuita** (ver
> [`../Rules/aws.md`](../Rules/aws.md)). Por eso los servicios de negocio (reserva,
> cotización, prueba y venta) registran la notificación con el mensaje ya redactado y el
> endpoint de envío devuelve el enlace `mailto:`, que el frontend abre en el cliente de
> correo del usuario. **Anti-duplicados:** la PK única + `Put` condicional impiden que el
> mismo evento al mismo destinatario se registre dos veces; los reenvíos reutilizan el
> registro y solo incrementan `intentos` (máximo 5). **Sin romper el negocio:** el
> registro se hace con `registrarSinFallo`, de modo que un fallo al guardar la
> notificación nunca revierte la operación comercial. Si la operación no tenía correo
> válido, la notificación se crea en estado `omitido` y `enviar` responde `400`.

### Relación entre tablas (sin claves foráneas)

DynamoDB **no tiene claves foráneas**. Las relaciones se modelan por convención:

- `Vehiculos.createdBy` → `Usuarios.userId`
- `MovimientosInventario.repuestoId` → `Repuestos.repuestoId`
- `Usuarios.userId` ← `sub` del usuario en **Cognito**
- `ClientesComerciales` es autónoma: no referencia a otras tablas (su historial de
  consultas vive como lista anidada en el ítem).
- `Cotizaciones.clienteId` → `ClientesComerciales.clienteId` y
  `Cotizaciones.items[].vehiculoId` → `Vehiculos.vehiculoId` (guardando además un snapshot).
- `Reservas.clienteId` → `ClientesComerciales.clienteId` y `Reservas.vehiculoId` →
  `Vehiculos.vehiculoId` (guardando además un snapshot).
- `Ventas.clienteId` → `ClientesComerciales.clienteId`, `Ventas.vehiculoId` →
  `Vehiculos.vehiculoId` y `Ventas.reservaId` → `Reservas.reservaId` (con snapshots).
- `PruebasManejo.vehiculoId` → `Vehiculos.vehiculoId` (con snapshot) y
  `PruebasManejo.clienteId` → `ClientesComerciales.clienteId`; en las solicitudes anónimas
  el `clienteId` queda como `'anonimo'` y `cliente` como `null`.
- `Notificaciones.recursoId` → identificador de la operación que originó el correo
  (`reservaId`, `cotizacionId`, `pruebaId` o `ventaId`); no guarda snapshot porque el
  mensaje se redacta al momento del evento.

La integridad referencial se garantiza **en la capa de servicios** (por ejemplo,
`movimientoService` verifica que el repuesto exista antes de registrar el movimiento),
no por la base de datos.

> Diagrama entidad-relación: ver **Diagrama 4** en [`diagramas.md`](./diagramas.md).

---

## 6. Acceso a datos mediante repositorios y el cliente de documentos de AWS SDK

Como DynamoDB es NoSQL no usé un ORM, porque no había uno relacional que encajara. En su
lugar usé dos cosas que cumplen la misma función. La primera es el cliente de documentos
del AWS SDK, que configuro una sola vez en `src/db/dynamodb.js` y me evita trabajar con los
tipos `S`, `N` o `L`, porque convierte los objetos de JavaScript automáticamente. La segunda
es el patrón repositorio: hice un módulo por tabla con métodos con nombres de negocio, como
`findByCodigo`, `save` o `adjustStock`, que por dentro usan los comandos del SDK. De esta
forma los servicios no saben que existe DynamoDB, solo llaman a esos métodos.

> El enunciado pedía "Conexión mediante ORM". **Este proyecto no usa un ORM** (no hay
> TypeORM, Prisma ni Sequelize) porque **DynamoDB es NoSQL** y no existe un ORM
> relacional que aplique. En su lugar se usan dos piezas que cumplen el mismo objetivo
> (abstraer el acceso a datos): el **cliente de documentos de AWS SDK v3** y el
> **patrón repositorio**.

### 6.1 El cliente de documentos (`src/db/dynamodb.js`)

`@aws-sdk/lib-dynamodb` provee un **DocumentClient** que hace *marshalling*/desmarshalling
automático entre objetos JavaScript y el formato de DynamoDB. Es lo más parecido a un
"ORM": permite trabajar con objetos JS normales sin pensar en tipos (`S`, `N`, `L`…).

```javascript
// backend/src/db/dynamodb.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { config } = require('../config');

// Cliente único compartido por todos los repositorios.
const client = DynamoDBClient ? new DynamoDBClient({ region: config.awsRegion }) : undefined;

const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: config.awsRegion })
);

module.exports = { documentClient };
```

Con este cliente, los repositorios envían comandos con objetos JS normales:

```javascript
await documentClient.send(new GetCommand({ TableName, Key: { vehiculoId } }));
```

### 6.2 El patrón repositorio

Cada tabla tiene **un repositorio** que expone funciones de negocio claras y oculta los
comandos de DynamoDB. Así, los servicios **no saben que existe DynamoDB**.

```javascript
// backend/src/repositories/repuestoRepository.js (extracto)
const { GetCommand, QueryCommand, PutCommand, UpdateCommand } =
  require('@aws-sdk/lib-dynamodb');
const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.repuestosTableName;

async function findById(repuestoId) {
  const result = await documentClient.send(
    new GetCommand({ TableName: tableName, Key: { repuestoId } })
  );
  return result.Item ?? null;
}

async function findByCodigo(codigo) {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'codigo-index',
      KeyConditionExpression: 'codigo = :c',
      ExpressionAttributeValues: { ':c': codigo },
    })
  );
  return result.Items?.[0] ?? null;
}
```

### 6.3 Comparación ORM vs. este enfoque

| ORM (TypeORM/Prisma/Sequelize) | Este proyecto (DocumentClient + repositorios) |
| --- | --- |
| Mapea clases ↔ tablas | El repositorio mapea objetos JS ↔ ítems DynamoDB |
| Consultas en lenguaje propio (QueryBuilder) | Comandos explícitos: `GetCommand`, `QueryCommand`, `ScanCommand`, `PutCommand`, `UpdateCommand` |
| Migraciones automáticas | Infra como código (CDK, punto 7) |
| Transacciones | Operaciones atómicas condicionales (`ConditionExpression`) |

### 6.4 Operaciones atómicas como "integridad sin transacciones"

DynamoDB no tiene el `BEGIN/COMMIT` de SQL, pero ofrece **actualizaciones condicionales
atómicas**. En la gestión de stock se usa para impedir dejar existencias negativas:

```javascript
// backend/src/repositories/repuestoRepository.js (extracto)
async function adjustStock(repuestoId, delta) {
  let condition = 'attribute_exists(repuestoId)';
  if (delta < 0) {
    condition = 'attribute_exists(repuestoId) AND cantidad >= :requerido';
  }
  const result = await documentClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { repuestoId },
      UpdateExpression: 'SET cantidad = if_not_exists(cantidad, :zero) + :delta, updatedAt = :now',
      ConditionExpression: condition,
      ReturnValues: 'UPDATED_NEW',
    })
  );
  return result.Attributes;
}
```

Si la condición no se cumple, DynamoDB lanza `ConditionalCheckFailedException`, que el
servicio traduce a un `ConflictError` (409).

---

## 7. Aprovisionamiento del esquema con Infraestructura como Código (AWS CDK)

Como no hay un esquema relacional, no hay migraciones. Las tablas, sus claves, los índices y
los permisos los declaro con infraestructura como código usando AWS CDK en TypeScript. En
`infra/lib/inventario-stack.ts` describo cada recurso y sus GSIs, y al ejecutar `cdk deploy`
CloudFormation crea o actualiza exactamente lo que declaré. Esto me dio una ventaja
concreta cuando en HU06 agregué el atributo `documentos` a los vehículos: no tuve que
migrar nada, solo ajusté el esquema de Zod y la lógica del servicio, y los vehículos que ya
existían siguieron funcionando sin ese atributo. Algo parecido pasó en la HU07: declarar la
tabla `ClientesComerciales` con sus dos índices dentro de `repuestos-stack.ts` y volver a
ejecutar `cdk deploy` bastó para que CloudFormation creara la tabla nueva sin mover las que
ya existían. Lo mismo repetí en la HU08 con la tabla `Cotizaciones` y sus dos índices.

> El enunciado pedía "Migraciones". En bases **NoSQL no hay migraciones**: la base es
> *schemaless* y no existe un esquema que versionar. La creación y evolución de tablas,
> índices y permisos se hace con **Infraestructura como Código (AWS CDK en TypeScript)**,
> que cumple el rol de "migración declarativa".

### 7.1 ¿Por qué no hay migraciones?

- **No hay DDL**: no existe `CREATE TABLE` / `ALTER TABLE`. Los atributos se agregan a
  los ítems según se necesiten.
- **Ejemplo real (HU06)**: se añadió el atributo `documentos` a los vehículos. En SQL
  habría requerido una migración `ALTER TABLE`. En este proyecto solo se cambió el
  esquema **Zod** y la lógica del servicio: **los ítems existentes siguen siendo válidos**
  y simplemente no tienen el atributo `documentos`.

### 7.2 El rol del CDK

El stack `infra/lib/inventario-stack.ts` declara las tablas, sus claves e índices y los
permisos IAM. Al ejecutar `cdk deploy`, CloudFormation crea/actualiza los recursos.

```typescript
// infra/lib/inventario-stack.ts (esquema conceptual)
new dynamodb.Table(this, 'VehiculosTable', {
  partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: RemovalPolicy.RETAIN,
});

// Índice secundario para buscar por VIN
table.addGlobalSecondaryIndex({
  indexName: 'vin-index',
  partitionKey: { name: 'vin', type: dynamodb.AttributeType.STRING },
});
```

En la HU07 sumé una tabla nueva al stack de repuestos, con los índices que después usa el
servicio para evitar duplicados:

```typescript
// infra/lib/repuestos-stack.ts (HU07: nueva tabla + índices)
this.clientesComercialesTable = new dynamodb.Table(this, 'ClientesComercialesTable', {
  partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

this.clientesComercialesTable.addGlobalSecondaryIndex({
  indexName: 'email-index',
  partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
});

this.clientesComercialesTable.addGlobalSecondaryIndex({
  indexName: 'documento-index',
  partitionKey: { name: 'documento', type: dynamodb.AttributeType.STRING },
});
```

En la HU08 agregué la tabla `Cotizaciones`, con un índice por cliente (historial) y otro por
número (unicidad):

```typescript
// infra/lib/repuestos-stack.ts (HU08: nueva tabla + índices)
this.cotizacionesTable = new dynamodb.Table(this, 'CotizacionesTable', {
  partitionKey: { name: 'cotizacionId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

this.cotizacionesTable.addGlobalSecondaryIndex({
  indexName: 'cliente-index',
  partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});

this.cotizacionesTable.addGlobalSecondaryIndex({
  indexName: 'numero-index',
  partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
});
```

En la HU09 agregué la tabla `Reservas`, con un índice por vehículo (detectar reservas activas),
otro por cliente (historial) y otro por número (unicidad):

```typescript
// infra/lib/repuestos-stack.ts (HU09: nueva tabla + índices)
this.reservasTable = new dynamodb.Table(this, 'ReservasTable', {
  partitionKey: { name: 'reservaId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

this.reservasTable.addGlobalSecondaryIndex({
  indexName: 'vehiculo-index',
  partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});

this.reservasTable.addGlobalSecondaryIndex({
  indexName: 'cliente-index',
  partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});

this.reservasTable.addGlobalSecondaryIndex({
  indexName: 'numero-index',
  partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
});
```

En la HU10 agregué la tabla `Ventas`, con un índice por vehículo (control de doble venta),
otro por cliente (historial) y otro por número (unicidad):

```typescript
// infra/lib/repuestos-stack.ts (HU10: nueva tabla + índices)
this.ventasTable = new dynamodb.Table(this, 'VentasTable', {
  partitionKey: { name: 'ventaId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

this.ventasTable.addGlobalSecondaryIndex({
  indexName: 'vehiculo-index',
  partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});

this.ventasTable.addGlobalSecondaryIndex({
  indexName: 'cliente-index',
  partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});

this.ventasTable.addGlobalSecondaryIndex({
  indexName: 'numero-index',
  partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
});
```

En la HU11 agregué la tabla `PruebasManejo`, con un índice por vehículo (agenda y detección
de solapes), otro por cliente (historial) y otro por número (unicidad):

```typescript
// infra/lib/repuestos-stack.ts (HU11: nueva tabla + índices)
this.pruebasManejoTable = new dynamodb.Table(this, 'PruebasManejoTable', {
  partitionKey: { name: 'pruebaId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

this.pruebasManejoTable.addGlobalSecondaryIndex({
  indexName: 'vehiculo-index',
  partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'fechaHora', type: dynamodb.AttributeType.STRING },
});

this.pruebasManejoTable.addGlobalSecondaryIndex({
  indexName: 'cliente-index',
  partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});

this.pruebasManejoTable.addGlobalSecondaryIndex({
  indexName: 'numero-index',
  partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
});
```

> Nota: a diferencia de los demás GSIs por fecha (`createdAt`), el `vehiculo-index` usa
> `fechaHora` como clave de ordenación para que la agenda de un vehículo quede ordenada
> cronológicamente y el servicio pueda filtrar las ventanas solapadas con un `Query`.

En la HU12 agregué la tabla `Notificaciones`, con la clave primaria compuesta por evento
(anti-duplicados) y un índice por recurso (historial de correos de una operación):

```typescript
// infra/lib/repuestos-stack.ts (HU12: nueva tabla + índice)
this.notificacionesTable = new dynamodb.Table(this, 'NotificacionesTable', {
  partitionKey: { name: 'eventoId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // capa gratuita
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

this.notificacionesTable.addGlobalSecondaryIndex({
  indexName: 'recurso-index',
  partitionKey: { name: 'recursoId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
});
```

> La PK `eventoId` es una cadena única `tipo:recursoId:evento:destinatario`; el `Put`
> condicional (`attribute_not_exists`) con esa clave es lo que evita el envío duplicado
> de un mismo evento, sin necesidad de transacciones.

### 7.3 Equivalencia "migración" → "cambio de infraestructura"

| Concepto relacional | Equivalente en este proyecto |
| --- | --- |
| `CREATE TABLE` | Recurso `Table` en CDK (p. ej. `ClientesComercialesTable` HU07, `CotizacionesTable` HU08, `ReservasTable` HU09, `VentasTable` HU10, `PruebasManejoTable` HU11, `NotificacionesTable` HU12) |
| `CREATE INDEX` | `table.addGlobalSecondaryIndex({ indexName: 'vin-index', ... })` |
| `ALTER TABLE ADD COLUMN` | Agregar el atributo al esquema Zod (sin tocar la BD) |
| `DROP/DELETE` | `RemovalPolicy.DESTROY` (entorno de práctica) o `cdk destroy` |
| Versionado del esquema | El propio código CDK en Git |

### 7.4 Despliegue

```bash
cd infra
npx tsc --noEmit      # verifica tipos
npx cdk deploy        # crea/actualiza tablas, bucket, User Pool y sus GSIs
```

> Diagrama de despliegue: ver **Diagrama 2** en [`diagramas.md`](./diagramas.md).

---

## 8. Operaciones CRUD

Aunque no uso SQL, los servicios sí implementan el CRUD completo. Cada operación se traduce
en un comando del SDK: crear con `PutCommand` (o `UpdateCommand` cuando ajusto stock), leer
por clave con `GetCommand` y listar con `Query` o `Scan`, actualizar combinando los cambios
y guardando de nuevo, y borrar con `DeleteObjectCommand` los archivos que quedan huérfanos en
S3. Para leer uso `QueryCommand` cuando existe una clave o un GSI, porque es más eficiente,
y `Scan` para listados completos, algo aceptable por el volumen del proyecto. Las escrituras
que deben respetar una regla de negocio usan condiciones atómicas en lugar de transacciones.

Aunque DynamoDB no usa SQL, los **servicios** ofrecen el CRUD clásico. La siguiente tabla
resume las **cuatro operaciones CRUD**, el comando del SDK que se usa en cada caso y en qué
endpoints del proyecto se aplican.

| Operación | Significado | HTTP | Comando DynamoDB | Endpoints del proyecto |
| --- | --- | --- | --- | --- |
| **C — Create** | Crear un recurso | `POST` | `PutCommand` | `POST /api/usuarios`, `/api/vehiculos`, `/api/repuestos`, `/api/movimientos`, `/api/clientes/registro`, `/api/clientes-comerciales`, `/api/cotizaciones`, `/api/reservas`, `/api/ventas`, `/api/pruebas-man` |
| **R — Read (uno)** | Leer un recurso por su clave | `GET` | `GetCommand` (o `QueryCommand` por GSI) | `GET /api/usuarios/:userId`, `/api/vehiculos/:vehiculoId`, `/api/repuestos/:repuestoId`, `/api/catalogo/:vehiculoId`, `/api/cotizaciones/:cotizacionId`, `/api/reservas/:reservaId`, `/api/ventas/:ventaId`, `/api/pruebas-man/:pruebaId` |
| **R — Read (lista)** | Listar todos los recursos | `GET` | `ScanCommand` (`QueryCommand` si hay filtro) | `GET /api/usuarios`, `/api/vehiculos`, `/api/repuestos`, `/api/movimientos`, `/api/catalogo`, `/api/cotizaciones`, `/api/reservas`, `/api/ventas`, `/api/pruebas-man` |
| **U — Update** | Actualizar parcialmente | `PATCH` (o `POST .../<accion>` en la HU11) | `PutCommand` / `UpdateCommand` | `PATCH /api/usuarios/:userId`, `/api/usuarios/:userId/estado`, `/api/vehiculos/:vehiculoId`, `/api/repuestos/:repuestoId`, `/api/clientes-comerciales/:clienteId`, `/api/cotizaciones/:cotizacionId`; `POST /api/pruebas-man/:pruebaId/confirmar|reprogramar|cancelar|realizar` |
| **D — Delete** | Borrar | — (sin endpoint) | `DeleteObjectCommand` (S3) | Al quitar fotos/documentos de un vehículo; desactivación lógica de usuarios en Cognito |

> **Nota sobre el borrado.** No hay `DELETE` de usuarios, vehículos ni repuestos para no
> perder el histórico. El "borrado" real ocurre con los **archivos en S3** cuando se quitan
> de un vehículo, y el "borrado lógico" de un usuario se hace **desactivándolo** (estado
> `inactivo`, que además lo deshabilita en Cognito).

### Ejemplo completo: crear un repuesto (Create)

```javascript
// backend/src/services/repuestoService.js (extracto)
async function createRepuesto(input, actor) {
  const existente = await repuestoRepository.findByCodigo(input.codigo);
  if (existente) {
    throw new ConflictError('Ya existe un repuesto registrado con ese código.');
  }

  const ahora = new Date().toISOString();
  const repuesto = {
    repuestoId: randomUUID(),
    codigo: input.codigo,
    nombre: input.nombre,
    cantidad: input.cantidad,
    cantidadMinima: input.cantidadMinima ?? 0,
    createdAt: ahora,
    updatedAt: ahora,
    createdBy: actor?.sub ?? null,
  };

  return toResponse(await repuestoRepository.save(repuesto));
}
```

### Ejemplo: leer uno (Read — `GetCommand`)

```javascript
// backend/src/services/repuestoService.js (extracto)
async function getRepuesto(repuestoId) {
  const repuesto = await repuestoRepository.findById(repuestoId);   // GetCommand
  if (!repuesto) {
    throw new NotFoundError('El repuesto no existe.');
  }
  return toResponse(repuesto);
}
```

Cuando la búsqueda es por un atributo distinto de la clave (por ejemplo, el VIN o el
correo), el repositorio consulta el **GSI** con `QueryCommand`:

```javascript
// backend/src/repositories/vehiculoRepository.js (extracto)
const result = await documentClient.send(new QueryCommand({
  TableName: config.vehiculosTableName,
  IndexName: 'vin-index',
  KeyConditionExpression: 'vin = :vin',
  ExpressionAttributeValues: { ':vin': vin },
}));
return result.Items?.[0] ?? null;
```

### Ejemplo: leer/listar (Read — `ScanCommand`)

```javascript
async function listRepuestos() {
  const repuestos = await repuestoRepository.listAll();      // ScanCommand
  return [...repuestos]
    .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'es'))
    .map(toResponse);
}
```

### Ejemplo: actualizar (Update)

```javascript
async function updateRepuesto(repuestoId, changes, actor) {
  const actual = await repuestoRepository.findById(repuestoId);   // GetCommand
  if (!actual) throw new NotFoundError('El repuesto no existe.');

  const actualizado = {
    ...actual,
    ...changes,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.sub ?? null,
  };
  return toResponse(await repuestoRepository.save(actualizado));  // PutCommand
}
```

### Ejemplo: borrado (Delete — `DeleteObjectCommand` y borrado lógico)

No existe un endpoint `DELETE`, pero sí hay dos formas de "borrar":

1. **Archivos huérfanos en S3.** Al actualizar un vehículo, el servicio compara las
   fotos/documentos recibidos con los que ya tenía y elimina de S3 los que se quitaron:

   ```javascript
   // backend/src/services/storageService.js (extracto)
   async function deleteObject(key) {
     if (!key) return;
     try {
       await s3.send(new DeleteObjectCommand({ Bucket: config.fotosBucketName, Key: key }));
     } catch {
       // El archivo pudo eliminarse antes; se ignora para no bloquear la operación.
     }
   }
   ```

   Así, quitar una foto o un documento del formulario borra el objeto real y evita dejar
   almacenamiento basura (y costos innecesarios).

2. **Borrado lógico de usuarios.** En lugar de eliminar la cuenta se cambia su estado a
   `inactivo` (`PATCH /api/usuarios/:userId/estado`): el servicio llama a
   `cognitoService.setEnabled(email, false)` y guarda `estado: 'inactivo'` en DynamoDB, de
   modo que el usuario ya no puede iniciar sesión pero el histórico se conserva.

### Sobre `Scan` vs `Query`

- `QueryCommand` se usa cuando hay **clave** (por ejemplo, por `vin` con el GSI `vin-index`
  o por `email`), es eficiente.
- `ScanCommand` recorre toda la tabla; se usa para listados completos (inventario,
  repuestos, usuarios) aceptando su mayor costo, adecuado para el volumen del proyecto.

---

## 9. Validación de datos con Zod

Validé toda la entrada del usuario con Zod antes de que llegara a la lógica de negocio,
usando un helper común `validate(schema, data)`. Ese helper ejecuta `schema.safeParse` y, si
falla, lanza un `ValidationError` con el detalle campo por campo; si pasa, devuelve los
datos ya normalizados (`trim`, `toUpperCase`, conversión de números). En los esquemas defino
tipos, longitudes, rangos y enums cerrados (por ejemplo, el VIN debe cumplir 17 caracteres,
la contraseña reglas de complejidad, y `rol`/`estado`/`condicion` solo admiten valores
permitidos). En las actualizaciones uso esquemas parciales, así valido únicamente lo que se
envía.

Toda entrada del usuario se valida **antes** de llegar a los servicios. Se usa **Zod**,
que valida en tiempo de ejecución y **transforma/normaliza** los datos.

### 9.1 El helper `validate`

Cada archivo de `src/validation/` exporta un `validate(schema, data)` que, ante error,
lanza un `ValidationError` con el **detalle por campo**:

```javascript
// backend/src/validation/usuarioSchemas.js (extracto)
function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new ValidationError('Datos inválidos.', details);
  }
  return result.data;                       // datos normalizados
}
```

### 9.2 Ejemplos de esquemas

```javascript
// Usuario: contraseña con reglas y rol restringido al personal
const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una minúscula.')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula.')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.');

const createUsuarioSchema = z.object({
  nombre: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  rol: z.enum(STAFF_ROLES),          // admin, vendedor, jefe_taller, mecanico
  password: passwordSchema,
});
```

```javascript
// Vehículo: VIN con formato estándar de 17 caracteres
const vinSchema = z.string().trim().toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'El VIN debe tener 17 caracteres válidos (sin I, O ni Q).');
```

```javascript
// Cliente comercial (HU07): esquema con nombre, reutilizable en el array de
// historial y en el endpoint de consultas
const consultaClienteSchema = z.object({
  fecha: z.string().trim().optional(),          // la asigna el backend al registrar
  vehiculo: z.string().trim().min(1).max(80).optional(),
  interes: z.string().trim().min(1).max(500),
  observacion: z.string().trim().max(500).optional(),
});

const createClienteComercialSchema = z.object({
  nombres: z.string().trim().min(2).max(60),
  apellidos: z.string().trim().min(2).max(60),
  documento: docSchema,                          // GSI documento-index (único)
  telefono: telefonoSchema,
  email: emailSchema,                            // GSI email-index (único)
  consultas: z.array(consultaClienteSchema).optional(),
  estadoSeguimiento: z.enum(['nuevo', 'contactado', 'cotizando', 'reservado', 'vendido', 'cerrado']).optional(),
});

// Actualización parcial que exige al menos un campo
const updateClienteComercialSchema = z.object({ /* mismos campos, todos opcionales */ })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'No se enviaron cambios para actualizar.',
  });
```

```javascript
// Cotización (HU08): descuento acotado a la política comercial y vigencia acotada
const DESCUENTO_MAXIMO = 20;

const createCotizacionSchema = z.object({
  clienteId: z.string().trim().min(1),
  vehiculoIds: z.array(z.string().trim().min(1)).min(1).max(20),
  descuentoPorcentaje: z.coerce.number().min(0).max(DESCUENTO_MAXIMO).optional(),
  observaciones: z.string().trim().max(1000).optional(),
  vigenciaDias: z.coerce.number().int().min(1).max(90).optional(),
});

// PATCH: acepta cambios de descuento, observaciones o estado (pendiente → …), exigiendo
// al menos un campo
const updateCotizacionSchema = z.object({ /* campos opcionales */ })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'No se enviaron cambios para actualizar.',
  });
```

```javascript
// Prueba de manejo (HU11): fecha futura dentro del horario de atención y en pasos de 15 min
const fechaHoraSchema = z.string()
  .datetime({ message: 'La fecha y la hora no son válidas.' })
  .refine((valor) => new Date(valor) > new Date(), {
    message: 'La fecha y la hora deben ser futuras.',
  })
  .refine((valor) => {
    const minutos = new Date(valor).getHours() * 60 + new Date(valor).getMinutes();
    return minutos >= 8 * 60 && minutos < 18 * 60 && minutos % 15 === 0;
  }, { message: 'El horario de atención es de 08:00 a 18:00 y las horas se agendan de 15 en 15 minutos.' });

const createPruebaManejoSchema = z.object({
  vehiculoId: z.string().trim().min(1, 'Selecciona un vehículo.'),
  clienteId: z.string().trim().min(1).optional(),   // solo lo envía el staff
  contacto: z.object({
    nombre: z.string().trim().min(2).max(120),
    telefono: z.string().trim().min(6).max(30),
    email: z.string().trim().email().max(160).optional(),
  }),
  fechaHora: fechaHoraSchema,
  duracionMinutos: z.coerce.number().int().min(15).max(180).optional(),  // defecto 60
  observaciones: z.string().trim().max(1000).optional(),
});
```

### 9.3 Reglas y buenas prácticas aplicadas

- **Coerción de tipos:** `z.coerce.number()` convierte strings de formularios a números.
- **Normalización:** `trim()` y `toUpperCase()` limpian los datos antes de guardarlos.
- **Enums cerrados:** `condicion`, `tipo`, `estado`, `rol`, `estadoSeguimiento` (HU07) y
  `estado`/descuento/vigencia de cotización (HU08) solo aceptan valores permitidos. En la
  HU11, `estado` de la prueba (`pendiente`/`confirmada`/`realizada`/`cancelada`) y `estado`
  del listado usan enums igual de cerrados.
- **Límites:** longitudes máximas, rangos (`anio` entre 1950 y año actual+1, precio > 0) y,
  en la HU11, duración de 15 a 180 minutos más la restricción de horario (08:00–18:00 en
  pasos de 15 minutos) resuelta con `refine`.
- **El esquema de actualización es parcial:** `updateVehiculoSchema`/`updateUsuarioSchema`
  usan `.partial()` (y `updateUsuarioSchema` exige al menos un campo con `.refine`).

> Diagrama de secuencia de validación: ver **Diagrama 5** en [`diagramas.md`](./diagramas.md).

---

## 10. Manejo de errores

Centralicé el manejo de errores en una jerarquía de clases que heredan de `AppError`, y cada
error ya trae consigo su código HTTP y su código de negocio: `ValidationError` (400),
`UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404) y `ConflictError`
(409). Los servicios solo lanzan el error correspondiente y no construyen respuestas. Un
único `errorHandler` captura cualquier excepción, traduce los errores de AWS
(Cognito/DynamoDB) a errores de mi aplicación y responde siempre con el mismo contrato
`{ error, code, details? }`. Los errores de las funciones asíncronas los canalizo con
`asyncHandler`, que envuelve cada handler y envía el rechazo a `next()`.

El manejo de errores es **centralizado** y basado en una jerarquía de clases.

### 10.1 Jerarquía `AppError` (`src/errors/AppError.js`)

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;     // código HTTP
    this.code = code;                 // código de negocio para el cliente
    this.isOperational = true;        // error "esperado", no un bug
  }
}

class ValidationError extends AppError { constructor(m = 'Datos inválidos.', details) { super(m, 400, 'VALIDATION_ERROR'); this.details = details; } }
class UnauthorizedError extends AppError { constructor(m = 'No autorizado.') { super(m, 401, 'UNAUTHORIZED'); } }
class ForbiddenError extends AppError { constructor(m = 'Prohibido.') { super(m, 403, 'FORBIDDEN'); } }
class NotFoundError extends AppError { constructor(m = 'No encontrado.') { super(m, 404, 'NOT_FOUND'); } }
class ConflictError extends AppError { constructor(m = 'Conflicto.') { super(m, 409, 'CONFLICT'); } }
```

Los servicios **lanzan** (`throw`) estos errores; no construyen respuestas HTTP.

### 10.2 Manejador central (`src/errors/errorHandler.js`)

```javascript
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  const mapped = mapAwsError(err);            // Cognito → AppError
  if (mapped) return res.status(mapped.statusCode).json({ error: mapped.message, code: mapped.code });

  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'Error interno del servidor.', code: 'INTERNAL_ERROR' });
}
```

### 10.3 Tres orígenes de error y cómo se resuelven

1. **Validación (Zod):** el helper `validate` lanza `ValidationError` (400) con `details`.
2. **Negocio (servicios):** `NotFoundError` (404), `ConflictError` (409),
   `ForbiddenError` (403), etc.
3. **Infraestructura (AWS SDK):** errores crudos de Cognito/DynamoDB se mapean
   (por ejemplo, `UsernameExistsException` → 409, `ConditionalCheckFailedException` →
   409 de stock insuficiente). Los errores **no operacionales** se registran y devuelven
   500 genérico (sin filtrar detalles internos al cliente).

### 10.4 `asyncHandler`

Express 5 propaga los rechazos de promesas, y además se usa `utils/asyncHandler.js` para
delegar cualquier error asíncrono a `next()`:

```javascript
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
```

> Flujo de errores: ver **Diagrama 6** en [`diagramas.md`](./diagramas.md).

---

## 11. Endpoints REST

Armé la API siguiendo las convenciones de REST: sustantivos en plural con el prefijo `/api`
y el verbo HTTP adecuado (`GET` para consultar, `POST` para crear y `PATCH` para actualizar
de forma parcial). Cada ruta protegida pasa primero por `requireAuth`, que exige el token, y
después por `requireRole(...)` cuando hay que limitar por rol. Dejé como públicas solo la
raíz, `/info`, el catálogo, el autorregistro de clientes y el alta de pruebas de manejo
(`POST /api/pruebas-man`, con token **opcional** mediante `optionalAuth`); el resto
necesita un token o un
rol específico. No expuse ningún `DELETE` de vehículos ni repuestos para no perder el
histórico, y lo único que borro son los archivos de S3 cuando se quitan de un vehículo.

La API sigue convenciones REST: **sustantivos en plural** (`/vehiculos`, `/repuestos`),
verbos HTTP según la acción y respuestas JSON. El prefijo general es `/api`.

### Referencia completa de endpoints

Tabla consolidada con **todos** los endpoints de la API (50 en total). La columna
*Autenticación* indica lo que exige cada ruta y *Cuerpo / Query* los datos que recibe.

| Método | Ruta | Autenticación | Cuerpo / Query | Descripción |
| --- | --- | --- | --- | --- |
| `GET` | `/` | — | — | Mensaje de bienvenida + versión |
| `GET` | `/info` | — | — | Estado del servicio |
| `POST` | `/api/clientes/registro` | — | `{ nombre, email, password, fechaNacimiento?, carnetIdentidad?, celular? }` | Autorregistro de clientes |
| `GET` | `/api/catalogo` | — | — | Catálogo público (solo `publicado !== false`) |
| `GET` | `/api/catalogo/:vehiculoId` | — | — | Detalle público de un vehículo |
| `GET` | `/api/auth/session` | token | — | Perfil del usuario autenticado |
| `GET` | `/api/usuarios` | admin | — | Listar usuarios |
| `GET` | `/api/usuarios/:userId` | admin | — | Obtener un usuario |
| `POST` | `/api/usuarios` | admin | `{ nombre, email, rol, password }` | Crear usuario (Cognito + DynamoDB) |
| `PATCH` | `/api/usuarios/:userId` | admin | `{ nombre?, rol?, estado? }` | Actualizar usuario |
| `PATCH` | `/api/usuarios/:userId/estado` | admin | `{ estado: "activo" \| "inactivo" }` | Activar/desactivar |
| `GET` | `/api/vehiculos` | token | — | Listar inventario |
| `GET` | `/api/vehiculos/:vehiculoId` | token | — | Obtener vehículo |
| `POST` | `/api/vehiculos` | admin/vendedor | `{ ...vehiculo, fotos: string[], documentos: { key, nombre }[] }` | Registrar vehículo |
| `PATCH` | `/api/vehiculos/:vehiculoId` | admin/vendedor | campos parciales del vehículo | Actualizar vehículo |
| `POST` | `/api/vehiculos/archivos/presign` | admin/vendedor | `{ categoria: "foto" \| "documento", contentType, nombre, size }` | URL prefirmada de subida |
| `GET` | `/api/repuestos` | token | — | Listar repuestos (incluye `requiereReposicion`) |
| `GET` | `/api/repuestos/:repuestoId` | token | — | Obtener repuesto |
| `POST` | `/api/repuestos` | admin/vendedor/jefe_taller | `{ codigo, nombre, precio, cantidad, cantidadMinima? }` | Registrar repuesto |
| `PATCH` | `/api/repuestos/:repuestoId` | admin/vendedor/jefe_taller | `{ codigo?, nombre?, precio?, cantidadMinima? }` | Actualizar datos (no `cantidad`) |
| `GET` | `/api/movimientos` | token | query `?repuestoId=<uuid>&tipo=entrada\|salida` | Historial de movimientos |
| `POST` | `/api/movimientos` | admin/vendedor/jefe_taller | `{ repuestoId, tipo: "entrada" \| "salida", cantidad, motivo? }` | Registrar entrada/salida |
| `GET` | `/api/clientes-comerciales` | admin/vendedor | — | Listar clientes comerciales |
| `POST` | `/api/clientes-comerciales` | admin/vendedor | `{ nombres, apellidos, documento, telefono, email, notas?, estadoSeguimiento? }` | Registrar cliente (409 si duplica email/documento) |
| `GET` | `/api/clientes-comerciales/:clienteId` | admin/vendedor | — | Obtener cliente con historial de consultas |
| `PATCH` | `/api/clientes-comerciales/:clienteId` | admin/vendedor | campos parciales del cliente | Actualizar datos o `estadoSeguimiento` |
| `POST` | `/api/clientes-comerciales/:clienteId/consultas` | admin/vendedor | `{ vehiculo?, interes, observacion? }` | Agregar una consulta al historial |
| `GET` | `/api/cotizaciones` | admin/vendedor | query `?clienteId=&estado=` | Listar cotizaciones |
| `POST` | `/api/cotizaciones` | admin/vendedor | `{ clienteId, vehiculoIds[], descuentoPorcentaje?, observaciones?, vigenciaDias? }` | Generar cotización (número único, `201`) |
| `GET` | `/api/cotizaciones/:cotizacionId` | admin/vendedor | — | Obtener una cotización |
| `PATCH` | `/api/cotizaciones/:cotizacionId` | admin/vendedor | `{ descuentoPorcentaje?, observaciones?, estado? }` | Actualizar cotización |
| `POST` | `/api/cotizaciones/:cotizacionId/enviar-correo` | admin/vendedor | — | Envío solicitado por el vendedor: registra el intento (HU12) y devuelve `mailto:` |
| `GET` | `/api/reservas` | admin/vendedor | query `?clienteId=&vehiculoId=&estado=` | Listar reservas |
| `POST` | `/api/reservas` | admin/vendedor | `{ clienteId, vehiculoId, condiciones?, monto?, vigenciaDias? }` | Registrar reserva (aparta vehículo, `201`) |
| `GET` | `/api/reservas/:reservaId` | admin/vendedor | — | Obtener una reserva |
| `POST` | `/api/reservas/:reservaId/cancelar` | admin/vendedor | `{ motivo? }` | Cancelar reserva y liberar vehículo |
| `POST` | `/api/reservas/:reservaId/convertir` | admin/vendedor | `{ observaciones? }` | Convertir en venta (vehículo `vendido`) |
| `GET` | `/api/ventas` | admin/vendedor | query `?clienteId=&vehiculoId=` | Historial de ventas |
| `POST` | `/api/ventas` | admin/vendedor | `{ clienteId, vehiculoId, descuentoPorcentaje?, observaciones?, reservaId?, fechaVenta? }` | Registrar venta (número único, `201`) |
| `GET` | `/api/ventas/:ventaId` | admin/vendedor | — | Obtener el detalle de una venta |
| `POST` | `/api/pruebas-man` | token opcional | `{ vehiculoId, clienteId?, contacto, fechaHora, duracionMinutos?, observaciones? }` | Solicitar prueba de manejo (`201`, `PRB-AAAA-######`) |
| `GET` | `/api/pruebas-man` | admin/vendedor | query `?clienteId=&vehiculoId=&estado=` | Listar pruebas (orden por `fechaHora`) |
| `GET` | `/api/pruebas-man/:pruebaId` | admin/vendedor | — | Obtener una prueba |
| `POST` | `/api/pruebas-man/:pruebaId/confirmar` | admin/vendedor | `{ observaciones? }` | `pendiente` → `confirmada` |
| `POST` | `/api/pruebas-man/:pruebaId/reprogramar` | admin/vendedor | `{ fechaHora, duracionMinutos?, observaciones? }` | Cambia horario conservando el estado |
| `POST` | `/api/pruebas-man/:pruebaId/cancelar` | admin/vendedor | `{ motivo? }` | `pendiente`/`confirmada` → `cancelada` |
| `POST` | `/api/pruebas-man/:pruebaId/realizar` | admin/vendedor | `{ observaciones? }` | `confirmada` → `realizada` |
| `GET` | `/api/notificaciones` | admin/vendedor | query `?tipo=&estado=&recursoId=` | Listar notificaciones (HU12) |
| `GET` | `/api/notificaciones/:eventoId` | admin/vendedor | — | Obtener una notificación con su historial |
| `POST` | `/api/notificaciones/:eventoId/enviar` | admin/vendedor | — | Registrar el intento (máx. 5) y devolver el enlace `mailto:` |

> **Autorización en dos niveles.** Todas las rutas protegidas pasan primero por
> `requireAuth` (token JWT obligatorio) y, cuando aplica, por `requireRole(...)`. En el
> router de usuarios se aplica `router.use(requireAuth, requireRole('admin'))`, por lo que
> **ninguna ruta de usuarios es accesible para roles distintos de `admin`**.

### Endpoints agrupados por módulo

**Públicos (sin autenticación)**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Mensaje de bienvenida + versión |
| `GET` | `/info` | Estado del servicio |
| `POST` | `/api/clientes/registro` | Autorregistro de clientes |
| `GET` | `/api/catalogo` | Catálogo público (solo publicados) |
| `GET` | `/api/catalogo/:vehiculoId` | Detalle público de un vehículo |
| `POST` | `/api/pruebas-man` | Solicitar prueba de manejo (token **opcional**: si llega, se identifica al cliente) |

**Autenticación y usuarios**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/auth/session` | token | Perfil del usuario autenticado |
| `GET` | `/api/usuarios` | admin | Listar usuarios |
| `GET` | `/api/usuarios/:userId` | admin | Obtener un usuario |
| `POST` | `/api/usuarios` | admin | Crear usuario (Cognito + DynamoDB) |
| `PATCH` | `/api/usuarios/:userId` | admin | Actualizar usuario |
| `PATCH` | `/api/usuarios/:userId/estado` | admin | Activar/desactivar |

**Vehículos**

| Método | Endpoint | Permiso |
| --- | --- | --- |
| `GET` | `/api/vehiculos` | token |
| `GET` | `/api/vehiculos/:vehiculoId` | token |
| `POST` | `/api/vehiculos` | admin/vendedor |
| `PATCH` | `/api/vehiculos/:vehiculoId` | admin/vendedor |
| `POST` | `/api/vehiculos/archivos/presign` | admin/vendedor |

**Repuestos y movimientos**

| Método | Endpoint | Permiso |
| --- | --- | --- |
| `GET` | `/api/repuestos` | token |
| `GET` | `/api/repuestos/:repuestoId` | token |
| `POST` | `/api/repuestos` | admin/vendedor/jefe_taller |
| `PATCH` | `/api/repuestos/:repuestoId` | admin/vendedor/jefe_taller |
| `GET` | `/api/movimientos` | token |
| `POST` | `/api/movimientos` | admin/vendedor/jefe_taller |

**Clientes comerciales (HU07)**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/clientes-comerciales` | admin/vendedor | Listar clientes |
| `POST` | `/api/clientes-comerciales` | admin/vendedor | Registrar cliente (anti-duplicados) |
| `GET` | `/api/clientes-comerciales/:clienteId` | admin/vendedor | Obtener cliente + historial |
| `PATCH` | `/api/clientes-comerciales/:clienteId` | admin/vendedor | Actualizar datos/estado |
| `POST` | `/api/clientes-comerciales/:clienteId/consultas` | admin/vendedor | Registrar consulta |

**Cotizaciones (HU08)**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/cotizaciones` | admin/vendedor | Listar cotizaciones (`?clienteId=&estado=`) |
| `POST` | `/api/cotizaciones` | admin/vendedor | Generar cotización (número único, `201`) |
| `GET` | `/api/cotizaciones/:cotizacionId` | admin/vendedor | Obtener una cotización |
| `PATCH` | `/api/cotizaciones/:cotizacionId` | admin/vendedor | Actualizar descuento, observaciones o estado |
| `POST` | `/api/cotizaciones/:cotizacionId/enviar-correo` | admin/vendedor | Envío solicitado por el vendedor (HU12): registra intento y devuelve `mailto:` |

**Reservas (HU09)**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/reservas` | admin/vendedor | Listar reservas (`?clienteId=&vehiculoId=&estado=`) |
| `POST` | `/api/reservas` | admin/vendedor | Registrar reserva (número único, `201`) |
| `GET` | `/api/reservas/:reservaId` | admin/vendedor | Obtener una reserva |
| `POST` | `/api/reservas/:reservaId/cancelar` | admin/vendedor | Cancelar reserva y liberar vehículo |
| `POST` | `/api/reservas/:reservaId/convertir` | admin/vendedor | Convertir en venta (vehículo `vendido`) |

**Ventas (HU10)**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/ventas` | admin/vendedor | Historial de ventas (`?clienteId=&vehiculoId=`) |
| `POST` | `/api/ventas` | admin/vendedor | Registrar venta (número único, vehículo `vendido`, `201`) |
| `GET` | `/api/ventas/:ventaId` | admin/vendedor | Obtener el detalle de una venta |

**Pruebas de manejo (HU11)**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/pruebas-man` | token opcional | Solicitar prueba (`201`, número único, conflicto de horario `409`) |
| `GET` | `/api/pruebas-man` | admin/vendedor | Listar pruebas (`?clienteId=&vehiculoId=&estado=`) |
| `GET` | `/api/pruebas-man/:pruebaId` | admin/vendedor | Obtener una prueba + historial |
| `POST` | `/api/pruebas-man/:pruebaId/confirmar` | admin/vendedor | Confirmar (`pendiente` → `confirmada`) |
| `POST` | `/api/pruebas-man/:pruebaId/reprogramar` | admin/vendedor | Reprogramar (conserva estado, revalida horario) |
| `POST` | `/api/pruebas-man/:pruebaId/cancelar` | admin/vendedor | Cancelar (libera el horario) |
| `POST` | `/api/pruebas-man/:pruebaId/realizar` | admin/vendedor | Marcar realizada (`confirmada` → `realizada`) |

**Notificaciones por correo (HU12)**

| Método | Endpoint | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/notificaciones` | admin/vendedor | Listar notificaciones (`?tipo=&estado=&recursoId=`) |
| `GET` | `/api/notificaciones/:eventoId` | admin/vendedor | Obtener una notificación + historial de intentos |
| `POST` | `/api/notificaciones/:eventoId/enviar` | admin/vendedor | Registrar el intento (máx. 5, anti-duplicados) y devolver `mailto:` |

> **Transporte `mailto:` (HU12).** La HU12 original planteaba Amazon SES, que cobra por
> mensaje; como el proyecto se limita a la **capa gratuita**, el envío se resuelve con un
> enlace `mailto:` que el frontend abre en el cliente de correo del usuario. El backend
> redacta el mensaje (`plantillasCorreo`), registra el intento en la tabla
> `Notificaciones` (máximo 5; el 6.º responde `409`) y el frontend descarga el PDF (en el
> caso de cotizaciones) y abre el correo para que el usuario lo adjunte.

> **Token opcional (`optionalAuth`).** Solo el `POST /api/pruebas-man` usa este middleware:
> si la petición trae `Authorization`, se verifica el JWT y el `clienteId` enviado por el
> staff se vincula a la solicitud; si no trae token (visitante desde el catálogo), la prueba
> se guarda con `clienteId: 'anonimo'` y `origen: 'catalogo'`. Todas las demás rutas de la
> HU11 exigen `requireAuth` + `requireRole('admin', 'vendedor')`.

### Parámetros (path, query y cuerpos)

- **Path params:** `:vehiculoId`, `:userId`, `:repuestoId`, `:clienteId`, `:cotizacionId`,
  `:reservaId`, `:ventaId`, `:pruebaId` y `:eventoId` identifican el
 recurso a
  consultar o modificar.
- **Query strings:** `GET /api/movimientos` acepta filtros opcionales
  (`?repuestoId=<uuid>` y `?tipo=entrada|salida`) y `GET /api/cotizaciones` acepta
  `?clienteId=<uuid>` y `?estado=<pendiente|aceptada|rechazada|vencida>`; `GET /api/reservas`
  acepta `?clienteId=`, `?vehiculoId=` y `?estado=<activa|cancelada|vencida|convertida>`,
  `GET /api/ventas` acepta `?clienteId=` y `?vehiculoId=`, `GET /api/pruebas-man` acepta
  `?clienteId=`, `?vehiculoId=` y `?estado=<pendiente|confirmada|realizada|cancelada>`, y
  `GET /api/notificaciones` acepta `?tipo=`, `?estado=` y `?recursoId=`. Los
  demás listados
  no reciben filtros y devuelven la colección completa junto con `total`.
- **Cuerpos (JSON):** siempre validados con Zod (punto 9). Los más relevantes:
  - `POST /api/vehiculos` → datos del vehículo más `fotos: string[]` y
    `documentos: { key, nombre }[]` (claves devueltas por el presign).
  - `POST /api/vehiculos/archivos/presign` →
    `{ categoria: "foto" | "documento", contentType, nombre, size }`.
  - `POST /api/movimientos` → `{ repuestoId, tipo: "entrada" | "salida", cantidad, motivo? }`.
  - `POST /api/clientes-comerciales` → datos del cliente (los duplicados se detectan en el
    servidor y responden `409`); `POST .../consultas` → `{ vehiculo?, interes, observacion? }`
    (la `fecha` la asigna el backend).
  - `POST /api/cotizaciones` → `{ clienteId, vehiculoIds[], descuentoPorcentaje?, observaciones?, vigenciaDias? }`
    (snapshot de precios y `total` los calcula el backend); `PATCH` → `{ descuentoPorcentaje?, observaciones?, estado? }`.
  - `POST /api/reservas` → `{ clienteId, vehiculoId, condiciones?, monto?, vigenciaDias? }`
    (el backend aparta el vehículo y genera el número); `POST .../cancelar` → `{ motivo? }`;
    `POST .../convertir` → `{ observaciones? }` (deja el vehículo `vendido`).
  - `POST /api/ventas` → `{ clienteId, vehiculoId, descuentoPorcentaje?, observaciones?, reservaId?, fechaVenta? }`
    (el backend verifica la disponibilidad, aparta la unidad, calcula los importes y genera el número).
  - `POST /api/pruebas-man` → `{ vehiculoId, clienteId?, contacto: { nombre, telefono, email? }, fechaHora, duracionMinutos?, observaciones? }`
    (el backend valida horario futuro 08:00–18:00 en pasos de 15 min, descarta solapes del
    mismo vehículo con `409` y genera el número); `POST .../reprogramar` →
    `{ fechaHora, duracionMinutos?, observaciones? }`; `POST .../confirmar` y
    `POST .../realizar` → `{ observaciones? }`; `POST .../cancelar` → `{ motivo? }`.
  - `PATCH /api/repuestos/:repuestoId` **no** acepta `cantidad`: el stock solo cambia por
    movimientos.

### Convenciones REST aplicadas

- **`PATCH`** para actualizaciones parciales (no `PUT`), porque se envía solo lo que cambia.
- **Recursos anidados por acción**: `POST /api/vehiculos/archivos/presign` es una acción
  sobre el sub-recurso `archivos`, igual que `confirmar`, `reprogramar`, `cancelar` y
  `realizar` sobre una prueba de manejo (`POST /api/pruebas-man/:pruebaId/<accion>`), en lugar
  de un `PATCH` de estado.
- **Sin `DELETE`** de vehículos/repuestos: se preserva el histórico (auditoría). El único
  borrado es de archivos en S3 cuando se quitan del recurso.
- **Filtros por query string**: `GET /api/movimientos?repuestoId=...&tipo=...`.
- **Respuestas de listado** siempre incluyen `total` junto a la colección (`vehiculos`,
  `repuestos`, `usuarios`, `movimientos`, `clientes`, `cotizaciones`, `reservas`, `ventas`,
  `pruebas`).

---

## 12. JSON y códigos HTTP

Toda la comunicación es en JSON y el token viaja en la cabecera `Authorization: Bearer`. Las
respuestas correctas devuelven el recurso (por ejemplo, `{ message, vehiculo }`) y los
errores usan siempre la misma forma `{ error, code, details? }`, donde `code` es un
identificador fijo que el frontend puede interpretar. Los códigos HTTP reflejan lo que
ocurrió: `200` en consultas y actualizaciones, `201` al crear, `400` si los datos no son
válidos, `401` si falta el token o expiró, `403` si no hay permisos, `404` si el recurso no
existe, `409` ante un conflicto (código o VIN repetido, stock insuficiente, email o
documento de cliente repetido, vehículo no cotizable, cotización ya no modificable, vehículo
no disponible para reservar o reserva ya no gestionable, horario de prueba ocupado o
transición de estado inválida en una prueba de manejo) y `500` para
errores inesperados, que además registro en el log sin mostrar detalles internos.

### 12.1 Formato de petición y respuesta

Todas las peticiones y respuestas son **JSON** (`Content-Type: application/json`).
La autenticación va en el encabezado `Authorization: Bearer <ID token de Cognito>`.

**Petición de ejemplo**

```http
POST /api/repuestos HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJraWQiOiJ...
Content-Type: application/json

{
  "codigo": "BMW-FR-001",
  "nombre": "Filtro de aire",
  "precio": 85.5,
  "cantidad": 20,
  "cantidadMinima": 5
}
```

**Respuesta exitosa (201 Created)**

```json
{
  "repuesto": {
    "repuestoId": "6f1c...e2",
    "codigo": "BMW-FR-001",
    "nombre": "Filtro de aire",
    "precio": 85.5,
    "cantidad": 20,
    "cantidadMinima": 5,
    "requiereReposicion": false,
    "createdAt": "2026-10-16T12:00:00.000Z",
    "updatedAt": "2026-10-16T12:00:00.000Z"
  }
}
```

**Respuesta de error de validación (400 Bad Request)**

```json
{
  "error": "Datos inválidos.",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "precio", "message": "El precio debe ser mayor a 0." },
    { "field": "codigo", "message": "El código es obligatorio." }
  ]
}
```

**Respuesta de conflicto (409 Conflict)**

```json
{ "error": "Ya existe un repuesto registrado con ese código.", "code": "CONFLICT" }
```

### 12.2 Códigos HTTP usados

| Código | Significado | Cuándo se usa |
| --- | --- | --- |
| `200 OK` | Éxito | GET, PATCH |
| `201 Created` | Recurso creado | POST de creación |
| `400 Bad Request` | Datos inválidos | Validación Zod / regla de negocio inválida |
| `401 Unauthorized` | Falta token o es inválido/expirado | `requireAuth` |
| `403 Forbidden` | Token válido pero sin permiso | `requireRole` / cuenta inactiva |
| `404 Not Found` | Recurso o ruta inexistente | `NotFoundError` / `notFoundHandler` |
| `409 Conflict` | Duplicado o conflicto de estado | código/VIN duplicado, stock insuficiente, email/documento de cliente duplicado, prueba con horario solapado, transición de estado inválida |
| `500 Internal Server Error` | Error inesperado | fallo no controlado (se registra en log) |

### 12.3 Contrato de error uniforme

Todos los errores tienen la misma forma: `{ error, code, details? }`.
- `error`: mensaje legible en español.
- `code`: código estable para que el frontend decida (p. ej. `VALIDATION_ERROR`).
- `details`: solo en validaciones; lista de `{ field, message }`.

---

## 13. Documentación básica de API

Por último documenté cómo levantar y usar la API: cómo arrancar el servidor en local
(copiar el `.env.example` a `.env`, completar los valores y ejecutar `node server.js`), el
endpoint de prueba `/info`, la forma de autenticarse con Cognito enviando el ID token como
`Bearer`, los roles con sus permisos y un ejemplo completo de subida de una foto (pedir la
URL prefirmada, hacer el `PUT` a S3 y registrar el vehículo con la clave). También dejé las
variables de entorno, los comandos para verificar el proyecto, una referencia rápida de los
endpoints y varios ejemplos con cURL.

### 13.1 Puesta en marcha local

```bash
cd backend
copy .env.example .env     # Windows (PowerShell: Copy-Item)
# completar USER_POOL_ID, USER_POOL_CLIENT_ID, FOTOS_BUCKET_NAME, tablas, etc.
node server.js             # http://localhost:3000
```

Comprobación rápida:

```bash
curl http://localhost:3000/info
# {"nombre":"Concesionaria BMW","version":"1.0.0","estado":"operativo"}
```

### 13.2 Autenticación

1. El frontend inicia sesión con **Amazon Cognito** (Amplify) y obtiene un **ID token**.
2. Cada petición protegida envía `Authorization: Bearer <ID token>`.
3. El backend verifica el token (`aws-jwt-verify`) y extrae los roles del claim
   `cognito:groups`.

### 13.3 Roles y permisos

| Rol | Descripción |
| --- | --- |
| `admin` | Acceso total; gestiona usuarios/personal. |
| `vendedor` | Gestiona vehículos, repuestos, movimientos, clientes comerciales (HU07), cotizaciones (HU08), reservas (HU09), ventas (HU10) y pruebas de manejo (HU11). |
| `jefe_taller` | Gestiona repuestos y movimientos. |
| `mecanico` | Consulta inventario (rol por defecto). |
| `cliente` | Se autorregistra; accede al catálogo. |

### 13.4 Ejemplo de flujo completo (subir una foto de vehículo)

```text
1) POST /api/vehiculos/archivos/presign     (admin/vendedor)
   body: { categoria: "foto", contentType: "image/jpeg", nombre: "front.jpg", size: 204800 }
   → { key, uploadUrl, maxSize }

2) PUT <uploadUrl>   (directo a S3, con el mismo tamaño firmado)

3) POST /api/vehiculos   (admin/vendedor)
   body: { ...,  fotos: ["vehiculos/fotos/<uuid>.jpg"] }
```

> La URL prefirmada firma el `Content-Length`; si se sube un archivo de tamaño distinto
> al declarado, S3 responde `403 SignatureDoesNotMatch`. Esto refuerza la validación de
> tipo y tamaño (≤ 5 MB fotos, ≤ 10 MB documentos).

### 13.5 Variables de entorno (`.env.example`)

```ini
PORT=3000
AWS_REGION=us-east-2
USER_POOL_ID=us-east-2_XXXXXXXXX
USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
USUARIOS_TABLE_NAME=Usuarios
VEHICULOS_TABLE_NAME=Vehiculos
REPUESTOS_TABLE_NAME=Repuestos
MOVIMIENTOS_TABLE_NAME=MovimientosInventario
CLIENTES_COMERCIALES_TABLE_NAME=ClientesComerciales
COTIZACIONES_TABLE_NAME=Cotizaciones
RESERVAS_TABLE_NAME=Reservas
VENTAS_TABLE_NAME=Ventas
PRUEBAS_MANEJO_TABLE_NAME=PruebasManejo
NOTIFICACIONES_TABLE_NAME=Notificaciones
FOTOS_BUCKET_NAME=nombre-del-bucket
CORS_ORIGIN=http://localhost:5173
```

### 13.6 Verificación del proyecto

```bash
# Backend: comprobar sintaxis
node --check server.js

# Frontend (tipos + build)
cd frontend; npm run build

# Infra (tipos)
cd infra; npx tsc --noEmit
```

### 13.7 Referencia rápida de la API

Resumen para consulta veloz (el detalle completo de cada endpoint, con su cuerpo y
permisos, está en el punto 11). URL base: `http://localhost:3000` (configurable con
`PORT`). Todas las respuestas son JSON y las rutas protegidas requieren el encabezado
`Authorization: Bearer <ID token>`. `{id}` representa `:userId`, `:vehiculoId`,
`:repuestoId`, `:clienteId`, `:cotizacionId`, `:reservaId`, `:ventaId` o `:pruebaId` según
el recurso.

| Acción | Método y ruta | Requiere |
| --- | --- | --- |
| Estado del servicio | `GET /info` | — |
| Inicio de sesión | SDK de Amplify en el cliente (Cognito) | credenciales |
| Perfil de la sesión | `GET /api/auth/session` | token |
| Catálogo público | `GET /api/catalogo` · `GET /api/catalogo/{id}` | — |
| Autorregistro de cliente | `POST /api/clientes/registro` | — |
| Listar / ver usuarios | `GET /api/usuarios` · `/api/usuarios/{id}` | admin |
| Crear / editar usuario | `POST /api/usuarios` · `PATCH /api/usuarios/{id}` | admin |
| Activar / desactivar usuario | `PATCH /api/usuarios/{id}/estado` | admin |
| Listar / ver vehículos | `GET /api/vehiculos` · `/api/vehiculos/{id}` | token |
| Crear / editar vehículo | `POST /api/vehiculos` · `PATCH /api/vehiculos/{id}` | admin/vendedor |
| Firmar subida de archivo | `POST /api/vehiculos/archivos/presign` | admin/vendedor |
| Listar / ver repuestos | `GET /api/repuestos` · `/api/repuestos/{id}` | token |
| Crear / editar repuesto | `POST /api/repuestos` · `PATCH /api/repuestos/{id}` | admin/vendedor/jefe_taller |
| Historial de movimientos | `GET /api/movimientos` (`?repuestoId=&tipo=`) | token |
| Registrar movimiento | `POST /api/movimientos` | admin/vendedor/jefe_taller |
| Listar / ver clientes comerciales | `GET /api/clientes-comerciales` · `/{id}` | admin/vendedor |
| Registrar / editar cliente | `POST /api/clientes-comerciales` · `PATCH /{id}` | admin/vendedor |
| Registrar consulta (historial) | `POST /api/clientes-comerciales/{id}/consultas` | admin/vendedor |
| Listar / ver cotizaciones | `GET /api/cotizaciones` · `/api/cotizaciones/{id}` | admin/vendedor |
| Generar cotización | `POST /api/cotizaciones` | admin/vendedor |
| Actualizar cotización | `PATCH /api/cotizaciones/{id}` | admin/vendedor |
| Listar / ver reservas | `GET /api/reservas` · `/api/reservas/{id}` | admin/vendedor |
| Registrar reserva | `POST /api/reservas` | admin/vendedor |
| Cancelar / convertir reserva | `POST /api/reservas/{id}/cancelar` · `/convertir` | admin/vendedor |
| Historial / detalle de ventas | `GET /api/ventas` · `/api/ventas/{id}` | admin/vendedor |
| Registrar venta | `POST /api/ventas` | admin/vendedor |
| Solicitar prueba de manejo | `POST /api/pruebas-man` | — (token opcional) |
| Listar / ver pruebas de manejo | `GET /api/pruebas-man` · `/api/pruebas-man/{id}` (`?clienteId=&vehiculoId=&estado=`) | admin/vendedor |
| Confirmar / reprogramar prueba | `POST /api/pruebas-man/{id}/confirmar` · `/reprogramar` | admin/vendedor |
| Cancelar / realizar prueba | `POST /api/pruebas-man/{id}/cancelar` · `/realizar` | admin/vendedor |
| Solicitar envío de correo de cotización | `POST /api/cotizaciones/{id}/enviar-correo` | admin/vendedor |
| Listar / ver notificaciones | `GET /api/notificaciones` · `/api/notificaciones/{eventoId}` (`?tipo=&estado=&recursoId=`) | admin/vendedor |
| Reintentar envío de notificación | `POST /api/notificaciones/{eventoId}/enviar` | admin/vendedor |

### 13.8 Ejemplos de peticiones (cURL)

Con el backend en `http://localhost:3000` y un `TOKEN` con un ID token válido de Cognito:

```bash
# 1) Estado del servicio (público)
curl http://localhost:3000/info

# 2) Catálogo público
curl http://localhost:3000/api/catalogo

# 3) Perfil de la sesión (protegido)
curl http://localhost:3000/api/auth/session -H "Authorization: Bearer $TOKEN"

# 4) Crear un repuesto (admin/vendedor/jefe_taller)
curl -X POST http://localhost:3000/api/repuestos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"BMW-FR-001","nombre":"Filtro de aire","precio":85.5,"cantidad":20,"cantidadMinima":5}'

# 5) Listar movimientos filtrando por tipo
curl "http://localhost:3000/api/movimientos?tipo=entrada" -H "Authorization: Bearer $TOKEN"

# 6) Registrar una salida de stock
curl -X POST http://localhost:3000/api/movimientos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"repuestoId":"<uuid>","tipo":"salida","cantidad":2,"motivo":"Reparación"}'

# 7) Firmar la subida de una foto
curl -X POST http://localhost:3000/api/vehiculos/archivos/presign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoria":"foto","contentType":"image/jpeg","nombre":"front.jpg","size":204800}'

# 8) Listar clientes comerciales (admin/vendedor)
curl http://localhost:3000/api/clientes-comerciales -H "Authorization: Bearer $TOKEN"

# 9) Registrar un cliente comercial (responde 409 si email/documento duplicado)
curl -X POST http://localhost:3000/api/clientes-comerciales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombres":"Juan","apellidos":"Pérez","documento":"1234567","telefono":"71234567","email":"juan@example.com"}'

# 10) Agregar una consulta al historial del cliente
curl -X POST http://localhost:3000/api/clientes-comerciales/<uuid>/consultas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehiculo":"BMW Serie 3 2024","interes":"Quiere cotizar financiamiento","observacion":"Llamar el lunes"}'

# 11) Generar una cotización (admin/vendedor) — guarda snapshot de precios
curl -X POST http://localhost:3000/api/cotizaciones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"<uuid>","vehiculoIds":["<uuid-vehiculo>"],"descuentoPorcentaje":5,"vigenciaDias":15}'

# 12) Aceptar una cotización (solo si sigue pendiente)
curl -X PATCH http://localhost:3000/api/cotizaciones/<uuid> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"aceptada"}'

# 13) Registrar una reserva (aparta el vehículo y responde 201)
curl -X POST http://localhost:3000/api/reservas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"<uuid>","vehiculoId":"<uuid-vehiculo>","condiciones":"Depósito del 10%","vigenciaDias":30}'

# 14) Convertir una reserva en venta (vehículo → vendido)
curl -X POST http://localhost:3000/api/reservas/<uuid>/convertir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"observaciones":"Venta cerrada con financiamiento"}'

# 15) Registrar una venta (verifica disponibilidad y responde 201)
curl -X POST http://localhost:3000/api/ventas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"<uuid>","vehiculoId":"<uuid-vehiculo>","descuentoPorcentaje":5,"observaciones":"Entrega en showroom"}'

# 16) Historial de ventas (filtra por cliente o vehículo)
curl "http://localhost:3000/api/ventas?clienteId=<uuid>" -H "Authorization: Bearer $TOKEN"

# 17) Solicitar una prueba de manejo (público: sin Authorization, o con token si hay sesión)
curl -X POST http://localhost:3000/api/pruebas-man \
  -H "Content-Type: application/json" \
  -d '{"vehiculoId":"<uuid-vehiculo>","contacto":{"nombre":"Ana Torres","telefono":"71234567"},"fechaHora":"2026-11-10T10:15:00","duracionMinutos":60}'

# 18) Gestionar una prueba (admin/vendedor): confirmar, reprogramar y marcar realizada
curl -X POST http://localhost:3000/api/pruebas-man/<uuid>/confirmar \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'
curl -X POST http://localhost:3000/api/pruebas-man/<uuid>/realizar \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"observaciones":"Cliente conforme con el equipo."}'

# 19) Solicitar el envío del correo de una cotización (HU12) — registra el intento
#     y devuelve { mailto } con el enlace mailto: para abrir el gestor de correo
curl -X POST http://localhost:3000/api/cotizaciones/<uuid>/enviar-correo \
  -H "Authorization: Bearer $TOKEN"

# 20) Listar notificaciones (HU12), con filtros opcionales
curl "http://localhost:3000/api/notificaciones?tipo=cotizacion&estado=pendiente" \
  -H "Authorization: Bearer $TOKEN"

# 21) Reintentar el envío de una notificación (máximo 5 intentos; el 6.º responde 409)
curl -X POST http://localhost:3000/api/notificaciones/<eventoId>/enviar \
  -H "Authorization: Bearer $TOKEN"
```

> **Windows PowerShell:** usa `curl.exe` (no el alias `curl` de `Invoke-WebRequest`) y
> comillas escapadas o el operador *here-string*. En Git Bash/WSL los ejemplos funcionan
> tal cual.

---

## Anexo: Historias de usuario cubiertas

| HU | Descripción | Estado |
| --- | --- | --- |
| HU01 | Inicio de sesión | Implementada |
| HU02 | Gestión de usuarios y roles | Implementada |
| HU03 | Inventario de vehículos | Implementada |
| HU04 | Inventario de repuestos | Implementada |
| HU05 | Catálogo web público de vehículos | Implementada |
| HU06 | Gestión de fotografías y documentos | Implementada |
| HU07 | Seguimiento comercial de clientes | Implementada (backend verificado end-to-end) |
| HU08 | Cotizaciones | Implementada (backend verificado end-to-end) |
| HU09 | Reservas de vehículos | Implementada (backend verificado end-to-end) |
| HU10 | Ventas de vehículos | Implementada (backend verificado end-to-end) |
| HU11 | Pruebas de manejo | Implementada (backend verificado end-to-end: 46/46 aserciones) |
| HU12 | Notificaciones por correo | Implementada (backend verificado end-to-end: 34/34 aserciones; transporte `mailto:`, sin SES) |

---

> **Diagramas:** todos los diagramas PlantUML (arquitectura, despliegue AWS, modelo de
> datos, secuencias de autenticación/CRUD/errores y casos de uso) están en
> [`diagramas.md`](./diagramas.md), listos para copiar y renderizar.
