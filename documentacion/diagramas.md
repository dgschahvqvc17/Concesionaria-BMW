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
| 11 | Generación de cotización (HU08) | Secuencia |
| 12 | Reserva de vehículo y conversión en venta (HU09) | Secuencia |
| 13 | Registro de venta de vehículo (HU10) | Secuencia |
| 14 | Prueba de manejo: solicitud y gestión (HU11) | Secuencia |
| 15 | Notificaciones por correo (HU12) | Secuencia |
| 16 | Citas del taller (HU13) | Secuencia |
| 17 | Asignar trabajos a los mecánicos (HU14) | Secuencia |

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

database "Amazon DynamoDB\n(11 tablas + GSIs)" as ddb
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
    database "Cotizaciones" as t6
    database "Reservas" as t7
    database "Ventas" as t8
    database "PruebasManejo" as t9
    database "Notificaciones" as t10
    database "CitasTaller" as t11
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
  usecase "Generar cotizaciones (HU08)" as UC_cotizaciones
  usecase "Gestionar reservas (HU09)" as UC_reservas
  usecase "Registrar ventas (HU10)" as UC_ventas
  usecase "Solicitar y gestionar pruebas de manejo (HU11)" as UC_pruebas
  usecase "Consultar y reenviar notificaciones (HU12)" as UC_notificaciones
  usecase "Gestionar citas del taller (HU13)" as UC_citas_taller
  usecase "Asignar trabajos a los mecanicos (HU14)" as UC_asignar_trabajos
  usecase "Gestionar usuarios y roles (HU02)" as UC_usuarios
}

visitante --> UC_catalogo
visitante --> UC_pruebas : solicitud anonima
cliente --> UC_catalogo
cliente --> UC_registro
cliente --> UC_login
cliente --> UC_pruebas : con su sesion

mecanico --> UC_login
mecanico --> UC_consultar
mecanico --> UC_asignar_trabajos : consulta sus trabajos

jefe --> UC_login
jefe --> UC_consultar
jefe --> UC_repuestos
jefe --> UC_movimientos
jefe --> UC_citas_taller
jefe --> UC_asignar_trabajos

vendedor --> UC_login
vendedor --> UC_vehiculos
vendedor --> UC_archivos
vendedor --> UC_repuestos
vendedor --> UC_movimientos
vendedor --> UC_clientes
vendedor --> UC_cotizaciones
vendedor --> UC_reservas
vendedor --> UC_ventas
vendedor --> UC_pruebas
vendedor --> UC_notificaciones

admin --> UC_login
admin --> UC_vehiculos
admin --> UC_archivos
admin --> UC_repuestos
admin --> UC_movimientos
admin --> UC_clientes
admin --> UC_cotizaciones
admin --> UC_reservas
admin --> UC_ventas
admin --> UC_pruebas
admin --> UC_notificaciones
admin --> UC_citas_taller
admin --> UC_asignar_trabajos
admin --> UC_usuarios
@enduml
```

> **Nota:** se evitan acentos en las etiquetas para máxima compatibilidad con cualquier
> renderizador. Si el tuyo los admite, puedes escribirlos con normalidad.

---

## Diagrama 4 — Modelo de datos en DynamoDB

```plantuml
@startuml
title Modelo de datos — DynamoDB (11 tablas)
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

entity "Cotizaciones" as cotizaciones {
  * cotizacionId <<PK>> : string
  --
  numero <<GSI numero-index>> : string
  clienteId <<GSI cliente-index>> : string
  cliente : object
  items : list<object>
  subtotal : number
  descuentoMonto : number
  total : number
  descuentoPorcentaje : number
  observaciones : string
  estado : string
  vigenciaDias : number
  fechaVencimiento : string
  createdAt : string
  updatedAt : string
}

entity "Reservas" as reservas {
  * reservaId <<PK>> : string
  --
  numero <<GSI numero-index>> : string
  clienteId <<GSI cliente-index>> : string
  cliente : object
  vehiculoId <<GSI vehiculo-index>> : string
  vehiculo : object
  condiciones : string
  monto : number
  estado : string
  vigenciaDias : number
  fechaVencimiento : string
  observaciones : string
  historial : list<object>
  createdAt : string
  updatedAt : string
}

