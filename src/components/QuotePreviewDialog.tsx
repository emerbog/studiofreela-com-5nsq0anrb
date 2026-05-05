import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Quote } from '@/types'
import { useAppData } from '@/hooks/use-app-data'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'

interface QuotePreviewDialogProps {
  quote: Quote | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotePreviewDialog({ quote, open, onOpenChange }: QuotePreviewDialogProps) {
  const { clients } = useAppData()

  if (!quote) return null

  const client = clients.find((c) => c.id === quote.clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] md:h-auto overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none">
        <div className="bg-background border rounded-t-xl p-6 border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
          <DialogHeader className="flex flex-row items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-serif text-heading">
                Visualização de Orçamento
              </DialogTitle>
              <DialogDescription>
                Documento de proposta comercial pronto para envio
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-background text-sm py-1 px-3 mt-0">
              {quote.status}
            </Badge>
          </DialogHeader>
        </div>

        <div className="p-8 md:p-12 bg-white text-slate-900 rounded-b-xl border border-t-0 shadow-lg">
          {/* Mockup do Documento */}
          <div className="max-w-2xl mx-auto space-y-12 text-sm">
            {/* Cabeçalho do Documento */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8">
              <div>
                <h1 className="text-3xl font-serif font-bold tracking-tight text-slate-900 mb-2">
                  Elegante.
                </h1>
                <p className="text-slate-500">Serviços Fotográficos</p>
                <p className="text-slate-500">contato@elegante.com</p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-semibold text-lg text-slate-900 tracking-wider">ORÇAMENTO</p>
                <p className="text-slate-500">Nº: {quote.number}</p>
                <p className="text-slate-500">Data: {formatDate(quote.date)}</p>
              </div>
            </div>

            {/* Informações do Cliente */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
                Preparado Para:
              </h3>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                <p className="font-medium text-base text-slate-900">{client?.name}</p>
                <p className="text-slate-600">{client?.email}</p>
                <p className="text-slate-600">{client?.phone}</p>
                {client?.document && <p className="text-slate-600">Doc: {client.document}</p>}
              </div>
            </div>

            {/* Tabela de Itens */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="py-3 text-left font-semibold text-slate-900">
                      Descrição do Serviço
                    </th>
                    <th className="py-3 text-center font-semibold text-slate-900">Qtd</th>
                    <th className="py-3 text-right font-semibold text-slate-900">Valor Unit.</th>
                    <th className="py-3 text-right font-semibold text-slate-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quote.items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="py-4 text-slate-700">{item.description}</td>
                      <td className="py-4 text-center text-slate-500">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-500">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais */}
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-3">
                <div className="flex justify-between border-b border-slate-200 pb-3">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="text-slate-700">{formatCurrency(quote.total)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-serif">
                  <span className="font-semibold text-slate-900">Total Geral:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-4 text-center text-xs text-slate-400 border-t border-slate-200 mt-12">
              <p>Este orçamento é válido por 15 dias após a data de emissão.</p>
              <p>
                A aprovação deste orçamento não garante a reserva da data, que só se efetiva
                mediante assinatura de contrato.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
