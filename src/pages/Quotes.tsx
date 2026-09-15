import React, { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  FileText,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Send,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { QuoteFormSheet } from '@/components/QuoteFormSheet'
import { QuotePreviewDialog } from '@/components/QuotePreviewDialog'
import { Quote } from '@/types'

export default function Quotes() {
  const { quotes, clients, updateQuote, deleteQuote, currentTier } = useAppData()
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null)

  const isEconomy = currentTier === 'economy'

  const handleUpdateStatus = async (quote: Quote, newStatus: Quote['status']) => {
    await updateQuote(quote.id, { status: newStatus })
  }

  const handleDeleteConfirm = async () => {
    if (quoteToDelete) {
      await deleteQuote(quoteToDelete.id)
      setQuoteToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <QuotePreviewDialog
        quote={selectedQuote}
        open={!!selectedQuote}
        onOpenChange={(open) => !open && setSelectedQuote(null)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!quoteToDelete} onOpenChange={(open) => !open && setQuoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Confirmar exclusão de orçamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento{' '}
              <strong className="text-foreground">{quoteToDelete?.number}</strong>? Esta ação é
              irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Orçamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-heading">
            Orçamentos & Propostas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gere propostas comerciais em PDF com discriminação de itens e valores.
          </p>
        </div>
        <QuoteFormSheet />
      </div>

      {isEconomy && (
        <Card className="border border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#b07d4f]/20 flex items-center justify-center text-[#b07d4f] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-sm text-foreground">
                  Recurso dos Planos Intermediate e Advanced
                </h3>
                <p className="text-xs text-muted-foreground">
                  Seu plano atual é o Economy. Faça upgrade para gerar e emitir propostas formais em
                  PDF com sua marca.
                </p>
              </div>
            </div>
            <QuoteFormSheet
              triggerAsChild={
                <Button size="sm" variant="outline" className="text-xs shrink-0">
                  Ver Formulário
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/60 shadow-xs">
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-semibold text-foreground">
                Nenhum orçamento emitido
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Crie propostas personalizadas para seus clientes com cálculo automático de totais.
              </p>
              <div className="mt-4">
                <QuoteFormSheet />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-serif">Número</TableHead>
                  <TableHead className="font-serif">Cliente</TableHead>
                  <TableHead className="font-serif">Data de Emissão</TableHead>
                  <TableHead className="font-serif">Total Previsto</TableHead>
                  <TableHead className="font-serif">Situação</TableHead>
                  <TableHead className="text-right font-serif">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => {
                  const client = clients.find((c) => c.id === quote.clientId)
                  return (
                    <TableRow key={quote.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {quote.number}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {client ? client.name : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatShortDate(quote.date)}
                      </TableCell>
                      <TableCell className="font-serif font-semibold text-foreground">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            quote.status === 'Aprovado'
                              ? 'default'
                              : quote.status === 'Rejeitado'
                                ? 'destructive'
                                : quote.status === 'Enviado'
                                  ? 'secondary'
                                  : 'outline'
                          }
                          className="text-[10px] font-sans"
                        >
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedQuote(quote)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Visualizar proposta"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(quote, 'Enviado')}
                                className="gap-2 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5 text-blue-600" /> Marcar como Enviado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(quote, 'Aprovado')}
                                className="gap-2 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Marcar como
                                Aprovado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(quote, 'Rejeitado')}
                                className="gap-2 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-amber-600" /> Marcar como
                                Rejeitado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setQuoteToDelete(quote)}
                                className="gap-2 text-destructive cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir Orçamento
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