entity "Ventas" as ventas {
  * ventaId <<PK>> : string
  --
  numero <<GSI numero-index>> : string
  clienteId <<GSI cliente-index>> : string
  cliente : object
  vehiculoId <<GSI vehiculo-index>> : string
  vehiculo : object
  reservaId : string
  numeroReserva : string
  precioLista : number
  descuentoPorcentaje : number
  descuentoMonto : number
  precioFinal : number
  observaciones : string
  fechaVenta : string
  createdAt : string
  updatedAt : string
}

entity "PruebasManejo" as pruebas {
  * pruebaId <<PK>> : string
  --
  numero <<GSI numero-index>> : string
  vehiculoId <<GSI vehiculo-index>> : string
  vehiculo : object
  clienteId <<GSI cliente-index>> : string
  cliente : object
  contacto : object
  fechaHora : string
  duracionMinutos : number
  estado : string
  origen : string
  observaciones : string
  historial : list<object>
  createdAt : string
  updatedAt : string
}

entity "Notificaciones" as notificaciones {
  * eventoId <<PK>> : string
  --
  recursoId <<GSI recurso-index>> : string
  tipo : string
  evento : string
  numero : string
  destinatario : string
  destinatarioNombre : string
  asunto : string
  cuerpo : string
  estado : string
  intentos : number
  maxIntentos : number
  ultimoResultado : string
  ultimoIntentoAt : string
  historial : list<object>
  createdAt : string
  updatedAt : string
}

entity "CitasTaller" as citas {
  * citaId <<PK>> : string
  --
  numero <<GSI numero-index>> : string
  vehiculoId <<GSI vehiculo-index>> : string
  vehiculo : object
  clienteId <<GSI cliente-index>> : string
  cliente : object
  tipoServicio : string
  fechaHora : string
  duracionMinutos : number
  estado : string
  mecanicoId <<GSI mecanico-index>> : string
  mecanico : object
  asignadoAt : string
  asignaciones : list<object>
  observaciones : string
  historial : list<object>
  createdAt : string
  updatedAt : string
}

