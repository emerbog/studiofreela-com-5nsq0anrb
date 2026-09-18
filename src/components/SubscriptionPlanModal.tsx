import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { billingService } from '@/services/billingService'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { PlanTier, PlanConfig, SubscriptionItem, PaymentItem } from '@/types'
import {
  CreditCard,
  Check,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  QrCode,
  FileText,
  AlertCircle,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface SubscriptionPlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPlan?: PlanTier
}

export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({
  open,
  onOpenChange,
  initialPlan,
}) => {
  const { user, refreshUser } = useAuth()
  const [plans, setPlans] = useState<PlanConfig[]>([])
  const [isConfigured, setIsConfigured] = useState<boolean>(true)
  const [isSandbox, setIsSandbox] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(initialPlan || 'intermediate')
  const [cpfCnpj, setCpfCnpj] = useState<string>('')
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false)
  const [checkoutData, setCheckoutData] = useState<{
    checkoutUrl: string
    subscriptionId: string
    price: number
    plan: PlanTier
  } | null>(null)

  // Histórico de assinaturas e pagamentos do usuário
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)

  // Simulação sandbox
  const [simulating, setSimulating] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      loadBillingConfig()
      loadUserBillingHistory()
      if (initialPlan) {
        setSelectedPlan(initialPlan)
      }
    }
  }, [open, initialPlan])

  const loadBillingConfig = async () => {
    setLoading(true)
    try {
      const config = await billingService.getConfig()
      setPlans(config.plans)
      setIsConfigured(config.configured)
      setIsSandbox(config.environment === 'sandbox')
    } catch (_) {
      // Fallback local se endpoint falhar
      setPlans([
        {
          id: 'economy',
          name: 'Economy',
          price: 0,
          currency: 'BRL',
          billingInterval: 'monthly',
          features: [
            'Agenda de eventos (até 20 eventos)',
            'Base de clientes (até 10 clientes)',
            'Contas a receber e financeiro básico',
            'Orçamentos com itens e taxas',
            'Suporte padrão por e-mail',
          ],
        },
        {
          id: 'intermediate',
          name: 'Intermediate',
          price: 29.9,
          currency: 'BRL',
          billingInterval: 'monthly',
          badge: 'Mais Popular',
          features: [
            'Agenda de eventos ilimitada',
            'Base de clientes ilimitada',
            'Emissão de orçamentos completos em PDF',
            'Controle financeiro avançado e parcelas',
            'Suporte prioritário',
          ],
        },
        {
          id: 'advanced',
          name: 'Advanced',
          price: 49.9,
          currency: 'BRL',
          billingInterval: 'monthly',
          badge: 'Completo',
          features: [
            'Tudo do Intermediate incluso',
            'Gerador interativo de contratos com validade jurídica',
            'Exportação e impressão direta de contratos',
            'Modelos jurídicos LGPD, confidencialidade e foro',
            'Suporte VIP 24/7',
          ],
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 89.9,
          currency: 'BRL',
          billingInterval: 'monthly',
          badge: 'Enterprise',
          features: [
            'Tudo do Advanced incluso',
            'Múltiplos usuários e operadores',
            'Auditoria comercial completa',
            'Atendimento consultivo e onboarding assistido',
          ],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadUserBillingHistory = async () => {
    setLoadingHistory(true)
    try {
      const [subs, pays] = await Promise.all([
        billingService.getMySubscriptions(),
        billingService.getMyPayments(),
      ])
      setSubscriptions(subs)
      setPayments(pays)
    } catch (_) {
      // Ignorar erros se coleções vazias
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleStartCheckout = async (planTier: PlanTier) => {
    if (planTier === 'economy') {
      toast({
        title: 'Plano Economy já disponível',
        description: 'Você pode utilizar os recursos do plano Economy sem custo.',
      })
      return
    }

    setCheckoutLoading(true)
    try {
      const res = await billingService.createCheckout({
        plan: planTier,
        cpfCnpj: cpfCnpj.trim() || undefined,
      })

      if (res.success && res.checkoutUrl) {
        setCheckoutData({
          checkoutUrl: res.checkoutUrl,
          subscriptionId: res.subscriptionId,
          price: res.price,
          plan: res.plan,
        })
        toast({
          title: 'Checkout Asaas gerado!',
          description:
            'Acesse o link seguro do Asaas para concluir seu pagamento via Pix, Boleto ou Cartão.',
        })
        // Recarregar histórico
        await loadUserBillingHistory()
      } else {
        toast({
          title: 'Erro ao gerar checkout',
          description: res.message || 'Não foi possível gerar a assinatura no gateway.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Falha ao conectar com o gateway de cobrança Asaas.'
      toast({
        title: 'Aviso de Cobrança',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Simular confirmação de pagamento em modo Sandbox
  const handleSimulatePayment = async () => {
    setSimulating(true)
    try {
      await billingService.simulateSandboxScenario({
        scenario: 'payment_confirmed',
        plan_tier: selectedPlan,
        billing_type: 'PIX',
      })
      toast({
        title: 'Simulação de Pagamento Aprovada!',
        description: `Seu plano foi atualizado para ${selectedPlan.toUpperCase()} via simulação Sandbox Asaas.`,
      })
      await refreshUser()
      await loadUserBillingHistory()
      setCheckoutData(null)
    } catch (err: any) {
      toast({
        title: 'Erro na simulação',
        description: err?.message || 'Falha ao processar simulação.',
        variant: 'destructive',
      })
    } finally {
      setSimulating(false)
    }
  }

  const isPilot = user?.pilot_access
  const currentPlan = user?.plan_tier || 'economy'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-serif">
                  Planos & Assinatura Studio Freela
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Pagamento recorrente mensal com gateway seguro <strong>Asaas</strong> (Pix, Boleto
                  e Cartão de Crédito).
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isSandbox && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30"
                >
                  Modo Sandbox
                </Badge>
              )}
              {isPilot && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                >
                  Acesso Piloto Liberado
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Alerta de Acesso Piloto */}
        {isPilot && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Você possui Acesso de Piloto Convidado (Irrestrito)</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Sua conta possui liberação total de todos os recursos (contratos ilimitados,
                clientes e agenda). Qualquer teste de contratação com o Asaas coexistirá sem revogar
                seu privilégio de piloto.
              </p>
            </div>
          </div>
        )}

        {/* Alerta caso o gateway Asaas ainda não tenha ASAAS_API_KEY no ambiente */}
        {!isConfigured && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Integração Asaas em configuração</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                A chave de API do Asaas (<code>ASAAS_API_KEY</code>) ainda não foi configurada nos
                Secrets do ambiente. Você pode visualizar os planos e simular os fluxos em modo
                Sandbox com segurança.
              </p>
            </div>
          </div>
        )}

        {/* Modal de Checkout em Andamento / Link Gerado */}
        {checkoutData && (
          <div className="p-5 bg-card border-2 border-primary/40 rounded-xl shadow-sm space-y-4 my-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Assinatura Criada no Gateway Asaas
                </span>
                <h3 className="text-lg font-serif font-bold text-foreground">
                  Finalize seu pagamento para liberação automática
                </h3>
              </div>
              <Badge className="bg-primary text-primary-foreground font-mono text-sm self-start sm:self-auto">
                {formatCurrency(checkoutData.price)}/mês
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              O Studio Freela utiliza a política estrita de liberação{' '}
              <strong>somente via Webhook oficial do Asaas</strong>. Nenhum dado do seu cartão
              trafega ou é guardado no Studio Freela. Clique no link abaixo para pagar via Pix,
              Boleto ou Cartão no checkout seguro Asaas:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                asChild
                className="bg-primary text-primary-foreground font-medium text-xs h-10 px-5 gap-2 shadow-sm"
              >
                <a href={checkoutData.checkoutUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Abrir Checkout do Asaas
                </a>
              </Button>

              {isSandbox && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="text-xs h-10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
                  {simulating ? 'Simulando...' : 'Simular Aprovação (Sandbox)'}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCheckoutData(null)}
                className="text-xs h-10"
              >
                Fechar Painel de Checkout
              </Button>
            </div>
          </div>
        )}

        {/* Grade de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id
            const isSelected = selectedPlan === p.id
            const isEconomy = p.id === 'economy'

            return (
              <Card
                key={p.id}
                className={`flex flex-col justify-between transition-all duration-200 cursor-pointer relative ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md bg-card'
                    : 'border-border/70 hover:border-border bg-muted/10'
                } ${isCurrent ? 'bg-primary/5' : ''}`}
                onClick={() => setSelectedPlan(p.id)}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-[9px] uppercase tracking-wider px-2 py-0.5">
                      {p.badge}
                    </Badge>
                  </div>
                )}

                <div>
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-serif font-bold">{p.name}</CardTitle>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        >
                          Seu Plano
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-serif font-bold text-foreground">
                          {p.price === 0 ? 'Grátis' : formatCurrency(p.price)}
                        </span>
                        {p.price > 0 && <span className="text-xs text-muted-foreground">/mês</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {p.price === 0 ? 'Sem compromisso' : 'Cobrança mensal no Asaas'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 pt-1 text-xs">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Incluso:
                    </div>
                    <ul className="space-y-1.5">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="pt-3 pb-4">
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full text-xs h-8">
                      Plano Atual
                    </Button>
                  ) : isEconomy ? (
                    <Button variant="ghost" disabled className="w-full text-xs h-8">
                      Gratuito Padrão
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={`w-full text-xs h-8 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'variant-outline'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlan(p.id)
                        handleStartCheckout(p.id)
                      }}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading && selectedPlan === p.id
                        ? 'Gerando...'
                        : `Assinar ${p.name}`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Seção de dados para o Checkout Asaas */}
        <div className="p-4 bg-muted/30 border border-border/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Checkout Seguro Asaas (Pix, Boleto ou Cartão de Crédito)
            </h4>
            <span className="text-[11px] text-muted-foreground">Certificação PCI-DSS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="inp-cpf-opt" className="text-xs">
                CPF / CNPJ para Nota Fiscal e Fatura (Opcional)
              </Label>
              <Input
                id="inp-cpf-opt"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => handleStartCheckout(selectedPlan)}
                disabled={checkoutLoading || selectedPlan === 'economy'}
                className="w-full text-xs h-8 bg-primary text-primary-foreground gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {checkoutLoading
                  ? 'Preparando Checkout...'
                  : `Ir para Checkout Asaas (${selectedPlan.toUpperCase()})`}
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            * Seus dados de pagamento são preenchidos exclusivamente na tela protegida do Asaas. A
            liberação do plano no Studio Freela ocorre imediatamente após a confirmação do pagamento
            enviada pelo webhook oficial.
          </p>
        </div>

        {/* Histórico do Usuário */}
        {subscriptions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Minhas Assinaturas Registradas
            </h4>
            <div className="border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border/60 text-[11px] text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-3">Plano</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Vencimento</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 capitalize font-medium">{s.plan}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                        {s.price ? formatCurrency(s.price) : 'Gratuito'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={
                            s.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : s.status === 'past_due'
                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                          }
                        >
                          {s.status === 'active'
                            ? 'Ativa'
                            : s.status === 'past_due'
                              ? 'Vencida'
                              : s.status === 'incomplete'
                                ? 'Aguardando Pagamento'
                                : s.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {s.current_period_end ? formatDate(s.current_period_end) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {s.checkout_url && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] gap-1 text-primary"
                          >
                            <a href={s.checkout_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> Fatura
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cancelamento a qualquer momento sem fidelidade ou multa.</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
