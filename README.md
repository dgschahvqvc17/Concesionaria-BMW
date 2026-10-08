# Concesionaria BMW

Este documento describe el proyecto **Concesionaria BMW**, una primera aplicación web construida con **Node.js** y **Express**.

---

## Descripción

**Concesionaria BMW** es una aplicación web del lado del servidor (backend) orientada a la presentación y gestión de vehículos BMW. Responde mensajes de texto según la ruta que se solicite y ofrece una lista de vehículos en formato JSON, sin base de datos ni funcionalidades complejas.

---

## Objetivo de esta práctica

El objetivo es construir la primera aplicación web del curso de Tecnología Web II utilizando **Node.js** y **Express**. Con esta práctica se demuestra que un servidor puede recibir pedidos (requests) y entregar respuestas distintas según la ruta pedida (response).

---

## Tecnologías utilizadas

- **Node.js** – entorno que permite ejecutar JavaScript fuera del navegador.
- **Express** – framework que facilita crear el servidor y manejar las rutas.
- **npm** – gestor de paquetes de Node.js, se usó para crear el `package.json` e instalar Express.
- **JavaScript** – lenguaje con el que está escrito el servidor.

---

## Rutas disponibles

| Ruta | Descripción |
|------|-------------|
| `GET /` | Mensaje de bienvenida de la Concesionaria BMW. |
| `GET /bienvenido` | Variante del mensaje de bienvenida de la Concesionaria BMW. |
| `GET /info` | Breve descripción del sistema. |
| `GET /contacto` | Información de contacto ficticia de la concesionaria. |
| `GET /vehiculos` | Lista de vehículos BMW disponibles (texto). |
| `GET /productos` | Lista de vehículos BMW en formato JSON. |
| `GET /api/productos` | Cantidad total y lista de vehículos en formato JSON. |

### Ejemplos de respuesta

- `GET /` → `Bienvenido a Concesionaria BMW`
- `GET /info` → `Concesionaria BMW es un sistema para la presentación y gestión de vehículos BMW.`
- `GET /contacto` → `Concesionaria BMW - Teléfono: 70000000 - Correo: contacto@bmw.com (datos ficticios de demostración)`
- `GET /vehiculos` → `Vehículos BMW disponibles: BMW Serie 3, BMW Serie 5, BMW X3, BMW X5`
- `GET /productos` → `[{"id":1,"marca":"BMW","modelo":"Serie 3","anio":2024,"precio":52000}, ...]`
- `GET /api/productos` → `{"total":4,"productos":[{"id":1,"marca":"BMW","modelo":"Serie 3","anio":2024,"precio":52000}, ...]}`
- Cualquier ruta inexistente → `404` con `{"error":"Ruta no encontrada"}`

---

## Ejecución

Para levantar el servidor:

```bash
cd backend
node server.js
```

También se puede iniciar con el script `start` definido en el `package.json`:

```bash
cd backend
npm start
```

Ambos comandos levantan el mismo servidor. Para detenerlo se usa `Ctrl + C` en la terminal.

---

## Puerto

El servidor escucha en el puerto:

```text
3000
```

Una vez iniciado, se accede desde el navegador en:

```text
http://localhost:3000
```

---

## Estructura del proyecto

```text
Concesionaria-BMW/
├── backend/
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

- `backend/server.js` – el servidor Express con las rutas de la concesionaria.
- `backend/package.json` – información del proyecto, dependencia de Express y script `start`.
- `backend/package-lock.json` – archivo que npm genera con las versiones exactas instaladas.
- `backend/node_modules/` – carpeta con las librerías instaladas (Express incluido).
- `.gitignore` – archivo que indica qué carpetas y archivos no se deben subir a Git.
- `README.md` – este documento.

---

## Git y GitHub

El proyecto tiene un repositorio Git inicializado en la rama `develop` y un repositorio remoto configurado:

```text
origin  https://github.com/dgschahvqvc17/Concesionaria-BMW.git
```

Existe un archivo `.gitignore` que excluye `node_modules/`, archivos `.env` y logs. La publicación de los cambios (`git push`) la realiza el estudiante cuando lo autorice.