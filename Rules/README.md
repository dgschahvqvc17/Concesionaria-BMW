# Rules — Guía de desarrollo de Concesionaria BMW

Esta carpeta concentra las **reglas y convenciones** del proyecto para que cualquier
persona (o agente de IA) pueda trabajar de forma consistente.

> Lee este archivo primero. Si vas a tocar código, revisa además el documento del
> área correspondiente.

## Índice

| Documento | Alcance |
| --- | --- |
| [`backend.md`](./backend.md) | Backend Express: MVC, capas, SOLID, clean code, errores, validación, auth. |
| [`frontend.md`](./frontend.md) | Frontend React: arquitectura, sistema de diseño BMW, componentes, estado. |
| [`aws.md`](./aws.md) | Servicios AWS usados, infra CDK y regla de **solo capa gratuita**. |
| [`../AGENTS.md`](../AGENTS.md) | Resumen rápido para agentes de IA. |

## Qué es el proyecto

**Concesionaria BMW** es una aplicación web full-stack para gestionar un concesionario
BMW. Se construye por Historias de Usuario (HU):

- **HU01** — Iniciar sesión (Cognito + roles).
- **HU02** — Gestionar usuarios y roles (solo admin).
- **HU03** — Gestionar inventario de vehículos (listar, registrar, modificar, fotos).
- **HU04** — Gestionar inventario de repuestos (existencias, entradas/salidas, reposición).
- **HU05** — Catálogo web público de vehículos (filtros, detalle, proyección pública).
- **HU06** — Gestionar fotografías y documentos de los vehículos (S3, roles, validación).

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui |
| Autenticación (cliente) | AWS Amplify (`aws-amplify`) contra Cognito |
| Backend | Node.js + Express 5 (CommonJS) |
| Validación | Zod |
| Persistencia | Amazon DynamoDB (AWS SDK v3) |
| Archivos | Amazon S3 (URLs prefirmadas) |
| Autenticación (servidor) | Verificación de JWT de Cognito (`aws-jwt-verify`) |
| Infraestructura | AWS CDK (TypeScript) |

## Estructura del repositorio

```text
Concesionaria-BMW/
├── backend/     API REST (Express, MVC + capas)
├── frontend/    SPA (React + Vite)
├── infra/       Infraestructura como código (AWS CDK)
├── Rules/       Documentación y convenciones (esta carpeta)
├── AGENTS.md    Guía rápida para agentes de IA
└── README.md    Documento principal del proyecto
```

## Convenciones generales (aplican a todo el repo)

1. **Idioma**: el código (nombres de funciones, mensajes al usuario) y la documentación
   se escriben en **español**. Mantén la consistencia con el código existente.
2. **Solo capa gratuita de AWS**: no agregar servicios que generen costo. Ver
   [`aws.md`](./aws.md).
3. **Nunca** subir secretos, `.env`, tokens ni credenciales al repositorio. Los `.env`
   están en `.gitignore`; solo se versionan los `.env.example`.
4. **Separación de responsabilidades**: respeta las capas del backend y la estructura
   del frontend. No mezcles acceso a datos con lógica de negocio ni con HTTP.
5. **Clean code**: nombres descriptivos, funciones cortas con una sola responsabilidad,
   sin código muerto ni duplicado.
6. **Verifica antes de terminar**: compila y construye (`build`) lo que toques.
7. **No hacer commit ni push** salvo que se solicite explícitamente.

## Estado de verificación

Comandos usados para validar cambios:

```bash
# Backend: chequeo de sintaxis de cada archivo
node --check server.js

# Frontend: tipos + build de producción
cd frontend
npm run build

# Infra: compilar CDK
cd infra
npx tsc --noEmit
```

> Nota conocida: `frontend` define el script `lint` pero **ESLint no está instalado**.
> Si se necesita linting real, primero hay que instalar y configurar ESLint.