usuarios ||..o{ movimientos : "crea"
usuarios ||..o{ vehiculos : "registra"
movimientos }o..|| repuestos : "afecta"
usuarios ||..o{ repuestos : "gestiona"
usuarios ||..o{ clientes : "da seguimiento"
clientes ||..o{ cotizaciones : "recibe"
vehiculos ||..o{ cotizaciones : "se cotiza"
clientes ||..o{ reservas : "reserva"
vehiculos ||..o{ reservas : "se reserva"
clientes ||..o{ ventas : "compra"
vehiculos ||..o{ ventas : "se vende"
reservas ||..o{ ventas : "origina"
vehiculos ||..o{ pruebas : "se prueba"
clientes ||..o{ pruebas : "solicita"
reservas ||..o{ notificaciones : "genera correo"
cotizaciones ||..o{ notificaciones : "genera correo"
pruebas ||..o{ notificaciones : "genera correo"
ventas ||..o{ notificaciones : "genera correo"
vehiculos ||..o{ citas : "recibe servicio"
clientes ||..o{ citas : "agenda"
usuarios ||..o{ citas : "trabaja como mecanico asignado"
citas ||..o{ notificaciones : "genera correo"

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

## Diagrama 11 — Generación de cotización (HU08)

```plantuml
@startuml
title Secuencia — Generar cotización (HU08)
skinparam shadowing false

actor Vendedor as v
participant "Frontend\n(React)" as fe
participant "Backend\n(Express)" as be
database "DynamoDB\nCotizaciones" as db
database "DynamoDB\nVehiculos/Clientes" as db2

v -> fe : Selecciona cliente y vehículos,\naplica descuento
fe -> be : POST /api/cotizaciones\n(Bearer token admin/vendedor)
be -> be : validate(createCotizacionSchema)\n(descuento <= 20%, vigencia 1-90)
be -> db2 : GetCommand cliente + vehiculos
alt Vehículo no cotizable / cliente inexistente
  db2 --> be : vendido / no existe
  be --> fe : 409 CONFLICT / 404 NOT FOUND
  fe --> v : Toast de error
else Datos válidos
  db2 --> be : cliente + vehiculos (precios vigentes)
  be -> db : UpdateItem ADD secuencia#<año> (número único)
  db --> be : secuencia
  be -> be : snapshot items + calcular subtotal/descuento/total\nnumero = COT-AAAA-######
  be -> db : PutCommand (cotizacionId = UUID)
  db --> be : OK
  be --> fe : 201 { message, cotizacion }
  fe --> v : Cotización listada (PDF on-demand)
end

v -> fe : Descargar PDF / Enviar por correo
fe -> fe : jsPDF genera el PDF / buildMailto abre el cliente
fe --> v : PDF descargado / correo redactado (mailto:)
@enduml
```

---

## Diagrama 12 — Reserva de vehículo y conversión en venta (HU09)

```plantuml
@startuml
title Secuencia — Reservar vehículo (HU09)
skinparam shadowing false

actor Vendedor as v
participant "Frontend\n(React)" as fe
participant "Backend\n(Express)" as be
database "DynamoDB\nReservas" as db
database "DynamoDB\nVehiculos/Clientes" as db2

v -> fe : Selecciona cliente y vehículo disponible
fe -> be : POST /api/reservas\n(Bearer token admin/vendedor)
be -> be : validate(createReservaSchema)\n(vigencia 1-365)
be -> db2 : GetCommand cliente + vehiculo
alt Vehículo no disponible / cliente inexistente
  db2 --> be : reservado / vendido / no existe
  be --> fe : 409 CONFLICT / 404 NOT FOUND
  fe --> v : Toast de error
else Datos válidos
  be -> db2 : UpdateItem estado=reservado\nConditionExpression estado=disponible
  alt Condición no cumplida
    db2 --> be : ConditionalCheckFailed
    be --> fe : 409 CONFLICT
  else Condición cumplida
    db2 --> be : vehiculo reservado
    be -> db : UpdateItem ADD secuencia#<año> (número único)
    db --> be : secuencia
    be -> be : snapshot cliente/vehiculo\nnumero = RES-AAAA-######
    be -> db : PutCommand (reservaId = UUID)
    db --> be : OK
    be --> fe : 201 { message, reserva }
    fe --> v : Reserva listada
  end
end

v -> fe : Cancelar o convertir en venta
fe -> be : POST /api/reservas/{id}/cancelar | /convertir
be -> db : UpdateItem estado (historial)\n+ vehiculo disponible | vendido
db --> be : OK
be --> fe : 200 { message, reserva }
fe --> v : Estado actualizado (vehículo liberado o vendido)
@enduml
```

---

## Diagrama 13 — Registro de venta de vehículo (HU10)

```plantuml
@startuml
title Secuencia — Registrar venta (HU10)
skinparam shadowing false

actor Vendedor as v
participant "Frontend\n(React)" as fe
participant "Backend\n(Express)" as be
database "DynamoDB\nVentas" as db
database "DynamoDB\nVehiculos/Clientes/Reservas" as db2

v -> fe : Selecciona cliente, vehículo y descuento
fe -> be : POST /api/ventas\n(Bearer token admin/vendedor)
be -> be : validate(createVentaSchema)\n(descuento <= 20%, fecha no futura)
be -> db2 : GetCommand cliente + vehiculo
alt Vehículo no vendible / cliente inexistente / ya vendido
  db2 --> be : vendido / no_disponible / ya vendido / no existe
  be --> fe : 409 CONFLICT / 404 NOT FOUND
  fe --> v : Toast de error
else Datos válidos
  be -> be : Verifica de nuevo la disponibilidad\n(disponible o reservado con reserva vigente)
  be -> db2 : UpdateItem estado=vendido\nConditionExpression estado=<leído>
  alt Condición no cumplida (otra venta ganó)
    db2 --> be : ConditionalCheckFailed
    be --> fe : 409 CONFLICT
  else Condición cumplida
    db2 --> be : vehiculo vendido
    be -> db : UpdateItem ADD secuencia#<año> (número único)
    db --> be : secuencia
    be -> be : precioFinal = precioLista - descuentoMonto\nnumero = VTA-AAAA-######
    be -> db : PutCommand (ventaId = UUID, snapshot)
    db --> be : OK
    opt Venta sobre unidad reservada
      be -> db2 : UpdateItem reserva estado=convertida (ventaNumero)
    end
    be --> fe : 201 { message, venta }
    fe --> v : Venta en el historial
  end
end

v -> fe : Ver comprobante
fe -> fe : jsPDF genera Comprobante-VTA-AAAA-######.pdf
fe --> v : PDF descargado
@enduml
```

---

## Diagrama 14 — Prueba de manejo: solicitud y gestión (HU11)

```plantuml
@startuml
title Secuencia — Prueba de manejo (HU11)
skinparam shadowing false

actor Visitante as visitante
actor Vendedor as v
participant "Frontend\n(React)" as fe
participant "Backend\n(Express)" as be
database "DynamoDB\nPruebasManejo" as db
database "DynamoDB\nVehiculos/Clientes" as db2

visitante -> fe : Detalle del vehículo publicado\n"Solicitar prueba de manejo"
fe -> be : POST /api/pruebas-man\n(optionalAuth: sin token)
be -> be : validate(createPruebaManejoSchema)\n(futura, 08:00-18:00, paso 15 min)
be -> db2 : GetCommand vehiculo
alt Vehiculo inexistente
  db2 --> be : no existe
  be --> fe : 404 NOT FOUND
else No publicado o no disponible
  db2 --> be : publicado=false / vendido
  be --> fe : 409 CONFLICT
else Vehiculo apto (disponible o reservado)
  db2 --> be : vehiculo
  be -> db : Query GSI vehiculo-index\n(pruebas del vehículo)
  db --> be : agenda
  alt Ventana solapada con otra prueba
    be --> fe : 409 CONFLICT (numero en conflicto)
  else Horario libre
    be -> db : UpdateItem ADD secuencia#<año> (numero unico)
    db --> be : secuencia
    be -> db : PutCommand (pruebaId = UUID,\nestado=pendiente, origen, historial)
    db --> be : OK
    be --> fe : 201 { message, prueba } (PRB-AAAA-######)
    fe --> visitante : Confirmacion
  end
end

note over be
  Si el POST llega con token, el clienteId del staff
  se vincula; sin token queda clienteId='anonimo'.
end note

v -> fe : /pruebas-man (admin/vendedor)\nlista con filtros cliente/vehiculo/estado
fe -> be : GET /api/pruebas-man (Bearer admin/vendedor)
be -> db : Query (indice por filtro) o Scan
db --> be : pruebas
be --> fe : 200 { pruebas, total }

v -> fe : Confirmar / Reprogramar / Cancelar / Realizar
fe -> be : POST /api/pruebas-man/:id/<accion>\n(Bearer admin/vendedor)
be -> db : GetCommand prueba
alt Estado no permitido (ej. confirmar dos veces)
  be --> fe : 409 CONFLICT
else Transicion valida
  be -> db : Query vehiculo-index (si reprograma)\nrevalida solapes
  be -> db : UpdateCommand estado + historial
  db --> be : OK
  be --> fe : 200 { message, prueba }
  fe --> v : Estado actualizado + toast
end
@enduml
```

---

## Diagrama 15 — Notificaciones por correo (HU12)

```plantuml
@startuml
title Secuencia — Notificaciones por correo (HU12)
skinparam shadowing false

actor Vendedor as v
participant "Frontend\n(React)" as fe
participant "Backend\n(Express)" as be
database "DynamoDB\nOperacion\n(Reserva/Cotizacion/...)" as db
database "DynamoDB\nNotificaciones" as ddb

group Operacion de negocio (ej. crear reserva)
  v -> fe : Completa el formulario
  fe -> be : POST /api/reservas (Bearer admin/vendedor)
  be -> db : PutCommand (operacion)
  db --> be : OK
  be -> ddb : PutCommand condicional\n(eventoId = tipo:recurso:evento:destinatario)\nregistrarSinFallo
  alt Registro duplicado
    ddb --> be : ConditionalCheckFailed (se ignora)
  else Registro nuevo
    ddb --> be : notificacion pendiente
  end
  be --> fe : 201 { message, reserva }
  fe --> v : Operacion confirmada
end

group Envio del correo (HU12)
  v -> fe : /notificaciones o detalle de la operacion\n"Enviar"
  fe -> be : GET /api/notificaciones (filtros opcionales)
  be -> ddb : Scan/Query (GSI recurso-index)
  ddb --> be : notificaciones
  be --> fe : 200 { notificaciones, total }

  fe -> be : POST /api/notificaciones/:eventoId/enviar\n(Bearer admin/vendedor)
  be -> ddb : GetCommand (notificacion)
  alt Sin correo / estado omitido
    be --> fe : 400 (la operacion no tiene correo)
  else Mas de 5 intentos
    be --> fe : 409 (maximo de intentos alcanzado)
  else Envio permitido
    be -> be : registrar intento (+1, historial[])
    be -> ddb : UpdateCommand (intentos, estado,\nhistorial, ultimoResultado)
    ddb --> be : OK
    be --> fe : 200 { message, mailto, notificacion }
    fe -> fe : abrirMailto(mailto)\n(cotizaciones: ademas descarga el PDF con jsPDF)
    fe --> v : Se abre el gestor de correo del usuario
  end
end

note right of be
  Transporte mailto: sin Amazon SES (capa gratuita).
  registrarSinFallo: un fallo al registrar
  la notificacion nunca revierte la operacion.
  Dedup: PK unica + Put condicional.
end note
@enduml
```

---

## Diagrama 16 — Citas del taller (HU13)

```plantuml
@startuml
title Secuencia — Citas del taller (HU13)
skinparam shadowing false

actor "Jefe de taller" as jefe
participant "Frontend\n/citas" as fe
participant "API\n/api/citas-taller" as api
participant "citaTaller\nController" as ctrl
participant "citaTaller\nService" as svc
participant "citaTaller\nRepository" as repo
database "DynamoDB\nCitasTaller" as db
database "DynamoDB\nVehiculos/Clientes" as db2
database "DynamoDB\nNotificaciones" as ddb

group Alta de una cita
  jefe -> fe : /citas "Nueva cita"\n(vehiculo, cliente, tipoServicio, fecha)
  fe -> api : POST /api/citas-taller\n(Bearer admin/jefe_taller)
  api -> ctrl : asyncHandler(create)
  ctrl -> ctrl : validate(createCitaTallerSchema)
  ctrl -> svc : createCita(datos, actor)
  svc -> db2 : GetCommand vehiculo / cliente
  alt Vehiculo o cliente inexistente
    db2 --> svc : no existe
    svc --> api : 404 NOT FOUND
  else Recursos ok
    db2 --> svc : vehiculo + cliente (snapshots)
    svc -> repo : findByVehiculo (GSI vehiculo-index)
    repo -> db : Query (citas del vehiculo)
    db --> repo : agenda
    repo --> svc : citas
    svc -> svc : valida fecha futura 08:00-18:00,\npaso 15 min y duracion 15-480
    alt Ventana solapada (solicitada/confirmada/en_atencion)
      svc --> api : 409 CONFLICT (cita en conflicto)
    else Horario libre
      svc -> repo : siguienteSecuencia(anio)
      repo -> db : UpdateItem ADD secuencia#<año> (numero unico)
      db --> repo : secuencia
      repo --> svc : CIT-AAAA-######
      svc -> repo : save (citaId UUID, estado=solicitada,\nsnapshots, historial)
      repo -> db : PutCommand
      db --> repo : OK
      svc -> ddb : notificarCita 'cita_solicitada'\nregistrarSinFallo (dedup eventoId)
      ddb --> svc : pendiente (un fallo no revierte el alta)
      svc --> api : cita
      api --> fe : 201 { message, cita }
      fe --> jefe : Confirmacion + badge "solicitada"
    end
  end
end

group Gestion de la cita (confirmar, iniciar, finalizar, reprogramar, cancelar)
  jefe -> fe : Detalle de la cita "Confirmar"
  fe -> api : POST /api/citas-taller/:citaId/confirmar\n(Bearer admin/jefe_taller)
  api -> ctrl : asyncHandler(confirmar)
  ctrl -> svc : confirmarCita(citaId, datos, actor)
  svc -> repo : findById (GetCommand)
  repo -> db : GetCommand cita
  db --> repo : cita
  repo --> svc : cita
  alt Estado distinto de "solicitada"
    svc --> api : 409 CONFLICT (transicion invalida)
  else Transicion valida
    svc -> repo : update (estado=confirmada + historial)
    repo -> db : UpdateCommand
    db --> repo : OK
    svc -> ddb : notificarCita 'cita_confirmada'\nregistrarSinFallo
    ddb --> svc : pendiente
    svc --> api : cita actualizada
    api --> fe : 200 { message, cita }
    fe --> jefe : Estado actualizado + toast
  end
end

note right of svc
  Reprogramar conserva el estado y revalida
  horario y solapes; iniciar pasa
  confirmada -> en_atencion (sin notificacion);
  finalizar en_atencion -> finalizada;
  cancelar solicitada/confirmada -> cancelada
  con motivo (<= 500). Cualquier otra
  combinacion responde 409 (assertEstado).
end note

note bottom of ddb
  Tipo cita_taller, destinatario = email del
  cliente (snapshot), transporte mailto: sin
  Amazon SES (capa gratuita).
  registrarSinFallo: un fallo al notificar
  nunca revierte la operacion del taller.
end note
@enduml
```

---

## Diagrama 17 — Asignar trabajos a los mecánicos (HU14)

```plantuml
@startuml
title Secuencia — Asignar trabajos a los mecanicos (HU14)
skinparam shadowing false

actor "Jefe de taller" as jefe
actor "Mecanico" as mecanico
participant "Frontend\n/citas" as fe
participant "API\n/api/citas-taller\n/api/usuarios/mecanicos" as api
participant "citaTaller\nController" as ctrl
participant "citaTaller\nService" as svc
participant "citaTaller\nRepository" as repo
database "DynamoDB\nCitasTaller\n(GSI mecanico-index)" as db
database "DynamoDB\nUsuarios" as dbu
database "DynamoDB\nNotificaciones" as ddb

group Listar mecanicos activos
  jefe -> fe : /citas, detalle de la cita "Asignar mecanico"
  fe -> api : GET /api/usuarios/mecanicos\n(Bearer admin/jefe_taller)
  api -> ctrl : asyncHandler(listMecanicos)
  ctrl -> svc : (usuarioService.listMecanicos)
  svc -> dbu : Scan/Query usuarios\n(rol=mecanico, estado=activo)
  dbu --> svc : mecanicos
  svc --> api : { total, mecanicos } (orden por nombre)
  api --> fe : 200 { total, mecanicos }
  fe --> jefe : Selector de mecanicos activos
end

group Asignar o reasignar el mecanico responsable
  jefe -> fe : Elige mecanico (+ observaciones opcionales)
  fe -> api : POST /api/citas-taller/:citaId/asignar\n(Bearer admin/jefe_taller)\n{ mecanicoId, observaciones? }
  api -> ctrl : asyncHandler(asignar)
  ctrl -> ctrl : validate(asignarCitaSchema)
  ctrl -> svc : asignarMecanico(citaId, datos, actor)
  svc -> repo : findById (GetCommand)
  repo -> db : GetCommand cita
  db --> repo : cita
  repo --> svc : cita
  svc -> dbu : GetCommand usuario
  dbu --> svc : usuario
  alt Usuario inexistente
    svc --> api : 404 NOT FOUND
  else Rol distinto de "mecanico"
    svc --> api : 409 CONFLICT (no es mecanico)
  else Mecanico inactivo
    svc --> api : 409 CONFLICT (inactivo)
  else Estado fuera de confirmada/en_atencion
    svc --> api : 409 CONFLICT (asignacion no permitida)
  else Ya asignada al mismo mecanico
    svc --> api : 409 CONFLICT (ya asignada)
  else Asignacion valida
    svc -> svc : guarda mecanicoId, mecanico (snapshot),\nasignadoAt y agrega a asignaciones[]\n(tipo "asignada" o "reasignada")
    svc -> repo : update (asignacion + historial)
    repo -> db : UpdateCommand
    db --> repo : OK
    svc -> ddb : notificarMecanico\n'cita_asignada' / 'cita_reasignada'\nregistrarSinFallo (destinatario = email\ndel mecanico, transporte mailto:)
    ddb --> svc : pendiente
    svc --> api : cita actualizada
    api --> fe : 200 { message, cita }
    fe --> jefe : Mecanico asignado + historial
  end
end

group El mecanico consulta sus trabajos
  mecanico -> fe : /citas (rol mecanico)
  fe -> api : GET /api/citas-taller?mecanicoId=<sub del token>\n(Bearer mecanico)
  api -> ctrl : asyncHandler(list) (fuerza\nmecanicoId = req.auth.sub)
  ctrl -> svc : listCitas(filtro del mecanico)
  svc -> repo : findByMecanico (GSI mecanico-index)
  repo -> db : Query mecanico-index
  db --> repo : citas del mecanico
  repo --> svc : citas
  svc --> api : { total, citas }
  api --> fe : 200 { total, citas }
  fe --> mecanico : Solo sus trabajos asignados
end

note right of svc
  La HU14 reutiliza la tabla CitasTaller de la
  HU13 como ordenes de trabajo: no crea tabla
  nueva, solo anade el GSI mecanico-index
  (mecanicoId + fechaHora). El detalle de una
  cita ajena responde 403 al rol mecanico.
end note

note bottom of ddb
  Tipo cita_taller, eventos cita_asignada y
  cita_reasignada, destinatario = email del
  mecanico asignado, transporte mailto: sin
  Amazon SES (capa gratuita).
  registrarSinFallo: un fallo al notificar
  nunca revierte la asignacion.
end note
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
