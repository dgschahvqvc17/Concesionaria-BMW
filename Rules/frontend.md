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
│   ├── auth/               # LoginForm, AuthBrandPanel
│   ├── brand/              # BmwRoundel, MStripe
│   ├── common/             # ConfirmDialog
│   ├── dashboard/          # InfoTile
│   ├── inventory/          # InventarioFiltros, VehiculosTable, VehiculoFormDialog, PhotoUploader
│   ├── layout/             # AppLayout (sidebar), PageHeader
│   ├── ui/                 # Primitivos shadcn/ui (button, input, card, table, ...)
│   ├── users/              # UsersTable, UserFormDialog
│   └── ProtectedRoute.tsx  # Guardas de sesión/rol
├── context/AuthContext.tsx # Estado de sesión
├── hooks/                  # useUsuarios, useVehiculos
├── lib/                    # api, amplify, brand, roles, vehiculos, cognito-errors, utils
├── pages/                  # LoginPage, DashboardPage, InventoryPage, UsersPage, UnauthorizedPage
├── services/               # usuarios, vehiculos (llamadas a la API)
└── types/                  # usuario, vehiculo
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
`button`, `input`, `label`, `card`, `table`, `dialog`, `select`, `badge`, `alert`,
`sonner` (toasts). Están alineados a la marca (p. ej. el botón por defecto usa
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
- `lib/roles.ts`: `UserRole`, `normalizeRoles`, `primaryRole`
  (roles: `admin`, `vendedor`, `jefe_taller`, `mecanico`).
- `components/ProtectedRoute.tsx`: exige sesión y, opcionalmente, roles.
- `App.tsx`: define el enrutado. Las rutas protegidas viven dentro de `<AppLayout />`;
  `/usuarios` está anidada bajo `ProtectedRoute roles={['admin']}`.

## Acceso a la API

- `lib/api.ts`: `apiRequest<T>()` adjunta el ID token de Cognito y normaliza errores
  como `ApiError`. Helpers: `getErrorMessage`, `getFieldErrors`, `getSessionProfile`.
- `services/*.ts`: un objeto con funciones por endpoint (p. ej. `usuariosService.list`).
- `hooks/*`: estado (`loading`, `error`) + acciones; exponen operaciones listas para la UI.
- Subida de fotos: `services/vehiculos.ts` pide una URL prefirmada
  (`/api/vehiculos/fotos/presign`) y hace `PUT` directo a S3.

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
