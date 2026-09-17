import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { adminService } from '@/services/adminService'
import { AdminUserItem, PlanTier } from '@/types'
import { formatDate } from '@/lib/formatters'
import {
  Search,
  Filter,
  Download,
  ShieldAlert,
  Ban,
  CheckCircle,
  KeyRound,
  Trash2,
  Eye,
  LogOut,
  RefreshCw,
  UserCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export const AdminUsers: React.FC = () => {
  const { overviewData, refreshData, role } = useAdmin()
  const users = overviewData?.users || []

  // Filters state
  const [searchTerm, setSearchTerm] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all') // all, active, blocked

  // Selected user for modal / actions
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    type:
      | 'block'
      | 'unblock'
      | 'revoke'
      | 'reset_password'
      | 'delete'
      | 'view'
      | 'change_role'
      | 'change_plan'
    user: AdminUserItem | null
    reason?: string
    newRole?: string
    newPlan?: string
  }>({
    isOpen: false,
    type: 'view',
    user: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.profession && u.profession.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchPlan = planFilter === 'all' || u.plan_tier === planFilter

      let matchStatus = true
      if (statusFilter === 'blocked') matchStatus = !!u.is_blocked
      else if (statusFilter === 'active') matchStatus = !u.is_blocked

      return matchSearch && matchPlan && matchStatus
    })
  }, [users, searchTerm, planFilter, statusFilter])

  // Handle Export CSV with Audit logging
  const handleExportCSV = async () => {
    try {
      // 1. Audit log
      await adminService.logUsageEvent('csv_export_users', {
        total_exported: filteredUsers.length,
        filters: { planFilter, statusFilter, searchTerm },
      })

      // 2. Generate CSV
      // LGPD: Mask sensitive phone and address, never show password hashes!
      const headers = [
        'ID',
        'Nome',
        'Email',
        'Telefone',
        'Plano',
        'Status',
        'Papel',
        'Clientes',
        'Orçamentos',
        'Contratos',
        'Data Cadastro',
      ]
      const rows = filteredUsers.map((u) => [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        u.phone ? `"${u.phone.slice(0, 4)}****${u.phone.slice(-2)}"` : '""',
        u.plan_tier,
        u.is_blocked ? 'Bloqueado' : 'Ativo',
        u.role,
        u.counts.clients,
        u.counts.quotes,
        u.counts.contracts,
        u.created,
      ])

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute(
        'download',
        `studiofreela_usuarios_${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Exportação CSV realizada!', {
        description: `${filteredUsers.length} registros exportados e auditados no sistema.`,
      })
    } catch (err: any) {
      toast.error('Falha ao exportar CSV', { description: err?.message })
    }
  }

  // Handle user administrative action
  const handleConfirmAction = async () => {
    if (!actionModal.user) return

    try {
      setIsSubmitting(true)

      if (actionModal.type === 'block') {
        await adminService.executeUserAction(actionModal.user.id, 'block', {
          reason: actionModal.reason || 'Bloqueio administrativo',
        })
        toast.success('Usuário bloqueado com sucesso.')
      } else if (actionModal.type === 'unblock') {
        await adminService.executeUserAction(actionModal.user.id, 'unblock')
        toast.success('Usuário desbloqueado com sucesso.')
      } else if (actionModal.type === 'revoke') {
        await adminService.executeUserAction(actionModal.user.id, 'revoke_sessions')
        toast.success('Sessões ativas do usuário encerradas.')
      } else if (actionModal.type === 'reset_password') {
        await adminService.executeUserAction(actionModal.user.id, 'send_password_reset')
        toast.success('Solicitação de redefinição de senha registrada.')
      } else if (actionModal.type === 'change_role') {
        await adminService.executeUserAction(actionModal.user.id, 'change_role', {
          newRole: actionModal.newRole,
        })
        toast.success(`Papel atualizado para ${actionModal.newRole}.`)
      } else if (actionModal.type === 'change_plan') {
        await adminService.executeUserAction(actionModal.user.id, 'change_plan', {
          newPlan: actionModal.newPlan,
        })
        toast.success(`Plano atualizado para ${actionModal.newPlan}.`)
      } else if (actionModal.type === 'delete') {
        await adminService.executeUserAction(actionModal.user.id, 'delete_account')
        toast.success('Conta excluída conforme solicitação LGPD.')
      }

      await refreshData()
      setActionModal({ isOpen: false, type: 'view', user: null })
    } catch (err: any) {
      toast.error('Erro na ação administrativa', {
        description: err?.message || 'Falha ao processar solicitação.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Gestão de Freelancers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualização, moderação e conformidade LGPD de todos os usuários da base.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por nome, e-mail ou profissão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-9 text-xs"
          />
        </div>

        <div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Filtrar por plano" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todos os Planos</SelectItem>
              <SelectItem value="economy">Economy (Gratuito)</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Status da conta" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Apenas Ativos</SelectItem>
              <SelectItem value="blocked">Apenas Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center text-xs text-slate-400 justify-end sm:col-span-3 lg:col-span-1">
          {filteredUsers.length} usuário(s) encontrado(s)
        </div>
      </div>

      {/* Table / Cards list (Mobile-friendly) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Freelancer</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Papel</th>
                <th className="py-3 px-4">Recursos Criados</th>
                <th className="py-3 px-4">Cadastro</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum freelancer encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-1.5">
                            {u.name}
                            {u.is_blocked && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1 rounded">
                                Bloqueado
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                          {u.profession && (
                            <div className="text-[10px] text-slate-500">{u.profession}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={
                          u.plan_tier === 'advanced' || u.plan_tier === 'premium'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 capitalize'
                            : u.plan_tier === 'intermediate'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 capitalize'
                              : 'bg-slate-800 text-slate-400 border-slate-700 capitalize'
                        }
                      >
                        {u.plan_tier}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      {u.is_blocked ? (
                        <span className="inline-flex items-center text-rose-400 gap-1 text-[11px]">
                          <Ban className="w-3.5 h-3.5" />
                          Bloqueada
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-emerald-400 gap-1 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Regular
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-300 font-mono">
                        {u.role || 'freelancer'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span title="Clientes">{u.counts.clients} cl</span>•
                        <span title="Orçamentos">{u.counts.quotes} orç</span>•
                        <span title="Contratos">{u.counts.contracts} ct</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {u.created ? formatDate(u.created) : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(u)
                            setActionModal({ isOpen: true, type: 'view', user: u })
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Ver perfil completo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {u.is_blocked ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setActionModal({ isOpen: true, type: 'unblock', user: u })
                            }
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                            title="Desbloquear conta"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActionModal({ isOpen: true, type: 'block', user: u })}
                            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                            title="Bloquear conta"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setActionModal({ isOpen: true, type: 'revoke', user: u })}
                          className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                          title="Encerrar sessões ativas"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setActionModal({ isOpen: true, type: 'reset_password', user: u })
                          }
                          className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                          title="Enviar recuperação de senha"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (Responsive) */}
        <div className="md:hidden divide-y divide-slate-800">
          {filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">Nenhum usuário encontrado.</div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{u.name}</h4>
                    <p className="text-xs text-slate-400">{u.email}</p>
                    {u.profession && <p className="text-[11px] text-slate-500">{u.profession}</p>}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      u.is_blocked
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px]'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]'
                    }
                  >
                    {u.is_blocked ? 'Bloqueado' : 'Ativo'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                    {u.plan_tier}
                  </span>
                  <span>•</span>
                  <span>Papel: {u.role}</span>
                  <span>•</span>
                  <span>{u.counts.clients} clientes</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(u)
                      setActionModal({ isOpen: true, type: 'view', user: u })
                    }}
                    className="h-8 text-xs bg-slate-900 border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Detalhes
                  </Button>

                  {u.is_blocked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActionModal({ isOpen: true, type: 'unblock', user: u })}
                      className="h-8 text-xs text-emerald-400 border-emerald-900/50 bg-emerald-950/20"
                    >
                      Desbloquear
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActionModal({ isOpen: true, type: 'block', user: u })}
                      className="h-8 text-xs text-rose-400 border-rose-900/50 bg-rose-950/20"
                    >
                      Bloquear
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog
        open={actionModal.isOpen}
        onOpenChange={(open) =>
          !open && setActionModal({ isOpen: false, type: 'view', user: null })
        }
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-white">
              {actionModal.type === 'view' && 'Perfil e Histórico do Freelancer'}
              {actionModal.type === 'block' && 'Confirmar Bloqueio de Acesso'}
              {actionModal.type === 'unblock' && 'Desbloquear Usuário'}
              {actionModal.type === 'revoke' && 'Encerrar Todas as Sessões'}
              {actionModal.type === 'reset_password' && 'Recuperação de Acesso'}
              {actionModal.type === 'change_role' && 'Alterar Papel de Acesso'}
              {actionModal.type === 'change_plan' && 'Alterar Plano do Freelancer'}
              {actionModal.type === 'delete' && 'Exclusão de Conta (LGPD)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Usuário selecionado: {actionModal.user?.name} ({actionModal.user?.email})
            </DialogDescription>
          </DialogHeader>

          {/* View Mode */}
          {actionModal.type === 'view' && actionModal.user && (
            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block">ID do Usuário</span>
                  <span className="text-slate-200 font-mono text-[11px]">
                    {actionModal.user.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Plano Atual</span>
                  <span className="text-emerald-400 font-semibold capitalize">
                    {actionModal.user.plan_tier}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Papel no Sistema</span>
                  <span className="text-slate-200 capitalize font-mono">
                    {actionModal.user.role}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status da Conta</span>
                  <span
                    className={
                      actionModal.user.is_blocked ? 'text-rose-400 font-medium' : 'text-emerald-400'
                    }
                  >
                    {actionModal.user.is_blocked ? 'Bloqueada' : 'Ativa / Regular'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Data de Cadastro</span>
                  <span className="text-slate-300">{formatDate(actionModal.user.created)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Último Acesso</span>
                  <span className="text-slate-300">
                    {actionModal.user.last_login_at
                      ? formatDate(actionModal.user.last_login_at)
                      : 'Ainda não registrado'}
                  </span>
                </div>
              </div>

              {actionModal.user.is_blocked && actionModal.user.blocked_reason && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300">
                  <span className="font-semibold block mb-0.5">Motivo do Bloqueio:</span>
                  {actionModal.user.blocked_reason}
                </div>
              )}

              <div className="border-t border-slate-800 pt-3">
                <span className="font-semibold text-slate-300 block mb-2">
                  Totais Cadastrados pelo Usuário:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Clientes</span>
                    <span className="text-sm font-bold text-white">
                      {actionModal.user.counts.clients}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Orçamentos</span>
                    <span className="text-sm font-bold text-white">
                      {actionModal.user.counts.quotes}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Contratos</span>
                    <span className="text-sm font-bold text-white">
                      {actionModal.user.counts.contracts}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300">
                🔒 <strong>Segurança & LGPD:</strong> Senhas e hashes nunca são acessíveis nem
                armazenados em texto claro. Dados cadastrais mascarados para conformidade.
              </div>

              {role === 'admin' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        type: 'change_role',
                        user: actionModal.user,
                        newRole: actionModal.user?.role || 'freelancer',
                      })
                    }
                    className="flex-1 text-xs border-slate-700 bg-slate-800 text-slate-200"
                  >
                    Alterar Papel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setActionModal({
                        isOpen: true,
                        type: 'change_plan',
                        user: actionModal.user,
                        newPlan: actionModal.user?.plan_tier || 'economy',
                      })
                    }
                    className="flex-1 text-xs border-slate-700 bg-slate-800 text-slate-200"
                  >
                    Alterar Plano
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Block Mode */}
          {actionModal.type === 'block' && (
            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-300">
                O bloqueio impede que o freelancer faça login ou utilize a API do Studio Freela. A
                restrição é aplicada diretamente no servidor via hook de autenticação.
              </p>
              <div>
                <label className="text-slate-400 block mb-1">
                  Motivo do bloqueio (registrado na auditoria):
                </label>
                <Input
                  placeholder="Ex.: Inadimplência reincidente / Suspeita de fraude"
                  value={actionModal.reason || ''}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  className="bg-slate-950 border-slate-800 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* Change Role Mode */}
          {actionModal.type === 'change_role' && (
            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-300">
                Defina os privilégios de acesso administrativo deste usuário:
              </p>
              <Select
                value={actionModal.newRole || 'freelancer'}
                onValueChange={(val) => setActionModal({ ...actionModal, newRole: val })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 text-xs">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="freelancer">Freelancer (Somente seus dados)</SelectItem>
                  <SelectItem value="admin">Administrador Geral (Acesso total)</SelectItem>
                  <SelectItem value="financeiro">Financeiro (Assinaturas e Pagamentos)</SelectItem>
                  <SelectItem value="suporte">Suporte (Usuários e Chamados)</SelectItem>
                  <SelectItem value="analista">Analista (Métricas e Relatórios)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Change Plan Mode */}
          {actionModal.type === 'change_plan' && (
            <div className="space-y-3 py-2 text-xs">
              <p className="text-slate-300">Altere o nível de limites do usuário:</p>
              <Select
                value={actionModal.newPlan || 'economy'}
                onValueChange={(val) => setActionModal({ ...actionModal, newPlan: val })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 text-xs">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                  <SelectItem value="economy">Economy (Até 10 clientes)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (Até 30 clientes)</SelectItem>
                  <SelectItem value="advanced">Advanced (Ilimitado)</SelectItem>
                  <SelectItem value="premium">Premium (Ilimitado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Revoke Sessions Mode */}
          {actionModal.type === 'revoke' && (
            <div className="py-2 text-xs text-slate-300 space-y-2">
              <p>
                Esta ação atualizará o token de segurança da conta. Todos os navegadores e
                dispositivos atualmente conectados serão desconectados imediatamente.
              </p>
            </div>
          )}

          {/* Reset Password Mode */}
          {actionModal.type === 'reset_password' && (
            <div className="py-2 text-xs text-slate-300 space-y-2">
              <p>
                Um e-mail formal de recuperação será acionado para{' '}
                <strong>{actionModal.user?.email}</strong>. Por motivos de segurança e LGPD, novas
                senhas nunca são geradas por administradores.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModal({ isOpen: false, type: 'view', user: null })}
              className="border-slate-800 bg-slate-950 text-slate-300 text-xs"
            >
              Fechar
            </Button>

            {actionModal.type !== 'view' && (
              <Button
                variant={
                  actionModal.type === 'block' || actionModal.type === 'delete'
                    ? 'destructive'
                    : 'default'
                }
                size="sm"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Confirmar Ação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
