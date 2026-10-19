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
│   ├── clientesComerciales/ # ClienteComercialFormDialog (HU07)
│   ├── common/             # ConfirmDialog
│   ├── cotizaciones/       # CotizacionFormDialog, CotizacionesTable, CotizacionDetalleDialog (HU08)
│   ├── dashboard/          # InfoTile
│   ├── inventory/          # vehículos y repuestos (tablas, formularios, filtros, movimientos, archivos)
│   ├── layout/             # AppLayout (sidebar), PageHeader
│   ├── reservas/           # ReservaFormDialog, ReservasTable, ReservaDetalleDialog (HU09)
│   ├── ui/                 # Primitivos shadcn/ui (button, input, textarea, card, table, ...)
│   ├── users/              # UsersTable, UserFormDialog
│   └── ProtectedRoute.tsx  # Guardas de sesión/rol
├── context/AuthContext.tsx # Estado de sesión
├── hooks/                  # useUsuarios, useVehiculos, useCatalogo, useRepuestos, useMovimientos, useClientesComerciales, useCotizaciones, useReservas
├── lib/                    # api, amplify, brand, roles, vehiculos, catalogo, archivos, cotizaciones, cotizacionPdf, cotizacionEmail, consultaEmail, reservas, utils
├── pages/                  # LoginPage, DashboardPage, InventoryPage, CatalogoPage, VehiculoDetallePage, ...
├── services/               # usuarios, vehiculos, catalogo, repuestos, movimientos, clientesComerciales, cotizaciones, reservas (llamadas a la API)
└── types/                  # usuario, vehiculo, repuesto, clienteComercial, cotizacion, reserva
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
- **Correo**: `lib/cotizacionEmail.ts` arma un enlace `mailto:` con destinatario, asunto y
  cuerpo redactados (el usuario adjunta el PDF). Evita AWS SES para no salir de la capa
  gratuita.
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
