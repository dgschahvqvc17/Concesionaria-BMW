# Tecnología Web II - Primera Aplicación Web

Este documento describe el trabajo realizado a partir del **Punto 3 de la práctica: "La meta de hoy"**, que consiste en construir una primera aplicación web funcional utilizando Node.js y Express, con un servidor local que responde diferentes mensajes según la ruta que se solicite.

---

## 1. Meta de la práctica

El objetivo es armar mi primera aplicación web del lado del servidor (backend).

Con Node.js y Express levanté un servidor local que escucha en el **puerto 3000** y que responde de manera diferente según la dirección que se visite en el navegador:

- En la ruta `/` responde que la aplicación está funcionando.
- En la ruta `/bienvenido` responde un mensaje de bienvenida.

La idea es demostrar que el servidor puede recibir pedidos (requests) y entregar respuestas distintas según la ruta pedida.

---

## 2. Tecnologías utilizadas

- **Visual Studio Code** – editor donde escribí y ejecuté el proyecto.
- **Node.js** – entorno que permite ejecutar JavaScript fuera del navegador.
- **npm** – gestor de paquetes de Node.js, se usó para crear el `package.json` e instalar Express.
- **Express** – framework que facilita crear el servidor y manejar las rutas.
- **JavaScript** – lenguaje con el que está escrito el servidor.

---

## 3. Backend

La carpeta donde vive el servidor es:

```text
backend
```

Dentro de ella se encuentra todo lo necesario para que la aplicación funcione: el archivo `package.json`, el archivo `package-lock.json`, la carpeta `node_modules` (donde se instalan las librerías) y el archivo `server.js`.

Esta carpeta se creó durante esta práctica porque el proyecto estaba vacío, es decir, no existía ningún backend previo que reutilizar.

---

## 4. Inicialización del proyecto

Dentro de la carpeta `backend` ejecuté:

```bash
npm init -y
```

Este comando crea automáticamente el archivo `package.json`, que es el archivo donde Node.js guarda la información del proyecto: el nombre, la versión, los scripts y las dependencias instaladas.

---

## 5. Instalación de Express

Después inicialicé el proyecto, instalé Express con:

```bash
npm install express
```

Ese comando descargó Express y lo guardó en la carpeta `node_modules`. Además, `npm` agregó Express dentro del apartado `dependencies` del `package.json`, así quedó registrado como dependencia del proyecto.

Express es el framework que me permite crear el servidor y definir las rutas de forma sencilla, sin tener que configurar muchas cosas a mano.

---

## 6. Servidor

El servidor está en el archivo:

```text
backend/server.js
```

Este archivo hace tres cosas:

1. Importa Express con `require('express')` y crea la aplicación con `const app = express();`
2. Registra las rutas que responden a las visitas del navegador.
3. Levanta el servidor escuchando en el **puerto 3000** con `app.listen(3000, ...)`.

Cuando el servidor arranca, muestra en la terminal este mensaje:

```text
Servidor ejecutándose en http://localhost:3000
```

---

## 7. Primera ruta

Ruta implementada:

```text
GET /
```

URL:

```text
http://localhost:3000
```

Respuesta enviada por el servidor:

```text
¡Mi aplicación web está funcionando!
```

El código que la genera es:

```js
app.get('/', (req, res) => {
  res.send('¡Mi aplicación web está funcionando!');
});
```

`res.send()` es lo que manda el texto de vuelta al navegador.

---

## 8. Segunda ruta

Ruta implementada:

```text
GET /bienvenido
```

URL:

```text
http://localhost:3000/bienvenido
```

Respuesta enviada por el servidor:

```text
Bienvenido a mi aplicación web.
```

El código que la genera es:

```js
app.get('/bienvenido', (req, res) => {
  res.send('Bienvenido a mi aplicación web.');
});
```

Esta segunda ruta sirve para demostrar que el mismo servidor puede entregar respuestas diferentes según la dirección que se solicite.

---

## 9. Ejecución del proyecto

Para levantar el servidor:

```bash
cd backend
node server.js
```

También agregué el script `start` en el `package.json`, así que se puede iniciar de la otra forma:

```bash
cd backend
npm start
```

Los dos comandos son equivalentes y levantan el mismo servidor en el puerto 3000. Para detenerlo, en la terminal se usa `Ctrl + C`.

---

## 10. Pruebas realizadas

Se comprobaron las dos rutas del servidor:

| Ruta | URL | Respuesta | Estado |
|------|-----|-----------|--------|
| `GET /` | http://localhost:3000 | ¡Mi aplicación web está funcionando! | 200 OK |
| `GET /bienvenido` | http://localhost:3000/bienvenido | Bienvenido a mi aplicación web. | 200 OK |

La forma de comprobarlas fue la siguiente:

1. Se revisó que el archivo `server.js` no tuviera errores de sintaxis.
2. Se levantó el servidor con `node server.js` y se comprobó el mensaje de inicio en la terminal.
3. Se realizaron peticiones HTTP reales a las dos direcciones con `Invoke-WebRequest`.
4. Las dos rutas respondieron con código **200** y con el texto esperado.
5. Finalmente se detuvo el servidor para no dejarlo ejecutándose.

Como ambas rutas respondieron con mensajes distintos, queda demostrado que el servidor funciona y que devuelve una respuesta diferente según la ruta solicitada.

---

## 11. Conceptos aprendidos

- **Node.js**: permite ejecutar código JavaScript en la computadora sin necesidad de un navegador. Aquí se usa para hacer funcionar el servidor.
- **npm**: es el gestor de paquetes de Node.js. Se usó para crear el `package.json` y para instalar Express.
- **Express**: es un framework de Node.js que simplifica la creación del servidor y la definición de rutas.
- **Servidor**: el programa que queda escuchando y esperando que alguien le pida información.
- **localhost**: la dirección que apunta a la misma computadora donde está corriendo el servidor. En este caso, `localhost:3000`.
- **Puerto**: el número que identifica a cuál servicio se le hacen los pedidos. En esta práctica se usa el **3000**.
- **Ruta**: la parte de la dirección que indica qué se está pidiendo, por ejemplo `/` o `/bienvenido`.
- **Request (pedido)**: es la solicitud que envía el navegador al servidor, por ejemplo al abrir `http://localhost:3000/bienvenido`.
- **Response (respuesta)**: es lo que el servidor devuelve después de recibir un pedido. En este caso, un texto.
- **GET**: el tipo de petición que se usa para pedir información. Casi todo lo que se abre en el navegador es un GET.

La idea principal de la práctica es esta:

> **El navegador pide y el servidor responde.**

Por eso en el código cada ruta tiene dos cosas: qué se está pidiendo (`req`) y qué se contesta (`res`).

---

## 12. Estructura del proyecto

La estructura final del proyecto quedó así:

```text
Tecnologia WEB 2/
├── backend/
│   ├── node_modules/
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
└── README.md
```

- `backend/server.js`: el servidor Express con las rutas `/` y `/bienvenido`.
- `backend/package.json`: información del proyecto, dependencia de Express y script `start`.
- `backend/package-lock.json`: archivo que npm genera con las versiones exactas instaladas.
- `backend/node_modules/`: carpeta con las librerías instaladas (Express incluido).
- `README.md`: este documento.

---

## 13. GitHub

> **La subida del proyecto a GitHub será realizada posteriormente por el estudiante.**

Durante esta práctica no se ejecutó ningún `git push` ni se creó o modificó un repositorio remoto. Todo el trabajo se hizo únicamente sobre los archivos locales del proyecto.