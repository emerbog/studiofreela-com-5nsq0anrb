import { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatShortDate, formatCurrency } from '@/lib/formatters'
import {
  Lock,
  Plus,
  FileSignature,
  FileText,
  Sparkles,
  Printer,
  Eye,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { Contract } from '@/types'
import { InteractiveContractEditor } from '@/components/InteractiveContractEditor'
import { ContractDocumentViewer } from '@/components/ContractDocumentViewer'
import { ContractFormDialog } from '@/components/ContractFormDialog'
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

export default function Contracts() {
  const { currentTier, setCurrentTier, contracts, clients, quotes, deleteContract } = useAppData()
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'view'>('list')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const tierPriority = { economy: 1, intermediate: 2, advanced: 3, premium: 3 }
  const isLocked = tierPriority[currentTier] < tierPriority.advanced

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 shadow-sm border border-border/60">
          <Lock className="w-8 h-8 text-accent" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent font-medium text-xs mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Exclusivo Plano Advanced
        </div>
        <h1 className="text-3xl font-serif font-semibold mb-3">Gerador Interativo de Contratos</h1>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Preencha modelos jurídicos de prestação de serviços freelancer com campos dinâmicos,
          cálculo de parcelas, entregas, cláusulas LGPD e gere contratos formatados em alta
          definição.
          <br />
          Disponível no plano <strong>Advanced</strong>.
        </p>
        <Button
          size="lg"
          onClick={() => setCurrentTier('advanced')}
          className="rounded-full shadow-md px-8 gap-2 bg-primary hover:bg-primary/90"
        >
          <Sparkles className="w-4 h-4 text-accent" />
          Fazer Upgrade para o Plano Advanced
        </Button>
      </div>
    )
  }

  const handleOpenViewer = (contract: Contract) => {
    setSelectedContract(contract)
    setActiveTab('view')
  }

  const handleCreateNew = () => {
    setSelectedContract(null)
    setActiveTab('create')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visualização Direta do Contrato Formatado */}
      {activeTab === 'view' && selectedContract && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-heading">
                Visualização do Contrato
              </h1>
              <p className="text-sm text-muted-foreground">
                Documento jurídico pronto para conferência e assinatura.
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('list')}>
              Fechar Visualização
            </Button>
          </div>

          <ContractDocumentViewer contract={selectedContract} onBack={() => setActiveTab('list')} />
        </div>
      )}

      {/* Formulário Interativo Completo */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <h1 className="sr-only">Gerador Interativo de Contrato</h1>
          <InteractiveContractEditor
            initialContract={selectedContract}
            onGenerateSuccess={(contract) => {
              setSelectedContract(contract)
              setActiveTab('view')
            }}
            onCancel={() => setActiveTab('list')}
          />
        </div>
      )}

      {/* Lista Principal de Contratos */}
      {activeTab === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-serif text-heading font-semibold">
                  Contratos de Prestação de Serviços
                </h1>
                <Badge
                  variant="secondary"
                  className="text-xs bg-accent/15 text-accent-foreground font-sans border-accent/30"
                >
                  Plano Advanced
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Crie, preencha formulários dinâmicos e emita contratos formais completos para
                clientes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleCreateNew} className="shadow-sm gap-2">
                <Plus className="w-4 h-4" />
                Novo Contrato Interativo
              </Button>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="elegant-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total de Contratos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-serif">{contracts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Registrados no sistema</p>
              </CardContent>
            </Card>

            <Card className="elegant-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assinados / Vigentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-serif text-emerald-600">
                  {contracts.filter((c) => c.status === 'Assinado').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Garantia e segurança jurídica ativa
                </p>
              </CardContent>
            </Card>

            <Card className="elegant-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Em Negociação / Rascunhos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-serif text-amber-600">
                  {contracts.filter((c) => c.status !== 'Assinado').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Prontos para envio ou ajuste</p>
              </CardContent>
            </Card>
          </div>

          <Card className="elegant-card">
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <CardTitle>Histórico de Contratos Emitidos</CardTitle>
                <CardDescription>
                  Visualize os instrumentos contratuais preenchidos com o modelo oficial de
                  prestação de serviços.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b border-border/50">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Documento
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Contratante / Cliente
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Orçamento Ref.
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Valor
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Emissão
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
                        <td colSpan={7} className="text-center py-16 px-4">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                              <FileSignature className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-serif font-semibold text-base text-foreground">
                              Nenhum contrato gerado ainda
                            </h3>
                            <p className="text-xs text-muted-foreground text-center">
                              Crie contratos profissionais de prestação de serviços com cláusulas
                              jurídicas completas, proteção LGPD e exportação para PDF.
                            </p>
                            <Button
                              size="sm"
                              onClick={handleCreateNew}
                              className="gap-2 shadow-sm font-medium mt-1"
                            >
                              <Plus className="w-4 h-4" /> Criar Primeiro Contrato
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      contracts.map((contract) => {
                        const client = clients.find((c) => c.id === contract.clientId)
                        const quote = quotes.find((q) => q.id === contract.quoteId)
                        const totalVal = contract.formData?.totalValue

                        return (
                          <tr
                            key={contract.id}
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          >
                            <td className="p-4 align-middle font-medium">
                              <div className="flex items-center gap-2">
                                <FileSignature className="w-4 h-4 text-accent shrink-0" />
                                <span className="font-mono text-xs font-semibold">
                                  {contract.number}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <div>
                                <div className="font-medium">
                                  {contract.formData?.clientName || client?.name || 'Cliente'}
                                </div>
                                {contract.formData?.clientDoc && (
                                  <div className="text-xs text-muted-foreground">
                                    {contract.formData.clientDoc}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              {quote ? (
                                <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded font-medium">
                                  <FileText className="w-3 h-3 text-muted-foreground" />{' '}
                                  {quote.number}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            <td className="p-4 align-middle text-right font-medium">
                              {totalVal ? formatCurrency(totalVal) : '-'}
                            </td>
                            <td className="p-4 align-middle text-muted-foreground text-xs">
                              {formatShortDate(contract.date)}
                            </td>
                            <td className="p-4 align-middle text-center">
                              <Badge
                                variant={contract.status === 'Assinado' ? 'default' : 'outline'}
                                className="font-normal text-xs"
                              >
                                {contract.status}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenViewer(contract)}
                                  className="h-8 gap-1.5 text-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Visualizar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setContractToDelete(contract)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title="Excluir contrato"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
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
        </>
      )}

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!contractToDelete}
        onOpenChange={(open) => !open && setContractToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Confirmar exclusão de contrato
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contrato{' '}
              <strong className="text-foreground">{contractToDelete?.number}</strong>? Esta ação é
              definitiva e removerá as cláusulas e assinaturas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (contractToDelete) {
                  await deleteContract(contractToDelete.id)
                  setContractToDelete(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Contrato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para acionamento direto via componentes externos se necessário */}
      <ContractFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
