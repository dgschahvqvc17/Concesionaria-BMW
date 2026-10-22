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
  HU07 seguimiento comercial de clientes, HU08 cotizaciones, HU09 reservas de vehículos,
  HU10 ventas de vehículos, HU11 pruebas de manejo, HU12 notificaciones por correo,
  HU13 citas del taller, HU14 asignación de trabajos a mecánicos, HU15 registro de
  mantenimiento y reparaciones, HU16 consulta del historial de servicios de los vehículos
  y HU17 consulta de reportes de gestión
  (Sprint 3 = "Taller y administración")
  (HU01–HU06 verificadas end-to-end; HU07–HU17 con backend verificado e2e y
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
- Ventas (HU10): tabla `Ventas` (GSIs `vehiculo-index`, `cliente-index` y `numero-index`;
  número único `VTA-AAAA-######` reservado de forma atómica); rutas `/api/ventas`
  (solo `admin`/`vendedor`) con `POST /`, `GET /` y `GET /:ventaId`. Solo se venden vehículos
  `disponible` o `reservado` con reserva vigente (409 en conflicto); al confirmar se
  reverifica la disponibilidad y se aparta la unidad con un update condicional atómico
  (`estado → vendido`), impidiendo vender la misma unidad dos veces. Snapshot de cliente y
  vehículo, descuento autorizado ≤ 20%, `precioLista`/`descuentoMonto`/`precioFinal`,
  fecha de venta (no futura), observaciones y autor de la operación. Si la unidad estaba
  reservada, la venta se vincula y la reserva pasa a `convertida`. El comprobante se genera
  en el frontend con **jsPDF**.
- Pruebas de manejo (HU11): tabla `PruebasManejo` (GSIs `vehiculo-index` con `fechaHora`,
  `cliente-index` y `numero-index`; número único `PRB-AAAA-######` reservado de forma atómica);
  rutas `/api/pruebas-man` con `POST /` **público con token opcional** (`optionalAuth`, solicitud
  desde el catálogo) y el resto solo `admin`/`vendedor`. Conflictos = mismo vehículo + ventanas
  solapadas (409); horario de atención 08:00–18:00 en pasos de 15 min, duración 15–180 min
  (defecto 60), vehículos `disponible`/`reservado` publicados. Estados
  `pendiente`/`confirmada`/`realizada`/`cancelada` con transiciones confirmar, reprogramar
  (conserva estado + historial), cancelar y realizar. Snapshot de vehículo y `contacto`;
  en solicitudes públicas el `clienteId` se ignora (`'anonimo'`). Frontend: página
  `/pruebas-man` (admin/vendedor), diálogo reutilizable desde el detalle del vehículo
  (público) y la ficha del cliente.
- Notificaciones por correo (HU12): tabla `Notificaciones` (PK `eventoId` =
  `tipo:recursoId:evento:destinatario` con `Put` condicional anti-duplicados; GSI
  `recurso-index`); rutas `/api/notificaciones` (solo `admin`/`vendedor`) con `GET /`,
  `GET /:eventoId` y `POST /:eventoId/enviar`. Los servicios de negocio (reserva, cotización,
  prueba, venta) registran la notificación con `registrarSinFallo` (un fallo al notificar
  no revierte la operación). Transporte **`mailto:`** (decisión: sin Amazon SES por la capa
  gratuita, igual que HU08); máximo 5 intentos por registro (6.º → 409); estados
  `pendiente`/`intentado`/`fallido`/`omitido`. Frontend: página `/notificaciones`
  (admin/vendedor), `NotificacionesRecurso` en los detalles de cotización/reserva/prueba/venta
  y envío de cotización con descarga de PDF + `mailto:`.
- Citas del taller (HU13): tabla `CitasTaller` (GSIs `vehiculo-index`,
  `cliente-index` y `numero-index`; número único `CIT-AAAA-######` reservado de forma
  atómica); rutas `/api/citas-taller` (solo `admin`/`jefe_taller`, 8 endpoints: listado,
  detalle y transiciones). Estados `solicitada`/`confirmada`/`en_atencion`/`finalizada`/
  `cancelada`; conflicto 409 si el mismo vehículo tiene otra cita solapada; horario de
  atención 08:00–18:00 en pasos de 15 min (duración 15–480, defecto 60). Notificaciones
  tipo `cita_taller` (eventos `cita_*`) con `registrarSinFallo`. Frontend: ruta `/citas`
  (admin/jefe_taller, ítem «Taller»).
- Asignación de trabajos a mecánicos (HU14): reutiliza `CitasTaller` como **órdenes de
  trabajo** con el campo `mecanicoId` + GSI `mecanico-index` (`mecanicoId` + `fechaHora`;
  sin tabla nueva ni infraestructura adicional). `POST /api/citas-taller/:citaId/asignar`
  y `GET /api/usuarios/mecanicos` (ambos `admin`/`jefe_taller`); `GET /api/citas-taller`
  acepta `?mecanicoId=`. Solo se asigna sobre citas `confirmada`/`en_atencion` (409);
  404 si el usuario no existe y 409 si no tiene rol `mecanico` o está inactivo («no se
  asignan trabajos a usuarios inactivos»), además del 409 por mecánico repetido. Guarda
  snapshot `mecanico`, `asignadoAt` e historial `asignaciones` (`asignada`/`reasignada`);
  notifica al mecánico con eventos `cita_asignada`/`cita_reasignada` (transporte
  `mailto:`). El rol `mecanico` accede a `/citas` pero **solo ve sus propias citas**
  (listado filtrado por `req.auth.sub` y 403 en detalle ajeno).
- Registro de mantenimiento y reparaciones (HU15): añade a cada orden (`CitasTaller`) los
  campos `diagnostico`, `tareas[]`, `repuestosUtilizados[]`, `observacionesTecnicas`,
  `archivos[]`, `ultimoAvanceAt` y las fechas reales `fechaInicioReal` (al pasar a
  `en_atencion`) y `fechaFinReal` (al `finalizar`); sin tabla ni infraestructura nueva.
  `POST /api/citas-taller/:citaId/avances` registra el avance (un solo POST aplica lo
  enviado; se exige al menos diagnóstico, tarea, repuesto, observación o archivo) y
  `POST /api/citas-taller/:citaId/archivos/presign` firma la subida de archivos técnicos
  (categorías `taller_foto` → `taller/fotos` ≤ 5 MB y `taller_documento` → `taller/documentos`
  ≤ 10 MB, reutilizando el bucket de HU06). **Solo el mecánico asignado (`mecanicoId === sub`)
  o un gestor (`admin`/`jefe_taller`) puede documentar** (403 en caso contrario); los avances
  solo se admiten en estados `confirmada`/`en_atencion` (409). Los repuestos utilizados se
  descuentan de inmediato registrando un **movimiento de salida atómico** (HU04; 404 si el
  repuesto no existe y 409 si no hay existencias). El mecánico asignado puede `iniciar`
  (`confirmada→en_atencion`) y `finalizar` (`en_atencion→finalizada`) su propia orden.
  Frontend: `TallerAvancesPanel` dentro del detalle de la orden en `/citas`.
- Historial de servicios de vehículos (HU16): sin tabla ni infraestructura nueva; reutiliza
  `CitasTaller` y el GSI `vehiculo-index` de HU13. `GET /api/citas-taller/historial?vin=`
  (o `?vehiculoId=`) y `GET /api/citas-taller/historial/:vehiculoId` (solo
  `admin`/`jefe_taller`/`vendedor`, 403 para `mecanico`); resuelve el vehículo por VIN exacto
  (`vehiculoRepository.findByVin`, GSI `vin-index`, 404 si no existe). Devuelve el resumen del
  vehículo (`vehiculo`) y `servicios[]` (ordenados por fecha descendente) con número, tipo,
  fechas reales, diagnóstico, tareas, repuestos, observaciones, responsable (snapshot
  `mecanico`) y estado; **excluye** citas `solicitada`/`cancelada`. Frontend: ruta
  `/historial-servicios` (admin/jefe_taller/vendedor, ítem «Historial») con buscador por VIN,
  tabla de servicios y detalle de solo lectura.
- Reportes de gestión (HU17): sin tabla ni infraestructura nueva; `GET /api/reportes` (resumen
  consolidado) y `GET /api/reportes/:tipo` (`inventario`/`ventas`/`cotizaciones`/`clientes`/
  `taller`/`repuestos`), solo `admin`/`vendedor` (403 al resto). Filtro opcional
  `?fechaDesde=&fechaHasta=` (ISO-8601, 400 si están mal formadas o invertidas) aplicable a
  ventas/cotizaciones/taller. Agrega con los repositorios existentes (`listAll`): inventario
  por estado + valor, ventas (totales, ticket, serie mensual), cotizaciones por estado,
  taller (estados, tipos, órdenes finalizadas, repuestos consumidos), repuestos (valor y
  existencias bajas) y clientes por `estadoSeguimiento`. Gráficos **SVG propios** en el
  frontend (sin dependencias). **No se usa Amazon QuickSight** (carece de capa gratuita).
  Frontend: ruta `/reportes` (admin/vendedor, ítem «Reportes») con KPIs, filtro de fechas y
  gráficos de barras/dona.
- Archivos (HU06): se suben a S3 con URL prefirmada (`POST /api/vehiculos/archivos/presign`,
  solo `admin`/`vendedor`); la firma fija el tamaño (≤ 5 MB fotos, ≤ 10 MB documentos) y se
  valida tipo/tamaño al guardar. Los documentos nunca se exponen en el catálogo público.
- Catálogo público (HU05): `GET /api/catalogo` y `GET /api/catalogo/:vehiculoId` (sin auth);
  solo expone vehículos con `publicado !== false`, con proyección pública (sin VIN ni datos internos).
- Región AWS: `us-east-2`. Los valores reales de recursos están en los `.env` (no versionados)
  y en `infra/cdk-outputs.json`.
