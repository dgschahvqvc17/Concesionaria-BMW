# Frontend — Arquitectura y sistema de diseño

SPA de Concesionaria BMW: **React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui**,
con autenticación vía **AWS Amplify** contra Cognito.

## Principios rectores

- **Clean code** y **SOLID**: componentes con una responsabilidad, lógica separada de la
  presentación, estado y acceso a datos en capas dedicadas.
- **Sistema de diseño consistente**: todo usa los tokens de marca BMW y los primitivos
  de UI; no se inventan estilos sueltos.
- **Accesibilidad**: etiquetas `htmlFor`/`id`, `aria-*`, foco visible y contraste.

## Estructura de carpetas

```text
frontend/src/
├── App.tsx                 # Router + providers + Toaster
├── main.tsx                # Punto de entrada; configureAmplify()
├── index.css               # Tokens CSS, utilidades (surface-card, glass) y base
├── components/
│   ├── auth/               # LoginForm, AuthBrandPanel, RegisterClienteForm
│   ├── brand/              # BmwRoundel, MStripe
│   ├── catalog/            # Catálogo público: CatalogoLayout, CatalogoCard, CatalogoFiltros, VehiculoGaleria
│   ├── citasTaller/        # CitasTallerTable, CitaTallerFormDialog, CitaTallerDetalleDialog (HU13)
│   ├── clientesComerciales/ # ClienteComercialFormDialog (HU07)
│   ├── common/             # ConfirmDialog
│   ├── cotizaciones/       # CotizacionFormDialog, CotizacionesTable, CotizacionDetalleDialog (HU08)
│   ├── dashboard/          # InfoTile
│   ├── inventory/          # vehículos y repuestos (tablas, formularios, filtros, movimientos, archivos)
│   ├── layout/             # AppLayout (sidebar), PageHeader
│   ├── notificaciones/      # NotificacionesTable, NotificacionDetalleDialog, NotificacionesRecurso (HU12)
│   ├── pruebasManejo/      # PruebaManejoFormDialog, PruebasManejoTable, PruebaManejoDetalleDialog (HU11)
│   ├── reservas/           # ReservaFormDialog, ReservasTable, ReservaDetalleDialog (HU09)
│   ├── ventas/             # VentaFormDialog, VentasTable, VentaDetalleDialog (HU10)
│   ├── ui/                 # Primitivos shadcn/ui (button, input, textarea, card, table, ...)
│   ├── users/              # UsersTable, UserFormDialog
│   └── ProtectedRoute.tsx  # Guardas de sesión/rol
├── context/AuthContext.tsx # Estado de sesión
├── hooks/                  # useUsuarios, useVehiculos, useCatalogo, useRepuestos, useMovimientos, useClientesComerciales, useCotizaciones, useReservas, useVentas, usePruebasManejo, useNotificaciones, useCitasTaller, useMecanicos
├── lib/                    # api, amplify, brand, roles, vehiculos, catalogo, archivos, cotizaciones, cotizacionPdf, consultaEmail, reservas, ventas, ventaPdf, pruebasManejo, notificaciones, citasTaller, utils
├── pages/                  # LoginPage, DashboardPage, InventoryPage, CatalogoPage, VehiculoDetallePage, pruebasManejo/PruebasManejoPage, notificaciones/NotificacionesPage, citasTaller/CitasTallerPage, ...
├── services/               # usuarios, vehiculos, catalogo, repuestos, movimientos, clientesComerciales, cotizaciones, reservas, ventas, pruebasManejo, notificaciones, citasTaller (llamadas a la API)
└── types/                  # usuario, vehiculo, repuesto, clienteComercial, cotizacion, reserva, venta, pruebaManejo, notificacion, citaTaller
```

### Flujo de datos

```text
Página (page) → hook (estado) → service (HTTP) → lib/api → backend
      ↑                              ↓
  componentes de UI            types (tipos compartidos)
```

