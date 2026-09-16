import { useState, useMemo } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CalendarIcon,
  Clock,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  toLocalDateString,
  parseLocalDate,
} from '@/lib/formatters'
import { AppEvent, Finance, Quote } from '@/types'
import { EventFormDialog } from '@/components/EventFormDialog'
import { QuotePreviewDialog } from '@/components/QuotePreviewDialog'
import { QuoteFormSheet } from '@/components/QuoteFormSheet'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Agenda() {
  const navigate = useNavigate()
  const { events, clients, finances, quotes, deleteEvent } = useAppData()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [eventToEdit, setEventToEdit] = useState<AppEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [quoteToPreview, setQuoteToPreview] = useState<Quote | null>(null)
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null)
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false)

  // Filter events by selected date (match startDate or within start/end range)
  const selectedDateStr = toLocalDateString(selectedDate)

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return []
    return events.filter((e) => {
      const start = toLocalDateString(e.date)
      const end = e.endDate ? toLocalDateString(e.endDate) : start
      return selectedDateStr >= start && selectedDateStr <= end
    })
  }, [events, selectedDateStr])

  // Payment installments due on selected date
  const financesForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return []
    return finances.filter((f) => {
      const due = toLocalDateString(f.dueDate)
      return due === selectedDateStr
    })
  }, [finances, selectedDateStr])

  // Calendar dates with dots: expand multi-day events so all in-between days get the indicator
  const datesWithActivity = useMemo(() => {
    const set = new Set<string>()
    events.forEach((e) => {
      const startStr = toLocalDateString(e.date)
      const endStr = e.endDate ? toLocalDateString(e.endDate) : startStr
      if (startStr) {
        set.add(startStr)
        if (endStr && endStr > startStr) {
          // Preenche todos os dias do intervalo para eventos multidiários
          const cur = parseLocalDate(startStr)
          const target = parseLocalDate(endStr)
          if (cur && target) {
            // Limite de segurança de no máximo 60 dias para evitar loops
            let count = 0
            while (cur <= target && count < 60) {
              set.add(toLocalDateString(cur))
              cur.setDate(cur.getDate() + 1)
              count++
            }
          }
        }
      }
    })
    finances.forEach((f) => {
      const dueStr = toLocalDateString(f.dueDate)
      if (dueStr) {
        set.add(dueStr)
      }
    })
    return set
  }, [events, finances])

  const handleOpenEventFromQuote = (quoteId: string) => {
    const q = quotes.find((item) => item.id === quoteId)
    if (q) {
      setQuoteToPreview(q)
    } else {
      navigate('/quotes')
    }
  }

  const handleEditLinkedQuote = (quoteId: string) => {
    const q = quotes.find((item) => item.id === quoteId)
    if (q) {
      setQuoteToEdit(q)
      setIsQuoteFormOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteEvent(id)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-heading">
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Eventos confirmados (vermelho), pré-reservas (verde) e vencimentos de recebíveis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setQuoteToEdit(null)
              setIsQuoteFormOpen(true)
            }}
            className="gap-2 text-xs h-9"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Orçamento
          </Button>
          <Button
            onClick={() => {
              setEventToEdit(null)
              setIsDialogOpen(true)
            }}
            className="gap-2 text-xs h-9 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo Evento Avulso
          </Button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card rounded-xl border border-border/60 text-xs">
        <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider font-mono">
          Legenda:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-foreground font-medium">
            Verde: Pré-reserva (Orçamento enviado)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          <span className="text-foreground font-medium">Vermelho: Evento Confirmado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-foreground font-medium">Azul: Recebível Previsto/Pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-zinc-400" />
          <span className="text-foreground font-medium">Cinza: Recebido / Concluído</span>
        </div>
      </div>

      {/* Main Grid: Calendar & Day details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Calendar Picker */}
        <div className="md:col-span-5 bg-card p-4 rounded-xl border border-border/70 shadow-xs">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md mx-auto"
            modifiers={{
              hasActivity: (date) => {
                const s = toLocalDateString(date)
                return datesWithActivity.has(s)
              },
            }}
            modifiersClassNames={{
              hasActivity: 'font-bold underline decoration-primary decoration-2 underline-offset-4',
            }}
          />
        </div>

        {/* Selected Day Agenda Items */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <h3 className="font-serif font-bold text-base sm:text-lg text-heading flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              {selectedDate ? formatDate(selectedDate) : 'Selecione um dia'}
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {eventsForSelectedDate.length} evento(s) • {financesForSelectedDate.length}{' '}
              recebimento(s)
            </span>
          </div>

          {eventsForSelectedDate.length === 0 && financesForSelectedDate.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border/80 space-y-2">
              <p className="text-xs text-muted-foreground">
                Nenhum compromisso ou recebimento agendado para esta data.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuoteToEdit(null)
                    setIsQuoteFormOpen(true)
                  }}
                  className="text-xs h-8"
                >
                  Criar Orçamento
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEventToEdit(null)
                    setIsDialogOpen(true)
                  }}
                  className="text-xs h-8"
                >
                  Adicionar Evento
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. Events for the day */}
              {eventsForSelectedDate.map((ev) => {
                const client = clients.find((c) => c.id === ev.clientId)
                const isPreReservation =
                  ev.status === 'Pré-reserva' || ev.eventType === 'pre_reservation'
                const isConfirmed = ev.status === 'Confirmado'
                const linkedQuote = ev.quoteId ? quotes.find((q) => q.id === ev.quoteId) : null

                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-xl border transition-all shadow-xs flex flex-col justify-between space-y-2.5 ${
                      isConfirmed
                        ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/70'
                        : isPreReservation
                          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70'
                          : 'border-border/70 bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isConfirmed
                                ? 'bg-red-600'
                                : isPreReservation
                                  ? 'bg-emerald-500'
                                  : 'bg-zinc-400'
                            }`}
                          />
                          <h4 className="font-serif font-bold text-base text-foreground">
                            {ev.title}
                          </h4>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Cliente:{' '}
                          <strong className="text-foreground">{client?.name || 'Cliente'}</strong>
                          {client?.phone && ` • ${client.phone}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={isConfirmed ? 'default' : 'outline'}
                          className={
                            isConfirmed
                              ? 'bg-red-600 text-white border-transparent text-[10px]'
                              : isPreReservation
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px]'
                                : 'text-[10px]'
                          }
                        >
                          {isConfirmed
                            ? 'Confirmado'
                            : isPreReservation
                              ? 'Pré-reserva'
                              : ev.status}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            {ev.quoteId && (
                              <DropdownMenuItem
                                onClick={() => handleOpenEventFromQuote(ev.quoteId!)}
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-2" /> Abrir Orçamento
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setEventToEdit(ev)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="w-3.5 h-3.5 mr-2" /> Editar Evento
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(ev.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {ev.time || '09:00'}
                          {ev.endTime ? ` até ${ev.endTime}` : ''}
                          {ev.endDate &&
                            toLocalDateString(ev.endDate) !== toLocalDateString(ev.date) && (
                              <span className="text-[10px] ml-1 text-primary">
                                (término {formatShortDate(ev.endDate)})
                              </span>
                            )}
                        </span>
                      </div>

                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Touch card opens quote */}
                    {linkedQuote && (
                      <div
                        onClick={() => handleOpenEventFromQuote(ev.quoteId!)}
                        className="mt-1 p-2 bg-background/80 rounded-lg border border-border/50 text-xs flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span className="font-mono text-muted-foreground">
                            {linkedQuote.number}
                          </span>
                          <span className="font-medium text-foreground">
                            Total: {formatCurrency(linkedQuote.total)}
                          </span>
                        </div>
                        <span className="text-primary text-[11px] font-medium flex items-center gap-1">
                          Ver proposta <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* 2. Receivable installments for the day with coin icons */}
              {financesForSelectedDate.map((fin) => {
                const client = clients.find((c) => c.id === fin.clientId)
                const isPaid = fin.status === 'Pago'
                const todayStr = toLocalDateString(new Date())
                const dueStr = toLocalDateString(fin.dueDate)
                const isOverdue = !isPaid && dueStr && dueStr < todayStr
                const isForecastOrPending = !isPaid && !isOverdue

                // Coin icon styling per spec:
                // azul (previsto/pendente), cinza (pago), vermelho discreto (vencido)
                const iconColorClass = isPaid
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  : isOverdue
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'

                const cardBorderClass = isPaid
                  ? 'bg-muted/40 border-border/60 text-muted-foreground'
                  : isOverdue
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-blue-500/5 border-blue-500/30'

                return (
                  <div
                    key={fin.id}
                    onClick={() => navigate('/financial')}
                    className={`p-3.5 rounded-xl border cursor-pointer hover:border-primary/50 transition-all flex items-center justify-between text-xs shadow-xs ${cardBorderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColorClass}`}
                        title={
                          isPaid
                            ? 'Recebível pago (cinza)'
                            : isOverdue
                              ? 'Recebível vencido (vermelho)'
                              : 'Recebível previsto/pendente (azul)'
                        }
                      >
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{fin.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] py-0 px-1.5 ${
                              isPaid
                                ? 'bg-zinc-200/50 text-zinc-700 dark:text-zinc-300'
                                : isOverdue
                                  ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {isPaid ? 'Recebido' : isOverdue ? 'Vencido' : fin.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {client ? `Cliente: ${client.name} • ` : ''}
                          Vencimento: {formatShortDate(fin.dueDate)}
                          {fin.paymentMethod && ` via ${fin.paymentMethod}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-serif font-bold text-sm text-foreground">
                        {formatCurrency(fin.value)}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Abrir financeiro
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog for event creation/edit */}
      <EventFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        eventToEdit={eventToEdit}
        defaultDate={selectedDate}
        onSuccess={() => {
          // Mantém a data selecionada ou refresca
        }}
      />

      {/* Quote form and preview dialogs */}
      <QuoteFormSheet
        open={isQuoteFormOpen}
        onOpenChange={setIsQuoteFormOpen}
        quoteToEdit={quoteToEdit}
        onSuccess={(savedQuote) => {
          const targetDateStr = savedQuote.eventStartDate || savedQuote.date
          if (targetDateStr) {
            const parsed = parseLocalDate(targetDateStr)
            if (parsed) {
              setSelectedDate(parsed)
            }
          }
        }}
      />

      <QuotePreviewDialog
        open={!!quoteToPreview}
        onOpenChange={(op) => !op && setQuoteToPreview(null)}
        quote={quoteToPreview}
        client={clients.find((c) => c.id === quoteToPreview?.clientId)}
        onEdit={(q) => {
          setQuoteToEdit(q)
          setIsQuoteFormOpen(true)
        }}
      />
    </div>
  )
}
export default Agenda
