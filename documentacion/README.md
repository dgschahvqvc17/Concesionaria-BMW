# Documentación del backend — Concesionaria BMW

Esta carpeta reúne la documentación técnica del **backend** del proyecto
**Concesionaria BMW**. Está pensada para explicar, de forma amplia y detallada, cómo
está construido el servidor: su estructura, arquitectura, base de datos, validación,
manejo de errores y su API REST.

> **Nota importante sobre el enunciado original.**
> La consigna pedía documentar el backend con **PostgreSQL**, **ORM** y **migraciones**.
> Este proyecto **no usa una base de datos relacional**: usa una base de datos
> **NoSQL (Amazon DynamoDB)** y servicios administrados de **AWS** (Cognito, S3),
> siempre dentro de la **capa gratuita**. Por eso, en la documentación se conservan
> los 13 puntos pedidos, pero los que no aplican se **renombran y adaptan** a la
> tecnología real del proyecto. La siguiente tabla resume la equivalencia.

## Equivalencia de los puntos pedidos

| # | Punto del enunciado | En este proyecto se documenta como |
| --- | --- | --- |
| 1 | Estructura del proyecto backend | **Estructura del proyecto backend** (sin cambios) |
| 2 | Implementación con JavaScript/TypeScript | **Implementación con JavaScript (Node.js) y TypeScript** |
| 3 | Arquitectura del backend | **Arquitectura del backend (MVC por capas)** |
| 4 | Configuración de PostgreSQL | **Configuración de Amazon DynamoDB (base NoSQL)** |
| 5 | Modelo y tablas de la base de datos | **Modelo de datos y tablas de DynamoDB** |
| 6 | Conexión mediante ORM | **Acceso a datos mediante repositorios y el cliente de documentos de AWS SDK** |
| 7 | Migraciones | **Aprovisionamiento del esquema con Infraestructura como Código (AWS CDK)** |
| 8 | Operaciones CRUD | **Operaciones CRUD** (sin cambios) |
| 9 | Validación de datos | **Validación de datos con Zod** |
| 10 | Manejo de errores | **Manejo de errores** |
| 11 | Endpoints REST | **Endpoints REST** |
| 12 | JSON y códigos HTTP | **JSON y códigos HTTP** |
| 13 | Documentación básica de API | **Documentación básica de la API** |

## Archivos de esta carpeta

| Archivo | Contenido |
| --- | --- |
| [`README.md`](./README.md) | Este índice y guía. |
| [`backend.md`](./backend.md) | Documentación detallada de los 13 puntos (adaptados). |
| [`diagramas.md`](./diagramas.md) | Diagramas en **PlantUML** listos para copiar y renderizar. |

## Cómo usar los diagramas

1. Abre <https://www.plantuml.com/plantuml/uml/> (editor online oficial).
2. Copia el bloque que quieras de [`diagramas.md`](./diagramas.md) (incluyendo
   `@startuml` ... `@enduml`).
3. Pégalo en el editor. El diagrama se genera automáticamente.
5. Descarga la imagen (PNG/SVG) con el botón **Download** y úsala en tu informe.

> También puedes pegarlos en cualquier editor compatible con PlantUML (VS Code con la
> extensión *PlantUML*, IntelliJ, etc.).

## Resumen del stack real

- **Runtime:** Node.js (CommonJS).
- **Framework HTTP:** Express 5.
- **Validación:** Zod.
- **Base de datos:** Amazon DynamoDB (NoSQL, on-demand).
- **Autenticación:** Amazon Cognito (User Pool + grupos/JWT).
- **Archivos:** Amazon S3 (bucket privado + URLs prefirmadas).
- **Infraestructura:** AWS CDK (TypeScript).
- **Región:** `us-east-2`.
- **Frontend (contexto):** React 18 + Vite + TypeScript + Tailwind + shadcn/ui.

## Documentos relacionados (convenciones internas)

Estos archivos describen las reglas de desarrollo del repositorio y complementan esta
documentación:

- [`../Rules/README.md`](../Rules/README.md) — índice de convenciones.
- [`../Rules/backend.md`](../Rules/backend.md) — convenciones del backend.
- [`../Rules/aws.md`](../Rules/aws.md) — convenciones de infraestructura y capa gratuita.
- [`../Rules/frontend.md`](../Rules/frontend.md) — convenciones del frontend.
