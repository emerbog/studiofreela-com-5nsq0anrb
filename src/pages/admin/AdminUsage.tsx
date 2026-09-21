import React, { useState, useMemo } from 'react'
import { useAdmin } from '@/hooks/use-admin'
import { formatDate } from '@/lib/formatters'
import {
  Activity,
  Search,
  Filter,
  FileText,
  Calendar,
  UserCheck,
  Briefcase,
  FileSpreadsheet,
  LogIn,
  Layers,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const AdminUsage: React.FC = () => {
  const { overviewData } = useAdmin()
  const events = overviewData?.usageEvents || []
  const users = overviewData?.users || []

  const userMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>()
    users.forEach((u) => map.set(u.id, { name: u.name, email: u.email }))
    return map
  }, [users])

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const user = userMap.get(ev.user)
      const name = user?.name || ''
      const email = user?.email || ''
      const matchSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.event_type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchType = typeFilter === 'all' || ev.event_type === typeFilter
      return matchSearch && matchType
    })
  }, [events, userMap, searchTerm, typeFilter])

  const eventTypeLabels: Record<string, { label: string; color: string; icon: any }> = {
    login: {
      label: 'Autenticação',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: LogIn,
    },
    client_created: {
      label: 'Cliente Criado',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: UserCheck,
    },
    quote_created: {
      label: 'Orçamento Criado',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: FileText,
    },
    quote_confirmed: {
      label: 'Orçamento Confirmado',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: FileSpreadsheet,
    },
    pdf_generated: {
      label: 'PDF Exportado',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: FileText,
    },
    event_created: {
      label: 'Evento na Agenda',
      color: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      icon: Calendar,
    },
    receivable_created: {
      label: 'Recebível Criado',
      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      icon: Layers,
    },
    contract_generated: {
      label: 'Contrato Criado',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Briefcase,
    },
    contract_sent: {
      label: 'Contrato Enviado',
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: Briefcase,
    },
    contract_signed: {
      label: 'Contrato Assinado',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Briefcase,
    },
    resume_generated: {
      label: 'Apresentação Profissional Gerada',
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      icon: FileText,
    },
    equipment_created: {
      label: 'Equipamento Cadastrado',
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: Layers,
    },
    service_created: {
      label: 'Serviço Cadastrado',
      color: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
      icon: Layers,
    },
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
          Uso da Plataforma (Eventos)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Registro temporal auditável de engajamento, geração de documentos, PDFs e conversões.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por usuário ou evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-9 text-xs"
          />
        </div>

        <div className="w-full sm:w-60">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-9 text-xs">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
              <SelectItem value="all">Todos os Eventos</SelectItem>
              <SelectItem value="login">Autenticação (Login)</SelectItem>
              <SelectItem value="client_created">Cliente Criado</SelectItem>
              <SelectItem value="quote_created">Orçamento Criado</SelectItem>
              <SelectItem value="quote_confirmed">Orçamento Confirmado</SelectItem>
              <SelectItem value="pdf_generated">PDF Gerado</SelectItem>
              <SelectItem value="event_created">Evento Criado</SelectItem>
              <SelectItem value="receivable_created">Recebível Criado</SelectItem>
              <SelectItem value="contract_generated">Contrato Gerado</SelectItem>
              <SelectItem value="resume_generated">Apresentação Profissional Gerada</SelectItem>
              <SelectItem value="equipment_created">Equipamento Cadastrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Activity className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-300">
              Nenhum evento registrado com esses filtros.
            </p>
            <p className="text-slate-500 text-xs">
              Eventos são gravados automaticamente pelas rotinas do servidor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Freelancer</th>
                  <th className="py-3 px-4">Ação / Evento</th>
                  <th className="py-3 px-4">Detalhes</th>
                  <th className="py-3 px-4">Endereço IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((ev) => {
                  const user = userMap.get(ev.user)
                  const meta = eventTypeLabels[ev.event_type] || {
                    label: ev.event_type,
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                    icon: Activity,
                  }
                  const Icon = meta.icon

                  return (
                    <tr key={ev.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(ev.created)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{user?.name || ev.user}</div>
                        <div className="text-[11px] text-slate-400">{user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={`text-[11px] ${meta.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                        {ev.details
                          ? JSON.stringify(ev.details)
                          : ev.resource_id
                            ? `ID: ${ev.resource_id}`
                            : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {ev.ip_address || '—'}
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