- Las **páginas** orquestan el hook y renderizan componentes.
- Los **hooks** manejan estado, carga, error y llamadas al service.
- Los **services** encapsulan los endpoints (`apiRequest`).
- Los **tipos** (`src/types`) describen el contrato con el backend.

## Sistema de diseño (marca BMW)

### Paleta

Definida en `tailwind.config.ts` (extend.colors):

| Token | Valor | Uso |
| --- | --- | --- |
| `brand-blue` | `#1d6fd8` | Color primario (botones, foco) |
| `brand-blue-electric` | `#3b8bff` | Acento/indicador activo |
| `brand-blue-dark` | `#0a4c93` | Gradientes |
| `brand-blue-deep` | `#0b3b73` | Gradientes, sidebar |
| `brand-blue-night` | `#071a33` | Fondo oscuro, sidebar |
| `brand-blue-ink` | `#040d1c` | Overlays |
| `brand-blue-ice` | `#e8f1ff` | Fondos suaves |
| `m-blue` / `m-darkblue` / `m-red` | `#0066b1` / `#16588e` / `#e31e24` | Franja del emblema M |

Los colores semánticos (`primary`, `background`, `muted`, `destructive`, ...) usan
variables CSS (HSL) en `src/index.css`, con variantes clara y `.dark`.

### Utilidades y tokens clave

- `surface-card`: tarjeta estándar (borde suave + `shadow-card` + `rounded-2xl`).
- `glass`: superficie translúcida con `backdrop-blur` (barras flotantes).
- `text-gradient`: texto con degradado BMW.
- Fondos: `bg-bmw-mesh` (malla de degradados), `bg-sidebar-grid bg-grid` (cuadrícula),
  `bg-m-gradient` (franja M en degradado).
- Sombras: `shadow-card`, `shadow-panel`, `shadow-glow`, `shadow-inset`.
- Animaciones: `animate-fade-in`, `animate-slide-up`, `animate-panel-in`, `animate-float`.
- Tipografía: Inter (definida en el `fontFamily`).

### Componentes de marca

- `BmwRoundel`: logotipo redondo BMW en SVG (acepta `className` y `title`).
- `MStripe`: franja tricolor del emblema M.

### Layout

- `AppLayout`: estructura posterior al login. **Barra lateral** (escritorio) con
  degradado azul BMW, cuadrícula, navegación con indicador activo y tarjeta de usuario;
  en móvil se convierte en cabecera `glass` + cajón deslizante. Expone el área de
  contenido vía `<Outlet />`.
- `PageHeader`: encabezado de página (eyebrow con franja M, título, descripción,
  acciones).

### Primitivos UI (shadcn/ui)

En `src/components/ui`. **Reutilízalos** en vez de crear estilos ad hoc:
`button`, `input`, `textarea`, `label`, `card`, `table`, `dialog`, `select`, `badge`,
`alert`, `sonner` (toasts). Están alineados a la marca (p. ej. el botón por defecto usa
degradado BMW).

## Convenciones de componentes

- Componentes de función con `export function Nombre(...)` (PascalCase).
- Un componente por archivo, en la carpeta del dominio correspondiente.
- Props tipadas con `interface NombreProps`.
- Estilos con clases Tailwind y el helper `cn()` (`@/lib/utils`) para condicionales.
- Sin comentarios salvo que aporten valor; el estilo del proyecto evita comentarios
  innecesarios.
- Textos de UI en español.
- Iconos de `lucide-react`.

## Autenticación y roles

- `lib/amplify.ts`: configura Amplify (`configureAmplify()` se llama en `main.tsx`).
- `context/AuthContext.tsx`: provee `{ user, status, login, logout }`. Carga el perfil
  real desde el backend (`/api/auth/session`) y bloquea usuarios inactivos.
- `lib/roles.ts`: `UserRole`, `STAFF_ROLES`, `normalizeRoles`, `primaryRole`
  (roles: `admin`, `vendedor`, `jefe_taller`, `mecanico`, `cliente`).
