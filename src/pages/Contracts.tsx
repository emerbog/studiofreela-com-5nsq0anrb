import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatShortDate } from '@/lib/formatters'
import { Lock, Plus, FileSignature, FileText } from 'lucide-react'
import { ContractFormSheet } from '@/components/ContractFormSheet'

export default function Contracts() {
  const { currentTier, contracts, clients, quotes } = useAppData()

  const tierPriority = { economy: 1, intermediate: 2, premium: 3 }
  const isLocked = tierPriority[currentTier] < tierPriority.premium

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 shadow-sm">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-serif font-semibold mb-3">Módulo de Contratos</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Gere contratos formais vinculados a clientes ou orçamentos para dar segurança jurídica ao
          seu negócio.
          <br />
          Exclusivo do plano <strong>Premium</strong>.
        </p>
        <Button size="lg" className="rounded-full shadow-md px-8">
          Fazer Upgrade para Premium
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
        <div className="space-y-1">
          <h2 className="text-3xl text-heading font-semibold">Contratos</h2>
          <p className="text-muted-foreground">Formalize acordos de prestação de serviços.</p>
        </div>
        <ContractFormSheet
          triggerAsChild={
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          }
        />
      </div>

      <Card className="elegant-card">
        <CardHeader>
          <CardTitle>Histórico de Contratos</CardTitle>
          <CardDescription>Lista de todos os contratos gerados no sistema.</CardDescription>
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
                    Orçamento Ref.
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Data Emissão
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
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground h-24">
                      Nenhum contrato gerado.
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => {
                    const client = clients.find((c) => c.id === contract.clientId)
                    const quote = quotes.find((q) => q.id === contract.quoteId)

                    return (
                      <tr
                        key={contract.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle font-medium flex items-center gap-2">
                          <FileSignature className="w-4 h-4 text-muted-foreground" />
                          {contract.number}
                        </td>
                        <td className="p-4 align-middle">{client?.name || 'Cliente Removido'}</td>
                        <td className="p-4 align-middle">
                          {quote ? (
                            <span className="flex items-center gap-1.5 text-xs bg-secondary px-2.5 py-1 rounded-md max-w-fit font-medium">
                              <FileText className="w-3.5 h-3.5" /> {quote.number}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 align-middle">{formatShortDate(contract.date)}</td>
                        <td className="p-4 align-middle text-center">
                          <Badge
                            variant={contract.status === 'Assinado' ? 'default' : 'outline'}
                            className="font-normal rounded-sm"
                          >
                            {contract.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <Button variant="ghost" size="sm">
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
    </div>
  )
}
