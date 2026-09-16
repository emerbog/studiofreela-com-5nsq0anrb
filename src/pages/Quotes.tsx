import { useState, useMemo } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Plus,
  Search,
  MoreVertical,
  FileDown,
  Edit,
  Trash2,
  FileCheck,
  Eye,
  CheckCircle,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/formatters'
import { Quote, QuoteStatus } from '@/types'
import { QuoteFormSheet } from '@/components/QuoteFormSheet'
import { QuotePreviewDialog } from '@/components/QuotePreviewDialog'
import { exportQuoteToPdf, shareQuotePdf } from '@/lib/quote-pdf'
import { toast } from 'sonner'

export function Quotes() {
  const { quotes, clients, updateQuote, deleteQuote, resyncQuote } = useAppData()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null)
  const [quoteToPreview, setQuoteToPreview] = useState<Quote | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null)
  const [syncingQuoteId, setSyncingQuoteId] = useState<string | null>(null)

  const handleOpenNew = () => {
    setQuoteToEdit(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (quote: Quote) => {
    setQuoteToEdit(quote)
    setIsFormOpen(true)
  }

  const handleConfirmQuote = async (quote: Quote) => {
    setSyncingQuoteId(quote.id)
    try {
      const ok = await updateQuote(quote.id, {
        status: 'Confirmado',
        statusHistory: [
          ...(quote.statusHistory || []),
          {
            status: 'Confirmado',
            timestamp: new Date().toISOString(),
            note: 'Confirmado pelo usuário: evento confirmado na agenda e parcelas pendentes.',
          },
        ],
      })
      if (ok) {
        toast.success(`Orçamento ${quote.number} confirmado!`, {
          description:
            'O evento mudou para vermelho na agenda e os recebíveis agora são pendentes.',
        })
      }
    } finally {
      setSyncingQuoteId(null)
    }
  }

  const handleResyncQuote = async (quote: Quote) => {
    setSyncingQuoteId(quote.id)
    try {
      await resyncQuote(quote.id)
    } finally {
      setSyncingQuoteId(null)
    }
  }

  const handleChangeStatus = async (quote: Quote, newStatus: QuoteStatus) => {
    const ok = await updateQuote(quote.id, {
      status: newStatus,
      statusHistory: [
        ...(quote.statusHistory || []),
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: `Status alterado para ${newStatus}`,
        },
      ],
    })
    if (ok) {
      toast.success(`Status alterado para "${newStatus}" com sucesso!`)
    }
  }

  const handleDelete = async () => {
    if (quoteToDelete) {
      await deleteQuote(quoteToDelete)
      setQuoteToDelete(null)
    }
  }

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const client = clients.find((c) => c.id === quote.clientId)
      const clientName = client?.name?.toLowerCase() || ''
      const tradeName = client?.tradeName?.toLowerCase() || ''
      const eventName = quote.eventName?.toLowerCase() || ''
      const number = quote.number?.toLowerCase() || ''
      const q = searchTerm.toLowerCase()

      const matchesSearch =
        clientName.includes(q) ||
        tradeName.includes(q) ||
        eventName.includes(q) ||
        number.includes(q)

      let matchesStatus = true
      if (statusFilter !== 'todos') {
        if (statusFilter === 'Confirmado') {
          matchesStatus = quote.status === 'Confirmado' || quote.status === 'Aprovado'
        } else {
          matchesStatus = quote.status === statusFilter
        }
      }

      return matchesSearch && matchesStatus
    })
  }, [quotes, clients, searchTerm, statusFilter])

  // Count summaries
  const stats = useMemo(() => {
    const totalCount = quotes.length
    const preReservationCount = quotes.filter((q) => q.status === 'Enviado').length
    const confirmedCount = quotes.filter(
      (q) => q.status === 'Confirmado' || q.status === 'Aprovado',
    ).length
    const draftCount = quotes.filter((q) => q.status === 'Rascunho').length
    return { totalCount, preReservationCount, confirmedCount, draftCount }
  }, [quotes])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-heading">
            Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crie propostas comerciais, sincronize datas na agenda e organize pagamentos
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> Novo Orçamento
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('todos')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'todos'
              ? 'border-primary bg-primary/5 shadow-xs'
              : 'border-border/60 bg-card hover:border-border'
          }`}
        >
          <span className="text-[11px] text-muted-foreground uppercase font-mono">Total</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-foreground mt-1">
            {stats.totalCount}
          </div>
          <span className="text-[11px] text-muted-foreground">Emitidos no app</span>
        </div>

        <div
          onClick={() => setStatusFilter('Enviado')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'Enviado'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
              : 'border-border/60 bg-card hover:border-border'
          }`}
        >
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-mono font-medium">
            Pré-reservas (Verde)
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.preReservationCount}
          </div>
          <span className="text-[11px] text-muted-foreground">Aguardando aceite</span>
        </div>

        <div
          onClick={() => setStatusFilter('Confirmado')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'Confirmado'
              ? 'border-red-500 bg-red-500/10 shadow-xs'
              : 'border-border/60 bg-card hover:border-border'
          }`}
        >
          <span className="text-[11px] text-red-600 dark:text-red-400 uppercase font-mono font-medium">
            Confirmados (Vermelho)
          </span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-red-700 dark:text-red-400 mt-1">
            {stats.confirmedCount}
          </div>
          <span className="text-[11px] text-muted-foreground">Eventos confirmados</span>
        </div>

        <div
          onClick={() => setStatusFilter('Rascunho')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'Rascunho'
              ? 'border-border bg-muted/60 shadow-xs'
              : 'border-border/60 bg-card hover:border-border'
          }`}
        >
          <span className="text-[11px] text-muted-foreground uppercase font-mono">Rascunhos</span>
          <div className="text-xl sm:text-2xl font-serif font-bold text-muted-foreground mt-1">
            {stats.draftCount}
          </div>
          <span className="text-[11px] text-muted-foreground">Não sincronizados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, evento ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'Enviado', label: 'Pré-reserva' },
            { id: 'Confirmado', label: 'Confirmado' },
            { id: 'Rascunho', label: 'Rascunho' },
            { id: 'Rejeitado', label: 'Rejeitado' },
            { id: 'Cancelado', label: 'Cancelado' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List / Cards mobile-first */}
      {filteredQuotes.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-semibold text-lg text-heading">
            Nenhum orçamento encontrado
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'todos'
              ? 'Tente ajustar os filtros ou termo de pesquisa.'
              : 'Crie seu primeiro orçamento completo com cronograma, serviços e condições de pagamento.'}
          </p>
          <Button onClick={handleOpenNew} className="gap-2 text-xs">
            <Plus className="w-4 h-4" /> Criar Orçamento Agora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredQuotes.map((quote) => {
            const client = clients.find((c) => c.id === quote.clientId)
            const isConfirmed = quote.status === 'Confirmado' || quote.status === 'Aprovado'
            const isPreReservation = quote.status === 'Enviado'

            return (
              <div
                key={quote.id}
                className="p-4 bg-card rounded-xl border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {quote.number}
                      </span>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatShortDate(quote.date)}
                      </span>
                    </div>

                    <Badge
                      variant={isConfirmed ? 'default' : isPreReservation ? 'outline' : 'secondary'}
                      className={
                        isConfirmed
                          ? 'bg-red-600 hover:bg-red-700 text-white border-transparent text-[10px]'
                          : isPreReservation
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]'
                            : 'text-[10px]'
                      }
                    >
                      {isConfirmed ? 'Confirmado' : isPreReservation ? 'Pré-reserva' : quote.status}
                    </Badge>
                  </div>

                  <h3 className="font-serif font-bold text-base text-foreground mt-1 line-clamp-1">
                    {quote.eventName || 'Serviço sob demanda'}
                  </h3>

                  {quote.syncStatus === 'error' && (
                    <div className="mt-1.5 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                      <span
                        className="truncate"
                        title={quote.syncError || 'Falha de sincronização'}
                      >
                        Sincronização com Agenda/Financeiro falhou.
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={syncingQuoteId === quote.id}
                        onClick={() => handleResyncQuote(quote)}
                        className="h-6 px-2 text-[10px] shrink-0 border-amber-500/40 hover:bg-amber-500/20"
                      >
                        <RefreshCw
                          className={`w-3 h-3 mr-1 ${syncingQuoteId === quote.id ? 'animate-spin' : ''}`}
                        />
                        Sincronizar novamente
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground font-medium mt-0.5 line-clamp-1">
                    Cliente:{' '}
                    <strong className="text-foreground">{client?.name || 'Cliente'}</strong>
                  </p>

                  <div className="space-y-1 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span className="truncate">
                        {quote.eventStartDate
                          ? `${formatShortDate(quote.eventStartDate)} às ${quote.eventStartTime || '09:00'}`
                          : formatDate(quote.date)}
                      </span>
                    </div>

                    {quote.eventLocation && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{quote.eventLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                      Total
                    </span>
                    <span className="text-base font-serif font-bold text-foreground">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuoteToPreview(quote)}
                      title="Visualizar Proposta"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => exportQuoteToPdf(quote, client, user, 'download')}
                      title="Baixar PDF"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <FileDown className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuItem onClick={() => setQuoteToPreview(quote)}>
                          <Eye className="w-3.5 h-3.5 mr-2" /> Visualizar Proposta
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => exportQuoteToPdf(quote, client, user, 'download')}
                        >
                          <FileDown className="w-3.5 h-3.5 mr-2" /> Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareQuotePdf(quote, client, user)}>
                          <Share2 className="w-3.5 h-3.5 mr-2" /> Compartilhar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(quote)}>
                          <Edit className="w-3.5 h-3.5 mr-2" /> Editar Orçamento
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleResyncQuote(quote)}
                          disabled={syncingQuoteId === quote.id}
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 mr-2 ${syncingQuoteId === quote.id ? 'animate-spin' : ''}`}
                          />
                          {quote.syncStatus === 'error'
                            ? 'Sincronizar novamente'
                            : 'Reprocessar sincronização'}
                        </DropdownMenuItem>

                        {!isConfirmed && (
                          <DropdownMenuItem
                            onClick={() => handleConfirmQuote(quote)}
                            disabled={syncingQuoteId === quote.id}
                            className="text-red-600 font-medium"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-2" /> Confirmar (Vermelho)
                          </DropdownMenuItem>
                        )}

                        {quote.status !== 'Enviado' && (
                          <DropdownMenuItem
                            onClick={() => handleChangeStatus(quote, 'Enviado')}
                            className="text-emerald-600"
                          >
                            <Calendar className="w-3.5 h-3.5 mr-2" /> Pré-reserva (Verde)
                          </DropdownMenuItem>
                        )}

                        {quote.status !== 'Cancelado' && (
                          <DropdownMenuItem
                            onClick={() => handleChangeStatus(quote, 'Cancelado')}
                            className="text-muted-foreground"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-2" /> Cancelar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setQuoteToDelete(quote.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Sheet / Dialog */}
      <QuoteFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        quoteToEdit={quoteToEdit}
        onSuccess={() => {
          setIsFormOpen(false)
          setQuoteToEdit(null)
        }}
      />

      {/* Preview Dialog */}
      <QuotePreviewDialog
        open={!!quoteToPreview}
        onOpenChange={(op) => !op && setQuoteToPreview(null)}
        quote={quoteToPreview}
        client={clients.find((c) => c.id === quoteToPreview?.clientId)}
        onEdit={(q) => handleOpenEdit(q)}
        onConfirm={(q) => handleConfirmQuote(q)}
      />

      {/* Delete alert */}
      <AlertDialog open={!!quoteToDelete} onOpenChange={(op) => !op && setQuoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Excluir este orçamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta ação removerá o orçamento e desvinculará os compromissos associados na agenda e
              títulos previstos não pagos. Tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
export default Quotes