- `components/ProtectedRoute.tsx`: exige sesión y, opcionalmente, roles.
- `App.tsx`: define el enrutado. Las rutas protegidas viven dentro de `<AppLayout />`;
  `/inventario` y `/repuestos` bajo `ProtectedRoute roles={STAFF_ROLES}` (no accesibles
  para clientes) y `/usuarios` bajo `ProtectedRoute roles={['admin']}`. El **catálogo web**
  (`/catalogo` y `/catalogo/:vehiculoId`) usa `CatalogoShell`: es **público** y siempre
  accesible, pero mantiene la barra lateral si hay sesión y, si no, muestra el diseño
  público (`CatalogoLayout`) con el botón de iniciar sesión.
- `components/auth/LoginPage` alterna entre `LoginForm` y `RegisterClienteForm`
  (autorregistro de clientes) mediante el estado `mode`.

## Catálogo web (HU05)

- Público y responsive: `components/catalog/` (`CatalogoLayout`, `CatalogoCard`,
  `CatalogoFiltros`, `VehiculoGaleria`) y `pages/CatalogoPage` / `pages/VehiculoDetallePage`.
- Datos: `services/catalogo.ts` (`catalogoService.list/get`) + `hooks/useCatalogo.ts`;
  filtrado por palabra clave, tipo, condición, año y precio en `lib/catalogo.ts`.
- Se alimenta del mismo inventario; solo se muestran los vehículos `publicado !== false`.

## Gestión de archivos (HU06)

- `lib/archivos.ts`: reglas de formatos/tamaños por categoría (`REGLAS_ARCHIVO`),
  `formatBytes` y `validarArchivo(file, categoria)` (validación previa en el cliente).
- `PhotoUploader` (fotos) y `DocumentosUploader` (documentos autorizados) suben
  directamente a S3 con URLs prefirmadas y muestran los errores con `toast`.
- El **catálogo público** nunca expone documentos: solo la proyección pública (HU05).
- Los documentos ya guardados incluyen `url` prefirmada de lectura (botón «Ver»).

## Seguimiento comercial (HU07)

- `pages/clientesComerciales/` (listado + detalle) + `ClienteComercialFormDialog`.
- Datos: `services/clientesComerciales.ts` + `hooks/useClientesComerciales.ts`.
- **Correo**: al registrar una consulta en la ficha del cliente, `lib/consultaEmail.ts` arma
  un enlace `mailto:` con la confirmación redactada y abre el gestor de correo (la notificación
  se puede desactivar con la casilla del formulario). Igual que HU08, evita AWS SES.

## Cotizaciones (HU08)

- `pages/cotizaciones/CotizacionesPage` + `components/cotizaciones/` (`CotizacionFormDialog`,
  `CotizacionesTable`, `CotizacionDetalleDialog`).
- Datos: `services/cotizaciones.ts` + `hooks/useCotizaciones.ts`; se alimenta del inventario
  (`useVehiculos`) y de los clientes (`useClientesComerciales`). Solo se ofrecen vehículos
  `disponible`/`reservado`.
- **PDF**: `lib/cotizacionPdf.ts` genera el documento con **jsPDF** (dependencia del
  frontend, sin costo en AWS) y lo descarga como `Cotizacion-<numero>.pdf`.
- **Correo (HU08 + HU12)**: el botón «Enviar por correo» llama a
  `notificacionesService.enviarCotizacion` (`POST .../enviar-correo`), que registra el
  intento en el backend y devuelve el enlace `mailto:` con el mensaje redactado; el
  frontend descarga el PDF y abre el gestor de correo del usuario (el usuario adjunta
  el PDF). Evita AWS SES para no salir de la capa gratuita.
- `lib/cotizaciones.ts`: estados, etiquetas/estilos y `calcularImportes`
  (descuento máximo 20%, espejo del backend).

