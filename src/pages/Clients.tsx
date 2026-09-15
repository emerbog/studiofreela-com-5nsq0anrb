import React, { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  FileText,
  UserCheck,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react'
import { ClientFormSheet } from '@/components/ClientFormSheet'
import { Client } from '@/types'

export default function Clients() {
  const { clients, deleteClient, currentTier } = useAppData()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.document && c.document.includes(q)) ||
      (c.phone && c.phone.includes(q))
    )
  })

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsEditOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id)
      setClientToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Edit sheet */}
      <ClientFormSheet
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setEditingClient(null)
        }}
        clientToEdit={editingClient}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Confirmar exclusão de cliente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente{' '}
              <strong className="text-foreground">{clientToDelete?.name}</strong>? Os eventos,
              orçamentos e títulos associados também serão afetados. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-heading">
            Clientes & Contatos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Base centralizada com isolamento seguro por conta. {clients.length}{' '}
            {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}.
          </p>
        </div>
        <ClientFormSheet />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail, CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <Card className="border border-border/60 shadow-xs">
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-semibold text-foreground">
                Nenhum cliente encontrado
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Nenhum resultado corresponde à sua pesquisa.'
                  : 'Comece adicionando seu primeiro cliente para organizar compromissos, orçamentos e contratos.'}
              </p>
              {!searchTerm && (
                <div className="mt-4">
                  <ClientFormSheet />
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-serif">Cliente / Razão Social</TableHead>
                  <TableHead className="font-serif">Contato</TableHead>
                  <TableHead className="font-serif">CPF / CNPJ</TableHead>
                  <TableHead className="font-serif">Anotações</TableHead>
                  <TableHead className="text-right font-serif">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif font-semibold text-xs shrink-0">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{client.name}</div>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" /> Ativo
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {!client.email && !client.phone && (
                          <span className="text-muted-foreground/60 italic">Sem contato</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {client.document || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {client.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(client)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar Dados
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setClientToDelete(client)}
                            className="gap-2 text-destructive cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
