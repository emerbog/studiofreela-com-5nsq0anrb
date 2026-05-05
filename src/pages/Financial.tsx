import { useAppData } from '@/hooks/use-app-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Check, Clock, AlertCircle } from 'lucide-react'

export default function Financial() {
  const { finances, clients, markFinanceAsPaid } = useAppData()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent gap-1"
          >
            <Check className="w-3 h-3" /> Pago
          </Badge>
        )
      case 'Atrasado':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" /> Atrasado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
            <Clock className="w-3 h-3" /> Pendente
          </Badge>
        )
    }
  }

  const totalReceivable = finances
    .filter((f) => f.status !== 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0)
  const totalReceived = finances
    .filter((f) => f.status === 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-heading text-3xl font-semibold">Contas a Receber</h2>
        <p className="text-muted-foreground">Acompanhe seus recebimentos e saldos pendentes.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="elegant-card bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif">{formatCurrency(totalReceivable)}</div>
          </CardContent>
        </Card>
        <Card className="elegant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Recebido (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif text-foreground">
              {formatCurrency(totalReceived)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="elegant-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="hover:bg-transparent">
                <TableHead>Título / Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right w-[100px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((finance) => {
                  const client = clients.find((c) => c.id === finance.clientId)
                  return (
                    <TableRow key={finance.id}>
                      <TableCell>
                        <p className="font-medium">{finance.title}</p>
                        <p className="text-sm text-muted-foreground">{client?.name}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(finance.dueDate)}
                      </TableCell>
                      <TableCell>{getStatusBadge(finance.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(finance.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {finance.status !== 'Pago' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => markFinanceAsPaid(finance.id)}
                            title="Marcar como pago"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              {finances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum título financeiro encontrado.
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
