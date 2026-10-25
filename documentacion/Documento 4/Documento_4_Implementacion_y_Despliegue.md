# Documento 4: Implementación y Despliegue

**Proyecto:** Concesionaria BMW  
**Elaborado por:** Estudiante  
**Fecha:** Octubre 2026  
**Versión:** 2.0

## Índice

- [1. Objetivo del documento](#1-objetivo-del-documento)
- [2. Alcance](#2-alcance)
- [3. Arquitectura general del sistema](#3-arquitectura-general-del-sistema)
- [4. Autenticación de usuarios](#4-autenticación-de-usuarios)
- [5. Autorización y roles](#5-autorización-y-roles)
- [6. Protección de contraseñas](#6-protección-de-contraseñas)
- [7. Validación y seguridad de entradas](#7-validación-y-seguridad-de-entradas)
- [8. Variables de entorno](#8-variables-de-entorno)
- [9. Manejo seguro de credenciales](#9-manejo-seguro-de-credenciales)
- [10. Integración Frontend - Backend y solución a problemas CORS](#10-integración-frontend---backend-y-solución-a-problemas-cors)
- [11. Subida de fotografías a S3 con URLs prefirmadas y configuración CORS](#11-subida-de-fotografías-a-s3-con-urls-prefirmadas-y-configuración-cors)
- [12. Backend desplegado en AWS Lambda con Function URL](#12-backend-desplegado-en-aws-lambda-con-function-url)
- [13. Infraestructura como Código (AWS CDK)](#13-infraestructura-como-código-aws-cdk)
- [14. Git y control de versiones](#14-git-y-control-de-versiones)
- [15. Dockerfile](#15-dockerfile)
- [16. Docker Compose](#16-docker-compose)
- [17. Configuración de producción](#17-configuración-de-producción)
- [18. Despliegue paso a paso](#18-despliegue-paso-a-paso)
- [19. Pruebas funcionales](#19-pruebas-funcionales)
- [20. Evidencias de funcionamiento](#20-evidencias-de-funcionamiento)
- [21. Documentación técnica](#21-documentación-técnica)
- [22. Anexos](#22-anexos)

---

## 1. Objetivo del documento

El presente documento tiene como finalidad detallar de manera completa la implementación, configuración de seguridad, integración entre componentes, infraestructura, despliegue a producción y evidencias del sistema **Concesionaria BMW**. Se busca dejar constancia de las decisiones técnicas tomadas, los problemas encontrados durante el despliegue y las soluciones aplicadas para dejarlos operativos.

## 2. Alcance

Este documento abarca todo lo relacionado con la puesta en marcha del sistema: autenticación y autorización, validación de datos, manejo de variables y credenciales, comunicación entre frontend y backend, almacenamiento de archivos en Amazon S3, despliegue serverless con AWS Lambda Function URL, despliegue del frontend en Vercel, control de versiones con Git, justificación del uso o no uso de Docker y Docker Compose, así como las pruebas funcionales realizadas.

## 3. Arquitectura general del sistema

Concesionaria BMW es una aplicación web full-stack organizada bajo una arquitectura desacoplada y mayoritariamente serverless. 

### 3.1. Componentes principales

| Componente | Tecnología | Descripción |
|---|---|---|
| Frontend (SPA) | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui | Interfaz de usuario para todos los roles. Desplegado en Vercel. |
| Backend (API REST) | Node.js + Express + Zod + AWS SDK v3 | Lógica de negocio, validación, autorización, auditoría. Adaptado a Lambda con `serverless-express`. |
| Autenticación | Amazon Cognito User Pools + AWS Amplify Auth | Gestión de usuarios, login, tokens JWT y sesiones. |
| Base de datos | Amazon DynamoDB | Almacenamiento NoSQL para todas las entidades del sistema (usuarios, vehículos, cotizaciones, reservas, ventas, citas, auditoría, etc.). |
| Almacenamiento de archivos | Amazon S3 | Almacenamiento privado de fotos de vehículos y archivos técnicos del taller. Acceso mediante URLs prefirmadas. |
| Cómputo | AWS Lambda (Node.js 20.x) + Lambda Function URL | Ejecución serverless del backend sin API Gateway. |
| Infraestructura | AWS CDK | Definición, versionado y despliegue de toda la infraestructura como código. |
| Despliegue Frontend | Vercel | Build, hosting estático con SPA rewrites y proxy `/api/*` al backend. |

### 3.2. Flujo general de comunicación

1. El usuario accede a `https://concesionaria-bmw-app.vercel.app`. Vercel sirve el bundle estático de React.
2. Para autenticación, el frontend utiliza AWS Amplify para autenticar contra Amazon Cognito y obtener el `idToken` JWT.
3. Las peticiones a la API se realizan a rutas relativas `/api/...`. Gracias a los *rewrites* de Vercel, estas peticiones son redirigidas al Lambda Function URL.
4. El Lambda recibe la petición a través de `serverless-express`, ejecuta el middleware de autenticación/autorización, valida con Zod, ejecuta la lógica correspondiente y accede a DynamoDB/S3 según el caso.
5. Para subida de imágenes, el backend genera una **URL prefirmada** de S3. El navegador realiza un `PUT` directo a ese bucket desde el origen de Vercel, siempre y cuando las reglas **CORS** de S3 lo permitan.

## 4. Autenticación de usuarios

### 4.1. Concepto
La autenticación consiste en verificar que el usuario es quien afirma ser. En este sistema se basa en tokens JWT emitidos por Amazon Cognito, lo que evita gestionar contraseñas en texto plano a nivel de aplicación.

### 4.2. Implementación con Amazon Cognito
Se configuró un **Cognito User Pool** con su respectivo **App Client**. La integración se realizó con **AWS Amplify Auth** desde el frontend.

**Flujo detallado:**

1. El usuario ingresa correo y contraseña en la vista de inicio de sesión.
2. `signIn` de Amplify envía las credenciales al User Pool.
3. Si son válidas, Cognito devuelve los tokens (`idToken`, `accessToken`, `refreshToken`).
4. El frontend guarda la sesión y utiliza `fetchAuthSession()` para obtener el `idToken` cuando realiza peticiones autenticadas.
5. En cada llamada a `apiRequest`, se adjunta `Authorization: Bearer <idToken>`.
6. El backend valida dicho token y extrae la información del usuario para aplicar autorización.

### 4.3. Registro
- **Clientes externos:** Pueden autorregistrarse desde la pantalla pública de registro. El backend crea el registro correspondiente con rol `cliente`.
- **Personal:** Únicamente el usuario con rol `admin` puede crear usuarios del personal desde el módulo de gestión de usuarios.

### 4.4. Cierre de sesión y persistencia
Se implementó el cierre de sesión mediante Amplify, limpiando la sesión local. Los tokens tienen vigencia controlada por Cognito, lo que agrega una capa extra de seguridad.

## 5. Autorización y roles

### 5.1. Diferencia entre autenticación y autorización
La autenticación responde a *"¿Quién eres?"*, mientras que la autorización responde a *"¿Qué puedes hacer?"*. Ambos controles se aplican en este proyecto, siendo la autorización estricta por roles en backend.

### 5.2. Matriz de roles y permisos

| Rol | Descripción | Acceso principal |
|---|---|---|
| `admin` | Administrador general | Control total. Usuarios/Roles, Inventario, Repuestos, Clientes Comerciales, Cotizaciones, Reservas, Ventas, Pruebas de Manejo, Notificaciones, Taller, Reportes, Auditoría (HU18). |
| `vendedor` | Vendedor | Enfocado a comercial. Clientes Comerciales, Cotizaciones, Reservas, Ventas, Pruebas de Manejo, Notificaciones. Sin acceso a Auditoría. |
| `jefe_taller` | Jefe de Taller | Gestión integral del taller. Citas, asignación/reasignación de mecánicos, historial de servicios, reportes relacionados al taller. |
| `mecanico` | Mecánico | Muy restringido. Únicamente sus órdenes asignadas. Puede registrar avances, repuestos utilizados, iniciar/finalizar su propia orden. No ve reportes generales ni auditoría. |
| `cliente` | Cliente | Público/autenticado con restricciones. Catálogo, detalle de vehículo, solicitud de prueba de manejo, consulta de su información. |

### 5.3. Implementación

**Backend:** Se cuenta con middleware de autorización que valida el rol obtenido tras validar el JWT. Si la ruta requiere ciertos roles y el usuario no los posee, se devuelve `403 Forbidden`.

**Frontend:** Se utilizan rutas protegidas, guardado de sesión y renderizado condicional del menú lateral según `rol`. A pesar de esto, **toda regla crítica se valida siempre en el backend**, ya que el control del lado cliente nunca debe tomarse como único.

## 6. Protección de contraseñas

- **Almacenamiento:** Amazon Cognito se encarga del hashing de contraseñas. Nunca se guardan en texto plano ni en DynamoDB.
- **Políticas:** Se aplican políticas de complejidad para contraseñas seguras.
- **Recuperación:** Flujo "Olvidé mi contraseña" con código de verificación enviado al correo registrado.
- **Sesión:** Uso de tokens firmados por Cognito, validación por firma y vigencia.
- **Cierre de sesión:** Permite invalidar la sesión activa desde el cliente.

## 7. Validación y seguridad de entradas

### 7.1. Validación con Zod
Todo payload entrante es validado con **Zod** en los controladores/rutas correspondientes. Se valida tipo, formato, campos obligatorios y reglas de negocio (descuentos, vigencias, horarios, solapamientos, etc.).

### 7.2. Medidas adicionales

| Medida | Explicación |
|---|---|
| **AWS SDK v3 + parámetros** | Se evitan concatenaciones directas en consultas, reduciendo riesgo de inyección. |
| **ConditionExpression** | Usado en operaciones críticas (reservar/vender vehículo, asignar mecánico, crear número único de cotización/reserva/venta) para prevenir condiciones de carrera. |
| **Manejo centralizado de errores** | `errorHandler` unifica respuestas, evitando filtrar stack traces al cliente. |
| **Validación de archivos** | Tipo, extensión y tamaño para fotos/documentos. |
| **CORS controlado** | Configurado en Express y en el bucket S3. Se optó por proxy en Vercel para simplificar el origen. |
| **Auditoría** | `auditoriaMiddleware` registra operaciones de escritura relevantes (HU18), con registros inmutables. |

## 8. Variables de entorno

### 8.1. Backend (`backend/.env`)
Variables utilizadas para conectar con AWS y configurar el servicio:

| Variable | Uso |
|---|---|
| `PORT` | Puerto local (desarrollo) |
| `AWS_REGION` | Región `us-east-2` |
| `USER_POOL_ID`, `USER_POOL_CLIENT_ID` | Cognito para validación de tokens |
| `USUARIOS_TABLE_NAME`, `VEHICULOS_TABLE_NAME`, `REPUESTOS_TABLE_NAME`, `MOVIMIENTOS_TABLE_NAME`, `CLIENTES_COMERCIALES_TABLE_NAME`, `COTIZACIONES_TABLE_NAME`, `RESERVAS_TABLE_NAME`, `VENTAS_TABLE_NAME`, `PRUEBAS_MANEJO_TABLE_NAME`, `NOTIFICACIONES_TABLE_NAME`, `CITAS_TALLER_TABLE_NAME`, `AUDITORIA_TABLE_NAME` | Nombres de tablas DynamoDB |
| `FOTOS_BUCKET_NAME` | Bucket S3 para fotos/documentos |
| `CORS_ORIGIN` | Orígenes permitidos (se complementa con el manejo explícito) |

### 8.2. Frontend (`frontend/.env`)
Variables con prefijo `VITE_` expuestas a Vite:

| Variable | Uso |
|---|---|
| `VITE_AWS_REGION` | Región para Amplify |
| `VITE_USER_POOL_ID` | Cognito User Pool |
| `VITE_USER_POOL_CLIENT_ID` | Cognito App Client |
| `VITE_API_URL` | En desarrollo apunta a `http://localhost:3000`. En producción se deja vacío para usar rutas relativas con proxy de Vercel |

**Importante:** Únicamente `.env.example` va versionado. Los valores reales nunca se suben al repositorio.

## 9. Manejo seguro de credenciales

- **IAM Roles en Lambda:** El rol asociado a la función otorga únicamente permisos mínimos (`dynamodb:*` acotado por tablas, `s3:*` acotado por bucket, lectura de Cognito si aplica, logs en CloudWatch).
- **Sin claves en código:** No hay `AWS_ACCESS_KEY_ID` ni `AWS_SECRET_ACCESS_KEY` hardcodeados. En Lambda se usan credenciales del rol. En local se usan credenciales configuradas en el entorno de AWS CLI.
- **Frontend con datos públicos:** Solo se exponen IDs de Cognito (no secretos). El `idToken` se gestiona con Amplify y se envía por `Authorization`.
- **Git Hygiene:** `.gitignore` protege `.env`, `cdk.out`, `node_modules`, `dist`.
- **S3 privado:** Bucket con `BlockPublicAccess.BLOCK_ALL`. Todo acceso a objetos se hace con URLs prefirmadas generadas por el backend.

## 10. Integración Frontend - Backend y solución a problemas CORS

Uno de los mayores inconvenientes fue la comunicación **cross-origin** entre `https://concesionaria-bmw-app.vercel.app` y `https://7mkye2nhuxvu3ktonxys6qxtry0ubbcy.lambda-url.us-east-2.on.aws`.

### 10.1. Cliente HTTP (`frontend/src/lib/api.ts`)

Se modificó para usar **rutas relativas en producción**:

```ts
const API_URL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
```

Así, en producción `apiRequest` y `publicRequest` hacen `fetch(`${API_URL}${path}`, ...)` quedando `fetch("/api/...", ...)`. Esto permite que el navegador lo trate como mismo origen.

### 10.2. Proxy con Vercel Rewrites (`frontend/vercel.json`)

Se añadió el rewrite **antes** del catch-all SPA:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://7mkye2nhuxvu3ktonxys6qxtry0ubbcy.lambda-url.us-east-2.on.aws/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Con esto, Vercel recibe `/api/...`, lo proxea internamente al Lambda y devuelve la respuesta al frontend sin generar un request cross-origin desde el navegador. Se eliminó la mayoría de problemas de preflight.

### 10.3. CORS en Express (`backend/src/app.js`)

También se añadió un manejador explícito para `OPTIONS` respondiendo con cabeceras CORS adecuadas:

```js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors({ origin: '*', credentials: false }));
```

Esto garantizó respuesta correcta al preflight incluso en casos donde alguna ruta lo requiriera.

### 10.4. Deployment Protection de Vercel
También se deshabilitó **Vercel Authentication (Deployment Protection)** en producción, ya que estaba bloqueando la carga de assets estáticos (`.js/.css`) devolviendo `403`.

## 11. Subida de fotografías a S3 con URLs prefirmadas y configuración CORS

### 11.1. Flujo de subida

1. **Solicitud de URL prefirmada:** El frontend solicita al backend `POST /api/vehiculos/archivos/presign` enviando `filename`, `contentType` y `categoria` (`taller_foto`/`vehiculo_foto` según el caso).
2. **Generación:** El backend valida tipo/tamaño, genera una clave única en S3 (`vehiculos/fotos/...` o `taller/fotos/...`) y crea una URL prefirmada con `PutObjectCommand` usando AWS SDK v3.
3. **Subida directa:** El navegador hace un `PUT` **directo** a esa URL prefirmada hacia el bucket S3, con el `Content-Type` correspondiente.
4. **Registro:** Tras subir correctamente, el frontend envía la clave/URL al backend para guardarla en el registro del vehículo u orden de trabajo.

### 11.2. Configuración CORS en el bucket S3 (`infra/lib/inventario-stack.ts`)

Inicialmente solo se permitía `http://localhost:5173`. Al pasar a producción con Vercel, el `PUT` directo fallaba por CORS. Se actualizó el bucket para permitir también el origen de producción:

```ts
this.fotosBucket = new s3.Bucket(this, 'FotosVehiculosBucket', {
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  encryption: s3.BucketEncryption.S3_MANAGED,
  enforceSSL: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  cors: [
    {
      allowedOrigins: [
        'http://localhost:5173',
        'https://concesionaria-bmw-app.vercel.app',
        'https://*.vercel.app',
      ],
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD, s3.HttpMethods.POST],
      allowedHeaders: ['*'],
      exposedHeaders: ['ETag'],
      maxAge: 3000,
    },
  ],
});
```

Se redesplegó `ConcesionariaBmwInventarioStack` con CDK para aplicar los cambios. Tras esto, la subida/actualización de fotos desde Vercel quedó funcional.

## 12. Backend desplegado en AWS Lambda con Function URL

### 12.1. Adaptación a Lambda
Se creó `backend/lambda.js` utilizando `@codegenie/serverless-express` para envolver la app Express:

```js
const serverlessExpress = require('@codegenie/serverless-express');
const { createApp } = require('./src/app');

const app = createApp();
const server = serverlessExpress({ app });

exports.handler = (event, context, callback) => {
  return server(event, context, callback);
};
```

### 12.2. Lambda Function URL
En `infra/lib/api-stack.ts` se configuró la función Lambda con una **Function URL** con `authType: NONE`. Esto permite invocar la API directamente por HTTP sin pasar por API Gateway, manteniéndose dentro de la capa gratuita.

Se otorgaron permisos mínimos al rol de Lambda para acceder a todas las tablas DynamoDB del proyecto, al bucket S3 y para escritura en CloudWatch Logs.

### 12.3. Variables de entorno
Todas las variables necesarias (`*_TABLE_NAME`, `FOTOS_BUCKET_NAME`, `USER_POOL_ID`, `USER_POOL_CLIENT_ID`, `AWS_REGION`) se inyectaron desde los stacks al `ApiStack` mediante cross-stack references.

## 13. Infraestructura como Código (AWS CDK)

Los stacks se organizaron de la siguiente manera:

| Stack | Recursos |
|---|---|
| `AuthStack` | Amazon Cognito User Pool, User Pool Client |
| `InventarioStack` | DynamoDB `Vehiculos`, S3 `FotosVehiculosBucket` (con CORS), outputs |
| `RepuestosStack` | DynamoDB `Repuestos`, `MovimientosInventario` |
| `ApiStack` | Lambda Function, Function URL, IAM Role/Policies, todas las env vars, integración con los demás stacks |

Todo desplegado en `us-east-2`. Se utilizaron `RemovalPolicy.DESTROY` para facilitar el ciclo de desarrollo/pruebas, manteniéndose dentro de free tier.

## 14. Git y control de versiones

- **Repositorio:** GitHub (`Concesionaria-BMW`)
- **Rama principal:** `main`
- **Commits descriptivos:** En español, atómicos y enfocados al cambio.
- **`.gitignore`:** Protege `.env`, `node_modules`, `dist`, `cdk.out`, archivos sensibles.
- **Historial relevante:** Commits relacionados a fix de CORS, proxy con rewrites, rutas relativas en producción y corrección de CORS en bucket S3.
- **Buenas prácticas:** Sin subir credenciales, sin subir builds.

## 15. Dockerfile

**No se utilizó.**

### Justificación

- **Arquitectura serverless:** El backend corre en AWS Lambda, no en un contenedor persistente.
- **Sin costos adicionales:** Lambda está dentro de la capa gratuita. ECS/ECR/Fargate sí generarían costo.
- **Menor complejidad:** No requiere construir imagen, subir a registro ni gestionar runtime/actualizaciones.
- **Ajustado a requisitos:** El proyecto está orientado a servicios serverless de AWS.
- **Despliegue administrado:** Escalado, disponibilidad y parches son gestionados por AWS.

## 16. Docker Compose

**No se utilizó.**

### Justificación

- **Desarrollo simple:** Solo se levantan `backend` (`node server.js`) y `frontend` (`npm run dev`) por separado.
- **Servicios gestionados:** DynamoDB, Cognito, S3 son servicios administrados de AWS.
- **Sin orquestación local compleja:** No hay múltiples contenedores interdependientes que requieran `docker-compose`.
- **Entornos separados:** Desarrollo local, frontend en Vercel, backend en Lambda. Suficiente para este proyecto.
- **Sin generar costos:** Se evita levantar infraestructura innecesaria.

## 17. Configuración de producción

| Capa | Configuración |
|---|---|
| **Frontend** | Vercel, Vite build, SPA rewrites, `/api/*` proxy a Lambda, rutas relativas, sin Deployment Protection. |
| **Backend** | Lambda Node.js 20.x, Function URL auth NONE, `serverless-express`, CORS manejado, variables desde stacks CDK. |
| **Auth** | Cognito User Pool + App Client configurados. |
| **Datos** | DynamoDB PAY_PER_REQUEST. |
| **Archivos** | S3 privado con URLs prefirmadas y CORS habilitado para Vercel. |
| **Monitoreo** | CloudWatch Logs para Lambda. |
| **Costos** | Presupuesto AWS configurado, gasto $0.00 en validación. |

## 18. Despliegue paso a paso

### 18.1. Infraestructura con CDK
```bash
cd infra
npm install
npx cdk bootstrap  # solo primera vez
npx cdk deploy ConcesionariaBmwAuthStack ConcesionariaBmwInventarioStack ConcesionariaBmwRepuestosStack ConcesionariaBmwApiStack --require-approval never
```

### 18.2. Backend
- Se añadió `lambda.js` con `@codegenie/serverless-express`
- Se corrigió `uuid` a `v8` por compatibilidad CommonJS
- Se actualizó `app.js` con manejo explícito de `OPTIONS`
- Desplegado vía `ApiStack`

### 18.3. Frontend
```bash
cd frontend
npm install
npm run build
npx vercel --prod --yes --force
```

Cambios aplicados:
- `vercel.json`: rewrite `/api/:path*` antes del catch-all
- `src/lib/api.ts`: `API_URL = ''` en producción (rutas relativas)
- Variables de entorno configuradas en Vercel
- Deployment Protection deshabilitado

### 18.4. Verificación
```bash
# Proxy funcionando
curl https://concesionaria-bmw-app.vercel.app/api/catalogo

# Lambda directo
curl https://7mkye2nhuxvu3ktonxys6qxtry0ubbcy.lambda-url.us-east-2.on.aws/api/catalogo
```

## 19. Pruebas funcionales

### 19.1. Pruebas por módulo

| HU | Módulo | Pruebas realizadas | Resultado |
|---|---|---|---|
| HU01 | Login/Autenticación | Login con distintos roles, sesión, logout | Aprobado |
| HU02 | Usuarios/Roles | CRUD por admin, activación/inactivación | Aprobado |
| HU03 | Inventario Vehículos | Crear/editar, estados, fotos | Aprobado |
| HU05 | Catálogo Público | Sin login, detalle, sin datos sensibles | Aprobado |
| HU07 | Clientes Comerciales | Registro, historial, autorización | Aprobado |
| HU08 | Cotizaciones | Número único, descuento <=20%, PDF, mailto | Aprobado |
| HU09 | Reservas | Disponibilidad, conversión a venta, vigencia | Aprobado |
| HU10 | Ventas | Validación disponibilidad, vinculación reserva, comprobante | Aprobado |
| HU11 | Pruebas de Manejo | Público + interno, solapamiento, agenda | Aprobado |
| HU12 | Notificaciones | Registro, listado, envío mailto | Aprobado |
| HU13 | Citas Taller | Estados, solapamiento, horarios | Aprobado |
| HU14 | Asignación Mecánicos | Asignar/reasignar, restricciones | Aprobado |
| HU15 | Avances Taller | Diagnóstico/tareas/repuestos, archivos, descuento repuestos | Aprobado |
| HU16 | Historial Servicios | Búsqueda por VIN, filtro citas válidas | Aprobado |
| HU17 | Reportes | KPIs, filtros fecha, gráficos SVG | Aprobado |
| HU18 | Auditoría | Solo admin, filtros, inmutabilidad | Aprobado |

### 19.2. Pruebas de seguridad y despliegue

| Prueba | Resultado |
|---|---|
| Acceso sin token a rutas protegidas | `401` - Aprobado |
| Acceso con rol no autorizado | `403` - Aprobado |
| Preflight `OPTIONS` desde Vercel | Responde con cabeceras CORS - Aprobado |
| Subida de fotos con URL prefirmada a S3 desde Vercel | Funcional tras CORS en bucket - Aprobado |
| Peticiones con `Authorization: Bearer` vía proxy | Sin `Failed to fetch` - Aprobado |
| Catálogo vía `/api/catalogo` desde mismo dominio | JSON correcto - Aprobado |

## 20. Evidencias de funcionamiento

**URL de producción:** [https://concesionaria-bmw-app.vercel.app](https://concesionaria-bmw-app.vercel.app)

| Evidencia | Descripción |
|---|---|
| Login con rol `admin` | Acceso correcto con credenciales `admin@bmw.com / Passw0rd123` |
| Menú por rol | Se visualizan únicamente módulos autorizados |
| Catálogo público | Carga sin autenticación |
| Inventario y gestión de fotos | CRUD de vehículos con subida/actualización de fotos funcional |
| Módulos comerciales | Cotizaciones, Reservas, Ventas operativos |
| Taller | Citas, asignación, avances, repuestos |
| Historial de servicios | Búsqueda por VIN funcional |
| Reportes | KPIs y gráficos renderizando |
| Auditoría | Listado exclusivo para `admin` |
| Proxy API | `/api/*` responde correctamente vía Vercel rewrites |
| Sin errores `Failed to fetch` | Tras correcciones de CORS/proxy/protección Vercel |

## 21. Documentación técnica

### 21.1. Estructura del proyecto
```text
ConcesionariaBMW/
├── backend/        # API REST (routes, controllers, services, repositories, middleware)
├── frontend/       # SPA React + Vite (pages, components, services, lib)
├── infra/          # AWS CDK (bin, lib con stacks)
├── documentacion/  # Documentación técnica
└── Rules/          # Convenciones del proyecto
```

### 21.2. Stack tecnológico resumido
**Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui, React Hook Form, Zod, AWS Amplify Auth, jsPDF  
**Backend:** Node.js, Express, Zod, AWS SDK v3, serverless-express, multer, uuid  
**AWS:** Cognito, DynamoDB, S3, Lambda, CloudWatch, CDK  
**Hosting:** Vercel  

### 21.3. Principios aplicados
Arquitectura por capas, separación de responsabilidades, validación estricta, autorización por roles, mínimo privilegio, credenciales vía IAM, serverless dentro de free tier, código limpio y sin secretos versionados.

## 22. Anexos

### Anexo A. Fragmentos clave modificados

#### A.1. `frontend/src/lib/api.ts` (rutas relativas en producción)
```ts
const API_URL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
```

#### A.2. `frontend/vercel.json` (proxy /api/*)
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://7mkye2nhuxvu3ktonxys6qxtry0ubbcy.lambda-url.us-east-2.on.aws/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### A.3. `backend/src/app.js` (preflight OPTIONS + CORS)
```js
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(cors({ origin: '*', credentials: false }));
```

#### A.4. `backend/lambda.js` (adaptador Express -> Lambda)
```js
const serverlessExpress = require('@codegenie/serverless-express');
const { createApp } = require('./src/app');
const app = createApp();
const server = serverlessExpress({ app });
exports.handler = (event, context, callback) => server(event, context, callback);
```

#### A.5. `infra/lib/inventario-stack.ts` (CORS bucket S3)
```ts
cors: [
  {
    allowedOrigins: [
      'http://localhost:5173',
      'https://concesionaria-bmw-app.vercel.app',
      'https://*.vercel.app',
    ],
    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD, s3.HttpMethods.POST],
    allowedHeaders: ['*'],
    exposedHeaders: ['ETag'],
    maxAge: 3000,
  },
],
```

### Anexo B. URLs del proyecto

| Recurso | URL |
|---|---|
| Frontend Producción | [https://concesionaria-bmw-app.vercel.app](https://concesionaria-bmw-app.vercel.app) |
| Lambda Function URL | [https://7mkye2nhuxvu3ktonxys6qxtry0ubbcy.lambda-url.us-east-2.on.aws](https://7mkye2nhuxvu3ktonxys6qxtry0ubbcy.lambda-url.us-east-2.on.aws) |
| Repositorio GitHub | [https://github.com/dgschahvqvc17/Concesionaria-BMW](https://github.com/dgschahvqvc17/Concesionaria-BMW) |

### Anexo C. Comandos útiles

```bash
# CDK
cd infra
npx cdk deploy --all --require-approval never

# Build + Deploy Frontend
cd frontend
npm run build
npx vercel --prod --yes --force

# Verificación API vía proxy
curl -I https://concesionaria-bmw-app.vercel.app/api/catalogo
```

### Anexo D. Lecciones aprendidas

- **Mismo origen > CORS complejo:** Usar *rewrites* de Vercel para proxy fue la solución más limpia y práctica.
- **Preflight importa:** Responder `OPTIONS` correctamente es clave con Function URL.
- **S3 presign + CORS:** Hay que habilitar los orígenes correctos en el bucket para `PUT` directo desde navegador.
- **Deployment Protection:** Puede pasar desapercibido y romper assets.
- **Serverless con IAM:** Más seguro que inyectar claves AWS en entornos externos.
- **Documentar incidencias:** Guardar el razonamiento de cada fix ahorra tiempo al redactar.

**Fin del Documento 4**