# Concesionaria BMW

Aplicación web **full-stack** para la gestión de una concesionaria BMW: autenticación de
usuarios con roles, autorregistro de clientes, administración de usuarios, inventario de
vehículos y repuestos con fotografías y documentos, catálogo web público, seguimiento
comercial de clientes potenciales, cotizaciones, reservas y ventas de vehículos, y
gestión de pruebas de manejo.

El proyecto usa **solo servicios de la capa gratuita de AWS**.

---

## Descripción

**Concesionaria BMW** es un sistema compuesto por:

- un **backend REST** (Node.js + Express) que expone la API, valida los JWT de Cognito y
  persiste en DynamoDB / S3 (fotografías y documentos con URLs prefirmadas);
- un **frontend SPA** (React + Vite + Tailwind + shadcn/ui) con una interfaz alineada a la
  identidad de marca BMW;
- **infraestructura como código** (AWS CDK) que aprovisiona Cognito, DynamoDB y S3.

---

## Funcionalidades (Historias de Usuario)

| HU | Descripción | Estado |
| --- | --- | --- |
| **HU01** | Inicio de sesión con Cognito y control de acceso por rol. | Implementada y verificada |
| **HU02** | Administración de usuarios y roles (solo `admin`). | Implementada y verificada |
| **HU03** | Inventario de vehículos: alta, edición, filtros y fotos en S3. | Implementada y verificada |
| **HU04** | Inventario de repuestos: registro, existencias, entradas/salidas y reposición. | Implementada y verificada |
| **HU05** | Catálogo web público de vehículos con búsqueda, filtros y detalle de fotos. | Implementada y verificada |
| **HU06** | Gestión de fotografías y documentos de los vehículos (S3, roles y mensajes de error). | Implementada y verificada |
| **HU07** | Seguimiento comercial de clientes: registro, anti-duplicados, historial de consultas, estados y notificación por correo (`mailto:`). | Implementada (backend verificado e2e) |
| **HU08** | Cotizaciones: generación con precios vigentes, descuentos ≤ 20%, estados, PDF (jsPDF) y envío por correo (`mailto:`). | Implementada (backend verificado e2e) |
| **HU09** | Reservas de vehículos: apartado con vigencia, estados e historial, cancelación y conversión en venta. | Implementada (backend verificado e2e) |
| **HU10** | Ventas de vehículos: registro con cliente/vehículo, descuentos autorizados, número único, historial, detalle y comprobante (jsPDF). | Implementada (backend verificado e2e) |
| **HU11** | Pruebas de manejo: solicitud pública desde el catálogo o interna, agenda sin conflictos por vehículo (08:00–18:00), confirmación, reprogramación, cancelación y registro de realizadas. | Implementada (backend verificado e2e) |

**Roles** (orden = precedencia): `admin`, `vendedor`, `jefe_taller`, `mecanico`, `cliente`.
Los **clientes** se autorregistran desde el login (nombre, fecha de nacimiento, carnet y
celular); el administrador gestiona solo al personal y no crea clientes.

---

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Backend | Node.js, Express 5, Zod, AWS SDK v3 (`lib-dynamodb`, `s3-request-presigner`), `aws-jwt-verify`, `cors`, `dotenv` |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, React Router, React Hook Form, AWS Amplify, jsPDF |
| Infraestructura | AWS CDK (TypeScript) |
| Servicios AWS | Cognito, DynamoDB, S3, CloudFormation, Lambda (helper), IAM, Budgets |

---

## Estructura del repositorio

```text
Concesionaria-BMW/
├── backend/     # API REST (Express, MVC por capas)
├── frontend/    # SPA (React + Vite)
├── infra/       # Infraestructura AWS (CDK)
├── Rules/       # Convenciones y documentación de desarrollo
├── AGENTS.md    # Guía rápida para agentes de IA
└── README.md
```

Documentación detallada: [`Rules/backend.md`](./Rules/backend.md),
[`Rules/frontend.md`](./Rules/frontend.md), [`Rules/aws.md`](./Rules/aws.md).

---

## Puesta en marcha

### 0. Requisitos

- Node.js 20+ y npm.
- AWS CLI configurado (para desplegar la infraestructura).

### 1. Infraestructura (AWS CDK)

```bash
cd infra
npm install
npm run deploy      # crea Cognito, DynamoDB y S3
```

Al finalizar, copia las salidas (`UserPoolId`, `UserPoolClientId`, nombres de tablas y
bucket) a los archivos `.env` de `backend` y `frontend`. También quedan en
`infra/cdk-outputs.json`.

Alta opcional de un usuario de prueba:

