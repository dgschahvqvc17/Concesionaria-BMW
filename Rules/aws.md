# AWS — Servicios, infraestructura y capa gratuita

Infraestructura declarada como código con **AWS CDK (TypeScript)** en `infra/`.

## REGLA PRINCIPAL: solo capa gratuita (Free Tier)

> **Es obligatorio mantenerse dentro de la capa gratuita de AWS.** El proyecto es una
> práctica académica y **no debe generar gastos**.

- No agregar servicios que generen costo.
- Antes de proponer un recurso nuevo, verifica que esté cubierto por la capa gratuita
  (y revisa [`aws.md` → Costos](#capa-gratuita-y-costos)).
- Servicios **prohibidos** salvo justificación y confirmación explícita: EC2, RDS,
  ElastiCache, API Gateway, NAT Gateway, ECS/EKS, OpenSearch, Redshift, etc.
- Configura siempre límites de bajo consumo (`RemovalPolicy.DESTROY`, capacidad mínima).
- Mantén activa la **alarma de presupuesto** de AWS Budgets.

## Servicios AWS utilizados

| Servicio | Para qué | Recurso |
| --- | --- | --- |
| **Amazon Cognito** | Autenticación (email + contraseña) y roles vía Groups. | User Pool + App Client + 4 grupos |
| **Amazon DynamoDB** | Persistencia de usuarios, vehículos, repuestos, movimientos, clientes comerciales, cotizaciones, reservas, ventas, pruebas de manejo, notificaciones y citas del taller. | 11 tablas (modo on-demand) |
| **Amazon S3** | Almacenamiento de fotografías de vehículos. | 1 bucket privado |
| **AWS CloudFormation** | Despliegue de la infraestructura (lo usa CDK). | 3 stacks |
| **AWS Lambda** | Helper de CDK para vaciar el bucket al destruir el stack (`autoDeleteObjects`). | 1 función auxiliar |
| **AWS IAM** | Rol de la Lambda auxiliar. | 1 rol |
| **AWS Budgets** | Alerta de presupuesto (`ConcesionariaBMW-1USD`). | 1 presupuesto |
| **Amazon CloudWatch** | Métricas/alarmas del presupuesto. | mínimo |

No se usa API Gateway, EC2, RDS, S3 público ni ninguna base relacional.

**HU12 (notificaciones por correo)**: la HU originalmente planteaba **Amazon SES**,
que cobra por mensaje (~$0.10/1.000) y no está cubierto por la capa gratuita. Por la
regla principal de este repositorio se implementó con transporte **`mailto:`** (el
correo se redacta en el backend y se abre con el cliente de correo del usuario, sin
costo); el registro de cada intento vive en la tabla `Notificaciones`. Si en el
futuro se necesitara envío automático, habría que confirmar explícitamente el costo
de SES antes de agregarlo.

## Regla de la capa gratuita — detalle por servicio

| Servicio | Capa gratuita | Situación del proyecto |
| --- | --- | --- |
| **Cognito** | 50 000 MAU (plan Essentials). | Muy por debajo; **$0**. |
| **DynamoDB (almacenamiento)** | 25 GB. | Uso ínfimo; **$0**. |
| **DynamoDB (lecturas/escrituras)** | 25 WCU + 25 RCU **solo en modo provisioned**. | Usamos **on-demand** → no cubierto por ese tramo, pero el consumo real es ~$0. |
| **S3** | 5 GB + 20 000 GET + 2 000 PUT durante los **primeros 12 meses**. | Uso mínimo. |
| **CloudFormation** | Ilimitado. | **$0**. |
| **Lambda** | 1 millón de solicitudes + 400 000 GB-s **cada mes (permanente)**. | Solo 1–2 invocaciones; **$0**. |
| **Budgets** | 2 presupuestos gratis. | 1 usado; **$0**. |
| **CloudWatch (alarmas)** | 10 alarmas gratis. | Dentro del límite. |

Conclusión: el gasto mensual real es **~$0**, aunque técnicamente DynamoDB on-demand y
S3 (tras los primeros 12 meses) no dependen del tramo gratuito. Si se quisiera asegurar
el 100 % en capa gratuita, se podría pasar DynamoDB a **provisioned 25/25**.

## Arquitectura de la infraestructura

```text
infra/
├── bin/concesionaria.ts        # Define la app CDK y las tres stacks
├── lib/
│   ├── auth-stack.ts           # Cognito + DynamoDB (Usuarios)
│   ├── inventario-stack.ts     # DynamoDB (Vehiculos) + S3 (FotosVehiculosBucket)
│   └── repuestos-stack.ts      # DynamoDB (Repuestos + MovimientosInventario + ClientesComerciales + Cotizaciones + Reservas + Ventas + PruebasManejo + Notificaciones + CitasTaller)
└── scripts/create-user.mjs     # Alta de usuarios de prueba (Cognito + grupo)
```

### Stack 1 — `ConcesionariaBmwAuthStack` (HU01/HU02)

- **Cognito User Pool**: login por email, auto-verificación de email, política de
  contraseña (mín. 8, mayúscula, minúscula, número; sin símbolos).
- **Groups** (roles): `admin`, `vendedor`, `jefe_taller`, `mecanico`, `cliente` (con precedencia).
  Los clientes se autorregistran; el personal lo administra el `admin`.
- **App Client** (SPA, sin secreto): flujos SRP y `USER_PASSWORD_AUTH`, tokens de 1 h.
- **Tabla `Usuarios`** (DynamoDB): PK `userId`, GSI `email-index`.
- Salidas: `UserPoolId`, `UserPoolClientId`, `UsuariosTableName`, `Region`.

### Stack 2 — `ConcesionariaBmwInventarioStack` (HU03)

- **Tabla `Vehiculos`** (DynamoDB): PK `vehiculoId`, GSI `vin-index`.
- **Bucket `FotosVehiculosBucket`** (S3): **privado** (`BLOCK_ALL`), cifrado
  `S3_MANAGED`, `enforceSSL`, CORS para `http://localhost:5173`,
  `autoDeleteObjects` + `DESTROY`.
- Salidas: `VehiculosTableName`, `FotosBucketName`, `Region`.

### Stack 3 — `ConcesionariaBmwRepuestosStack` (HU04 + HU07 + HU08 + HU09 + HU10 + HU11 + HU12 + HU13 + HU14)

- **Tabla `Repuestos`** (DynamoDB): PK `repuestoId`, GSI `codigo-index`.
- **Tabla `MovimientosInventario`** (DynamoDB): PK `movimientoId`, GSI
  `repuesto-index` (`repuestoId` + `createdAt`).
- **Tabla `ClientesComerciales`** (HU07, DynamoDB): PK `clienteId`, GSIs
  `email-index` y `documento-index` (búsqueda y anti-duplicados).
- **Tabla `Cotizaciones`** (HU08, DynamoDB): PK `cotizacionId`, GSIs `cliente-index`
  (`clienteId` + `createdAt`, historial por cliente) y `numero-index` (número único).
  Guarda una partición auxiliar `secuencia#<año>` para la numeración atómica.
- **Tabla `Reservas`** (HU09, DynamoDB): PK `reservaId`, GSIs `vehiculo-index`
  (`vehiculoId` + `createdAt`, detección de reservas activas), `cliente-index`
  (`clienteId` + `createdAt`, historial por cliente) y `numero-index` (número único).
  Guarda una partición auxiliar `secuencia#<año>` para la numeración atómica.
- **Tabla `Ventas`** (HU10, DynamoDB): PK `ventaId`, GSIs `vehiculo-index`
  (`vehiculoId` + `createdAt`, control de doble venta), `cliente-index`
  (`clienteId` + `createdAt`, historial por cliente) y `numero-index` (número único).
  Guarda una partición auxiliar `secuencia#<año>` para la numeración atómica.
- **Tabla `PruebasManejo`** (HU11, DynamoDB): PK `pruebaId`, GSIs `vehiculo-index`
  (`vehiculoId` + `fechaHora`, agenda y detección de conflictos de horario),
  `cliente-index` (`clienteId` + `createdAt`, historial por cliente) y
  `numero-index` (número único `PRB-AAAA-######`). Guarda una partición auxiliar
  `secuencia#<año>` para la numeración atómica.
- **Tabla `Notificaciones`** (HU12, DynamoDB): PK `eventoId` (clave única
  `tipo:recurso:evento:destinatario`; el `Put` condicional con
  `attribute_not_exists` impide el envío duplicado de un mismo evento) y GSI
  `recurso-index` (`recursoId` + `createdAt`, historial de correos de una
  operación).
- **Tabla `CitasTaller`** (HU13/HU14, DynamoDB): PK `citaId` (UUID), GSIs `vehiculo-index`
  (`vehiculoId` + `fechaHora`, detección de citas solapadas), `cliente-index`
  (`clienteId` + `createdAt`, historial por cliente), `numero-index` (número único
  `CIT-AAAA-######`) y `mecanico-index` (HU14: `mecanicoId` + `fechaHora`, carga de
  trabajo por mecánico). Guarda una partición auxiliar `secuencia#<año>` para la
  numeración atómica. Mismo patrón que `PruebasManejoTable` (HU11).
- Salidas: `RepuestosTableName`, `MovimientosTableName`,
  `ClientesComercialesTableName`, `CotizacionesTableName`, `ReservasTableName`,
  `VentasTableName`, `PruebasManejoTableName`, `NotificacionesTableName`,
  `CitasTallerTableName`, `Region`.

Las físicas (nombres reales) están en `infra/cdk-outputs.json` y se copian a los `.env`
de `backend` y `frontend`.

## Seguridad

- **S3 nunca público**: fotos y documentos se suben/leen con **URLs prefirmadas** (expiran
  en 1 hora) generadas por el backend (`src/services/storageService.js`). Los archivos
  privados (documentos) nunca quedan accesibles públicamente sin autorización.
- La URL de subida firma el `Content-Length` exacto: S3 rechaza archivos cuyo tamaño no
  coincida con el declarado (límite real: 5 MB fotos, 10 MB documentos).
- Validación de `content-type` permitido según la categoría (`foto`/`documento`) antes de
  firmar la subida, y verificación del objeto en S3 al guardar la referencia.
- Autenticación por **ID token de Cognito** verificado en el backend (firma, exp, iss, aud).
- **Nunca** subir credenciales AWS, `.env` ni tokens al repositorio.
- Las credenciales AWS deben venir del entorno (`aws configure` / variables), nunca del código.

## Región

`us-east-2` (Ohio), configurable con `CDK_DEFAULT_REGION` / `AWS_REGION`.

## Comandos (desde `infra/`)

```bash
npm install                 # dependencias
npm run synth               # generar plantillas CloudFormation
npm run deploy              # cdk deploy --require-approval never
npm run destroy             # eliminar las stacks
npm run create-user         # alta de usuario (ver variables abajo)
```

Alta de usuario de prueba:

```bash
# PowerShell
$env:USER_POOL_ID="us-east-2_XXXX"; $env:EMAIL="admin@bmw.com"; $env:PASSWORD="Passw0rd123"; $env:ROLE="admin"; $env:NAME="Admin Demo"; npm run create-user
```

## Reglas al tocar la infraestructura

- Mantener `RemovalPolicy.DESTROY` y `autoDeleteObjects` (entorno de práctica).
- No habilitar funcionalidades de Cognito con costo (SMS, MFA por SMS, advanced security
  avanzada).
- No exponer buckets ni tablas públicamente.
- Toda salida necesaria para el backend/frontend debe declararse como `CfnOutput`.
- Si agregas un recurso, verifica que esté dentro de la capa gratuita y documéntalo aquí.
