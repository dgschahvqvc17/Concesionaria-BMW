import type { ClienteComercial, ConsultaCliente } from '@/types/clienteComercial';

const REMITENTE = 'Concesionaria BMW';

type ConsultaCorreo = Pick<ConsultaCliente, 'vehiculo' | 'interes' | 'observacion'>;

export function asuntoConsulta(): string {
  return `Confirmación de consulta - ${REMITENTE}`;
}

export function cuerpoConsulta(cliente: ClienteComercial, consulta: ConsultaCorreo): string {
  const lineas = [
    `Estimado/a ${cliente.nombres} ${cliente.apellidos}:`,
    '',
    'Gracias por contactarnos. Registramos tu consulta con el siguiente detalle:',
    '',
  ];

  if (consulta.vehiculo) lineas.push(`Vehículo de interés: ${consulta.vehiculo}`);
  lineas.push(`Interés: ${consulta.interes}`);
  if (consulta.observacion) lineas.push(`Observación: ${consulta.observacion}`);

  lineas.push(
    '',
    'Un asesor se pondrá en contacto contigo a la brevedad.',
    '',
    'Saludos cordiales,',
    REMITENTE
  );

  return lineas.join('\r\n');
}

/** Arma el enlace `mailto:` con destinatario, asunto y cuerpo redactados. */
export function enlaceCorreoConsulta(cliente: ClienteComercial, consulta: ConsultaCorreo): string {
  const subject = encodeURIComponent(asuntoConsulta());
  const body = encodeURIComponent(cuerpoConsulta(cliente, consulta));
  return `mailto:${encodeURIComponent(cliente.email)}?subject=${subject}&body=${body}`;
}

/** Abre el cliente de correo del usuario con la confirmación de la consulta redactada. */
export function abrirCorreoConsulta(cliente: ClienteComercial, consulta: ConsultaCorreo): void {
  window.location.href = enlaceCorreoConsulta(cliente, consulta);
}
