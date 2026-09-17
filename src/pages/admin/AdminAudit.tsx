import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { formatDate } from '@/lib/formatters'
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  FileSpreadsheet,
  AlertOctagon,
  UserCheck,
  Ban,
  KeyRound,
  Layers,
  Lock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const AdminAudit: React.FC = () => {
  const { overviewData } = useAdmin()
  const logs = overviewData?.auditLogs || []

  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const email = l.admin_email || ''
      const action = l.action || ''
      const matchSearch =
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.details && JSON.stringify(l.details).toLowerCase().includes(searchTerm.toLowerCase()))

      const matchAction = actionFilter === 'all' || l.action === actionFilter
      return matchSearch && matchAction
    })
  }, [logs, searchTerm, actionFilter])

  const actionMeta: Record<string, { label: string; color: string; icon: any }> = {
    user_blocked: {
      label: 'Bloqueio de Usuário',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: Ban,
    },
    user_unblocked: {
      label: 'Desbloqueio de Usuário',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: UserCheck,
    },
    user_sessions_revoked: {
      label: 'Revogação de Sessões',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Lock,
    },
    password_reset_requested: {
      label: 'Reset de Senha',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: KeyRound,
    },
    csv_export_users: {
      label: 'Exportação CSV (Massa)',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: FileSpreadsheet,
    },
    role_changed: {
      label: 'Alteração de Papel',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: ShieldAlert,
    },
    role_assigned: {
      label: 'Atribuição de Papel',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: ShieldAlert,
    },
    plan_changed: {
      label: 'Alteração de Plano',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Layers,
    },
    webhook_payment_received: {
      label: 'Evento de Pagamento',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle,
    },
    account_deleted: {
      label: 'Exclusão LGPD',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: AlertOctagon,
    },
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
          Trilha de Auditoria & Segurança
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Registro imutável de todas as ações executadas por administradores, webhooks e rotinas do
          sistema.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por e-mail, ação ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todas as Ações</SelectItem>
              <SelectItem value="user_blocked">Bloqueio de Usuário</SelectItem>
              <SelectItem value="user_unblocked">Desbloqueio de Usuário</SelectItem>
              <SelectItem value="user_sessions_revoked">Revogação de Sessões</SelectItem>
              <SelectItem value="password_reset_requested">Reset de Senha</SelectItem>
              <SelectItem value="csv_export_users">Exportação CSV</SelectItem>
              <SelectItem value="role_changed">Alteração de Papel</SelectItem>
              <SelectItem value="plan_changed">Alteração de Plano</SelectItem>
              <SelectItem value="webhook_payment_received">Webhook de Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              Nenhum registro de auditoria encontrado.
            </p>
            <p className="text-slate-500 text-xs">
              Ações administrativas são gravadas automaticamente para conformidade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Alvo</th>
                  <th className="py-3 px-4">Detalhes</th>
                  <th className="py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((l) => {
                  const meta = actionMeta[l.action] || {
                    label: l.action,
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                    icon: ShieldAlert,
                  }
                  const Icon = meta.icon

                  return (
                    <tr key={l.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(l.created)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{l.admin_email || 'Sistema'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-[11px] ${meta.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {l.target_id || l.target_type || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-sm truncate font-mono text-[11px]">
                        {l.details ? JSON.stringify(l.details) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {l.ip_address || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        🛡️ <strong>Princípio da Responsabilidade (LGPD art. 6º, X):</strong> Todas as intervenções
        sobre contas de titulares são gravadas para comprovação de boas práticas e defesa de
        direitos.
      </div>
    </div>
  )
}
