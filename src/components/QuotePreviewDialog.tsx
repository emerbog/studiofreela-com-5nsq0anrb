import React, { useState } from 'react'
import { Quote, Client } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/formatters'
import { exportQuoteToPdf, shareQuotePdf } from '@/lib/quote-pdf'
import {
  Eye,
  FileDown,
  Share2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Truck,
  Sparkles,
  User,
  ArrowRight,
} from 'lucide-react'

interface QuotePreviewDialogProps {
  quote: Quote | null
  client?: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (quote: Quote) => void
  onConfirm?: (quote: Quote) => void
}

export function QuotePreviewDialog({
  quote,
  client,
  open,
  onOpenChange,
  onEdit,
  onConfirm,
}: QuotePreviewDialogProps) {
  const { user } = useAuth()

  if (!quote) return null

  const items = quote.items || []
  const equipments = quote.equipments || []
  const schedule = quote.paymentSchedule || []
  const logistics = quote.logistics
  const overtime = quote.overtimeRule

  const isConfirmed = quote.status === 'Confirmado' || quote.status === 'Aprovado'
  const isPreReservation = quote.status === 'Enviado'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-serif text-lg sm:text-xl text-heading">
                  Proposta #{quote.number}
                </DialogTitle>
                <Badge
                  variant={isConfirmed ? 'default' : isPreReservation ? 'outline' : 'secondary'}
                  className={
                    isConfirmed
                      ? 'bg-red-600 hover:bg-red-700 text-white border-transparent'
                      : isPreReservation
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : ''
                  }
                >
                  {isConfirmed
                    ? 'Confirmado'
                    : isPreReservation
                      ? 'Pré-reserva ativa'
                      : quote.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Emitido em {formatDate(quote.date)} • Validade de {quote.validityDays || 15} dias
              </DialogDescription>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-muted-foreground block uppercase font-mono">
                Total Geral
              </span>
              <span className="text-xl font-serif font-bold text-primary">
                {formatCurrency(quote.total)}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Header info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/50">
            <div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                Contratante / Cliente
              </span>
              <div className="font-semibold text-sm text-foreground mt-0.5">
                {client?.name || 'Cliente'}
              </div>
              {client?.phone && (
                <div className="text-muted-foreground mt-0.5">WhatsApp: {client.phone}</div>
              )}
              {client?.email && <div className="text-muted-foreground">E-mail: {client.email}</div>}
              {client?.document && (
                <div className="text-muted-foreground font-mono">Doc: {client.document}</div>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">
                Evento & Cronograma
              </span>
              <div className="font-semibold text-sm text-foreground mt-0.5">
                {quote.eventName || 'Serviço sob demanda'}
              </div>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {quote.eventStartDate
                    ? formatShortDate(quote.eventStartDate)
                    : formatDate(quote.date)}{' '}
                  {quote.eventStartTime && `às ${quote.eventStartTime}`}
                  {quote.eventEndTime && ` até ${quote.eventEndTime}`}
                </span>
              </div>
              {quote.eventLocation && (
                <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{quote.eventLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-sm text-heading">Serviços Contratados</h4>
            <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40">
              {items.map((it, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-card text-xs">
                  <div>
                    <span className="font-medium text-foreground">{it.description}</span>
                    <span className="text-muted-foreground ml-2">
                      ({it.quantity} {it.unit || 'un.'} × {formatCurrency(it.unitPrice)})
                    </span>
                  </div>
                  <strong className="text-foreground">
                    {formatCurrency((it.quantity || 1) * (it.unitPrice || 0))}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Equipamentos se houver */}
          {equipments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-heading">
                Equipamentos & Estrutura
              </h4>
              <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40">
                {equipments.map((eq, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between bg-card text-xs"
                  >
                    <div>
                      <span className="font-medium text-foreground">{eq.description}</span>
                      <span className="text-muted-foreground ml-2">({eq.quantity} un.)</span>
                    </div>
                    <div>
                      {eq.includedInService ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">
                          Incluso no serviço
                        </span>
                      ) : (
                        <strong className="text-foreground">
                          {formatCurrency((eq.quantity || 1) * (eq.unitPrice || 0))}
                        </strong>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Condições extras (Hora extra e logística) */}
          <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 space-y-2 text-xs">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary" /> Condições Contratuais & Logística
            </h4>
            <div className="space-y-1 text-muted-foreground leading-relaxed">
              {overtime?.enabled ? (
                <div>
                  • <strong>Hora extra:</strong> {formatCurrency(overtime.hourlyRate)}/hora
                  (tolerância {overtime.graceMinutes || 0} min).
                </div>
              ) : (
                <div>
                  • <strong>Hora extra:</strong> Não prevista ou sob consulta.
                </div>
              )}
              <div>
                • <strong>Alimentação:</strong>{' '}
                {logistics?.meal?.type === 'contractor'
                  ? 'Fornecida pelo contratante no local'
                  : logistics?.meal?.type === 'contracted'
                    ? `Paga pelo profissional (${formatCurrency(logistics.meal.chargedAmount || 0)})`
                    : 'Não se aplica'}
              </div>
              <div>
                • <strong>Transporte:</strong>{' '}
                {logistics?.transport?.type === 'contractor'
                  ? 'Pago/fornecido diretamente pelo contratante'
                  : logistics?.transport?.type === 'contracted'
                    ? `Incluso no orçamento (${formatCurrency(logistics.transport.chargedAmount || 0)})`
                    : 'Não se aplica'}
              </div>
              <div>
                • <strong>Hospedagem:</strong>{' '}
                {logistics?.lodging?.type === 'contractor'
                  ? 'Reserva e pagamento pelo contratante'
                  : logistics?.lodging?.type === 'contracted'
                    ? `Cobrada no orçamento (${formatCurrency(logistics.lodging.chargedAmount || 0)})`
                    : 'Não necessária'}
              </div>
            </div>
          </div>

          {/* Calendário de pagamento */}
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-sm text-heading">Calendário de Pagamento</h4>
            <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40">
              {schedule.map((sc, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-card text-xs">
                  <div>
                    <span className="font-medium text-foreground">{sc.description}</span>
                    <span className="text-muted-foreground ml-2">
                      (Vence em {formatDate(sc.dueDate)} via {sc.method})
                    </span>
                  </div>
                  <strong className="text-foreground">{formatCurrency(sc.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 sm:p-4 border-t border-border/70 bg-card shrink-0 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportQuoteToPdf(quote, client, user, 'view')}
              className="h-9 px-3 text-xs gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Visualizar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportQuoteToPdf(quote, client, user, 'download')}
              className="h-9 px-3 text-xs gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" /> Baixar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => shareQuotePdf(quote, client, user)}
              className="h-9 px-3 text-xs gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(quote)
                }}
                className="h-9 px-3 text-xs"
              >
                Editar
              </Button>
            )}

            {!isConfirmed && onConfirm && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onConfirm(quote)
                  onOpenChange(false)
                }}
                className="h-9 px-3.5 text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirmar Orçamento
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
export default QuotePreviewDialog
