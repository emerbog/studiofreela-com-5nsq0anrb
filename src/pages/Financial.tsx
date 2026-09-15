import React, { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { Finance } from '@/types'
import { toast } from 'sonner'

export default function Financial() {
  const { finances, clients, markFinanceAsPaid, addFinance, deleteFinance } = useAppData()
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [financeToDelete, setFinanceToDelete] = useState<Finance | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    value: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Pendente' as 'Pendente' | 'Pago' | 'Atrasado',
  })

  // Totais calculados dinamicamente
  const totalReceivable = finances.reduce((acc, curr) => acc + curr.value, 0)
  const totalPaid = finances
    .filter((f) => f.status === 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0)
  const totalPending = finances
    .filter((f) => f.status === 'Pendente' || f.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0)

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Informe a descrição do título.')
      return
    }

    const val = Number(formData.value)
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor monetário positivo.')
      return
    }

    if (!formData.dueDate) {
      toast.error('Informe a data de vencimento.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await addFinance({
        title: formData.title,
        clientId: formData.clientId || undefined,
        value: val,
        dueDate: new Date(`${formData.dueDate}T12:00:00`).toISOString(),
        status: formData.status,
      })

      if (created) {
        setIsNewDialogOpen(false)
        setFormData({
          title: '',
          clientId: '',
          value: '',
          dueDate: new Date().toISOString().split('T')[0],
          status: 'Pendente',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (financeToDelete) {
      await deleteFinance(financeToDelete.id)
      setFinanceToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!financeToDelete}
        onOpenChange={(open) => !open && setFinanceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Confirmar exclusão de título</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o recebível{' '}
              <strong className="text-foreground">{financeToDelete?.title}</strong> no valor de{' '}
              <strong className="text-foreground">
                {formatCurrency(financeToDelete?.value || 0)}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Título
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-heading">
            Contas a Receber
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de fluxo de caixa, títulos pendentes e confirmações de recebimento.
          </p>
        </div>

        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Novo Recebível
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-heading font-serif text-xl">
                Lançar Novo Recebível
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registre uma entrada prevista ou parcela de projeto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="finance-title" className="text-xs font-medium">
                  Descrição do Título *
                </Label>
                <Input
                  id="finance-title"
                  required
                  placeholder="Ex: Parcela 2/3 - Identidade Visual"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="finance-client" className="text-xs font-medium">
                  Cliente Vinculado (Opcional)
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                >
                  <SelectTrigger id="finance-client">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem vínculo com cliente</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="finance-value" className="text-xs font-medium">
                    Valor (R$) *
                  </Label>
                  <Input
                    id="finance-value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="finance-due" className="text-xs font-medium">
                    Vencimento *
                  </Label>
                  <Input
                    id="finance-due"
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="finance-status" className="text-xs font-medium">
                  Situação Inicial
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger id="finance-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button variant="outline" type="button" disabled={isSubmitting}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Cadastrar Título'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-sans">
              Total Faturado (Geral)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-foreground">
              {formatCurrency(totalReceivable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {finances.length}{' '}
              {finances.length === 1 ? 'título registrado' : 'títulos registrados'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-sans">
              Total Recebido (Baixado)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Valores já liquidados em conta</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-sans">
              Previsão a Receber
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold text-foreground">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Títulos em aberto e futuros</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Recebíveis */}
      <Card className="border border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Histórico de Recebíveis</CardTitle>
          <CardDescription className="text-xs">
            Cada título pode ser confirmado individualmente com registro imediato no banco.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {finances.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-semibold text-foreground">
                Nenhum título a receber
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Ao agendar eventos com valor ou lançar recebíveis avulsos, eles serão listados aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-serif">Descrição</TableHead>
                  <TableHead className="font-serif">Cliente</TableHead>
                  <TableHead className="font-serif">Vencimento</TableHead>
                  <TableHead className="font-serif">Valor</TableHead>
                  <TableHead className="font-serif">Status</TableHead>
                  <TableHead className="text-right font-serif">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finances.map((item) => {
                  const client = clients.find((c) => c.id === item.clientId)
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {client ? client.name : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatShortDate(item.dueDate)}
                      </TableCell>
                      <TableCell className="font-serif font-semibold text-foreground">
                        {formatCurrency(item.value)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'Pago'
                              ? 'default'
                              : item.status === 'Atrasado'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-[10px] font-sans"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {item.status !== 'Pago' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markFinanceAsPaid(item.id)}
                              className="h-8 gap-1 text-xs border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:text-emerald-400"
                            >
                              <Check className="w-3.5 h-3.5" /> Baixar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFinanceToDelete(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Excluir título"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
