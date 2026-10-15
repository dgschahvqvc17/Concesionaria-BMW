import { useMemo, useState } from 'react';
import { Loader2, Plus, Search, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { UsersTable } from '@/components/users/UsersTable';
import { useAuth } from '@/context/AuthContext';
import { useUsuarios } from '@/hooks/useUsuarios';
import { getErrorMessage } from '@/lib/api';
import type { CreateUsuarioInput, EstadoUsuario, UpdateUsuarioInput, Usuario } from '@/types/usuario';

/** Página de gestión de usuarios (HU02). Acceso restringido a administradores. */
export function UsersPage() {
  const { user } = useAuth();
  const { usuarios, loading, error, recargar, crear, actualizar, cambiarEstado } = useUsuarios();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [estadoLoadingId, setEstadoLoadingId] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<Usuario | null>(null);
  const [query, setQuery] = useState('');

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usuarios, query]);

  const abrirCrear = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const abrirEditar = (usuario: Usuario) => {
    setEditing(usuario);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: CreateUsuarioInput | UpdateUsuarioInput) => {
    setSubmitting(true);
    try {
      if (editing) {
        await actualizar(editing.userId, input as UpdateUsuarioInput);
        toast.success('Usuario actualizado correctamente.');
      } else {
        await crear(input as CreateUsuarioInput);
        toast.success('Usuario registrado correctamente.');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const ejecutarCambioEstado = async (usuario: Usuario, estado: EstadoUsuario) => {
    setEstadoLoadingId(usuario.userId);
    try {
      await cambiarEstado(usuario.userId, estado);
      toast.success(
        estado === 'activo' ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.'
      );
    } catch (estadoError) {
      toast.error(getErrorMessage(estadoError));
    } finally {
      setEstadoLoadingId(null);
    }
  };

  const handleToggleEstado = (usuario: Usuario) => {
    if (usuario.estado === 'activo') {
      setConfirmUser(usuario);
      return;
    }
    void ejecutarCambioEstado(usuario, 'activo');
  };

  const confirmarDesactivacion = async () => {
    if (!confirmUser) return;
    await ejecutarCambioEstado(confirmUser, 'inactivo');
    setConfirmUser(null);
  };

  const currentUserId = user?.sub ?? '';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Gestión de usuarios"
        description="Registra, edita y controla el acceso del personal del concesionario."
        actions={
          <Button onClick={abrirCrear}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo usuario
          </Button>
        }
      />

      <section className="surface-card animate-fade-in overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o correo"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {!loading && !error && (
            <p className="text-xs text-muted-foreground">
              {filtrados.length} de {usuarios.length} usuarios
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando usuarios…
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar el listado de usuarios</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                {error}
                <Button variant="outline" size="sm" className="w-fit" onClick={() => void recargar()}>
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
            <UsersIcon className="h-8 w-8" aria-hidden="true" />
            {query ? 'No se encontraron usuarios con ese criterio.' : 'Aún no hay usuarios registrados.'}
          </div>
        ) : (
          <UsersTable
            usuarios={filtrados}
            currentUserId={currentUserId}
            estadoLoadingId={estadoLoadingId}
            onEditar={abrirEditar}
            onToggleEstado={handleToggleEstado}
          />
        )}
      </section>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={editing}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirmUser)}
        onOpenChange={(open) => {
          if (!open) setConfirmUser(null);
        }}
        title="Desactivar usuario"
        description={
          confirmUser
            ? `¿Desactivar a ${confirmUser.nombre}? El usuario no podrá iniciar sesión hasta que lo actives de nuevo.`
            : ''
        }
        confirmLabel="Desactivar"
        destructive
        loading={estadoLoadingId === confirmUser?.userId}
        onConfirm={confirmarDesactivacion}
      />
    </div>
  );
}

export default UsersPage;
