import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  Download,
  ExternalLink,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export const AdminSubscriptions: React.FC = () => {
  const { overviewData } = useAdmin()
  const subscriptions = overviewData?.subscriptions || []
  const users = overviewData?.users || []

  // Create a fast map user_id -> user
  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>()
    users.forEach((u) => map.set(u.id, { name: u.name, email: u.email }))
    return map
  }, [users])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const userInfo = userMap.get(s.user)
      const name = userInfo?.name || ''
      const email = userInfo?.email || ''
      const matchSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.gateway_subscription_id &&
          s.gateway_subscription_id.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [subscriptions, userMap, searchTerm, statusFilter])

  // Exportar CSV
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há assinaturas disponíveis para o filtro atual.',
      })
      return
    }

    const headers = [
      'ID Assinatura',
      'Assinante Nome',
      'Assinante Email',
      'Plano',
      'Preço (BRL)',
      'Status',
      'Intervalo',
      'Início Período',
      'Fim Período / Próx Cobrança',
      'Provedor',
      'ID Gateway',
      'Data Criação',
    ]

    const rows = filtered.map((s) => {
      const u = userMap.get(s.user)
      return [
        `"${s.id}"`,
        `"${(u?.name || s.user).replace(/"/g, '""')}"`,
        `"${(u?.email || '').replace(/"/g, '""')}"`,
        `"${s.plan}"`,
        s.price || 0,
        `"${s.status}"`,
        `"${s.billing_interval || 'monthly'}"`,
        `"${s.current_period_start || ''}"`,
        `"${s.current_period_end || s.next_due_date || ''}"`,
        `"${s.gateway_provider || 'asaas'}"`,
        `"${s.gateway_subscription_id || ''}"`,
        `"${s.created}"`,
      ].join(',')
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `studiofreela_assinaturas_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({
      title: 'Exportação Concluída',
      description: `${filtered.length} registro(s) exportado(s) com sucesso.`,
    })
  }

  // Stats
  const activeCount = subscriptions.filter((s) => s.status === 'active').length
  const pastDueCount = subscriptions.filter((s) => s.status === 'past_due').length
  const canceledCount = subscriptions.filter((s) => s.status === 'canceled').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Gestão de Assinaturas Asaas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhamento em tempo real de planos, cobranças recorrentes, inadimplência e
            cancelamentos.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="outline"
          size="sm"
          className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-9 gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar CSV ({filtered.length})
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">Assinaturas Ativas</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeCount}</div>
            <p className="text-[11px] text-emerald-400 mt-0.5">Recorrência regular</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">
              Inadimplência / Atrasadas
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{pastDueCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Cobranças vencidas</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">Canceladas</CardTitle>
            <XCircle className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{canceledCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Churn acumulado</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">Integração Gateway</CardTitle>
            <Layers className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-white">Webhook Ativo</div>
            <p className="text-[11px] text-slate-400 mt-0.5">/backend/v1/webhooks/payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por assinante ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Status da assinatura" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="past_due">Atrasadas / Past Due</SelectItem>
              <SelectItem value="trialing">Em Período de Teste</SelectItem>
              <SelectItem value="canceled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              Nenhuma assinatura externa registrada no momento.
            </p>
            <p className="text-slate-500 max-w-md mx-auto text-xs leading-relaxed">
              A arquitetura com tabelas e webhooks seguros está operacional. Assim que o gateway
              (ex.: Stripe ou Asaas) for conectado, novas assinaturas serão sincronizadas em tempo
              real com auditoria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Assinante</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Próxima Cobrança</th>
                  <th className="py-3 px-4">Provedor & ID Gateway</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((s) => {
                  const user = userMap.get(s.user)
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{user?.name || s.user}</div>
                        <div className="text-[11px] text-slate-400">{user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-slate-200">
                        {s.plan}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">
                        {s.price ? formatCurrency(s.price) : 'Gratuito'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={
                            s.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : s.status === 'past_due'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : s.status === 'incomplete'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }
                        >
                          {s.status === 'active'
                            ? 'Ativa'
                            : s.status === 'past_due'
                              ? 'Inadimplente / Vencida'
                              : s.status === 'incomplete'
                                ? 'Aguardando Pagamento'
                                : s.status === 'canceled'
                                  ? 'Cancelada'
                                  : s.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {s.current_period_end
                          ? formatDate(s.current_period_end)
                          : s.next_due_date
                            ? formatDate(s.next_due_date)
                            : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium uppercase text-[10px]">
                          {s.gateway_provider || 'Asaas'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                          {s.gateway_subscription_id || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.checkout_url && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] gap-1 text-slate-300 hover:text-white"
                          >
                            <a href={s.checkout_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" /> Fatura
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gateway info card */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
        <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          Conformidade e Segurança de Pagamento
        </h4>
        <p className="leading-relaxed">
          Nenhum número de cartão de crédito é armazenado na base de dados do Studio Freela. Todas
          as transações são delegadas a gateways certificados PCI-DSS. O endpoint seguro{' '}
          <code>/backend/v1/webhooks/payments</code> processa notificações de alteração de status e
          validação criptográfica.
        </p>
      </div>
    </div>
  )
}
