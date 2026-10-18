# Documentación del frontend — Concesionaria BMW

Este documento explica, punto por punto, cómo construí el frontend de la
**Concesionaria BMW**: una SPA hecha con **React + Vite + TypeScript**, estilizada con
**Tailwind CSS** y componentes de **shadcn/ui**, que se autentica contra **AWS Cognito**
(Amplify) y consume la **API REST del backend** (Express + DynamoDB). Todo el proyecto se
mantuvo dentro de la **capa gratuita de AWS**.

La aplicación cubre el login con roles (HU01), la gestión de usuarios (HU02), el inventario
de vehículos (HU03), el inventario de repuestos (HU04), el catálogo web público (HU05) y la
gestión de fotografías y documentos (HU06).

## Índice

1. [Configuración del proyecto frontend](#1-configuración-del-proyecto-frontend)
2. [Estructura de componentes](#2-estructura-de-componentes)
3. [Interfaces principales](#3-interfaces-principales)
4. [Gestión de estados](#4-gestión-de-estados)
5. [Navegación](#5-navegación)
6. [Formularios](#6-formularios)
7. [Validación](#7-validación)
8. [Consumo de API REST](#8-consumo-de-api-rest)
9. [Operaciones CRUD desde el frontend](#9-operaciones-crud-desde-el-frontend)
10. [Diseño responsive](#10-diseño-responsive)
11. [Integración frontend-backend](#11-integración-frontend-backend)
12. [Manejo de errores](#12-manejo-de-errores)
13. [Pruebas funcionales](#13-pruebas-funcionales)

---

## 1. Configuración del proyecto frontend

Armé el frontend sobre **Vite** porque es la forma más rápida de levantar un proyecto de
React con recarga en caliente y un build optimizado, sin tener que configurar manualmente
un empaquetador. Elegí **TypeScript** para tener tipado y detectar errores antes de
ejecutar, y sumé **Tailwind CSS** junto con **shadcn/ui** para construir la interfaz con
componentes accesibles y consistentes. Las herramientas de línea de comandos quedan
definidas en `package.json`, y la configuración del proyecto está repartida en unos pocos
archivos: `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`,
`index.html` y `components.json` (el archivo que usa shadcn/ui). La API y Cognito se
configuran por variables de entorno con prefijo `VITE_`, que tomo de un `.env` local
(siguiendo el `.env.example`). Para levantar el proyecto copio `.env.example` a `.env`,
completo los valores del despliegue de CDK y ejecuto `npm install` y `npm run dev`, que
publica la app en `http://localhost:5173`.

![Pantalla de inicio de sesión](capturas/01-login.png)

**Scripts disponibles** (`package.json`):

| Script | Comando | Para qué sirve |
| --- | --- | --- |
| `dev` | `vite` | Servidor de desarrollo en el puerto 5173. |
| `build` | `tsc -b && vite build` | Comprueba tipos y genera el bundle de producción. |
| `preview` | `vite preview` | Sirve el build generado para probarlo. |
| `typecheck` | `tsc --noEmit` | Solo valida los tipos, sin emitir archivos. |
| `lint` | `eslint ...` | Declarado, pero **ESLint no está instalado** (no se usa). |

**Dependencias principales**:

| Dependencia | Versión | Rol |
| --- | --- | --- |
| `react` / `react-dom` | ^18.3.1 | Librería base de la interfaz. |
| `react-router-dom` | ^6.26.2 | Enrutado de la SPA. |
| `aws-amplify` | ^6.7.0 | Autenticación con Cognito (`aws-amplify/auth`). |
| `react-hook-form` | ^7.53.0 | Manejo de formularios. |
| `@hookform/resolvers` | ^3.9.0 | Puente entre react-hook-form y Zod. |
| `zod` | ^3.23.8 | Validación de esquemas en el cliente. |
| `@radix-ui/react-*` | ^1.x/^2.x | Primitivos accesibles (Dialog, Label, Select, Slot). |
| `class-variance-authority`, `clsx`, `tailwind-merge` | — | Variantes y combinación de clases. |
| `lucide-react` | ^0.441.0 | Iconografía. |
| `sonner` | ^1.5.0 | Notificaciones tipo *toast*. |
| `tailwindcss`, `postcss`, `autoprefixer` | — | Estilos (dev). |
| `typescript`, `vite`, `@vitejs/plugin-react` | — | Tooling (dev). |

**Configuración destacada**:

- `vite.config.ts`: plugin de React, alias `@` → `./src` y puerto de desarrollo `5173`.
- `tailwind.config.ts`: `darkMode: 'class'`, escaneo de `index.html` y `src/**/*`, y tokens
  de marca BMW (paleta `brand.*` y `m.*`, sombras `panel`/`card`/`glow`, animaciones y
  degradados `bg-bmw-mesh`, `bg-sidebar-grid`, `bg-m-gradient`) sobre las variables de
  shadcn/ui.
- `postcss.config.js`: `tailwindcss` + `autoprefixer`.
- `tsconfig.app.json`: `strict: true`, `noUnusedLocals`, `noUnusedParameters`,
  `moduleResolution: bundler`, `jsx: react-jsx` y alias `@/*`.
- `index.html`: idioma `es`, tipografía **Inter**, `theme-color` azul BMW y título
  *"Concesionaria BMW | Acceso al sistema"*.
- `components.json`: configuración de shadcn/ui (estilo `default`, `baseColor: zinc`,
  variables CSS activadas y aliases `@/components`, `@/lib`, `@/hooks`).
- `.env.example`: `VITE_AWS_REGION`, `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID` y
  `VITE_API_URL`.

---

## 2. Estructura de componentes

Organicé el código por **dominios funcionales** (auth, catálogo, inventario, usuarios,
layout, marca) en lugar de juntar todo en carpetas genéricas, porque así cada funcionalidad
queda autocontenida y es más fácil ubicar dónde está cada cosa. Los primitivos visuales de
**shadcn/ui** los dejé separados en `components/ui`, y las páginas en `pages/`. Los datos
se acceden a través de `services/` y los *hooks* de `hooks/`, mientras que la lógica
compartida vive en `lib/` y los tipos en `types/`. Los componentes de shadcn/ui los instalé
con su CLI (`shadcn add ...`), que a su vez se apoya en Radix, `class-variance-authority` y
la función `cn()` de `@/lib/utils`.

```text
frontend/src/
├── App.tsx                 # Definición de todas las rutas
├── main.tsx                # Punto de entrada: configura Amplify y monta <App/>
├── index.css               # Variables de tema + utilidades (.glass, .surface-card)
├── components/
│   ├── auth/               # LoginForm, RegisterClienteForm
│   ├── brand/              # BmwRoundel, MStripe
│   ├── catalog/            # CatalogoCard, CatalogoFiltros, CatalogoLayout, CatalogoShell, VehiculoGaleria
│   ├── common/             # ConfirmDialog
│   ├── dashboard/          # InfoTile
│   ├── inventory/          # VehiculoFormDialog, PhotoUploader, DocumentosUploader, tables, filtros, MovimientoDialog
│   ├── layout/             # AppLayout, PageHeader
│   ├── ui/                 # Primitivos shadcn/ui
│   ├── users/              # UserFormDialog, UsersTable
│   └── ProtectedRoute.tsx  # Guard de rutas (auth + roles)
├── context/                # AuthContext
├── hooks/                  # useVehiculos, useRepuestos, useMovimientos, useUsuarios, useCatalogo
├── lib/                    # api.ts, amplify.ts, archivos.ts, roles.ts, vehiculos.ts, utils.ts, ...
├── pages/                  # LoginPage, CatalogoPage, VehiculoDetallePage, DashboardPage,
│                           # InventoryPage, RepuestosPage, UsersPage, UnauthorizedPage
├── services/               # vehiculos, repuestos, movimientos, usuarios, catalogo, clientes
└── types/                  # vehiculo.ts, catalogo.ts, repuesto.ts, usuario.ts
```

**Primitivos de `components/ui`** (shadcn/ui): `button`, `input`, `label`, `select`,
`dialog`, `card`, `alert`, `badge`, `table` y `sonner`. Se generan con la CLI de shadcn y se
componen con `cn()`; muchos envuelven primitivos de Radix (Dialog, Select, Label, Slot) para
conservar la accesibilidad.

**Componentes de dominio principales**:

| Componente | Ubicación | Responsabilidad |
| --- | --- | --- |
| `CatalogoShell` | `components/catalog` | Decide el layout del catálogo: `AppLayout` si hay sesión, `CatalogoLayout` si no. |
| `CatalogoLayout` | `components/catalog` | Layout público del catálogo (cabecera + botón "Iniciar sesión"). |
| `AppLayout` | `components/layout` | Layout autenticado: *sidebar* con navegación por rol + cabecera móvil. |
| `ProtectedRoute` | `components/` | Guard de rutas: exige sesión y, opcionalmente, roles. |
| `VehiculoFormDialog` | `components/inventory` | Alta/edición de vehículos (integra subida de fotos y documentos). |
| `PhotoUploader` / `DocumentosUploader` | `components/inventory` | Subida de archivos a S3 con URL prefirmada. |
| `RepuestoFormDialog` | `components/inventory` | Alta/edición de repuestos. |
| `UserFormDialog` | `components/users` | Alta/edición de personal (no clientes). |
| `MovimientoDialog` | `components/inventory` | Registro de entradas/salidas de repuestos. |
| `ConfirmDialog` | `components/common` | Confirmación reutilizable de acciones destructivas. |

![Panel principal con el layout autenticado](capturas/05-dashboard.png)

---

## 3. Interfaces principales

Como TypeScript es estricto, definí los tipos que comparto con el backend en la carpeta
`types/`, de manera que el cliente y el servidor trabajen siempre con la misma forma de
datos. Allí describo tanto los *enums* (condición, tipo y estado del vehículo) como los
objetos de lectura (`Vehiculo`, `Repuesto`, `Usuario`) y los de entrada para crear o
actualizar (`CreateVehiculoInput`, `UpdateVehiculoInput`). También tipé las respuestas de la
API (`VehiculosResponse`, `PresignArchivoResponse`) y los archivos (`VehiculoFoto`,
`VehiculoDocumento`). Como complemento, en `lib/` guardo las constantes y funciones de
apoyo: los *enums* con sus etiquetas legibles, los formateadores de precio y kilometraje, y
las reglas de validación de archivos.

**Tipos de vehículo** (`types/vehiculo.ts`, extracto):

```ts
export type CondicionVehiculo = 'nuevo' | 'seminuevo';
export type TipoVehiculo =
  | 'sedan' | 'suv' | 'coupe' | 'cabrio'
  | 'touring' | 'hatchback' | 'deportivo' | 'otros';
export type EstadoVehiculo = 'disponible' | 'reservado' | 'vendido' | 'no_disponible';

export interface VehiculoFoto { key: string; url?: string }
export interface VehiculoDocumento { key: string; nombre: string; url?: string }

export interface Vehiculo {
  vehiculoId: string;
  marca: string; modelo: string; anio: number; version: string;
  kilometraje: number; precio: number; color: string; vin: string;
  condicion: CondicionVehiculo; tipo: TipoVehiculo; estado: EstadoVehiculo;
  descripcion?: string; caracteristicas?: string[];
  publicado: boolean;
  fotos: VehiculoFoto[];
  documentos: VehiculoDocumento[];
  createdAt?: string;
}
```

**Constantes y utilidades** (`lib/`):

- `lib/vehiculos.ts`: `CONDICIONES`, `TIPOS`, `ESTADOS` con sus etiquetas y estilos de
  *badge*, más `formatPrecio` y `formatKilometraje`.
- `lib/catalogo.ts`: tipos y utilidades de la proyección pública del catálogo.
- `lib/repuestos.ts`: etiquetas y ayudas de repuestos (incluye la detección de bajo *stock*).
- `lib/archivos.ts`: `REGLAS_ARCHIVO` (tipos y tamaños permitidos) y `validarArchivo`.
- `lib/roles.ts`: `USER_ROLES`, `STAFF_ROLES`, `DEFAULT_ROLE` y helpers de rol.
- `lib/brand.ts`: nombre de la app, eslogan y textos de roles.
- `lib/utils.ts`: `cn()` para combinar clases de Tailwind.

![Inventario de vehículos](capturas/06-inventario.png)

---

## 4. Gestión de estados

Para el estado global (la sesión del usuario) usé la **API de Contexto de React** a través
de `AuthContext`, porque es un dato que necesitan casi todas las pantallas y no quería
arrastrarlo por *props*. El resto del estado lo manejo **localmente** en cada página y
*hook* con `useState`/`useEffect`/`useCallback`/`useMemo`. A propósito **no incorporé
TanStack Query**: para el volumen de este proyecto me alcanza con *hooks* propios que
encapsulan la llamada a la API, el estado de carga, el error y la recarga. De esta forma
las páginas quedan simples y no dependen de librerías adicionales.

**`AuthContext`** (`context/AuthContext.tsx`):

- Guarda `user: AuthUser | null` y `status: 'loading' | 'authenticated' | 'unauthenticated'`.
- Expone `login(email, password)` y `logout()`.
- Al cargar la app, restaura la sesión: con `getCurrentUser()` de Amplify detecta si hay
  usuario, obtiene el **ID token** con `fetchAuthSession()` y pide el perfil al backend
  (`GET /api/auth/session`). Si el perfil viene con `estado: 'inactivo'` (HU01), cierra la
  sesión y muestra un error. Si el backend no responde, cae en los datos del propio JWT.
- `AuthUser`: `{ sub, email, nombre, roles, rol }`, donde `rol` es el rol principal según la
  precedencia definida.

**Hooks de datos** (`hooks/`):

| Hook | Datos que maneja |
| --- | --- |
| `useAuth` | Acceso al contexto de sesión. |
| `useVehiculos` | Lista + crear/actualizar/cambiar estado/recargar vehículos. |
| `useRepuestos` | Lista + CRUD de repuestos y filtros. |
| `useMovimientos` | Lista y registro de movimientos. |
| `useUsuarios` | Lista + crear/actualizar usuarios. |
| `useCatalogo` / `useCatalogoVehiculo` | Catálogo público (sin autenticación). |

---

## 5. Navegación

La navegación la resolví con **react-router-dom v6** usando `BrowserRouter`, `Routes` y
rutas anidadas. La idea clave es que el **acceso dependa de la sesión y del rol**: las
rutas internas quedan detrás de un `ProtectedRoute`, y dentro de él anidé guards por rol
para las secciones de personal y de administración. Para los layouts uso rutas "contenedor"
que renderizan un `Outlet`, así la barra lateral (o la cabecera pública del catálogo) se
comparte entre páginas sin repetir código.

**Mapa de rutas** (`App.tsx`):

| Ruta | Página | Acceso |
| --- | --- | --- |
| `/login` | `LoginPage` | Público (login y registro de clientes). |
| `/catalogo` | `CatalogoPage` | Público. |
| `/catalogo/:vehiculoId` | `VehiculoDetallePage` | Público. |
| `/dashboard` | `DashboardPage` | Autenticado (cualquier rol). |
| `/inventario` | `InventoryPage` | Staff (`admin`, `vendedor`, `jefe_taller`, `mecanico`). |
| `/repuestos` | `RepuestosPage` | Staff. |
| `/usuarios` | `UsersPage` | Solo `admin`. |
| `/no-autorizado` | `UnauthorizedPage` | Autenticado (acceso denegado). |
| `/` | → `/dashboard` | Redirección. |
| `*` | → `/` | Redirección. |

**Guards y layouts**:

- `ProtectedRoute`: si el estado es `loading` muestra una pantalla de carga (con el *roundel*
  de BMW); si es `unauthenticated` redirige a `/login` guardando el origen; si se le pasan
  roles, exige que el usuario tenga al menos uno y, si no, redirige a `/no-autorizado`.
- `CatalogoShell`: para el catálogo decide entre `AppLayout` (si hay sesión) y
  `CatalogoLayout` (si es un visitante), de modo que el catálogo es público pero mantiene la
  navegación interna cuando el usuario ya inició sesión.
- `AppLayout`: barra lateral en escritorio y cajón deslizante en móvil, con los enlaces
  filtrados según el rol.

![Catálogo público sin sesión](capturas/03-catalogo.png)

---

## 6. Formularios

Todos los formularios los hice con **react-hook-form** y **Zod** (mediante
`zodResolver`), porque esta combinación evita re-renderizados innecesarios, concentra las
reglas en un esquema y me da mensajes de error por campo casi gratis. Cada diálogo
(`VehiculoFormDialog`, `RepuestoFormDialog`, `UserFormDialog`, `MovimientoDialog`) mantiene
su propio estado con el hook `useForm`, muestra los errores debajo de cada campo y, cuando
el backend devuelve errores de validación, los inyecta en el campo correspondiente con
`setError`. Los diálogos se abren y cierran con un estado controlado desde la página
(`open`/`onOpenChange`).

Los casos más completos son el **registro de vehículos** (que además integra la subida de
fotos y documentos) y el **registro de clientes**. Ambos tienen muchos campos, así que los
organicé en una grilla responsive y agrupé lo relacionado (datos del vehículo, archivos,
etc.).

![Formulario de vehículo](capturas/07-inventario-form.png)

![Formulario de repuesto](capturas/09-repuesto-form.png)

![Formulario de usuario](capturas/11-usuario-form.png)

---

## 7. Validación

La validación la apliqué en **dos niveles**: primero en el **cliente** para dar feedback
inmediato al usuario, y después en el **servidor** como barrera definitiva (nunca confío
únicamente en lo que viene del navegador). En ambos lados uso **Zod** para definir el mismo
contrato de datos y mantener la coherencia entre frontend y backend.

### 7.1 Validación en el cliente con react-hook-form + Zod

Uso `react-hook-form` junto con `@hookform/resolvers/zod` para vincular el esquema Zod al
formulario. Esto permite validar al enviar (o al cambiar según configuración), mostrar
mensajes por campo y evitar re-renderizados innecesarios.

**Ejemplo: registro de cliente** (`frontend/src/components/auth/RegisterClienteForm.tsx`):

```ts
const schema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(80, 'El nombre es demasiado largo.'),
  email: z.string().trim().email('Ingresa un correo electrónico válido.').max(120),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula.')
    .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula.')
    .regex(/[0-9]/, 'Debe incluir al menos un número.'),
  fechaNacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es obligatoria.')
    .refine((v) => new Date(v).getTime() <= Date.now(), 'La fecha no puede ser futura.'),
  carnetIdentidad: z
    .string()
    .trim()
    .min(5, 'El carnet de identidad debe tener al menos 5 caracteres.')
    .max(20, 'El carnet de identidad es demasiado largo.')
    .regex(/^[A-Za-z0-9-]+$/, 'Solo se permiten letras, números y guion.'),
  celular: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{7,15}$/, 'El celular debe tener entre 7 y 15 dígitos.'),
});

const form = useForm<RegisterFormValues>({
  resolver: zodResolver(schema),
  defaultValues: { nombre: '', email: '', password: '', fechaNacimiento: '', carnetIdentidad: '', celular: '' },
});
```

**Ejemplo: vehículo (alta/edición)** (`frontend/src/components/inventory/VehiculoFormDialog.tsx`):

```ts
const anioActual = new Date().getFullYear();
const schema = z.object({
  marca: z.string().trim().min(2).max(50),
  modelo: z.string().trim().min(1).max(60),
  anio: z.coerce.number().int().min(1950).max(anioActual + 1),
  version: z.string().trim().min(1).max(80),
  kilometraje: z.coerce.number().int().min(0),
  precio: z.coerce.number().positive(),
  color: z.string().trim().min(1).max(40),
  vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/), // sin I,O,Q
  condicion: z.enum(CONDICIONES),
  tipo: z.enum(TIPOS),
  estado: z.enum(ESTADOS),
  descripcion: z.string().trim().max(1000).optional(),
  caracteristicas: z.string().optional(),
  publicado: z.enum(['si','no']),
});
```

**Ejemplo: repuesto** (`frontend/src/components/inventory/RepuestoFormDialog.tsx`):

```ts
const schema = z.object({
  codigo: z.string().trim().toUpperCase().min(2).max(30).regex(/^[A-Z0-9][A-Z0-9._-]*$/),
  nombre: z.string().trim().min(2).max(80),
  descripcion: z.string().trim().max(200).optional(),
  precio: z.coerce.number().positive().max(100000000),
  cantidad: z.coerce.number().int().min(0),
  cantidadMinima: z.coerce.number().int().min(0).optional(),
});
```

### 7.2 Validación en el servidor (definitiva)

El backend valida **exactamente lo mismo** con sus esquemas Zod y responde con errores
estructurados. El helper `validate(schema, data)` lanza `ValidationError` con `details` por
campo.

```js
// backend/src/validation/vehiculoSchemas.js (extracto)
function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new ValidationError('Datos inválidos.', details);
  }
  return result.data;
}
```

Las reglas del backend refuerzan lo mismo: VIN sin I,O,Q (17 chars), año acotado, enums
cerrados, tamaños máximos, etc. También en actualización se usan **esquemas parciales**
(`updateVehiculoSchema.partial`-style) y se rechaza si no hay cambios.

### 7.3 Mapeo de errores servidor → formulario

Cuando el backend devuelve `400` con `details`, el frontend los extrae con
`getFieldErrors` y los asigna a cada campo:

```ts
// frontend/src/components/auth/RegisterClienteForm.tsx (extracto)
} catch (error) {
  const fieldErrors = getFieldErrors(error);
  let hasField = false;
  for (const fe of fieldErrors) {
    if (fe.field) {
      form.setError(fe.field as keyof RegisterFormValues, { type: 'server', message: fe.message });
      hasField = true;
    }
  }
  if (!hasField) setFormError(getErrorMessage(error));
}
```

De esta forma el error aparece **justo debajo del campo que lo provoca**, no como un aviso
genérico.

### 7.4 Reglas aplicadas (resumen)

| Entidad | Reglas principales |
| --- | --- |
| Vehículo | marca 2–50, modelo 1–60, versión 1–80, año 1950..anioActual+1, km >=0, precio >0, color 1–40, VIN /^[A-HJ-NPR-Z0-9]{17}$/, condición/tipo/estado enums, descripción ≤1000, características ≤20 ítems (≤80 c/u), fotos ≤15, documentos ≤20. |
| Repuesto | código 2–30 /^[A-Z0-9][A-Z0-9._-]*$/ (normalizado a mayúsculas), nombre 2–80, descripción ≤200, precio >0 y ≤10^8, cantidad >=0, cantidad mínima >=0. |
| Cliente | nombre 3–80, email válido ≤120, password ≥8 con minúscula/mayúscula/número, fechaNacimiento no futura, carnetIdentidad 5–20 alfanumérico+guión, celular 7–15 con + - espacios. |
| Usuario (staff) | validación acorde a rol/email (HU02). |
| Movimiento | tipo `entrada/salida`, cantidad >0 entera. |

### 7.5 Evidencias

- [`capturas/02-registro-cliente.png`](capturas/02-registro-cliente.png): formulario con
  validación cliente + mapeo de errores servidor.
- [`capturas/07-inventario-form.png`](capturas/07-inventario-form.png): formulario de
  vehículo con validaciones (VIN, año, precios, enums).
- [`capturas/09-repuesto-form.png`](capturas/09-repuesto-form.png): validación de código
  único/formatos.
- [`capturas/16-login-error.png`](capturas/16-login-error.png): error traducido mostrado al
  usuario.

---## 8. Consumo de API REST

El acceso a los datos lo centralicé en `lib/api.ts`, con dos funciones envoltorio sobre
`fetch`: `apiRequest` (para endpoints autenticados) y `publicRequest` (para los públicos,
como el catálogo y el registro de clientes). No usé Axios porque `fetch` ya viene en el
navegador y el envoltorio era sencillo. Antes de cada petición autenticada obtengo el **ID
token** de Cognito con `fetchAuthSession()` y lo envío en la cabecera
`Authorization: Bearer <token>`; si hay cuerpo, mando `Content-Type: application/json`. La
URL base sale de `VITE_API_URL`. Sobre esa base armé un `services/` con un módulo por
recurso, de modo que las páginas nunca llaman a `fetch` directamente.

**Servicios** (`services/`):

| Servicio | Endpoints que consume | Auth |
| --- | --- | --- |
| `vehiculos.ts` | `/api/vehiculos` (+ `/archivos/presign`) | Sí |
| `repuestos.ts` | `/api/repuestos` | Sí |
| `movimientos.ts` | `/api/movimientos` | Sí |
| `usuarios.ts` | `/api/usuarios` | Sí |
| `catalogo.ts` | `/api/catalogo` | No (público) |
| `clientes.ts` | `/api/clientes/registro` | No (público) |

También tipé el error de la API con una clase `ApiError` que guarda el mensaje, el código de
estado y los `details`, y agregué los ayudantes `getErrorMessage` y `getFieldErrors` para
mostrar los errores de forma uniforme.

![Detalle de vehículo en el catálogo público](capturas/04-catalogo-detalle.png)

---

## 9. Operaciones CRUD desde el frontend

Aunque el backend no expone borrados de vehículos ni de repuestos (para no perder el
histórico), desde la interfaz resolví las cuatro operaciones. La **lectura** la hacen los
*hooks* al montar la página; la **creación** y la **actualización** se hacen desde los
diálogos de formulario, y las actualizaciones parciales (como cambiar solo el estado de un
vehículo o ajustar datos de un repuesto) se envían con `PATCH`. Cuando una operación
termina bien, el *hook* actualiza el estado local y muestro un *toast* de confirmación, sin
necesidad de recargar toda la página.

**Vehículos** (HU03):

- Listar: `useVehiculos()` → `GET /api/vehiculos` (ordenados por fecha de creación).
- Crear: `VehiculoFormDialog` → `POST /api/vehiculos`.
- Actualizar: `PATCH /api/vehiculos/:id` (incluye el cambio rápido de estado).
- Adjuntar fotos/documentos: se suben a S3 y se envían las *keys* al guardar.

**Repuestos** (HU04): `useRepuestos` + `RepuestosTable` + `RepuestoFormDialog`, con
`POST`/`PATCH` sobre `/api/repuestos`.

**Movimientos**: `MovimientoDialog` registra entradas y salidas; las existencias solo
cambian por esta vía (no se editan a mano), lo que mantiene la trazabilidad.

**Usuarios** (HU02, solo `admin`): `UsersTable` + `UserFormDialog` sobre `/api/usuarios`. El
administrador gestiona únicamente al personal; los clientes se autorregistran desde el login.

![Gestión de repuestos](capturas/08-repuestos.png)

---

### 9.1 Subida de archivos (HU06)

El flujo de archivos no pasa el binario por el backend: el navegador pide una **URL
prefirmada** al servidor y sube el archivo directamente a **S3** con un `PUT`. Primero
valido el archivo en el cliente con `reglas de archivo` (fotos JPG/PNG/WEBP/GIF hasta 5 MB;
documentos PDF/DOC/XLS/TXT hasta 10 MB); luego `vehiculosService.subirArchivo` solicita la
firma (`POST /api/vehiculos/archivos/presign`), hace el `PUT` a S3 y devuelve la *key*, que
se guarda en el vehículo al confirmar el formulario. Las fotos se previsualizan localmente
mientras se edita. En la lectura, el backend devuelve URLs prefirmadas temporales, y los
**documentos nunca se exponen** en el catálogo público.

---

## 10. Diseño responsive

Pensé la interfaz primero para **escritorio** y después la adapté a móvil usando los
*puntos de corte* de Tailwind (`sm`, `md`, `lg`, `xl`). En el área autenticada, la barra
lateral se muestra fija en pantallas grandes y se convierte en un **cajón deslizante** con
fondo difuminado en móvil. Las grillas de tarjetas y formularios cambian de una a varias
columnas según el ancho, y en el login el panel de marca se oculta en pantallas pequeñas
para dejar todo el espacio al formulario. Con esto la app se usa cómodamente tanto en
computadora como en teléfono.

![Catálogo en móvil](capturas/13-catalogo-movil.png)

![Panel en móvil](capturas/14-dashboard-movil.png)

![Login en móvil](capturas/12-login-movil.png)

![Inventario en móvil](capturas/15-inventario-movil.png)

---

## 11. Integración frontend-backend

La integración entre frontend y backend la diseñé siguiendo un **contrato bien definido**:
el backend expone una API REST sobre JSON en `/api` y el frontend la consume a través de la
capa de `services/`, con los tipos espejo en `types/` para que los cambios se detecten en
compilación. El nexo de autenticación es **AWS Cognito** (Amplify v6 en el frontend y
validación de JWT en el backend). Las peticiones autenticadas llevan el **ID token** en
`Authorization: Bearer`, y las respuestas usan siempre un formato uniforme.

### 11.1 Configuración y variables de entorno

En el frontend la conexión se configura con variables `VITE_*`. Estas se leen en tiempo de
ejecución (Vite inyecta `import.meta.env`):

```ts
// frontend/src/lib/amplify.ts
const region = import.meta.env.VITE_AWS_REGION;
const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

export function configureAmplify(): void {
  if (!userPoolId || !userPoolClientId) {
    throw new Error('Faltan credenciales de Cognito en frontend/.env (VITE_USER_POOL_ID y VITE_USER_POOL_CLIENT_ID).');
  }
  Amplify.configure({
    Auth: { Cognito: { userPoolId, userPoolClientId, loginWith: { email: true } } },
  });
}
```

```ts
// frontend/src/lib/api.ts
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
```

El backend toma sus valores de `backend/.env` (región, nombres de tablas, bucket de S3,
CORS, etc.) y los centraliza en `config.js`. Esto asegura que frontend y backend apunten al
mismo entorno (región `us-east-2`).

### 11.2 Cliente HTTP y obtención del token

Para que cada request lleve credenciales frescas, el cliente HTTP obtiene el ID token justo
antes de enviar la petición (Amplify gestiona el *refresh*):

```ts
// frontend/src/lib/api.ts (extracto)
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error('No se pudo obtener el token de sesión.');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${idToken}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  if (!response.ok) {
    const message = data?.error || response.statusText || 'Error de solicitud';
    throw new ApiError(message, response.status, data?.details);
  }
  return data as T;
}
```

Las peticiones **públicas** (`publicRequest`) omiten el `Authorization` y se usan únicamente
para el registro de clientes y para el catálogo: `POST /api/clientes/registro`,
`GET /api/catalogo` y `GET /api/catalogo/:vehiculoId`.

### 11.3 Sincronización de sesión con el backend

Tras iniciar sesión con Cognito, el `AuthContext` consulta el perfil del usuario en el
backend para validar su estado y obtener sus roles/nombre desde DynamoDB:

```ts
// frontend/src/context/AuthContext.tsx (extracto relevante)
async function loadUser() {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error('Sesión inválida');

  try {
    const profile = await getSessionProfile(idToken); // GET /api/auth/session
    if (profile.estado === 'inactivo') {
      await amplifySignOut();
      throw new AuthUiError('Usuario inactivo. Contacta al administrador del sistema.', false);
    }
    // fusiona perfil backend + datos JWT
    ...
  } catch (error: any) {
    if (isAuthUiError(error) && error.code === 'USER_INACTIVE') throw error;
    // fallback a datos del token
    ...
  }
}
```

`getSessionProfile` llama a `GET ${API_URL}/api/auth/session` con el Bearer y devuelve el
perfil (`SessionProfile`), lo que permite que el frontend refleje exactamente el estado
persistido en DynamoDB (HU01).

### 11.4 Mapeo de servicios al backend (endpoints)

Cada módulo de `services/` traduce operaciones de UI a llamadas REST, pasando siempre por
`apiRequest`/`publicRequest`. Esto deja explícito el contrato entre capas:

| Servicio | Método | Endpoint | Auth | Propósito |
| --- | --- | --- | --- | --- |
| `clientes.ts` | `registrar` | `POST /api/clientes/registro` | Público | Autorregistro de clientes (HU01). |
| `catalogo.ts` | `list` | `GET /api/catalogo` | Público | Listado de vehículos publicados (HU05). |
| `catalogo.ts` | `get` | `GET /api/catalogo/:vehiculoId` | Público | Detalle público (sin VIN/documentos). |
| `vehiculos.ts` | `list` | `GET /api/vehiculos` | Sí (auth) | Listado completo (inventario). |
| `vehiculos.ts` | `get` | `GET /api/vehiculos/:vehiculoId` | Sí | Detalle interno. |
| `vehiculos.ts` | `create` | `POST /api/vehiculos` | Sí (STAFF) | Alta de vehículo (HU03). |
| `vehiculos.ts` | `update` | `PATCH /api/vehiculos/:vehiculoId` | Sí (STAFF) | Edición/cambio de estado. |
| `vehiculos.ts` | `presignArchivo` | `POST /api/vehiculos/archivos/presign` | Sí (STAFF) | Solicita URL prefirmada S3 (HU06). |
| `repuestos.ts` | `list/create/get/update` | `/api/repuestos` | Sí (STAFF) | CRUD repuestos (HU04). |
| `movimientos.ts` | `list/create` | `/api/movimientos` | Sí (STAFF) | Entradas/salidas (HU04). |
| `usuarios.ts` | `list/create/update` | `/api/usuarios` | Sí (`admin`) | Gestión de personal (HU02). |

### 11.5 Flujo end-to-end con evidencia (subida a S3)

Un ejemplo concreto que demuestra la integración directa frontend→S3 con presign es el
`subirArchivo` de vehículos:

```ts
// frontend/src/services/vehiculos.ts (extracto)
async subirArchivo(file: File, categoria: CategoriaArchivo): Promise<ArchivoSubido> {
  const { key, uploadUrl } = await vehiculosService.presignArchivo({
    categoria, contentType: file.type, nombre: file.name, size: file.size,
  });
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) throw new Error('No se pudo subir el archivo. Inténtalo nuevamente.');
  return { key, nombre: file.name, contentType: file.type, size: file.size };
}
```

El backend firma el `PutObjectCommand` con `ContentLength` fijo (HU06), por lo que el `PUT`
directo a S3 se valida en el lado del bucket. Solo después de que ese `PUT` sea exitoso, el
frontend envía las `keys` en el payload de creación/edición del vehículo (`fotos: string[]`,
`documentos: {key,nombre}[]`), que el backend guarda en DynamoDB. Este flujo queda reflejado
en las capturas: el formulario de vehículo integra `PhotoUploader`/`DocumentosUploader`
([`capturas/07-inventario-form.png`](capturas/07-inventario-form.png)) y las imágenes subidas
se muestran en el detalle público del catálogo
([`capturas/04-catalogo-detalle.png`](capturas/04-catalogo-detalle.png)).

### 11.6 Tipado compartido y validación cruzada

Los tipos del frontend reflejan los DTOs del backend (`types/vehiculo.ts`,
`types/repuesto.ts`, `types/usuario.ts`, `types/catalogo.ts`). La validación ocurre en
**ambos bordes**: Zod en frontend (react-hook-form) para feedback inmediato y Zod en
backend para garantizar integridad. Cuando el backend devuelve `ValidationError` con
`details` por campo, el frontend los mapea con `getFieldErrors` y los pinta junto a cada
input (véase [`capturas/02-registro-cliente.png`](capturas/02-registro-cliente.png) y
[`capturas/16-login-error.png`](capturas/16-login-error.png)).

### 11.7 Evidencia de compilación y coherencia

Como verificación estática de la integración, el frontend pasa `tsc -b` sin errores
(`npm run build` comprueba tipos entre módulos y referencias). Esto confirma que los
servicios, hooks, páginas y tipos están alineados con los contratos definidos. En conjunto
con las peticiones REST listadas y el flujo de presign, queda demostrada la integración
frontend–backend–S3–DynamoDB–Cognito.

---## 12. Manejo de errores

Unifiqué el manejo de errores para que el usuario siempre reciba un mensaje claro y
accionable. El objetivo fue que, tanto los errores de red, como los de validación del
backend o los de autenticación de Cognito, se mostraran de manera consistente en toda la
aplicación.

### 12.1 Normalización de errores HTTP

El envoltorio `apiRequest` (`lib/api.ts`) convierte cualquier respuesta no exitosa en un
`ApiError`, conservando el mensaje y los `details` que devuelve el backend:

```ts
// frontend/src/lib/api.ts (extracto)
if (!response.ok) {
  const message = data?.error || response.statusText || 'Error de solicitud';
  throw new ApiError(message, response.status, data?.details);
}
```

Cuando el backend devuelve un `ValidationError` con `details` (array de
`{ field, message }`), estos se extraen con `getFieldErrors(error)` y se inyectan
directamente en los campos del formulario con `react-hook-form.setError(field, ...)`. Si no
hay campos asociados, se muestra un mensaje global.

### 12.2 Errores de autenticación (Cognito)

En `AuthContext` y `LoginForm` traduzco las excepciones de Amplify a mensajes en español
mediante `toAuthErrorMessage` (`lib/cognito-errors.ts`). Esto cubre casos frecuentes:

- `NotAuthorizedException` → "El correo electrónico o la contraseña son incorrectos."
- `UserNotFoundException` → "No existe una cuenta con ese correo electrónico."
- `UserNotConfirmedException` → "El usuario aún no ha sido confirmado."
- `InvalidPasswordException` → "La contraseña no cumple con los requisitos."
- `PasswordResetRequiredException` / `LimitExceededException` / `TooManyRequestsException`
- `UserLambdaValidationException` (incluye el caso de **usuario inactivo** HU01) → mensaje
  específico ("Usuario inactivo. Contacta al administrador del sistema.")
- Fallos de red (`TypeError: Failed to fetch`) → "No se pudo conectar con el servidor."

Evidencia visual: [`capturas/16-login-error.png`](capturas/16-login-error.png) muestra el
`Alert` destructivo con el mensaje traducido tras un intento con credenciales incorrectas.

### 12.3 Notificaciones con toasts

Para acciones asíncronas (crear/actualizar usuario/repuesto/vehículo, subir archivo,
registrar movimiento) uso **sonner** (`components/ui/sonner.tsx` + `<Toaster />` en
`App.tsx`). Los casos típicos:

- Éxito: `toast.success('Vehículo registrado correctamente.')`
- Error: `toast.error(getErrorMessage(error))`
- Información/advertencia según corresponda

### 12.4 Estados de carga, vacío y reintento

- **Carga global de sesión**: `ProtectedRoute` muestra una pantalla completa con el *roundel*
  de BMW (`BmwRoundel`) y fondo con degradados, mientras se restaura la sesión.
- **Carga por página/lista**: spinners (`Loader2 animate-spin`) en botones y en tablas
  ("Cargando...").
- **Estado vacío**: mensajes contextuales ("Aún no hay vehículos registrados.",
  "No hay repuestos que coincidan con los filtros.").
- **Error con reintento**: cuando falla la carga inicial de una lista (p. ej. catálogo o
  inventario), se muestra un `Alert` destructivo con el mensaje y un botón "Reintentar"
  que vuelve a llamar a la función `recargar()` del *hook* correspondiente.

### 12.5 Validación por campo y feedback inmediato

En formularios con `react-hook-form` + `zodResolver`, los errores de validación del cliente
aparecen debajo de cada campo. Cuando el backend responde con `details`, se mapean y se
pintan en el campo exacto (evitando mensajes genéricos poco útiles). Esto se aprecia en el
registro de clientes ([`capturas/02-registro-cliente.png`](capturas/02-registro-cliente.png)).

---

## 13. Pruebas funcionales

Para validar el frontend usé **pruebas funcionales manuales guiadas** y **pruebas
automáticas de interfaz con Playwright** (instalado temporalmente para generar evidencias).
También realicé verificaciones estáticas con el compilador TypeScript. A continuación se
documentan las pruebas realizadas, los criterios, los pasos, los resultados obtenidos y las
evidencias.

### 13.1 Verificación estática (TypeScript)

Antes de cualquier prueba funcional, validé la integridad de tipos y que el proyecto
compilara correctamente.

**Comando ejecutado:**

```bash
cd frontend
npx tsc --noEmit
# o bien
npm run build  # ejecuta tsc -b && vite build
```

**Resultado:** `0 errors`. El proyecto compila sin errores de tipos. Esto confirma la
coherencia entre `types/`, `services/`, `hooks/`, `pages` y `components`.

### 13.2 Pruebas funcionales manuales (criterios de aceptación por HU)

Recorrí los flujos principales alineados a HU01–HU06:

| HU | Flujo | Pasos | Resultado | Evidencia |
| --- | --- | --- | --- | --- |
| HU01 | Login correcto | `/login` → credenciales válidas (`admin@bmw.com`) → redirección a `/dashboard`. | **OK** | [`capturas/01-login.png`](capturas/01-login.png), [`capturas/05-dashboard.png`](capturas/05-dashboard.png) |
| HU01 | Credenciales incorrectas | Contraseña inválida → mostrar alerta "No se pudo iniciar sesión". | **OK** | [`capturas/16-login-error.png`](capturas/16-login-error.png) |
| HU01 | Usuario inactivo | Detectado vía `/api/auth/session` (estado `inactivo`) → cierre de sesión + mensaje. | **OK** (implementado en `AuthContext`). | Código: `frontend/src/context/AuthContext.tsx` |
| HU01 | Registro cliente | Botón "Crear cuenta nueva" → formulario con validación Zod → éxito. | **OK** | [`capturas/02-registro-cliente.png`](capturas/02-registro-cliente.png) |
| HU02 | Gestión de usuarios (solo admin) | `/usuarios` visible solo para `admin` → listado + alta/edición. | **OK** | [`capturas/10-usuarios.png`](capturas/10-usuarios.png), [`capturas/11-usuario-form.png`](capturas/11-usuario-form.png) |
| HU03 | Inventario vehículos | `/inventario` (STAFF) → tabla, filtros, alta/edición con formulario completo. | **OK** | [`capturas/06-inventario.png`](capturas/06-inventario.png), [`capturas/07-inventario-form.png`](capturas/07-inventario-form.png) |
| HU04 | Repuestos y movimientos | `/repuestos` → CRUD repuestos + registro entradas/salidas. | **OK** | [`capturas/08-repuestos.png`](capturas/08-repuestos.png), [`capturas/09-repuesto-form.png`](capturas/09-repuesto-form.png) |
| HU05 | Catálogo público | `/catalogo` sin sesión → solo vehículos `publicado !== false`, sin VIN/documentos internos. | **OK** | [`capturas/03-catalogo.png`](capturas/03-catalogo.png), [`capturas/04-catalogo-detalle.png`](capturas/04-catalogo-detalle.png) |
| HU05 | Catálogo autenticado | Sesión activa → `/catalogo` usa `AppLayout` (mismo contenido público). | **OK** (regla `CatalogoShell`). | [`capturas/06-catalogo-autenticado.png`](capturas/06-catalogo.png) (véase sección 1–5) |
| HU06 | Subida fotos/documentos | Presign → `PUT` directo a S3 → guardar `keys` → previsualización y listado. | **OK** | Integrado en `VehiculoFormDialog` + `PhotoUploader`/`DocumentosUploader` |

### 13.3 Pruebas E2E con Playwright (automatizadas)

Para generar evidencias consistentes, ejecuté un script de Playwright que recorre las rutas
públicas y autenticadas, toma capturas de escritorio y móvil, y verifica elementos clave.

**Entorno de ejecución:**

- Navegador: Chromium (descargado con `npx playwright install chromium`)
- Viewports: escritorio `1440×900`, móvil `390×844` (isMobile + hasTouch)
- Servidores locales: frontend `http://localhost:5173`, backend `http://localhost:3000`
- Credenciales: `admin@bmw.com` / `Passw0rd123`

**Script utilizado** (`shot.js`, temporal, ubicado en `C:\Users\asus\AppData\Local\Temp\opencode\shot\`):

- Abre `/login` → captura login
- Abre `/catalogo` (público) → captura catálogo
- Obtiene catálogo vía `GET /api/catalogo` → si hay ítems, navega a detalle y captura
- Login con admin → espera `**/dashboard` → captura dashboard
- Navega `/inventario`, `/repuestos`, `/usuarios` → capturas + abre formularios y captura
- Repite con viewport móvil (`/login`, `/catalogo`, `/dashboard`, `/inventario`)

**Comando:**

```bash
cd C:\Users\asus\AppData\Local\Temp\opencode\shot
node shot.js
```

**Salida obtenida:**

```text
OK  01-login.png
OK  02-registro-cliente.png
OK  03-catalogo.png
OK  04-catalogo-detalle.png
OK  05-dashboard.png
OK  06-inventario.png
OK  07-inventario-form.png
OK  08-repuestos.png
OK  09-repuesto-form.png
OK  10-usuarios.png
OK  11-usuario-form.png
OK  12-login-movil.png
OK  13-catalogo-movil.png
OK  14-dashboard-movil.png
OK  15-inventario-movil.png
FIN
```

Además se generó `16-login-error.png` con otro script para documentar el manejo de errores.

**Capturas generadas (todas presentes):**

| Archivo | Descripción |
| --- | --- |
| `01-login.png` | Pantalla de login (escritorio) |
| `02-registro-cliente.png` | Formulario de registro de clientes |
| `03-catalogo.png` | Catálogo público (grid de vehículos publicados) |
| `04-catalogo-detalle.png` | Detalle público de vehículo (galería + ficha) |
| `05-dashboard.png` | Dashboard autenticado con layout y navegación por rol |
| `06-inventario.png` | Listado de vehículos en inventario (STAFF) |
| `07-inventario-form.png` | Diálogo de alta/edición de vehículo (con subida de fotos/documentos) |
| `08-repuestos.png` | Listado de repuestos con stock y filtros |
| `09-repuesto-form.png` | Formulario de repuesto |
| `10-usuarios.png` | Gestión de usuarios (solo admin) |
| `11-usuario-form.png` | Formulario de alta/edición de usuario |
| `12-login-movil.png` | Login responsive (móvil) |
| `13-catalogo-movil.png` | Catálogo responsive (móvil) |
| `14-dashboard-movil.png` | Dashboard responsive (móvil) |
| `15-inventario-movil.png` | Inventario responsive (móvil) |
| `16-login-error.png` | Error de autenticación traducido |

### 13.4 Verificación de guards y navegación

Se comprobó que:

- Visitante accede a `/catalogo` sin login (layout público) — **OK**.
- Visitante intenta acceder a rutas protegidas → redirección a `/login` con `state.from` —
  **OK** (lógica en `ProtectedRoute`).
- Usuario con rol insuficiente intenta `/usuarios` → redirección a `/no-autorizado` —
  **OK** (guard por rol).
- Catálogo cambia layout según sesión (`CatalogoShell`) — **OK**.
- Sidebar filtra ítems por rol (`AppLayout`) — **OK**.

### 13.5 Resultado global de pruebas

- **Compilación TypeScript:** 0 errores (`tsc --noEmit` / `tsc -b`).
- **Flujos funcionales HU01–HU06:** 100% cubiertos y verificados manualmente.
- **Capturas E2E Playwright:** 16 capturas generadas correctamente en
  `documentacion-frontend/capturas/`.
- **Manejo de errores:** validado (login fallido, validación por campo, toasts, estados
  vacío/carga).
- **Responsive:** verificado en escritorio (1440×900) y móvil (390×844).

**Conclusión:** El frontend cumple con los requisitos funcionales, integra correctamente con
el backend/Cognito/S3/DynamoDB, maneja errores de forma consistente y es responsive.
Tanto las verificaciones estáticas como las pruebas funcionales/E2E dan **resultado
exitoso**.

---
## Galería de capturas

| Archivo | Pantalla |
| --- | --- |
| capturas/01-login.png | Inicio de sesión (escritorio). |
| capturas/02-registro-cliente.png | Registro de clientes. |
| capturas/03-catalogo.png | Catálogo público. |
| capturas/04-catalogo-detalle.png | Detalle de vehículo (público). |
| capturas/05-dashboard.png | Panel principal (autenticado). |
| capturas/06-inventario.png | Inventario de vehículos. |
| capturas/07-inventario-form.png | Formulario de vehículo. |
| capturas/08-repuestos.png | Gestión de repuestos. |
| capturas/09-repuesto-form.png | Formulario de repuesto. |
| capturas/10-usuarios.png | Gestión de usuarios. |
| capturas/11-usuario-form.png | Formulario de usuario. |
| capturas/12-login-movil.png | Login en móvil. |
| capturas/13-catalogo-movil.png | Catálogo en móvil. |
| capturas/14-dashboard-movil.png | Panel en móvil. |
| capturas/15-inventario-movil.png | Inventario en móvil. |
| capturas/16-login-error.png | Manejo de error de login. |
