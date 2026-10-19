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
- HU01 login, HU02 usuarios/roles, HU03 inventario de vehículos, HU04 inventario de repuestos,
  HU05 catálogo web público de vehículos, HU06 gestión de fotografías y documentos,
  HU07 seguimiento comercial de clientes, HU08 cotizaciones y HU09 reservas de vehículos
  (HU01–HU06 verificadas end-to-end; HU07, HU08 y HU09 con backend verificado e2e y
  frontend compilando).
- Clientes comerciales (HU07): tabla `ClientesComerciales` (GSIs `email-index` y
  `documento-index`); rutas `/api/clientes-comerciales` (solo `admin`/`vendedor`),
  con anti-duplicados (409) e historial de consultas. Al registrar una consulta, el frontend
  abre el gestor de correo con la confirmación redactada (`mailto:`, sin SES).
- Cotizaciones (HU08): tabla `Cotizaciones` (GSIs `cliente-index` y `numero-index`;
  número único `COT-AAAA-######` reservado de forma atómica); rutas `/api/cotizaciones`
  (solo `admin`/`vendedor`). Snapshot del precio vigente de cada vehículo, descuento
  autorizado ≤ 20%, estados `pendiente`/`aceptada`/`rechazada`/`vencida` (vencida se deriva
  de `fechaVencimiento`). El PDF se genera en el frontend con **jsPDF** y el envío por correo
  usa un enlace **`mailto:`** (sin AWS SES, para no salir de la capa gratuita).
- Reservas (HU09): tabla `Reservas` (GSIs `vehiculo-index`, `cliente-index` y `numero-index`;
  número único `RES-AAAA-######` reservado de forma atómica); rutas `/api/reservas`
  (solo `admin`/`vendedor`) con `POST /`, `GET /`, `GET /:reservaId`,
  `POST /:reservaId/cancelar` y `POST /:reservaId/convertir`. Solo se reservan vehículos
  `disponible` (409 en conflicto); al reservar el vehículo pasa a `reservado` con un update
  condicional atómico. Estados `activa`/`cancelada`/`vencida`/`convertida` (vencida se deriva
  de `fechaVencimiento` y libera la unidad); convertir en venta deja el vehículo `vendido`.
  `condiciones`, `monto` opcional, vigencia por defecto 30 días e historial de estados.
- Archivos (HU06): se suben a S3 con URL prefirmada (`POST /api/vehiculos/archivos/presign`,
  solo `admin`/`vendedor`); la firma fija el tamaño (≤ 5 MB fotos, ≤ 10 MB documentos) y se
  valida tipo/tamaño al guardar. Los documentos nunca se exponen en el catálogo público.
- Catálogo público (HU05): `GET /api/catalogo` y `GET /api/catalogo/:vehiculoId` (sin auth);
  solo expone vehículos con `publicado !== false`, con proyección pública (sin VIN ni datos internos).
- Región AWS: `us-east-2`. Los valores reales de recursos están en los `.env` (no versionados)
  y en `infra/cdk-outputs.json`.
