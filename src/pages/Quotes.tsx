import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { Lock, Plus } from 'lucide-react'
import { QuoteFormSheet } from '@/components/QuoteFormSheet'
import { useState } from 'react'
import { QuotePreviewDialog } from '@/components/QuotePreviewDialog'
import { Quote } from '@/types'

export default function Quotes() {
  const { currentTier, quotes, clients } = useAppData()
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const isLocked = currentTier === 'economy'

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 shadow-sm">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-serif font-semibold mb-3">Módulo de Orçamentos</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Crie, envie e gerencie orçamentos profissionais para seus clientes com cálculo automático
          e design elegante.
          <br />
          Disponível a partir do plano <strong>Intermediário</strong>.
        </p>
        <Button size="lg" className="rounded-full shadow-md px-8">
          Fazer Upgrade do Plano
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
        <div className="space-y-1">
          <h2 className="text-3xl text-heading font-semibold">Orçamentos</h2>
          <p className="text-muted-foreground">
            Gerencie propostas e orçamentos para seus clientes.
          </p>
        </div>
        <QuoteFormSheet
          triggerAsChild={
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="elegant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">
              Total Emitido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{quotes.length}</div>
          </CardContent>
        </Card>
        <Card className="elegant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground tracking-wider">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">
              {quotes.filter((q) => q.status === 'Aprovado').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>Histórico de Orçamentos</CardTitle>
          <CardDescription>Lista completa de propostas emitidas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border/50">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Número
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground h-24">
                      Nenhum orçamento criado.
                    </td>
                  </tr>
                ) : (
                  quotes.map((quote) => {
                    const client = clients.find((c) => c.id === quote.clientId)
                    return (
                      <tr
                        key={quote.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle font-medium">{quote.number}</td>
                        <td className="p-4 align-middle">{client?.name || 'Cliente Removido'}</td>
                        <td className="p-4 align-middle">{formatShortDate(quote.date)}</td>
                        <td className="p-4 align-middle text-right font-medium">
                          {formatCurrency(quote.total)}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <Badge
                            variant={quote.status === 'Aprovado' ? 'default' : 'secondary'}
                            className="font-normal rounded-sm"
                          >
                            {quote.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedQuote(quote)}>
                            Visualizar
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <QuotePreviewDialog
        quote={selectedQuote}
        open={!!selectedQuote}
        onOpenChange={(open) => !open && setSelectedQuote(null)}
      />
    </div>
  )
}