## Reservas de vehículos (HU09)

- `pages/reservas/ReservasPage` + `components/reservas/` (`ReservaFormDialog`,
  `ReservasTable`, `ReservaDetalleDialog`).
- Datos: `services/reservas.ts` + `hooks/useReservas.ts`; se alimenta del inventario
  (`useVehiculos`) y de los clientes (`useClientesComerciales`). Solo se ofrecen vehículos
  `disponible`.
- `ReservaDetalleDialog`: muestra el snapshot del cliente/vehículo, condiciones, historial de
  estados y permite **cancelar** (libera la unidad) o **convertir en venta** (deja el vehículo
  como `vendido`).
- `lib/reservas.ts`: estados (`activa`/`cancelada`/`vencida`/`convertida`), etiquetas/estilos,
  `puedeGestionarse` y la vigencia por defecto/máxima (espejo del backend).
- La ficha del cliente (`ClienteComercialDetallePage`) incluye además una tarjeta con sus reservas.

## Ventas de vehículos (HU10)

- `pages/ventas/VentasPage` + `components/ventas/` (`VentaFormDialog`, `VentasTable`,
  `VentaDetalleDialog`).
- Datos: `services/ventas.ts` + `hooks/useVentas.ts`; se alimenta del inventario
  (`useVehiculos`) y de los clientes (`useClientesComerciales`). Solo se ofrecen vehículos
  `disponible` o `reservado` (`esVendible` en `lib/ventas.ts`).
- `VentaFormDialog`: selecciona cliente, vehículo, descuento autorizado (≤ 20%) y
  observaciones; muestra un resumen con `precioLista`, `descuentoMonto` y `precioFinal`.
- `VentaDetalleDialog`: snapshot del cliente/vehículo, importes, autor de la operación y
  **descarga del comprobante** en PDF.
- `lib/ventas.ts`: `DESCUENTO_MAXIMO`, `calcularImportes`, `esVendible` y
  `etiquetaEstadoVehiculo` (espejo del backend).
- `lib/ventaPdf.ts`: comprobante `Comprobante-<numero>.pdf` con **jsPDF** (sin costo en AWS).
- La ficha del cliente (`ClienteComercialDetallePage`) incluye además una tarjeta con sus ventas
  y acceso directo al comprobante.

## Pruebas de manejo (HU11)

- `pages/pruebasManejo/PruebasManejoPage` + `components/pruebasManejo/`
  (`PruebaManejoFormDialog`, `PruebasManejoTable`, `PruebaManejoDetalleDialog`).
  Ruta `/pruebas-man` (admin/vendedor, ítem «Pruebas» en la navegación).
- Datos: `services/pruebasManejo.ts` + `hooks/usePruebasManejo.ts` (listado ordenado por
  fecha, filtros `clienteId`/`vehiculoId`/`estado` y acciones `crear`/`confirmar`/
  `reprogramar`/`cancelar`/`realizar`).
- `PruebaManejoFormDialog` es reutilizable en tres contextos: **catálogo público**
  (vehículo fijo, solicitud con `publicRequest`), **ficha del cliente** (cliente fijo,
  vinculada automáticamente) y **gestión interna** (selector de vehículo + cliente opcional).
  Filtra vehículos con `esVehiculoParaPrueba` (`disponible`/`reservado`, no dados de baja).
- **Solicitud pública**: `VehiculoDetallePage` muestra el botón «Solicitar prueba de manejo»
  cuando el vehículo es elegible; usa `pruebasManejoService.solicitar` (`publicRequest` sin token).
- `PruebaManejoDetalleDialog`: snapshot del contacto/vehículo, agenda (`fechaHora` +
  duración), historial de estados y las acciones según estado (confirmar, marcar realizada,
  reprogramar con nueva fecha/hora, cancelar con motivo).