```bash
$env:USER_POOL_ID="us-east-2_XXXX"; $env:EMAIL="admin@bmw.com"; $env:PASSWORD="Passw0rd123"; $env:ROLE="admin"; $env:NAME="Admin Demo"; npm run create-user
```

### 2. Backend

```bash
cd backend
npm install
# crea backend/.env a partir de backend/.env.example con los valores reales
npm start           # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
# crea frontend/.env a partir de frontend/.env.example con los valores reales
npm run dev         # http://localhost:5173
```

---

## Variables de entorno

Solo se versionan los archivos `.env.example`. **Nunca** subas los `.env` reales.

**`backend/.env`**

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor (por defecto `3000`) |
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
| `FOTOS_BUCKET_NAME` | Bucket S3 de fotografías |
| `CORS_ORIGIN` | Origen permitido (`http://localhost:5173`) |

**`frontend/.env`**

| Variable | Descripción |
| --- | --- |
| `VITE_AWS_REGION` | Región AWS |
| `VITE_USER_POOL_ID` | ID del User Pool de Cognito |
| `VITE_USER_POOL_CLIENT_ID` | ID del App Client de Cognito |
| `VITE_API_URL` | URL base del backend (`http://localhost:3000`) |

---

## API (resumen)

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/` , `/info` | Público |
| GET | `/api/catalogo` , `/api/catalogo/:vehiculoId` | Público (catálogo web) |
| GET | `/api/auth/session` | Autenticado |
| POST | `/api/clientes/registro` | Público (autorregistro de clientes) |
| GET/POST | `/api/usuarios` | `admin` |
| GET/PATCH | `/api/usuarios/:userId` | `admin` |
| PATCH | `/api/usuarios/:userId/estado` | `admin` |
| GET | `/api/vehiculos` | Autenticado |
| GET | `/api/vehiculos/:vehiculoId` | Autenticado |
| POST | `/api/vehiculos` | `admin`, `vendedor` |
| PATCH | `/api/vehiculos/:vehiculoId` | `admin`, `vendedor` |
| POST | `/api/vehiculos/archivos/presign` | `admin`, `vendedor` |
| GET | `/api/repuestos` | Autenticado |
| GET | `/api/repuestos/:repuestoId` | Autenticado |
| POST | `/api/repuestos` | `admin`, `vendedor`, `jefe_taller` |
| PATCH | `/api/repuestos/:repuestoId` | `admin`, `vendedor`, `jefe_taller` |
| GET | `/api/movimientos` | Autenticado |
| POST | `/api/movimientos` | `admin`, `vendedor`, `jefe_taller` |
| GET/POST | `/api/clientes-comerciales` | `admin`, `vendedor` |
| GET/PATCH | `/api/clientes-comerciales/:clienteId` | `admin`, `vendedor` |
| POST | `/api/clientes-comerciales/:clienteId/consultas` | `admin`, `vendedor` |
| GET/POST | `/api/cotizaciones` | `admin`, `vendedor` |
| GET/PATCH | `/api/cotizaciones/:cotizacionId` | `admin`, `vendedor` |
| GET/POST | `/api/reservas` | `admin`, `vendedor` |
| GET | `/api/reservas/:reservaId` | `admin`, `vendedor` |
| POST | `/api/reservas/:reservaId/cancelar` | `admin`, `vendedor` |
| POST | `/api/reservas/:reservaId/convertir` | `admin`, `vendedor` |
| GET/POST | `/api/ventas` | `admin`, `vendedor` |
| GET | `/api/ventas/:ventaId` | `admin`, `vendedor` |
| POST | `/api/pruebas-man` | Público (solicitud con token opcional) |
| GET | `/api/pruebas-man` , `/api/pruebas-man/:pruebaId` | `admin`, `vendedor` |
| POST | `/api/pruebas-man/:pruebaId/confirmar` , `/reprogramar` , `/cancelar` , `/realizar` | `admin`, `vendedor` |

Detalle completo en [`Rules/backend.md`](./Rules/backend.md).

---

## Costos y seguridad

- **Solo capa gratuita de AWS**: no se agregan recursos con costo. Ver
  [`Rules/aws.md`](./Rules/aws.md) para el detalle por servicio.
- Bucket y tablas **privados**; fotografías y documentos se acceden mediante **URLs
  prefirmadas** (tipo y tamaño validados; 5 MB fotos / 10 MB documentos).
- Sin secretos en el repositorio; las credenciales AWS provienen del entorno.

---

## Convenciones

Antes de contribuir, lee [`Rules/README.md`](./Rules/README.md) y el documento del área
que vayas a modificar. Puntos clave: clean code, SOLID, MVC por capas, validación con
Zod, tokens de diseño en el frontend y español como idioma del código y la UI.

Repositorio remoto: `https://github.com/dgschahvqvc17/Concesionaria-BMW.git`.
