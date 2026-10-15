# AGENTS.md — Guía para agentes de IA

Este repositorio es **Concesionaria BMW**, una app full-stack (React + Vite, Express,
AWS CDK con Cognito/DynamoDB/S3). Antes de trabajar, **lee la carpeta [`Rules/`](./Rules/)**
(empieza por [`Rules/README.md`](./Rules/README.md)); contiene las convenciones detalladas.

## Mapa rápido

| Carpeta | Qué es | Doc |
| --- | --- | --- |
| `backend/` | API REST (Express, MVC por capas, Zod, DynamoDB, S3) | [`Rules/backend.md`](./Rules/backend.md) |
| `frontend/` | SPA (React + TS + Tailwind + shadcn/ui) | [`Rules/frontend.md`](./Rules/frontend.md) |
| `infra/` | Infraestructura como código (AWS CDK) | [`Rules/aws.md`](./Rules/aws.md) |
| `Rules/` | Convenciones y documentación | — |

## Reglas inquebrantables

1. **Solo capa gratuita de AWS.** Nunca agregues recursos que generen costo (EC2, RDS,
   API Gateway, NAT, etc.). Ver [`Rules/aws.md`](./Rules/aws.md).
2. **Nunca** subir secretos, `.env`, tokens ni credenciales. Solo se versionan `.env.example`.
3. **No hacer commit ni push** salvo que se solicite explícitamente.
4. **Idioma**: código y mensajes al usuario en **español**.
5. **Backend**: respeta las capas `routes → controllers → services → repositories`.
   Nada de lógica de negocio en controladores/rutas; valida todo con Zod.
6. **Frontend**: usa los tokens de marca y los primitivos de `components/ui`; no inventes
   estilos sueltos. El acceso a datos va en `services/` + hooks.
7. Sin comentarios en el código salvo que aporten valor.

## Antes de dar una tarea por terminada

```bash
# Backend
node --check server.js          # (dentro de backend/)

# Frontend (tipos + build)
cd frontend; npm run build

# Infra
cd infra; npx tsc --noEmit
```

- Nota: `frontend` tiene script `lint` pero **ESLint no está instalado**; no lo uses.
- Verifica siempre que compila antes de concluir.

## Contexto útil

- Roles: `admin`, `vendedor`, `jefe_taller`, `mecanico`, `cliente` (orden = precedencia;
  por defecto `mecanico`). Los **clientes** se autorregistran desde el login
  (`POST /api/clientes/registro`); el administrador gestiona solo al personal y no crea clientes.
- HU01 login, HU02 usuarios/roles, HU03 inventario de vehículos y HU04 inventario de repuestos
  (implementadas; HU01–HU03 verificadas end-to-end).
- Región AWS: `us-east-2`. Los valores reales de recursos están en los `.env` (no versionados)
  y en `infra/cdk-outputs.json`.
