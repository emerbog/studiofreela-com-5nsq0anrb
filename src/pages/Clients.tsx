import { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { ClientFormSheet } from '@/components/ClientFormSheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, Phone, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Clients() {
  const { clients, events } = useAppData()
  const [search, setSearch] = useState('')

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  )

  const calculateLTV = (clientId: string) => {
    return events.filter((e) => e.clientId === clientId).reduce((sum, e) => sum + e.value, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-heading text-3xl font-semibold">Clientes</h2>
          <p className="text-muted-foreground">Gerencie sua carteira de clientes e histórico.</p>
        </div>
        <ClientFormSheet />
      </div>

      <Card className="elegant-card overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-secondary/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Nome / Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>LTV (Valor Vitalício)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="group">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {client.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {formatCurrency(calculateLTV(client.id))}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
