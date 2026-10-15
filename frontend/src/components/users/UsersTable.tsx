import { Loader2, Pencil, Power, PowerOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLE_LABELS } from '@/lib/brand';
import type { UserRole } from '@/lib/roles';
import type { Usuario } from '@/types/usuario';

interface UsersTableProps {
  usuarios: Usuario[];
  currentUserId: string;
  estadoLoadingId: string | null;
  onEditar: (usuario: Usuario) => void;
  onToggleEstado: (usuario: Usuario) => void;
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'border-transparent bg-brand-blue/10 text-brand-blue-deep',
  vendedor: 'border-transparent bg-emerald-500/10 text-emerald-700',
  jefe_taller: 'border-transparent bg-amber-500/10 text-amber-700',
  mecanico: 'border-transparent bg-zinc-500/10 text-zinc-700',
};

/** Tabla de usuarios con acciones de edición y activación/desactivación. */
export function UsersTable({
  usuarios,
  currentUserId,
  estadoLoadingId,
  onEditar,
  onToggleEstado,
}: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((usuario) => {
          const isSelf = usuario.userId === currentUserId;
          const activo = usuario.estado === 'activo';
          const toggling = estadoLoadingId === usuario.userId;

          return (
            <TableRow key={usuario.userId}>
              <TableCell>
                <div className="font-medium">{usuario.nombre}</div>
                <div className="text-xs text-muted-foreground">{usuario.email}</div>
              </TableCell>
              <TableCell>
                <Badge className={ROLE_STYLES[usuario.rol]}>{ROLE_LABELS[usuario.rol]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={activo ? 'secondary' : 'destructive'}>
                  {activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditar(usuario)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSelf || toggling}
                    onClick={() => onToggleEstado(usuario)}
                    title={isSelf ? 'No puedes cambiar el estado de tu propia cuenta' : undefined}
                  >
                    {toggling ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : activo ? (
                      <PowerOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Power className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">{activo ? 'Desactivar' : 'Activar'}</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