- `lib/pruebasManejo.ts`: estados y etiquetas/estilos, `ORIGEN_PRUEBA_LABELS`, horario de
  atención (08:00–18:00), paso de 15 min, duración 15–180 (espejo del backend),
  `esVehiculoParaPrueba`, `puedeConfirmarse`/`puedeReprogramarse`/`puedeCancelarse`/
  `puedeRealizarse` y helpers de `datetime-local` (`fechaHoraPorDefecto`, `validarFechaPrueba`,
  `aValorLocal`).
- La ficha del cliente (`ClienteComercialDetallePage`) incluye una tarjeta con sus pruebas
  y el botón «Nueva solicitud».

## Notificaciones por correo (HU12)

- `pages/notificaciones/NotificacionesPage` + `components/notificaciones/`
  (`NotificacionesTable`, `NotificacionDetalleDialog`, `NotificacionesRecurso`).
  Ruta `/notificaciones` (admin/vendedor, ítem «Correos» en la navegación).
- Datos: `services/notificaciones.ts` + `hooks/useNotificaciones.ts` (filtros
  `tipo`/`estado`/`recursoId`, `enviar(eventoId)` que devuelve el enlace `mailto:`).
- `lib/notificaciones.ts`: tipos/estados con etiquetas y estilos, etiquetas de eventos
  (`EVENTO_NOTIFICACION_LABELS`) y `abrirMailto`.
- `NotificacionesRecurso`: sección compacta reutilizable que muestra los correos de una
  operación; se inserta en los diálogos de detalle de cotización, reserva, prueba de
  manejo y venta, con botón «Enviar» para notificaciones pendientes/intentadas.
- El transporte es `mailto:` (decisión de diseño sin SES, ver `Rules/aws.md`): el backend
  redacta el mensaje, registra el intento (máx. 5, anti-duplicados) y el frontend abre el
  cliente de correo del usuario.

## Citas del taller (HU13) y asignación de trabajos a mecánicos (HU14)

- `pages/citasTaller/CitasTallerPage` + `components/citasTaller/` (`CitasTallerTable`,
  `CitaTallerFormDialog`, `CitaTallerDetalleDialog`).
  Ruta `/citas` bajo `<ProtectedRoute roles={['admin', 'jefe_taller', 'mecanico']}>`
  (ítem «Taller» en la navegación, icono `Wrench`, en `components/layout/AppLayout.tsx`,
  con los mismos roles).
- Datos: `services/citasTaller.ts` (`citasTallerService.list/get/create/confirmar/
  reprogramar/iniciar/finalizar/cancelar/asignar` + `listMecanicos`) +
  `hooks/useCitasTaller.ts` (filtros `clienteId`/`vehiculoId`/`estado`/`fechaDesde`/
  `fechaHasta`/`mecanicoId` y acción `asignar`) y `hooks/useMecanicos.ts` (HU14:
  mecánicos activos para asignar, `GET /api/usuarios/mecanicos`).
- `CitaTallerFormDialog`: selecciona vehículo, cliente comercial, tipo de servicio y
  fecha/hora; valida con `validarFechaCita` (fecha futura, 08:00–18:00, pasos de 15 min
  y duración 15–480, espejo del backend).
- `CitaTallerDetalleDialog`: snapshot del vehículo/cliente, agenda (`fechaHora` +
  duración), historial de estados, las acciones según estado, la tarjeta del
  **mecánico asignado** con su historial de asignaciones, la sección **«Asignar/
  Reasignar mecánico»** (selector de mecánicos activos, HU14) y la sección
  **`NotificacionesRecurso`** con los correos del evento.
- `CitasTallerTable` incluye la columna **Mecánico**; `CitasTallerPage` carga los
  mecánicos (`useMecanicos`), ofrece un **filtro por mecánico** y pasa `onAsignar`
  al diálogo de detalle.
- `types/citaTaller.ts` ampliado con `CitaMecanico`, `CitaAsignacion`, `Mecanico` y
  `AsignarCitaInput` (HU14).
