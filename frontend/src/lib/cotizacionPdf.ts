import { jsPDF } from 'jspdf';

import { ESTADO_COTIZACION_LABELS } from '@/lib/cotizaciones';
import { formatPrecio } from '@/lib/repuestos';
import type { Cotizacion } from '@/types/cotizacion';

const AZUL: [number, number, number] = [29, 111, 216];
const TEXTO: [number, number, number] = [23, 23, 23];
const GRIS: [number, number, number] = [100, 116, 139];

const MARGEN = 48;
const DERECHA = 595.28 - MARGEN;

function formatearFecha(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function nombreArchivoCotizacion(cotizacion: Cotizacion): string {
  return `Cotizacion-${cotizacion.numero}.pdf`;
}

/** Construye el documento PDF de una cotización (HU08). */
export function crearDocumentoCotizacion(cotizacion: Cotizacion): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...AZUL);
  doc.text('Concesionaria BMW', MARGEN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text('Cotización comercial', MARGEN, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TEXTO);
  doc.text(cotizacion.numero, DERECHA, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(`Emitida: ${formatearFecha(cotizacion.createdAt)}`, DERECHA, y + 16, { align: 'right' });
  doc.text(`Vence: ${formatearFecha(cotizacion.fechaVencimiento)}`, DERECHA, y + 30, { align: 'right' });

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
  const { cliente } = cotizacion;
  doc.text(`${cliente.nombres} ${cliente.apellidos}`, MARGEN, y + 16);
  doc.text(`Documento: ${cliente.documento}`, MARGEN, y + 30);
  doc.text(`Email: ${cliente.email}`, DERECHA, y + 16, { align: 'right' });
  doc.text(`Teléfono: ${cliente.telefono}`, DERECHA, y + 30, { align: 'right' });

  y += 58;
  doc.setFillColor(...AZUL);
  doc.rect(MARGEN, y - 12, DERECHA - MARGEN, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Vehículo', MARGEN + 8, y + 2);
  doc.text('Año', 360, y + 2, { align: 'right' });
  doc.text('Precio', DERECHA - 8, y + 2, { align: 'right' });

  y += 24;
  doc.setFont('helvetica', 'normal');
  cotizacion.items.forEach((item) => {
    doc.setFontSize(9);
    doc.setTextColor(...TEXTO);
    doc.text(`${item.marca} ${item.modelo} ${item.version}`, MARGEN + 8, y);
    doc.text(String(item.anio), 360, y, { align: 'right' });
    doc.text(formatPrecio(item.precioUnitario), DERECHA - 8, y, { align: 'right' });
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(`VIN: ${item.vin ?? '—'}`, MARGEN + 8, y);
    y += 16;
  });

  y += 4;
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
  fila('Subtotal', formatPrecio(cotizacion.subtotal));
  fila(`Descuento (${cotizacion.descuentoPorcentaje}%)`, `- ${formatPrecio(cotizacion.descuentoMonto)}`);
  fila('Total', formatPrecio(cotizacion.total), true);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`Estado: ${ESTADO_COTIZACION_LABELS[cotizacion.estado]}`, MARGEN, y);

  if (cotizacion.observaciones) {
    y += 18;
    doc.setTextColor(...TEXTO);
    doc.text('Observaciones', MARGEN, y);
    doc.setTextColor(70, 70, 70);
    const lineas = doc.splitTextToSize(cotizacion.observaciones, DERECHA - MARGEN);
    doc.text(lineas, MARGEN, y + 14);
  }

  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text('Documento generado por la plataforma de Concesionaria BMW.', MARGEN, 812);

  return doc;
}

/** Genera y descarga el PDF de la cotización. */
export function descargarCotizacionPdf(cotizacion: Cotizacion): void {
  crearDocumentoCotizacion(cotizacion).save(nombreArchivoCotizacion(cotizacion));
}
