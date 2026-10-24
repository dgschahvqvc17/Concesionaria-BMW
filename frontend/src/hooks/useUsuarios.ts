import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { usuariosService } from '@/services/usuarios';
import type { CreateUsuarioInput, EstadoUsuario, UpdateUsuarioInput, Usuario } from '@/types/usuario';

function ordenar(usuarios: Usuario[]): Usuario[] {
  return [...usuarios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Hook que encapsula la carga y mutación de usuarios (HU02). */
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { usuarios: lista } = await usuariosService.list();
      setUsuarios(ordenar(lista));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const crear = useCallback(async (input: CreateUsuarioInput): Promise<Usuario> => {
    const { usuario } = await usuariosService.create(input);
    setUsuarios((prev) => ordenar([...prev, usuario]));
    return usuario;
  }, []);

  const actualizar = useCallback(async (userId: string, input: UpdateUsuarioInput): Promise<Usuario> => {
    const { usuario } = await usuariosService.update(userId, input);
    setUsuarios((prev) => ordenar(prev.map((u) => (u.userId === userId ? usuario : u))));
    return usuario;
  }, []);

  const cambiarEstado = useCallback(async (userId: string, estado: EstadoUsuario): Promise<Usuario> => {
    const { usuario } = await usuariosService.setEstado(userId, estado);
    setUsuarios((prev) => prev.map((u) => (u.userId === userId ? usuario : u)));
    return usuario;
  }, []);

  return { usuarios, loading, error, recargar, crear, actualizar, cambiarEstado };
}
