# Diagramas PlantUML — Concesionaria BMW

Colección de diagramas del backend listos para **copiar y pegar** en un renderizador
PlantUML online (<https://www.plantuml.com/plantuml>), VS Code (extensión *PlantUML*) o
cualquier editor compatible.

## Cómo generar las imágenes

1. Copia el bloque completo, **incluyendo** `@startuml` y `@enduml`.
2. Pégalo en <https://www.plantuml.com/plantuml>.
3. Pulsa **Submit** y luego descarga el PNG/SVG.
4. Inserta la imagen en tu informe.

## Índice de diagramas

| # | Diagrama | Tipo |
| --- | --- | --- |
| 1 | Arquitectura del backend (MVC por capas) | Componentes |
| 2 | Despliegue en AWS (capa gratuita) | Despliegue |
| 3 | Casos de uso por rol | Casos de uso |
| 4 | Modelo de datos en DynamoDB | Entidad-Relación |
| 5 | Validación de datos (Zod) | Secuencia |
| 6 | Manejo de errores | Secuencia |
| 7 | Autenticación (login + JWT) | Secuencia |
| 8 | Crear vehículo con archivos (S3) | Secuencia |
| 9 | Movimiento de inventario (stock condicional) | Secuencia |
| 10 | Seguimiento comercial de clientes (HU07) | Secuencia |

---

## Diagrama 1 — Arquitectura del backend (MVC por capas)

```plantuml
@startuml
title Arquitectura del backend — MVC por capas
skinparam componentStyle rectangle
skinparam shadowing false

actor "SPA (React + Vite)" as spa

package "Backend Node.js + Express 5" {
  component "routes\n(rutas + auth/roles)" as routes
  component "validation\n(Zod)" as validation
  component "controllers\n(HTTP <-> servicio)" as controllers
  component "services\n(lógica de negocio)" as services
  component "repositories\n(acceso a datos)" as repositories
  component "errors\n(AppError + errorHandler)" as errors
  component "auth\n(JWT + roles)" as auth
  component "config\n(.env)" as config
}

database "Amazon DynamoDB\n(5 tablas + GSIs)" as ddb
cloud "Amazon S3\n(bucket privado)" as s3
cloud "Amazon Cognito\n(User Pool + grupos)" as cognito

spa --> routes : HTTP/JSON\nAuthorization: Bearer JWT
routes --> auth
routes --> validation
routes --> controllers
controllers --> services
services --> repositories
repositories --> ddb : AWS SDK v3
services --> s3 : URLs prefirmadas
auth --> cognito : verifica ID token
controllers ..> errors
services ..> errors
routes ..> errors
@enduml
```

---

## Diagrama 2 — Despliegue en AWS (capa gratuita)

```plantuml
@startuml
title Despliegue en AWS — solo capa gratuita
skinparam shadowing false

node "Navegador del usuario" as browser {
  component "SPA React" as spa
}

node "Servidor backend (Node.js/Express)\nentorno local / de desarrollo" as api

cloud "AWS us-east-2" {
  database "DynamoDB\n(on-demand)" as ddb {
    database "Usuarios" as t1
    database "Vehiculos" as t2
    database "Repuestos" as t3
    database "MovimientosInventario" as t4
    database "ClientesComerciales" as t5
  }
  cloud "Amazon S3\n(bucket privado)" as s3
  cloud "Amazon Cognito\n(User Pool + grupos)" as cognito
  node "IAM\n(usuario de despliegue)" as iam
}

browser --> api : HTTPS/JSON
browser --> cognito : login (Amplify)
browser --> s3 : PUT/GET con URL prefirmada
api --> ddb : AWS SDK v3
api --> s3 : presign / HeadObject / Delete
api --> cognito : verificación de JWT + admin de usuarios
iam ..> ddb
iam ..> s3
iam ..> cognito

note right of ddb
  Modo on-demand (pago por uso).
  Sin EC2, RDS, API Gateway ni NAT.
end note
@enduml
```

---

## Diagrama 3 — Casos de uso por rol

```plantuml
@startuml
title Casos de uso — Concesionaria BMW
left to right direction
skinparam shadowing false

actor "Visitante" as visitante
actor "Cliente" as cliente
actor "Mecanico" as mecanico
actor "Jefe de taller" as jefe
actor "Vendedor" as vendedor
actor "Administrador" as admin

rectangle "Sistema Concesionaria BMW" {
  usecase "Ver catalogo publico (HU05)" as UC_catalogo
  usecase "Autorregistrarse" as UC_registro
  usecase "Iniciar sesion (HU01)" as UC_login
  usecase "Consultar inventario" as UC_consultar
  usecase "Gestionar vehiculos (HU03)" as UC_vehiculos
  usecase "Gestionar fotos y documentos (HU06)" as UC_archivos
  usecase "Gestionar repuestos (HU04)" as UC_repuestos
  usecase "Registrar movimientos" as UC_movimientos
  usecase "Gestionar clientes comerciales (HU07)" as UC_clientes
  usecase "Gestionar usuarios y roles (HU02)" as UC_usuarios
}

visitante --> UC_catalogo
cliente --> UC_catalogo
cliente --> UC_registro
cliente --> UC_login

mecanico --> UC_login
mecanico --> UC_consultar

jefe --> UC_login
jefe --> UC_consultar
jefe --> UC_repuestos
jefe --> UC_movimientos

vendedor --> UC_login
vendedor --> UC_vehiculos
vendedor --> UC_archivos
vendedor --> UC_repuestos
vendedor --> UC_movimientos
vendedor --> UC_clientes

admin --> UC_login
admin --> UC_vehiculos
admin --> UC_archivos
admin --> UC_repuestos
admin --> UC_movimientos
admin --> UC_clientes
admin --> UC_usuarios
@enduml
```

> **Nota:** se evitan acentos en las etiquetas para máxima compatibilidad con cualquier
> renderizador. Si el tuyo los admite, puedes escribirlos con normalidad.

---

## Diagrama 4 — Modelo de datos en DynamoDB

```plantuml
@startuml
title Modelo de datos — DynamoDB (5 tablas)
hide circle
skinparam shadowing false
skinparam linetype ortho

entity "Usuarios" as usuarios {
  * userId <<PK>> : string
  --
  email <<GSI email-index>> : string
  nombre : string
  rol : string
  estado : string
  fechaNacimiento : string
  carnetIdentidad : string
  celular : string
  createdAt : string
  updatedAt : string
  createdBy : string
}

entity "Vehiculos" as vehiculos {
  * vehiculoId <<PK>> : string
  --
  vin <<GSI vin-index>> : string
  marca : string
  modelo : string
  anio : number
  version : string
  kilometraje : number
  precio : number
  color : string
  condicion : string
  tipo : string
  estado : string
  descripcion : string
  caracteristicas : list<string>
  publicado : boolean
  fotos : list<string>
  documentos : list<object>
  createdAt : string
  updatedAt : string
  createdBy : string
}

entity "Repuestos" as repuestos {
  * repuestoId <<PK>> : string
  --
  codigo <<GSI codigo-index>> : string
  nombre : string
  descripcion : string
  precio : number
  cantidad : number
  cantidadMinima : number
  createdAt : string
  updatedAt : string
}

entity "MovimientosInventario" as movimientos {
  * movimientoId <<PK>> : string
  --
  repuestoId <<GSI repuesto-index>> : string
  tipo : string
  cantidad : number
  motivo : string
  createdAt : string
  createdBy : string
}

entity "ClientesComerciales" as clientes {
  * clienteId <<PK>> : string
  --
  nombres : string
  apellidos : string
  documento <<GSI documento-index>> : string
  telefono : string
  email <<GSI email-index>> : string
  consultas : list<object>
  notas : string
  estadoSeguimiento : string
  createdAt : string
  updatedAt : string
}

usuarios ||..o{ movimientos : "crea"
usuarios ||..o{ vehiculos : "registra"
movimientos }o..|| repuestos : "afecta"
usuarios ||..o{ repuestos : "gestiona"
usuarios ||..o{ clientes : "da seguimiento"

note bottom of usuarios
  UserId = claim "sub" de Cognito.
  No hay claves foráneas: la
  integridad se valida en servicios.
end note
@enduml
```

---

## Diagrama 5 — Validación de datos (Zod)

```plantuml
@startuml
title Secuencia — Validación de datos con Zod
skinparam shadowing false

actor Cliente
participant "Router" as router
participant "Controller" as ctrl
participant "validate()\n(Zod)" as zod
participant "Service" as svc
participant "errorHandler" as eh

Cliente -> router : POST /api/repuestos (JSON)
router -> ctrl : create(req, res)
ctrl -> zod : safeParse(req.body)
alt Datos válidos
  zod --> ctrl : datos normalizados
  ctrl -> svc : createRepuesto(datos, actor)
  svc --> ctrl : repuesto
  ctrl --> Cliente : 201 Created
else Datos inválidos
  zod --> ctrl : error.issues
  ctrl -> eh : ValidationError(details)
  eh --> Cliente : 400 { error, code, details[] }
end
@enduml
```

---

## Diagrama 6 — Manejo de errores

```plantuml
@startuml
title Secuencia — Manejo central de errores
skinparam shadowing false

participant "Route" as route
participant "Controller" as ctrl
participant "Service" as svc
participant "Repository" as repo
participant "errorHandler" as eh
actor Cliente

Cliente -> route : Petición
route -> ctrl : handler (envuelto por asyncHandler)
ctrl -> svc : operación
svc -> repo : DynamoDB

alt Error de negocio (AppError)
  repo --> svc : ConditionalCheckFailed
  svc --> ctrl : throw ConflictError
  ctrl -> eh : next(err)
  eh --> Cliente : 409 { error, code }
else Error de validación
  ctrl --> eh : ValidationError
  eh --> Cliente : 400 { error, code, details }
else Error inesperado
  repo --> svc : error desconocido
  svc --> ctrl : throw
  ctrl -> eh : next(err)
  eh -> eh : console.error(err)
  eh --> Cliente : 500 { error: genérico, code }
end
@enduml
```

---

## Diagrama 7 — Autenticación (login + JWT)

```plantuml
@startuml
title Secuencia — Autenticación con Cognito y JWT
skinparam shadowing false

actor Usuario
participant "SPA" as spa
participant "Amazon Cognito" as cognito
participant "Backend" as api
database "DynamoDB\n(Usuarios)" as ddb

Usuario -> spa : email + contraseña
spa -> cognito : signIn()
cognito --> spa : ID token (JWT) + cognito:groups

spa -> api : GET /api/auth/session\nAuthorization: Bearer <JWT>
api -> cognito : verifyIdToken (firma, exp, aud)
cognito --> api : payload válido
api -> ddb : findById(sub)
alt Perfil existe
  ddb --> api : perfil
else Perfil no existe
  api -> ddb : save(perfil desde el token)
end
api --> spa : 200 { user, rol }

note right of api
  requireAuth protege las rutas.
  requireRole(...) exige grupos.
  Roles: admin, vendedor,
  jefe_taller, mecanico, cliente.
end note
@enduml
```

---

## Diagrama 8 — Crear vehículo con archivos (S3)

```plantuml
@startuml
title Secuencia — Crear vehículo con fotos/documentos (HU03 + HU06)
skinparam shadowing false

actor "Admin/Vendedor" as user
participant "SPA" as spa
participant "Backend" as api
participant "Amazon S3" as s3
database "DynamoDB" as ddb

group Subida de archivos
  user -> spa : selecciona foto/documento
  spa -> api : POST /api/vehiculos/archivos/presign\n{categoria, contentType, nombre, size}
  api -> api : valida tipo y tamaño (Zod + reglas)
  api --> spa : { key, uploadUrl, maxSize }
  spa -> s3 : PUT uploadUrl (mismo Content-Length)
  s3 --> spa : 200 OK
end

group Registro del vehículo
  spa -> api : POST /api/vehiculos\n{ ..., fotos:[key], documentos:[{key,nombre}] }
  api -> s3 : HeadObject (verifica cada archivo)
  s3 --> api : metadata real (tipo/tamaño)
  api -> ddb : PutCommand (vehículo)
  ddb --> api : ok
  api --> spa : 201 { message, vehiculo }
end

note right of api
  Al actualizar y quitar un archivo,
  se borra el objeto en S3
  (deleteObject) para no dejar basura.
end note
@enduml
```

---

## Diagrama 9 — Movimiento de inventario (stock condicional)

```plantuml
@startuml
title Secuencia — Registrar entrada/salida de repuesto
skinparam shadowing false

actor "Jefe/Vendedor/Admin" as user
participant "Backend" as api
participant "repuestoRepository" as repo
participant "movimientoRepository" as mrepo
database "DynamoDB" as ddb

user -> api : POST /api/movimientos\n{ repuestoId, tipo, cantidad, motivo }
api -> repo : findById(repuestoId)
repo -> ddb : GetCommand
ddb --> repo : repuesto (o null)
alt Repuesto no existe
  api --> user : 404 Not Found
else Repuesto existe
  api -> repo : adjustStock(repuestoId, delta)
  repo -> ddb : UpdateCommand con ConditionExpression\n(cantidad >= :requerido si es salida)
  alt Stock suficiente
    ddb --> repo : nuevo stock
    api -> mrepo : save(movimiento)
    mrepo -> ddb : PutCommand
    api --> user : 201 { movimiento }
  else Stock insuficiente
    ddb --> repo : ConditionalCheckFailedException
    repo --> api : error
    api --> user : 409 Conflict (stock insuficiente)
  end
end
@enduml
```

---

## Diagrama 10 — Seguimiento comercial de clientes (HU07)

```plantuml
@startuml
title Secuencia — Registrar cliente comercial y consulta (HU07)
skinparam shadowing false

actor Vendedor as v
participant "Frontend\n(React)" as fe
participant "Backend\n(Express)" as be
database "DynamoDB\nClientesComerciales" as db

v -> fe : Completa el formulario del cliente
fe -> be : POST /api/clientes-comerciales\n(Bearer token admin/vendedor)
be -> be : validate(createClienteComercialSchema)
be -> db : Query email-index y documento-index\n(¿el correo o documento ya existen?)
alt Dato ya registrado
  db --> be : ítem encontrado
  be --> fe : 409 CONFLICT\n"Ya existe un cliente con ese correo/documento"
  fe --> v : Toast de error (no se duplica nada)
else Sin duplicados
  db --> be : vacío
  be -> db : PutCommand (clienteId = UUID)
  db --> be : OK
  be --> fe : 201 { message, cliente }
  fe --> v : Listado actualizado
end

v -> fe : Registra una consulta (interés / vehículo)
fe -> be : POST /api/clientes-comerciales/{id}/consultas
be -> be : validate(consultaClienteSchema)
be -> db : UpdateCommand (push en lista consultas + fecha)
db --> be : ítem actualizado
be --> fe : 201 { message, cliente }
fe --> v : Historial con la nueva consulta
@enduml
```

---

## Diagrama extra — Flujo general de una petición (resumen)

```plantuml
@startuml
title Flujo general de una petición
skinparam shadowing false
start
:Cliente envía petición HTTP;
:Express recibe la ruta;
if (¿Ruta requiere auth?) then (sí)
  :requireAuth verifica JWT;
  if (¿Token válido?) then (no)
    :401 Unauthorized;
    stop
  endif
  if (¿Rol permitido?) then (no)
    :403 Forbidden;
    stop
  endif
endif
:Controller valida con Zod;
if (¿Datos válidos?) then (no)
  :400 ValidationError;
  stop
endif
:Service aplica reglas de negocio;
:Repository accede a DynamoDB;
:Controller devuelve JSON + status;
stop
@enduml
```
