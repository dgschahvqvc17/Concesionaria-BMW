import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClientesComerciales } from '@/hooks/useClientesComerciales';
import { getErrorMessage } from '@/lib/api';
import { formatFecha } from '@/lib/repuestos';
import { ClienteComercialFormDialog, type ClienteComercialFormValues } from '@/components/clientesComerciales/ClienteComercialFormDialog';

export function ClientesComercialesPage() {
  const { clientes, loading, error, recargar, crear } = useClientesComerciales();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [q, setQ] = useState('');

  const handleSubmit = async (values: ClienteComercialFormValues) => {
    setSubmitting(true);
    try {
      await crear(values);
      toast.success('Cliente registrado correctamente.');
      setOpen(false);
    } catch (submitError) {
      toast.error(getErrorMessage(submitError));
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  const filtrados = clientes.filter((c) => {
    const t = q.toLowerCase();
    return (
      c.nombres.toLowerCase().includes(t) ||
      c.apellidos.toLowerCase().includes(t) ||
      c.documento.toLowerCase().includes(t) ||
      c.email.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes comerciales"
        description="Seguimiento comercial y oportunidades de compra"
        actions={<Button onClick={() => setOpen(true)}>Nuevo cliente</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Buscar por nombre, documento o correo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
          {loading && <p className="text-sm text-muted-foreground">Cargando clientes…</p>}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudieron cargar los clientes</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={() => void recargar()}>Reintentar</Button>
              </AlertDescription>
            </Alert>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((c) => (
                <TableRow key={c.clienteId}>
                  <TableCell>{c.nombres} {c.apellidos}</TableCell>
                  <TableCell>{c.documento}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.telefono}</TableCell>
                  <TableCell>{c.estadoSeguimiento}</TableCell>
                  <TableCell>{formatFecha(c.createdAt)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/clientes-comerciales/${c.clienteId}`)}>Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtrados.length === 0 && (
                <TableRow><TableCell colSpan={7}>Sin resultados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ClienteComercialFormDialog open={open} onOpenChange={setOpen} onSubmit={handleSubmit} loading={submitting} />
    </div>
  );
}
