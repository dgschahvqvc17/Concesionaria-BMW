import { useState } from 'react';
import { Eye, FileText, Filter, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuditoria } from '@/hooks/useAuditoria';
import { getErrorMessage } from '@/lib/api';
import { TIPO_AUDITORIA_LABELS, TIPOS_AUDITORIA_FILTRO, fechaAuditoriaAInput } from '@/lib/auditoria';
import type { FiltroAuditoria } from '@/types/auditoria';

/** Página de auditoría del sistema: registro de operaciones importantes (HU18). */
export function AuditoriaPage() {
  const [usuarioId, setUsuarioId] = useState('');
  const [tipo, setTipo] = useState('');
  const [recursoTipo, setRecursoTipo] = useState('');
  const [recursoId, setRecursoId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [filtro, setFiltro] = useState<FiltroAuditoria>({});

  const { eventos, total, loading, error, recargar } = useAuditoria(filtro);

  const aplicarFiltro = async () => {
    if (desde && hasta && desde > hasta) {
      toast.error('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    const filtros: FiltroAuditoria = {
      usuarioId: usuarioId.trim() || undefined,
      tipo: tipo ? (tipo as FiltroAuditoria['tipo']) : undefined,
      recursoTipo: recursoTipo.trim() || undefined,
      recursoId: recursoId.trim() || undefined,
      fechaDesde: fechaAuditoriaAInput(desde),
      fechaHasta: fechaAuditoriaAInput(hasta, true),
    };
    setFiltro(filtros);
    try {
      await recargar(filtros);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const limpiarFiltro = async () => {
    setUsuarioId('');
    setTipo('');
    setRecursoTipo('');
    setRecursoId('');
    setDesde('');
    setHasta('');
    setFiltro({});
    try {
      await recargar({});
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seguridad"
        title="Registro de auditoría"
        description="Consulta las operaciones importantes realizadas en el sistema. Solo lectura, sin posibilidad de modificar o eliminar registros."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Solo administradores
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Filter className="h-4 w-4 text-brand-blue-deep" aria-hidden="true" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
          <CardDescription>
            Filtra por usuario, tipo de operación, registro afectado o rango de fechas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="aud-usuario">Usuario ID</Label>
              <Input
                id="aud-usuario"
                placeholder="sub o userId"
                value={usuarioId}
                onChange={(event) => setUsuarioId(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de operación</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_AUDITORIA_FILTRO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_AUDITORIA_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aud-recursoTipo">Tipo de recurso</Label>
              <Input
                id="aud-recursoTipo"
                placeholder="vehiculo, usuario, cita..."
                value={recursoTipo}
                onChange={(event) => setRecursoTipo(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aud-recursoId">ID del registro</Label>
              <Input
                id="aud-recursoId"
                placeholder="recursoId"
                value={recursoId}
                onChange={(event) => setRecursoId(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="aud-desde">Desde</Label>
              <Input id="aud-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aud-hasta">Hasta</Label>
              <Input id="aud-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
            </div>
            <Button onClick={() => void aplicarFiltro()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Aplicar filtros
            </Button>
            <Button variant="outline" onClick={() => void limpiarFiltro()} disabled={loading}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo consultar el registro de auditoría</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Eventos registrados</CardTitle>
              <CardDescription>{total} registro(s) encontrados.</CardDescription>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          {loading && eventos.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Cargando auditoría…
            </div>
          ) : eventos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
              <Eye className="h-7 w-7" aria-hidden="true" />
              No hay eventos con los filtros aplicados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((evento) => (
                    <TableRow key={evento.eventoId}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(evento.fechaHora || evento.createdAt).toLocaleString('es-BO')}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[200px]">
                          <p className="font-medium">{evento.usuarioNombre}</p>
                          <p className="text-xs text-muted-foreground">{evento.usuarioEmail || evento.usuarioId || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{evento.accion}</TableCell>
                      <TableCell>
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-xs">
                          {TIPO_AUDITORIA_LABELS[evento.tipo] || evento.tipo}
                        </span>
                      </TableCell>
                      <TableCell>
                        {evento.recursoTipo && evento.recursoId ? (
                          <span className="text-xs text-muted-foreground">
                            {evento.recursoTipo}:{evento.recursoId.slice(0, 12)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate">{evento.descripcion}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{evento.ip || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AuditoriaPage;
