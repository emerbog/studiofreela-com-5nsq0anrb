import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileCheck,
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

export const AdminPayments: React.FC = () => {
  const { overviewData } = useAdmin()
  const payments = overviewData?.payments || []
  const users = overviewData?.users || []

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>()
    users.forEach((u) => map.set(u.id, { name: u.name, email: u.email }))
    return map
  }, [users])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const userInfo = userMap.get(p.user)
      const name = userInfo?.name || ''
      const email = userInfo?.email || ''
      const matchSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.gateway_payment_id &&
          p.gateway_payment_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.gateway_subscription_id &&
          p.gateway_subscription_id.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [payments, userMap, searchTerm, statusFilter])

  // Exportar CSV
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há pagamentos disponíveis no filtro atual.',
      })
      return
    }

    const headers = [
      'ID Pagamento',
      'Usuário Nome',
      'Usuário Email',
      'Valor (BRL)',
      'Status',
      'Método de Pagamento',
      'Provedor',
      'ID Cobrança Gateway',
      'ID Assinatura Gateway',
      'Data Pagamento',
      'Data Criação',
    ]

    const rows = filtered.map((p) => {
      const u = userMap.get(p.user)
      return [
        `"${p.id}"`,
        `"${(u?.name || p.user).replace(/"/g, '""')}"`,
        `"${(u?.email || '').replace(/"/g, '""')}"`,
        p.amount || 0,
        `"${p.status}"`,
        `"${p.payment_method_type || 'other'}"`,
        `"${p.gateway_provider || 'asaas'}"`,
        `"${p.gateway_payment_id || ''}"`,
        `"${p.gateway_subscription_id || ''}"`,
        `"${p.paid_at || ''}"`,
        `"${p.created}"`,
      ].join(',')
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `studiofreela_pagamentos_${new Date().toISOString().slice(0, 10)}.csv`,
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
  const totalReceived = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)

  const succeededCount = payments.filter((p) => p.status === 'succeeded').length
  const failedCount = payments.filter((p) => p.status === 'failed').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Histórico de Pagamentos Asaas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditoria de faturas, transações via Pix/Boleto/Cartão, conciliação e falhas.
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">Total Liquidado</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalReceived)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{succeededCount} transações pagas</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">
              Cobranças Aprovadas
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{succeededCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Sem chargebacks ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-slate-400">
              Cobranças Recusadas
            </CardTitle>
            <XCircle className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{failedCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Saldo insuficiente ou bloqueio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por cliente ou ID de transação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Status do pagamento" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="succeeded">Aprovado (Succeeded)</SelectItem>
              <SelectItem value="pending">Pendente (Pending)</SelectItem>
              <SelectItem value="failed">Recusado (Failed)</SelectItem>
              <SelectItem value="refunded">Estornado (Refunded)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <DollarSign className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              Nenhuma transação de gateway registrada ainda.
            </p>
            <p className="text-slate-500 max-w-md mx-auto text-xs leading-relaxed">
              O webhook receptor está pronto para receber callbacks dos provedores de pagamento
              homologados com validação criptográfica.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pagador</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">ID Transação</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4 text-right">Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((p) => {
                  const user = userMap.get(p.user)
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{user?.name || p.user}</div>
                        <div className="text-[11px] text-slate-400">{user?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-300">
                        {p.payment_method_type === 'pix'
                          ? 'PIX Instantâneo'
                          : p.payment_method_type === 'credit_card'
                            ? 'Cartão de Crédito'
                            : p.payment_method_type === 'boleto'
                              ? 'Boleto Bancário'
                              : p.payment_method_type || 'PIX'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={
                            p.status === 'succeeded'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : p.status === 'failed'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : p.status === 'refunded'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }
                        >
                          {p.status === 'succeeded'
                            ? 'Aprovado'
                            : p.status === 'failed'
                              ? 'Recusado / Vencido'
                              : p.status === 'refunded'
                                ? 'Estornado'
                                : 'Pendente'}
                        </Badge>
                        {p.failure_reason && (
                          <span className="block text-[10px] text-rose-400 mt-0.5">
                            {p.failure_reason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {p.gateway_payment_id || p.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.paid_at ? formatDate(p.paid_at) : formatDate(p.created)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(p.invoice_url || p.bank_slip_url) && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] gap-1 text-slate-300 hover:text-white"
                          >
                            <a
                              href={p.invoice_url || p.bank_slip_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" /> Ver
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
    </div>
  )
}
