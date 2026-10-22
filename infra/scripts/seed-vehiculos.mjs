/**
 * Carga un catálogo de vehículos BMW de ejemplo en el sistema.
 *
 * Los vehículos se registran por la API (`POST /api/vehiculos`) para que
 * pasen por la misma validación, control de VIN duplicado y auditoría
 * (HU18) que el resto del sistema.
 *
 * Uso (desde infra/, con el backend levantado en el puerto 3000):
 *   $env:API_URL="http://localhost:3000"
 *   $env:USER_POOL_ID="us-east-2_XXXX"
 *   $env:CLIENT_ID="xxxxxxxx"
 *   $env:EMAIL="admin@bmw.com"
 *   $env:PASSWORD='Passw0rd123'
 *   npm run seed-vehiculos
 *
 * Variables opcionales:
 *   SOLO_NUEVOS=1   carga únicamente los 20 vehículos nuevos
 *   SOLO_USADOS=1   carga únicamente los 10 vehículos usados
 */
import { InitiateAuthCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

const REGION = process.env.AWS_REGION || 'us-east-2';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const EMAIL = process.env.EMAIL || 'admin@bmw.com';
const PASSWORD = process.env.PASSWORD || 'Passw0rd123';

const SOLO_NUEVOS = process.env.SOLO_NUEVOS === '1';
const SOLO_USADOS = process.env.SOLO_USADOS === '1';

/** Caracteres válidos para un VIN (17, sin I, O ni Q). */
const ALFA = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';

/** Genera un VIN único y válido a partir de un prefijo de fabricante. */
function generarVin(prefijo, indice) {
  const numero = String(100000000 + indice * 7919).padStart(9, '0');
  let sufijo = '';
  for (let i = 0; i < 5; i += 1) {
    sufijo += ALFA[(indice * (i + 3) * 7 + i) % ALFA.length];
  }
  return `${prefijo}${numero}${sufijo}`.toUpperCase();
}

/** 20 vehículos nuevos (kilometraje de entrega). */
const NUEVOS = [
  ['WBA', 'i4', 'eDrive40', 'sedan', 2025, 8, 52900, 'Blanco', 'Eléctrico puro con 400 km de autonomía y carga rápida de 150 kW.'],
  ['WBA', 'i5', 'M60 xDrive', 'sedan', 2025, 5, 84500, 'Negro', 'Gran turismo 100% eléctrico con tracción integral xDrive.'],
  ['WBA', 'i7', 'xDrive60', 'sedan', 2025, 12, 105900, 'Azul Marino', 'Berlina eléctrica de lujo con asientos executive y nivel 3.'],
  ['WBY', 'iX', 'xDrive50', 'suv', 2025, 10, 87500, 'Gris', 'SUV 100% eléctrico con 490 km de autonomía y sonido Harman Kardon.'],
  ['WBY', 'iX1', 'eDrive20', 'suv', 2025, 6, 47900, 'Blanco', 'Compacto eléctrico urbano con Practicality Package.'],
  ['WBS', 'XM', 'Label Red', 'suv', 2025, 15, 185000, 'Negro', 'El SUV más potente del catálogo, V8 biturbo de 550 CV.'],
  ['WBS', 'M5', 'Competition', 'sedan', 2025, 14, 112500, 'Gris', 'Berlina de altas prestaciones con 625 CV y transmisión M xDrive.'],
  ['WBS', 'M4', 'Competition xDrive', 'coupe', 2025, 11, 82900, 'Verde Macao', 'Coupé deportivo con paquete carbono y frenos M Sport.'],
  ['WBS', 'M3', 'Competition xDrive', 'sedan', 2025, 9, 78500, 'Amarillo', 'Sedán de drifted con 510 CV y diferencial activo M.'],
  ['WBS', 'M2', 'Coupé', 'coupe', 2025, 7, 69500, 'Azul', 'Coupé compacto de 460 CV con transmisión manual de 6 velocidades.'],
  ['WBY', 'X5', 'xDrive40i', 'suv', 2025, 13, 71500, 'Blanco', 'SUV de siete plazas con paquete de entretenimiento para las filas traseras.'],
  ['WBY', 'X6', 'xDrive40i', 'suv', 2025, 9, 76500, 'Gris', 'Coupé SUV con techo coupé electrónicamente ajustable.'],
  ['WBY', 'X7', 'M60i', 'suv', 2025, 8, 98500, 'Negro', 'SUV premium de seis plazas con 530 CV y tracción integral.'],
  ['WBA', 'Serie 1', '120i M Sport', 'hatchback', 2025, 5, 42900, 'Rojo', 'Compacto deportivo con pantalla curved y Virtual Cockpit.'],
  ['WBA', 'Serie 3', '330i Sport Line', 'sedan', 2025, 6, 51500, 'Blanco', 'Sedán compacto con motor mild hybrid de 255 CV.'],
  ['WBS', 'Serie 4', '430i M Sport', 'coupe', 2025, 8, 62500, 'Azul', 'Coupé de dos puertas con escape deportivo M.'],
  ['WBA', 'Serie 4', '440i Gran Coupé', 'sedan', 2025, 9, 67500, 'Gris', 'Coupé de cuatro puertas con portón trasero electrically abatible.'],
  ['WBA', 'Serie 5', '530i M Sport', 'sedan', 2025, 11, 68500, 'Negro', 'Berlina executive con Traveling Business Comfort.'],
  ['WBA', 'Serie 7', '840i Gran Coupé', 'sedan', 2025, 12, 99500, 'Blanco', 'Tope de gama con puertas automáticos y audio Bowers & Wilkins.'],
  ['WBS', 'Z4', 'sDrive30i M Sport', 'cabrio', 2025, 7, 56500, 'Amarillo', 'Roadster descapotable con techo de tela y modo Sport Plus.'],
];

/** 10 vehículos usados (seminuevos, con kilometraje y desgaste real). */
const USADOS = [
  ['WBA', 'Serie 3', '320i Sport Line', 'sedan', 2019, 62000, 29500, 'Plata', 'Seminuevo, un solo dueño, libro de servicio al día y revisión reciente en concesionario.'],
  ['WBA', 'Serie 1', '118i', 'hatchback', 2018, 78500, 22500, 'Azul', 'Compacto seminuevo con historial de mantenimiento y clima de dos zonas.'],
  ['WBA', 'Serie 5', '520i', 'sedan', 2017, 95000, 31500, 'Negro', 'Berlina de 2017 con interior de cuero, navegación y Parking Assistant.'],
  ['WBS', 'Serie 4', '420i Coupe', 'coupe', 2019, 69000, 34500, 'Blanco', 'Coupé seminuevo con techo solar y asistente de conducción.'],
  ['WBS', 'Serie 2', '220i Coupé', 'coupe', 2017, 96000, 24500, 'Gris', 'Coupé ágil con motor de 184 CV y llantas de 18 pulgadas.'],
  ['WBA', 'Serie 6', '640i Gran Coupé', 'sedan', 2018, 81000, 44500, 'Azul Oscuro', 'Coupé de cuatro puertas con Head-Up Display y suspensión neumática.'],
  ['WBY', 'X1', 'sDrive18i', 'suv', 2018, 88000, 26500, 'Blanco', 'SUV compacto seminuevo con Navigation Professional y garantía transferible.'],
  ['WBY', 'X3', 'xDrive30i M Sport', 'suv', 2019, 72000, 36500, 'Gris', 'SUV de media gama con paquete M Sport e historial de servicio completo.'],
  ['WBY', 'X6', 'xDrive35i', 'suv', 2019, 75000, 52500, 'Negro', 'Coupé SUV seminuevo con head-up display y asientos de cuero.'],
  ['WBS', 'Z4', '2.0i Roadster', 'cabrio', 2016, 102000, 27500, 'Rojo', 'Roadster descapotable con techo duro, en perfecto estado general.'],
];

/** Convierte la fila plana de la plantilla al cuerpo que exige la API. */
function construirVehiculo(fila, indice, condicion) {
  const [prefijo, modelo, version, tipo, anio, kilometraje, precio, color, descripcion] = fila;
  return {
    marca: 'BMW',
    modelo,
    version,
    tipo,
    anio,
    kilometraje,
    precio,
    color,
    vin: generarVin(prefijo, indice),
    condicion,
    estado: 'disponible',
    publicado: true,
    descripcion,
    caracteristicas: [
      'Un solo dueño',
      'Historial de servicio en concesionario oficial BMW',
      'Garantía oficial del fabricante',
      'Kilometraje verificado',
    ],
  };
}

async function obtenerToken() {
  if (!USER_POOL_ID || !CLIENT_ID) {
    throw new Error('Faltan USER_POOL_ID y CLIENT_ID del Cognito User Pool.');
  }
  const client = new CognitoIdentityProviderClient({ region: REGION });
  const res = await client.send(
    new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: EMAIL, PASSWORD },
    })
  );
  return res.AuthenticationResult.IdToken;
}

