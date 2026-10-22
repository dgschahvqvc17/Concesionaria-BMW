import { useRef, useState } from 'react';
import { FileText, Film, Loader2, Paperclip, Plus, Trash2, Wrench, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/api';
import { REGLAS_ARCHIVO_TALLER, formatBytes, validarArchivo } from '@/lib/archivos';
import { formatPrecio } from '@/lib/repuestos';
import { citasTallerService } from '@/services/citasTaller';
import type {
  ArchivoTaller,
  ArchivoTallerInput,
  CategoriaArchivoTaller,
  CitaTaller,
  RegistrarAvanceInput,
} from '@/types/citaTaller';
import type { Repuesto as RepuestoInventario } from '@/types/repuesto';

interface TallerAvancesPanelProps {
  cita: CitaTaller;
  repuestos: RepuestoInventario[];
  onRegistrar: (input: RegistrarAvanceInput) => Promise<void>;
  loading?: boolean;
}

interface RepuestoFila {
  repuestoId: string;
  cantidad: number;
}

const MAX_ARCHIVOS = 20;

/** Documenta el diagnóstico, tareas, repuestos y archivos de la orden (HU15). */
export function TallerAvancesPanel({ cita, repuestos, onRegistrar, loading }: TallerAvancesPanelProps) {
  const [diagnostico, setDiagnostico] = useState('');
  const [observacionesTecnicas, setObservacionesTecnicas] = useState('');
  const [tareas, setTareas] = useState<string[]>([]);
  const [tareaNueva, setTareaNueva] = useState('');
  const [filas, setFilas] = useState<RepuestoFila[]>([]);
  const [archivos, setArchivos] = useState<ArchivoTallerInput[]>([]);
  const [uploading, setUploading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const repuestosUtilizados = cita.repuestosUtilizados ?? [];
  const tareasRegistradas = cita.tareas ?? [];
  const archivosRegistrados = cita.archivos ?? [];

  const agregarTarea = () => {
    const valor = tareaNueva.trim();
    if (!valor) return;
    setTareas((prev) => [...prev, valor]);
    setTareaNueva('');
  };

  const agregarFila = () => {
    const disponible = repuestos.find((r) => !filas.some((f) => f.repuestoId === r.repuestoId));
    if (!disponible) {
      toast.error('No hay más repuestos para agregar.');
      return;
    }
    setFilas((prev) => [...prev, { repuestoId: disponible.repuestoId, cantidad: 1 }]);
  };

  const cambiarFila = (index: number, cambios: Partial<RepuestoFila>) => {
    setFilas((prev) => prev.map((fila, i) => (i === index ? { ...fila, ...cambios } : fila)));
  };

  const quitarFila = (index: number) => setFilas((prev) => prev.filter((_, i) => i !== index));

  const handleFiles = async (fileList: FileList | null, categoria: CategoriaArchivoTaller) => {
    if (!fileList || fileList.length === 0) return;

    if (archivos.length + fileList.length > MAX_ARCHIVOS) {
      toast.error(`Puedes adjuntar hasta ${MAX_ARCHIVOS} archivos.`);
      return;
    }

    setUploading(true);
    const subidos: ArchivoTallerInput[] = [];
    try {
      for (const file of Array.from(fileList)) {
        const error = validarArchivo(file, categoria);
        if (error) {
          toast.error(error);
          continue;
        }
        subidos.push(await citasTallerService.subirArchivoTaller(cita.citaId, file, categoria));
      }
      if (subidos.length > 0) setArchivos((prev) => [...prev, ...subidos]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const quitarArchivo = (key: string) => setArchivos((prev) => prev.filter((a) => a.key !== key));

  const tieneAvance =
    Boolean(diagnostico.trim()) ||
    Boolean(observacionesTecnicas.trim()) ||
    tareas.length > 0 ||
    filas.length > 0 ||
    archivos.length > 0;

  const guardar = async () => {
    if (!tieneAvance) {
      toast.error('Registra al menos un diagnóstico, tarea, repuesto, observación o archivo.');
      return;
    }

    const sinStock = filas.find((fila) => {
      const repuesto = repuestos.find((r) => r.repuestoId === fila.repuestoId);
      return repuesto && fila.cantidad > repuesto.cantidad;
    });
    if (sinStock) {
      toast.error('La cantidad supera las existencias disponibles de un repuesto.');
      return;
    }

    const input: RegistrarAvanceInput = {
      ...(diagnostico.trim() ? { diagnostico: diagnostico.trim() } : {}),
      ...(observacionesTecnicas.trim() ? { observacionesTecnicas: observacionesTecnicas.trim() } : {}),
      ...(tareas.length > 0 ? { tareas: tareas.map((descripcion) => ({ descripcion })) } : {}),
      ...(filas.length > 0
        ? { repuestosUtilizados: filas.map((f) => ({ repuestoId: f.repuestoId, cantidad: f.cantidad })) }
        : {}),
      ...(archivos.length > 0 ? { archivos } : {}),
    };

    setGuardando(true);
    try {
      await onRegistrar(input);
      toast.success('Avance registrado correctamente.');
      setDiagnostico('');
      setObservacionesTecnicas('');
      setTareas([]);
      setFilas([]);
      setArchivos([]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setGuardando(false);
    }
  };

  const bloqueado = loading || guardando;

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-xl border border-border/60 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Wrench className="h-4 w-4 text-brand-blue" aria-hidden="true" />
          Registro de avances
        </p>

        <div className="space-y-2">
          <Label htmlFor="avance-diagnostico">Diagnóstico del vehículo</Label>
          <Textarea
            id="avance-diagnostico"
            rows={2}
            value={diagnostico}
            onChange={(event) => setDiagnostico(event.target.value)}
            placeholder="Describe el diagnóstico técnico del vehículo."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avance-observaciones">Observaciones técnicas</Label>
          <Textarea
            id="avance-observaciones"
            rows={2}
            value={observacionesTecnicas}
            onChange={(event) => setObservacionesTecnicas(event.target.value)}
            placeholder="Notas técnicas adicionales (opcional)."
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <p className="text-sm font-semibold">Tareas de mantenimiento o reparación</p>
        {tareasRegistradas.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {tareasRegistradas.map((tarea, index) => (
              <li key={`${tarea.descripcion}-${index}`}>· {tarea.descripcion}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={tareaNueva}
            onChange={(event) => setTareaNueva(event.target.value)}
            placeholder="Nueva tarea realizada…"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                agregarTarea();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={agregarTarea} disabled={bloqueado}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </Button>
        </div>
        {tareas.length > 0 && (
          <ul className="space-y-2">
            {tareas.map((tarea, index) => (
              <li
                key={`${tarea}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{tarea}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setTareas((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={`Quitar ${tarea}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <p className="text-sm font-semibold">Repuestos utilizados</p>
        {repuestosUtilizados.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {repuestosUtilizados.map((repuesto, index) => (
              <li key={`${repuesto.repuestoId}-${index}`}>
                · {repuesto.codigo} — {repuesto.nombre} × {repuesto.cantidad}
              </li>
            ))}
          </ul>
        )}
        {filas.map((fila, index) => {
          const repuesto = repuestos.find((r) => r.repuestoId === fila.repuestoId);
          const excede = repuesto ? fila.cantidad > repuesto.cantidad : false;
          return (
            <div key={index} className="space-y-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Label>Repuesto</Label>
                  <Select
                    value={fila.repuestoId}
                    onValueChange={(value) => cambiarFila(index, { repuestoId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un repuesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {repuestos.map((r) => (
                        <SelectItem key={r.repuestoId} value={r.repuestoId}>
                          {r.codigo} — {r.nombre} ({r.cantidad} disp.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-1 sm:w-28">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={fila.cantidad}
                    onChange={(event) => cambiarFila(index, { cantidad: Number(event.target.value) })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => quitarFila(index)}
                  aria-label="Quitar repuesto"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              {excede && (
                <p className="text-xs text-destructive">
                  Solo hay {repuesto?.cantidad ?? 0} unidades disponibles ({formatPrecio(repuesto?.precio ?? 0)} c/u).
                </p>
              )}
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={agregarFila} disabled={bloqueado}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar repuesto
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-border/60 p-4">
        <p className="text-sm font-semibold">Fotografías y documentos técnicos</p>
        {archivosRegistrados.length > 0 && (
          <ul className="space-y-2">
            {archivosRegistrados.map((archivo) => (
              <ArchivoItem key={archivo.key} archivo={archivo} />
            ))}
          </ul>
        )}
        {archivos.length > 0 && (
          <ul className="space-y-2">
            {archivos.map((archivo) => (
              <li
                key={archivo.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{archivo.nombre}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => quitarArchivo(archivo.key)}
                  aria-label={`Quitar ${archivo.nombre}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={bloqueado || uploading || archivos.length >= MAX_ARCHIVOS}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Paperclip className="h-4 w-4" aria-hidden="true" />
            )}
            {uploading ? 'Subiendo…' : 'Adjuntar archivo'}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={`${REGLAS_ARCHIVO_TALLER.taller_foto.accept},${REGLAS_ARCHIVO_TALLER.taller_documento.accept}`}
          onChange={(event) => {
            const files = event.target.files;
            if (!files) return;
            const esFoto = Array.from(files).every((file) => file.type.startsWith('image/'));
            void handleFiles(files, esFoto ? 'taller_foto' : 'taller_documento');
          }}
        />
        <p className="text-xs text-muted-foreground">
          Fotografías: {REGLAS_ARCHIVO_TALLER.taller_foto.formatos} (máx.{' '}
          {formatBytes(REGLAS_ARCHIVO_TALLER.taller_foto.maxBytes)}). Documentos:{' '}
          {REGLAS_ARCHIVO_TALLER.taller_documento.formatos} (máx.{' '}
          {formatBytes(REGLAS_ARCHIVO_TALLER.taller_documento.maxBytes)}).
        </p>
      </div>

      <Button onClick={guardar} disabled={bloqueado || !tieneAvance}>
        {(loading || guardando) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Registrar avance
      </Button>
    </div>
  );
}

interface ArchivoItemProps {
  archivo: ArchivoTaller;
}

function ArchivoItem({ archivo }: ArchivoItemProps) {
  const esFoto = archivo.categoria === 'taller_foto' || archivo.contentType?.startsWith('image/');
  const Icono = esFoto ? Film : FileText;
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <Icono className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 truncate">{archivo.nombre}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge className="border-transparent bg-brand-blue/10 text-brand-blue">
          {esFoto ? 'Foto' : 'Documento'}
        </Badge>
        {archivo.url && (
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={archivo.url} target="_blank" rel="noopener noreferrer">
              Ver
            </a>
          </Button>
        )}
      </span>
    </li>
  );
}
