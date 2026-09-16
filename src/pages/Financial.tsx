import { useState, useMemo } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  Check,
  Loader2,
} from 'lucide-react'
import { formatCurrency, formatDate, formatShortDate, toLocalDateString } from '@/lib/formatters'
import { Finance, FinanceStatus } from '@/types'
import { toast } from 'sonner'
import { ClientSelector } from '@/components/ClientSelector'

export function Financial() {
  const { finances, clients, markFinanceAsPaid, addFinance, updateFinance, deleteFinance } =
    useAppData()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'todos' | 'previstos' | 'pendentes' | 'pagos'>('todos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null)

  // Mark as paid dialog
  const [payingFinance, setPayingFinance] = useState<Finance | null>(null)
  const [paidDate, setPaidDate] = useState(toLocalDateString(new Date()))
  const [isPayingSubmitting, setIsPayingSubmitting] = useState(false)

  // Manual finance form
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [value, setValue] = useState<number>(0)
  const [dueDate, setDueDate] = useState(toLocalDateString(new Date()))
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [status, setStatus] = useState<FinanceStatus>('Pendente')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenNew = () => {
    setEditingFinance(null)
    setTitle('')
    setClientId('')
    setValue(0)
    setDueDate(toLocalDateString(new Date()))
    setPaymentMethod('PIX')
    setStatus('Pendente')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (f: Finance) => {
    setEditingFinance(f)
    setTitle(f.title)
    setClientId(f.clientId || '')
    setValue(f.value)
    setDueDate(f.dueDate ? toLocalDateString(f.dueDate) : toLocalDateString(new Date()))
    setPaymentMethod(f.paymentMethod || 'PIX')
    setStatus(f.status)
    setIsDialogOpen(true)
  }

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Informe o título do recebimento.')
      return
    }
    if (value <= 0) {
      toast.error('Informe um valor válido maior que zero.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingFinance) {
        await updateFinance(editingFinance.id, {
          title: title.trim(),
          clientId: clientId || undefined,
          value,
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
          paymentMethod,
          status,
        })
      } else {
        await addFinance({
          title: title.trim(),
          clientId: clientId || undefined,
          value,
          dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
          paymentMethod,
          status,
        })
      }
      setIsDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!payingFinance) return
    setIsPayingSubmitting(true)
    try {
      const ok = await markFinanceAsPaid(
        payingFinance.id,
        new Date(`${paidDate}T12:00:00`).toISOString(),
      )
      if (ok) {
        setPayingFinance(null)
      }
    } finally {
      setIsPayingSubmitting(false)
    }
  }

  // Totals calculations separating 'Previsto' (quotes not confirmed) from confirmed pending
  const metrics = useMemo(() => {
    let totalPaid = 0
    let totalPendingConfirmed = 0
    let totalForecastedUnconfirmed = 0

    finances.forEach((f) => {
      const v = Number(f.value) || 0
      if (f.status === 'Pago') {
        totalPaid += v
      } else if (f.status === 'Pendente' || f.status === 'Atrasado') {
        totalPendingConfirmed += v
      } else if (f.status === 'Previsto') {
        totalForecastedUnconfirmed += v
      }
    })

    return {
      totalPaid,
      totalPendingConfirmed,
      totalForecastedUnconfirmed,
      totalOverall: totalPaid + totalPendingConfirmed,
    }
  }, [finances])

  // Filtered finances
  const filteredFinances = useMemo(() => {
    return finances.filter((f) => {
      const client = clients.find((c) => c.id === f.clientId)
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        f.title?.toLowerCase().includes(q) ||
        client?.name?.toLowerCase().includes(q) ||
        (f.paymentMethod && f.paymentMethod.toLowerCase().includes(q))

      let matchesTab = true
      if (activeTab === 'pagos') {
        matchesTab = f.status === 'Pago'
      } else if (activeTab === 'pendentes') {
        matchesTab = f.status === 'Pendente' || f.status === 'Atrasado'
      } else if (activeTab === 'previstos') {
        matchesTab = f.status === 'Previsto'
      }

      return matchesSearch && matchesTab
    })
  }, [finances, clients, searchTerm, activeTab])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-heading">
            Financeiro
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestão de fluxo de caixa, recebimentos confirmados e previsões de orçamentos
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> Novo Recebível Avulso
        </Button>
      </div>

      {/* KPI Cards: Separates Previsto vs Confirmado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Recebido */}
        <div className="p-4 bg-card rounded-xl border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
              Recebido (Efetivo)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">
            {formatCurrency(metrics.totalPaid)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Valores já recebidos e com baixa no caixa
          </p>
        </div>

        {/* Pendente Confirmado */}
        <div className="p-4 bg-card rounded-xl border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 uppercase font-semibold">
              A Receber (Confirmado)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">
            {formatCurrency(metrics.totalPendingConfirmed)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Orçamentos aprovados com contrato/reserva firme
          </p>
        </div>

        {/* Previsto (Orçamento não confirmado) */}
        <div className="p-4 bg-card rounded-xl border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 uppercase font-semibold">
              Previsto (Pré-reservas)
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">
            {formatCurrency(metrics.totalForecastedUnconfirmed)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Orçamentos enviados aguardando confirmação
          </p>
        </div>
      </div>

      {/* Filter and Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, cliente ou método..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'pendentes', label: 'A Receber' },
            { id: 'previstos', label: 'Previstos (Orçamento)' },
            { id: 'pagos', label: 'Recebidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Finance list table/cards */}
      {filteredFinances.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border/80 space-y-2">
          <p className="text-xs text-muted-foreground">
            Nenhum título financeiro encontrado para os critérios selecionados.
          </p>
        </div>
      ) : (
        <div className="border border-border/70 rounded-xl overflow-hidden bg-card divide-y divide-border/50">
          {filteredFinances.map((fin) => {
            const client = clients.find((c) => c.id === fin.clientId)
            const isPaid = fin.status === 'Pago'
            const isForecasted = fin.status === 'Previsto'

            return (
              <div
                key={fin.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{fin.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-2 font-medium ${
                        isPaid
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : isForecasted
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {isPaid ? 'Pago' : isForecasted ? 'Previsto (Não confirmado)' : 'Pendente'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {client && (
                      <span>
                        Cliente: <strong className="text-foreground">{client.name}</strong>
                      </span>
                    )}
                    <span>Vencimento: {formatDate(fin.dueDate)}</span>
                    {fin.paidAt && <span>Pago em: {formatShortDate(fin.paidAt)}</span>}
                    {fin.paymentMethod && <span>via {fin.paymentMethod}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-serif font-bold text-foreground">
                      {formatCurrency(fin.value)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isPaid ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setPayingFinance(fin)
                          setPaidDate(toLocalDateString(new Date()))
                        }}
                        className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Marcar Pago
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium px-2 py-1 bg-emerald-500/10 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Quitado
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(fin)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFinance(fin.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog create/edit finance */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingFinance ? 'Editar Título Financeiro' : 'Novo Recebível Avulso'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveFinance} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Título / Descrição *</Label>
              <Input
                required
                placeholder="Ex: Sinal de ensaio externo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cliente Vinculado</Label>
              <ClientSelector
                value={clientId}
                onChange={(id) => setClientId(id)}
                showEditButton={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Valor (R$) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={value || ''}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="text-xs h-9 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Data de Vencimento *</Label>
                <Input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Meio de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Status Inicial</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Previsto">Previsto</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Título'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark as paid modal */}
      <Dialog open={!!payingFinance} onOpenChange={(op) => !op && setPayingFinance(null)}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Confirmar Recebimento</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              Você está confirmando o pagamento de{' '}
              <strong className="text-foreground">
                {payingFinance && formatCurrency(payingFinance.value)}
              </strong>{' '}
              referente a <em>{payingFinance?.title}</em>.
            </p>

            <div className="space-y-1">
              <Label className="text-xs">Data Efetiva do Recebimento</Label>
              <Input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPayingSubmitting}
              onClick={() => setPayingFinance(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPayingSubmitting}
              onClick={handleConfirmPayment}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPayingSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Confirmando...
                </>
              ) : (
                'Confirmar Recebimento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default Financial
