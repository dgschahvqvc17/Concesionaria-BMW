import { jsPDF } from 'jspdf';

import { formatPrecio } from '@/lib/repuestos';
import type { Venta } from '@/types/venta';

const AZUL: [number, number, number] = [29, 111, 216];
const TEXTO: [number, number, number] = [23, 23, 23];
const GRIS: [number, number, number] = [100, 116, 139];

const MARGEN = 48;
const DERECHA = 595.28 - MARGEN;

function formatearFecha(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function nombreArchivoVenta(venta: Venta): string {
  return `Comprobante-${venta.numero}.pdf`;
}

/** Construye el comprobante PDF de una venta (HU10). */
export function crearDocumentoVenta(venta: Venta): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...AZUL);
  doc.text('Concesionaria BMW', MARGEN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text('Comprobante de venta de vehículo', MARGEN, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TEXTO);
  doc.text(venta.numero, DERECHA, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(`Fecha de venta: ${formatearFecha(venta.fechaVenta)}`, DERECHA, y + 16, { align: 'right' });
  if (venta.numeroReserva) {
    doc.text(`Reserva: ${venta.numeroReserva}`, DERECHA, y + 30, { align: 'right' });
  }

  y += 52;
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(1.2);
  doc.line(MARGEN, y, DERECHA, y);

  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXTO);
  doc.text('Cliente', MARGEN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(`${venta.cliente.nombres} ${venta.cliente.apellidos}`, MARGEN, y + 16);
  doc.text(`Documento: ${venta.cliente.documento}`, MARGEN, y + 30);
  doc.text(`Email: ${venta.cliente.email}`, DERECHA, y + 16, { align: 'right' });
  doc.text(`Teléfono: ${venta.cliente.telefono}`, DERECHA, y + 30, { align: 'right' });

  y += 58;
  doc.setFillColor(...AZUL);
  doc.rect(MARGEN, y - 12, DERECHA - MARGEN, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Vehículo', MARGEN + 8, y + 2);
  doc.text('Año', 360, y + 2, { align: 'right' });
  doc.text('Precio de lista', DERECHA - 8, y + 2, { align: 'right' });

  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXTO);
  doc.text(`${venta.vehiculo.marca} ${venta.vehiculo.modelo} ${venta.vehiculo.version}`, MARGEN + 8, y);
  doc.text(String(venta.vehiculo.anio), 360, y, { align: 'right' });
  doc.text(formatPrecio(venta.precioLista), DERECHA - 8, y, { align: 'right' });
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text(`VIN: ${venta.vehiculo.vin ?? '—'}`, MARGEN + 8, y);

  y += 14;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(MARGEN, y, DERECHA, y);

  y += 18;
  doc.setFontSize(10);
  const fila = (etiqueta: string, valor: string, negrita = false) => {
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.setTextColor(...TEXTO);
    doc.text(etiqueta, 360, y, { align: 'right' });
    doc.text(valor, DERECHA - 8, y, { align: 'right' });
    y += 16;
  };
  fila('Precio de lista', formatPrecio(venta.precioLista));
  fila(`Descuento (${venta.descuentoPorcentaje}%)`, `- ${formatPrecio(venta.descuentoMonto)}`);
  fila('Precio final', formatPrecio(venta.precioFinal), true);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(`Registrada por: ${venta.createdByName ?? '—'}`, MARGEN, y);

  if (venta.observaciones) {
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(...TEXTO);
    doc.text('Observaciones', MARGEN, y);
    doc.setTextColor(70, 70, 70);
    const lineas = doc.splitTextToSize(venta.observaciones, DERECHA - MARGEN);
    doc.text(lineas, MARGEN, y + 14);
  }

  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text('Documento generado por la plataforma de Concesionaria BMW.', MARGEN, 812);

  return doc;
}

/** Genera y descarga el comprobante PDF de la venta. */
export function descargarVentaPdf(venta: Venta): void {
  crearDocumentoVenta(venta).save(nombreArchivoVenta(venta));
}
