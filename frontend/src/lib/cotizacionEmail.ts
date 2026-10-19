import { ESTADO_COTIZACION_LABELS } from '@/lib/cotizaciones';
import { formatPrecio } from '@/lib/repuestos';
import type { Cotizacion } from '@/types/cotizacion';

const REMITENTE = 'Concesionaria BMW';

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function asuntoCotizacion(cotizacion: Cotizacion): string {
  return `Cotización ${cotizacion.numero} - ${REMITENTE}`;
}

export function cuerpoCotizacion(cotizacion: Cotizacion): string {
  const lineas = [
    `Estimado/a ${cotizacion.cliente.nombres} ${cotizacion.cliente.apellidos}:`,
    '',
    `Le enviamos la cotización ${cotizacion.numero} con los siguientes vehículos:`,
    '',
    ...cotizacion.items.map(
      (item) =>
        `  • ${item.marca} ${item.modelo} ${item.version} (${item.anio}) - ${formatPrecio(item.precioUnitario)}`
    ),
    '',
    `Subtotal: ${formatPrecio(cotizacion.subtotal)}`,
    `Descuento (${cotizacion.descuentoPorcentaje}%): - ${formatPrecio(cotizacion.descuentoMonto)}`,
    `Total: ${formatPrecio(cotizacion.total)}`,
    '',
    `Estado: ${ESTADO_COTIZACION_LABELS[cotizacion.estado]}`,
    `Vigencia: hasta el ${formatearFecha(cotizacion.fechaVencimiento)}`,
  ];

  if (cotizacion.observaciones) lineas.push('', `Observaciones: ${cotizacion.observaciones}`);

  lineas.push('', 'El detalle completo se adjunta en formato PDF.', '', 'Saludos cordiales,', REMITENTE);

  return lineas.join('\r\n');
}

/** Arma el enlace `mailto:` con destinatario, asunto y cuerpo redactados. */
export function enlaceCorreoCotizacion(cotizacion: Cotizacion): string {
  const subject = encodeURIComponent(asuntoCotizacion(cotizacion));
  const body = encodeURIComponent(cuerpoCotizacion(cotizacion));
  return `mailto:${encodeURIComponent(cotizacion.cliente.email)}?subject=${subject}&body=${body}`;
}

/** Abre el cliente de correo del usuario con la cotización redactada. */
export function abrirCorreoCotizacion(cotizacion: Cotizacion): void {
  window.location.href = enlaceCorreoCotizacion(cotizacion);
}