- `lib/citasTaller.ts`: `ESTADOS_CITA` con etiquetas/estilos
  (`solicitada`/`confirmada`/`en_atencion`/`finalizada`/`cancelada`),
  `TIPOS_SERVICIO` labels, horario de atención (08:00–18:00, paso 15 min), guards
  `puedeConfirmarse`/`puedeReprogramarse`/`puedeCancelarse`/`puedeIniciarse`/
  `puedeFinalizarse` y `validarFechaCita` (espejo del backend); para HU14:
  `ESTADOS_ASIGNABLES` (`confirmada`/`en_atencion`), `puedeAsignarseMecanico`,
  `etiquetaAsignacion` y `TIPO_ASIGNACION_LABELS` (`asignada`/`reasignada`).
- `lib/notificaciones.ts` y `types/notificacion.ts` ampliados con el tipo
  `cita_taller` y las etiquetas de eventos `cita_*` («Cita solicitada», «Cita
  confirmada», «Cita reprogramada», «Cita cancelada», «Cita finalizada», «Cita
  asignada», «Cita reasignada»).

## Acceso a la API

- `lib/api.ts`: `apiRequest<T>()` adjunta el ID token de Cognito y normaliza errores
  como `ApiError`. `publicRequest<T>()` es para endpoints públicos (catálogo, autorregistro).
  Helpers: `getErrorMessage`, `getFieldErrors`, `getSessionProfile`.
- `services/*.ts`: un objeto con funciones por endpoint (p. ej. `usuariosService.list`).
- `hooks/*`: estado (`loading`, `error`) + acciones; exponen operaciones listas para la UI.
- Subida de archivos: `services/vehiculos.ts` pide una URL prefirmada
  (`/api/vehiculos/archivos/presign`) y hace `PUT` directo a S3 (< 5 MB fotos, ≤ 10 MB documentos).

## Formularios

- React Hook Form + `zodResolver`.
- Esquemas Zod espejo de la validación del backend.
- Errores de servidor por campo: `getFieldErrors(error)` + `setError`.
- Feedback al usuario con `toast` (`sonner`).

## Cómo agregar una página/feature (paso a paso)

1. **Tipos** en `src/types/`.
2. **Service** en `src/services/` con las llamadas a la API.
3. **Hook** en `src/hooks/` (estado + carga + acciones).
4. **Componentes** en la carpeta de dominio (`components/...`) usando primitivos `ui/`.
5. **Página** en `src/pages/` con `PageHeader` y la composición.
6. **Ruta** en `App.tsx` (con `ProtectedRoute` y dentro de `AppLayout` si requiere sesión).
7. **Navegación**: agrega el ítem en `NAV_ITEMS` de `components/layout/AppLayout.tsx`
   (con `roles` si aplica).

## Variables de entorno

Ver `frontend/.env.example`:

| Variable | Descripción |
| --- | --- |
| `VITE_AWS_REGION` | Región AWS |
| `VITE_USER_POOL_ID` | ID del User Pool de Cognito |
| `VITE_USER_POOL_CLIENT_ID` | ID del App Client de Cognito |
| `VITE_API_URL` | URL base del backend (por defecto `http://localhost:3000`) |

## Comandos

```bash
cd frontend
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # tsc -b && vite build (verificación obligatoria)
npm run typecheck  # tsc --noEmit
```

> Nota: el script `npm run lint` existe pero **ESLint no está instalado** todavía.

## Reglas al modificar el frontend

- Usa los tokens de marca y los primitivos `ui/`; no introduzcas colores ni estilos
  fuera del sistema.
- No llames a `fetch` directamente en componentes: usa `services/` y `lib/api.ts`.
- No dupliques tipos: viven en `src/types`.
- Mantén la responsividad (móvil primero) y la accesibilidad.
- Verifica siempre con `npm run build` antes de terminar.
