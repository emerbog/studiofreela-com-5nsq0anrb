import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { adminService } from '@/services/adminService'
import { SupportTicket } from '@/types'
import { formatDate } from '@/lib/formatters'
import {
  LifeBuoy,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User,
  Shield,
  KeyRound,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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

export const AdminSupport: React.FC = () => {
  const { overviewData, refreshData } = useAdmin()
  const tickets = overviewData?.supportTickets || []
  const users = overviewData?.users || []

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>()
    users.forEach((u) => map.set(u.id, { name: u.name, email: u.email }))
    return map
  }, [users])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [newStatus, setNewStatus] = useState<string>('em_atendimento')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const user = userMap.get(t.user)
      const name = user?.name || ''
      const email = user?.email || ''
      const matchSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [tickets, userMap, searchTerm, statusFilter])

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return

    try {
      setIsSubmitting(true)
      await adminService.executeSupportAction(selectedTicket.id, 'reply', {
        message: replyMessage.trim(),
        status: newStatus,
      })
      toast.success('Resposta enviada ao usuário.')
      setReplyMessage('')
      await refreshData()
      setSelectedTicket(null)
    } catch (err: any) {
      toast.error('Erro ao enviar resposta', { description: err?.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickPasswordReset = async (ticket: SupportTicket) => {
    try {
      await adminService.executeUserAction(ticket.user, 'send_password_reset')
      toast.success('Link de recuperação enviado ao usuário do chamado.')
    } catch (err: any) {
      toast.error('Falha ao acionar recuperação', { description: err?.message })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
          Central de Suporte e Atendimento
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestão de chamados, recuperação de contas e resolução de dúvidas de freelancers.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por usuário, assunto ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Status do chamado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
              <SelectItem value="resolvido">Resolvidos</SelectItem>
              <SelectItem value="fechado">Fechados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <LifeBuoy className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              Nenhum chamado de suporte pendente.
            </p>
            <p className="text-slate-500 text-xs">A fila de suporte está zerada.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((t) => {
              const user = userMap.get(t.user)
              return (
                <div key={t.id} className="p-4 hover:bg-slate-800/30 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{t.subject}</h4>
                        <Badge
                          variant="outline"
                          className={
                            t.status === 'aberto'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : t.status === 'em_atendimento'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }
                        >
                          {t.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Freelancer: <span className="text-slate-200 font-medium">{user?.name}</span>{' '}
                        ({user?.email}) • Aberto em {formatDate(t.created)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPasswordReset(t)}
                        className="h-8 text-xs border-slate-700 bg-slate-800 text-blue-400 hover:text-blue-300"
                        title="Enviar link de recuperação para o freelancer"
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1" />
                        Reset Senha
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(t)
                          setNewStatus(t.status === 'aberto' ? 'em_atendimento' : t.status)
                        }}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        Atender Chamado
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {t.description}
                  </p>

                  {t.responses && t.responses.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      {t.responses.length} resposta(s) registrada(s) no histórico.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-white">
              Atendimento de Chamado
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold block">Descrição do Freelancer:</span>
                <p className="text-slate-200 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* Thread history */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 font-semibold block text-[11px]">
                    Histórico de Mensagens:
                  </span>
                  {selectedTicket.responses.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg text-[11px] ${
                        r.sender_type === 'admin'
                          ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-900/40 ml-4'
                          : 'bg-slate-900 text-slate-300 border border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">{r.sender_email}</span>
                        <span>{formatDate(r.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status change */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Novo Status do Chamado:</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reply message */}
              <div>
                <label className="text-slate-400 block mb-1">Escrever Resposta:</label>
                <Textarea
                  placeholder="Escreva a resposta que o usuário receberá em suas notificações..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border-slate-800 text-white text-xs resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTicket(null)}
              className="border-slate-800 bg-slate-950 text-slate-300 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSendReply}
              disabled={isSubmitting || !replyMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