async function api(ruta, opciones = {}) {
  const res = await fetch(`${API_URL}${ruta}`, opciones);
  const cuerpo = await res.json().catch(() => null);
  return { status: res.status, cuerpo };
}

async function main() {
  console.log(`API: ${API_URL}`);
  const token = await obtenerToken();
  console.log(`Autenticado como ${EMAIL}\n`);

  const existentes = await api('/api/vehiculos', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const vinRegistrados = new Set((existentes.cuerpo?.vehiculos ?? []).map((v) => v.vin));

  let creados = 0;
  let omitidos = 0;

  const registrar = async (fila, indice, condicion, etiqueta) => {
    const vehiculo = construirVehiculo(fila, indice, condicion);
    if (vinRegistrados.has(vehiculo.vin)) {
      omitidos += 1;
      console.log(`· ${etiqueta} ${vehiculo.modelo} ${vehiculo.version} — omitido (VIN ya existe)`);
      return;
    }
    const res = await api('/api/vehiculos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(vehiculo),
    });
    if (res.status === 201) {
      creados += 1;
      console.log(`✔ ${etiqueta} ${vehiculo.modelo} ${vehiculo.version} — creado (${vehiculo.vin})`);
    } else {
      omitidos += 1;
      console.log(`✖ ${etiqueta} ${vehiculo.modelo} ${vehiculo.version} — error ${res.status}: ${JSON.stringify(res.cuerpo)}`);
    }
  };

  if (!SOLO_USADOS) {
    for (const [i, fila] of NUEVOS.entries()) {
      await registrar(fila, i, 'nuevo', '[nuevo]');
    }
  }
  if (!SOLO_NUEVOS) {
    for (const [i, fila] of USADOS.entries()) {
      await registrar(fila, i + 100, 'seminuevo', '[usado]');
    }
  }

  console.log(`\nResultado: ${creados} creados, ${omitidos} omitidos.`);
}

main().catch((err) => {
  console.error('✖ Error:', err.name || '', err.message);
  process.exit(1);
});
