import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ClientSelector } from '@/components/ClientSelector'
import { ClientFormSheet } from '@/components/ClientFormSheet'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import {
  Quote,
  QuoteItem,
  QuoteEquipmentItem,
  QuotePaymentInstallment,
  OvertimeRule,
  LogisticsConfig,
  PriceSummary,
  Client,
  PaymentInstallmentMethod,
  ServiceUnit,
} from '@/types'
import {
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Truck,
  Sparkles,
  Loader2,
  ChevronRight,
  Check,
  AlertCircle,
  Eye,
  FileDown,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportQuoteToPdf, generateQuotePdfFilename, shareQuotePdf } from '@/lib/quote-pdf'

interface QuoteFormSheetProps {
  triggerAsChild?: React.ReactNode
  quoteToEdit?: Quote | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (quote: Quote) => void
}

const DRAFT_STORAGE_KEY = 'sf_quote_wizard_draft_v1'

const COMMON_UNITS: { label: string; value: ServiceUnit }[] = [
  { label: 'Serviço', value: 'serviço' },
  { label: 'Diária', value: 'diária' },
  { label: 'Hora', value: 'hora' },
  { label: 'Profissional', value: 'profissional' },
  { label: 'Peça', value: 'peça' },
  { label: 'Outro', value: 'outro' },
]

export function QuoteFormSheet({
  triggerAsChild,
  quoteToEdit,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: QuoteFormSheetProps) {
  const { clients, addQuote, updateQuote } = useAppData()
  const { user } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientSheetOpen, setClientSheetOpen] = useState(false)

  // Step 1: Cliente
  const [clientId, setClientId] = useState('')

  // Step 2: Evento
  const [eventName, setEventName] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventStartDate, setEventStartDate] = useState(new Date().toISOString().split('T')[0])
  const [eventStartTime, setEventStartTime] = useState('09:00')
  const [eventEndDate, setEventEndDate] = useState(new Date().toISOString().split('T')[0])
  const [eventEndTime, setEventEndTime] = useState('18:00')
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0])
  const [validityDays, setValidityDays] = useState(15)
  const [notes, setNotes] = useState('')

  // Step 3: Serviços, Equipamentos, Hora Extra, Logística
  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: '1',
      description: 'Cobertura Fotográfica Completa',
      quantity: 1,
      unit: 'serviço',
      unitPrice: 1500,
    },
  ])

  // Hora extra
  const [overtimeRule, setOvertimeRule] = useState<OvertimeRule>({
    enabled: false,
    hourlyRate: 150,
    graceMinutes: 15,
    notes: 'Iniciada após a tolerância estipulada.',
  })

  // Equipamentos próprios
  const [equipments, setEquipments] = useState<QuoteEquipmentItem[]>([])

  // Logística (Alimentação, Transporte, Hospedagem)
  const [logistics, setLogistics] = useState<LogisticsConfig>({
    meal: { type: 'contractor', notes: 'Alimentação fornecida no local do evento' },
    transport: {
      type: 'contractor',
      originDestination: '',
      notes: 'Deslocamento por conta do contratante',
    },
    lodging: { type: 'not_applicable', nightsCount: 0, notes: '' },
  })

  // Descontos
  const [discounts, setDiscounts] = useState<number>(0)

  // Step 4: Pagamento
  const [paymentPlanType, setPaymentPlanType] = useState<'single' | 'installments' | 'custom'>(
    'custom',
  )
  const [paymentSchedule, setPaymentSchedule] = useState<QuotePaymentInstallment[]>([
    {
      id: 'pay_1',
      description: 'Sinal de reserva (50%)',
      dueDate: new Date().toISOString().split('T')[0],
      value: 750,
      percentage: 50,
      method: 'PIX',
    },
    {
      id: 'pay_2',
      description: 'Saldo no dia do evento (50%)',
      dueDate: new Date().toISOString().split('T')[0],
      value: 750,
      percentage: 50,
      method: 'PIX',
    },
  ])

  // Desejado salvar como: Rascunho, Enviado (Pré-reserva) ou Confirmado
  const [targetStatus, setTargetStatus] = useState<'Rascunho' | 'Enviado' | 'Confirmado'>('Enviado')

  // Subtotais e totais
  const servicesSubtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0,
    )
  }, [items])

  const equipmentsSubtotal = useMemo(() => {
    return equipments.reduce((sum, item) => {
      if (item.includedInService) return sum
      return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
    }, 0)
  }, [equipments])

  const logisticsChargedSubtotal = useMemo(() => {
    let sum = 0
    if (logistics.meal.type === 'contracted' && logistics.meal.chargedAmount) {
      sum += Number(logistics.meal.chargedAmount) || 0
    }
    if (logistics.transport.type === 'contracted' && logistics.transport.chargedAmount) {
      sum += Number(logistics.transport.chargedAmount) || 0
    }
    if (logistics.lodging.type === 'contracted' && logistics.lodging.chargedAmount) {
      sum += Number(logistics.lodging.chargedAmount) || 0
    }
    return sum
  }, [logistics])

  const grandTotal = useMemo(() => {
    const raw =
      servicesSubtotal + equipmentsSubtotal + logisticsChargedSubtotal - (Number(discounts) || 0)
    return Math.max(0, Math.round(raw * 100) / 100)
  }, [servicesSubtotal, equipmentsSubtotal, logisticsChargedSubtotal, discounts])

  const totalScheduleAmount = useMemo(() => {
    return paymentSchedule.reduce((sum, p) => sum + (Number(p.value) || 0), 0)
  }, [paymentSchedule])

  const isScheduleBalanced = useMemo(() => {
    return Math.abs(totalScheduleAmount - grandTotal) < 0.05
  }, [totalScheduleAmount, grandTotal])

  // Load quote to edit or restore draft
  useEffect(() => {
    if (quoteToEdit) {
      setClientId(quoteToEdit.clientId || '')
      setEventName(quoteToEdit.eventName || '')
      setEventLocation(quoteToEdit.eventLocation || '')
      setEventStartDate(
        quoteToEdit.eventStartDate
          ? quoteToEdit.eventStartDate.slice(0, 10)
          : quoteToEdit.date.slice(0, 10),
      )
      setEventStartTime(quoteToEdit.eventStartTime || '09:00')
      setEventEndDate(
        quoteToEdit.eventEndDate
          ? quoteToEdit.eventEndDate.slice(0, 10)
          : quoteToEdit.date.slice(0, 10),
      )
      setEventEndTime(quoteToEdit.eventEndTime || '18:00')
      setQuoteDate(
        quoteToEdit.date ? quoteToEdit.date.slice(0, 10) : new Date().toISOString().split('T')[0],
      )
      setValidityDays(quoteToEdit.validityDays || 15)
      setNotes(quoteToEdit.notes || '')
      if (quoteToEdit.items && quoteToEdit.items.length > 0) {
        setItems(quoteToEdit.items)
      }
      if (quoteToEdit.equipments) {
        setEquipments(quoteToEdit.equipments)
      }
      if (quoteToEdit.overtimeRule) {
        setOvertimeRule(quoteToEdit.overtimeRule)
      }
      if (quoteToEdit.logistics) {
        setLogistics(quoteToEdit.logistics)
      }
      if (quoteToEdit.paymentSchedule && quoteToEdit.paymentSchedule.length > 0) {
        setPaymentSchedule(quoteToEdit.paymentSchedule)
      }
      if (quoteToEdit.priceSummary) {
        setDiscounts(quoteToEdit.priceSummary.discounts || 0)
      }
      const initialStatus =
        quoteToEdit.status === 'Confirmado' || quoteToEdit.status === 'Aprovado'
          ? 'Confirmado'
          : quoteToEdit.status === 'Enviado'
            ? 'Enviado'
            : 'Rascunho'
      setTargetStatus(initialStatus)
    } else if (open) {
      // Restore local draft
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (saved) {
          const d = JSON.parse(saved)
          if (d.clientId) setClientId(d.clientId)
          if (d.eventName) setEventName(d.eventName)
          if (d.eventLocation) setEventLocation(d.eventLocation)
          if (d.eventStartDate) setEventStartDate(d.eventStartDate)
          if (d.eventStartTime) setEventStartTime(d.eventStartTime)
          if (d.eventEndDate) setEventEndDate(d.eventEndDate)
          if (d.eventEndTime) setEventEndTime(d.eventEndTime)
          if (d.items && d.items.length > 0) setItems(d.items)
          if (d.equipments) setEquipments(d.equipments)
          if (d.overtimeRule) setOvertimeRule(d.overtimeRule)
          if (d.logistics) setLogistics(d.logistics)
          if (d.discounts) setDiscounts(d.discounts)
          if (d.paymentSchedule && d.paymentSchedule.length > 0) {
            setPaymentSchedule(d.paymentSchedule)
          }
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }, [quoteToEdit, open])

  // Save local draft on changes (only when creating new quote)
  useEffect(() => {
    if (!quoteToEdit && open) {
      const draftData = {
        clientId,
        eventName,
        eventLocation,
        eventStartDate,
        eventStartTime,
        eventEndDate,
        eventEndTime,
        validityDays,
        notes,
        items,
        equipments,
        overtimeRule,
        logistics,
        discounts,
        paymentSchedule,
        updatedAt: new Date().toISOString(),
      }
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
      } catch {
        /* intentionally ignored */
      }
    }
  }, [
    quoteToEdit,
    open,
    clientId,
    eventName,
    eventLocation,
    eventStartDate,
    eventStartTime,
    eventEndDate,
    eventEndTime,
    validityDays,
    notes,
    items,
    equipments,
    overtimeRule,
    logistics,
    discounts,
    paymentSchedule,
  ])

  // Helper quick actions for payment schedule
  const applyPresetPaymentPlan = (type: 'full' | 'half_half' | 'three_parts') => {
    const due = eventStartDate || new Date().toISOString().split('T')[0]
    if (type === 'full') {
      setPaymentSchedule([
        {
          id: `pay_${Date.now()}_1`,
          description: 'Pagamento integral à vista',
          dueDate: due,
          value: grandTotal,
          percentage: 100,
          method: 'PIX',
        },
      ])
    } else if (type === 'half_half') {
      const half = Math.round((grandTotal / 2) * 100) / 100
      const remainder = Math.round((grandTotal - half) * 100) / 100
      setPaymentSchedule([
        {
          id: `pay_${Date.now()}_1`,
          description: 'Sinal para reserva da data (50%)',
          dueDate: new Date().toISOString().split('T')[0],
          value: half,
          percentage: 50,
          method: 'PIX',
        },
        {
          id: `pay_${Date.now()}_2`,
          description: 'Saldo até o início do evento (50%)',
          dueDate: due,
          value: remainder,
          percentage: 50,
          method: 'PIX',
        },
      ])
    } else if (type === 'three_parts') {
      const part1 = Math.round(grandTotal * 0.4 * 100) / 100
      const part2 = Math.round(grandTotal * 0.3 * 100) / 100
      const part3 = Math.round((grandTotal - part1 - part2) * 100) / 100
      setPaymentSchedule([
        {
          id: `pay_${Date.now()}_1`,
          description: 'Sinal de reserva (40%)',
          dueDate: new Date().toISOString().split('T')[0],
          value: part1,
          percentage: 40,
          method: 'PIX',
        },
        {
          id: `pay_${Date.now()}_2`,
          description: 'Segunda parcela (30%)',
          dueDate: due,
          value: part2,
          percentage: 30,
          method: 'PIX',
        },
        {
          id: `pay_${Date.now()}_3`,
          description: 'Quitação na entrega final (30%)',
          dueDate: due,
          value: part3,
          percentage: 30,
          method: 'PIX',
        },
      ])
    }
  }

  // Auto-sync initial installment values when grandTotal changes if only 1 or 2 default rows
  useEffect(() => {
    if (paymentSchedule.length === 2 && paymentSchedule[0].percentage === 50) {
      const half = Math.round((grandTotal / 2) * 100) / 100
      const rem = Math.round((grandTotal - half) * 100) / 100
      setPaymentSchedule((prev) => [
        { ...prev[0], value: half },
        { ...prev[1], value: rem },
      ])
    }
  }, [grandTotal])

  // Services line operations
  const handleAddService = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        description: '',
        quantity: 1,
        unit: 'serviço',
        unitPrice: 0,
      },
    ])
  }

  const handleDuplicateService = (index: number) => {
    const item = items[index]
    const next = [...items]
    next.splice(index + 1, 0, {
      ...item,
      id: Math.random().toString(),
      description: `${item.description} (Cópia)`,
    })
    setItems(next)
  }

  const handleRemoveService = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Equipments line operations
  const handleAddEquipment = () => {
    setEquipments((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        includedInService: false,
      },
    ])
  }

  const handleRemoveEquipment = (index: number) => {
    setEquipments((prev) => prev.filter((_, i) => i !== index))
  }

  // Payment installment operations
  const handleAddInstallment = () => {
    const remaining = Math.max(0, Math.round((grandTotal - totalScheduleAmount) * 100) / 100)
    setPaymentSchedule((prev) => [
      ...prev,
      {
        id: `pay_${Date.now()}_${prev.length + 1}`,
        description: `Parcela ${prev.length + 1}`,
        dueDate: eventStartDate || new Date().toISOString().split('T')[0],
        value: remaining > 0 ? remaining : 0,
        method: 'PIX',
      },
    ])
  }

  const handleRemoveInstallment = (index: number) => {
    if (paymentSchedule.length > 1) {
      setPaymentSchedule((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // Validation per step
  const handleNextStep = () => {
    if (step === 1) {
      if (!clientId) {
        toast.error('Selecione ou cadastre um cliente para prosseguir.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!eventName.trim()) {
        toast.error('Informe o nome do evento ou serviço.')
        return
      }
      if (!eventStartDate) {
        toast.error('Informe a data de início do evento.')
        return
      }
      if (!eventStartTime) {
        toast.error('Informe o horário de início.')
        return
      }
      if (!eventEndDate) {
        toast.error('Informe a data de término.')
        return
      }
      if (!eventEndTime) {
        toast.error('Informe o horário de término.')
        return
      }

      // Check end date/time is posterior to start date/time
      const startIso = new Date(`${eventStartDate}T${eventStartTime}:00`)
      const endIso = new Date(`${eventEndDate}T${eventEndTime}:00`)
      if (endIso.getTime() <= startIso.getTime()) {
        toast.error('O término do evento deve ser posterior ao início.')
        return
      }
      setStep(3)
    } else if (step === 3) {
      const hasInvalidItem = items.some(
        (it) => !it.description.trim() || it.quantity <= 0 || it.unitPrice < 0,
      )
      if (hasInvalidItem) {
        toast.error('Todos os serviços devem ter descrição, quantidade maior que 0 e valor válido.')
        return
      }
      setStep(4)
    } else if (step === 4) {
      if (!isScheduleBalanced) {
        toast.error(
          `A soma das parcelas (${formatCurrency(totalScheduleAmount)}) deve ser exatamente igual ao total geral (${formatCurrency(grandTotal)}). Ajuste a diferença de ${formatCurrency(Math.abs(grandTotal - totalScheduleAmount))}.`,
        )
        return
      }
      setStep(5)
    }
  }

  const handleSaveQuote = async (statusOverride?: 'Rascunho' | 'Enviado' | 'Confirmado') => {
    const finalStatus = statusOverride || targetStatus

    if (!clientId) {
      toast.error('Selecione um cliente.')
      setStep(1)
      return
    }

    if (!eventName.trim() || !eventStartDate) {
      toast.error('Preencha os dados do evento na etapa 2.')
      setStep(2)
      return
    }

    if (!isScheduleBalanced) {
      toast.error('Ajuste o calendário de pagamentos para somar exatamente o total geral.')
      setStep(4)
      return
    }

    setIsSubmitting(true)
    try {
      const priceSummary: PriceSummary = {
        servicesSubtotal,
        equipmentsSubtotal,
        expensesSubtotal: logisticsChargedSubtotal,
        discounts: Number(discounts) || 0,
        grandTotal,
        overtimeSeparated: overtimeRule.enabled,
      }

      const quoteData = {
        clientId,
        date: new Date(`${quoteDate}T12:00:00`).toISOString(),
        validityDays: Number(validityDays) || 15,
        status: finalStatus,
        eventName: eventName.trim(),
        eventLocation: eventLocation.trim(),
        eventStartDate: new Date(`${eventStartDate}T${eventStartTime}:00`).toISOString(),
        eventStartTime,
        eventEndDate: new Date(`${eventEndDate}T${eventEndTime}:00`).toISOString(),
        eventEndTime,
        notes: notes.trim(),
        items,
        equipments,
        overtimeRule,
        logistics,
        paymentSchedule,
        priceSummary,
        total: grandTotal,
        statusHistory: [
          ...(quoteToEdit?.statusHistory || []),
          {
            status: finalStatus,
            timestamp: new Date().toISOString(),
            note: quoteToEdit ? 'Atualizado no formulário' : 'Criado no formulário',
          },
        ],
      }

      let savedQuote: Quote | null = null
      if (quoteToEdit) {
        const ok = await updateQuote(quoteToEdit.id, quoteData)
        if (ok) {
          savedQuote = { ...quoteToEdit, ...quoteData }
        }
      } else {
        savedQuote = await addQuote(quoteData)
        // Clear local draft upon successful save
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        } catch {
          /* intentionally ignored */
        }
      }

      if (savedQuote) {
        setOpen(false)
        onSuccess?.(savedQuote)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClientObj = clients.find((c) => c.id === clientId)

  return (
    <>
      <ClientFormSheet
        open={clientSheetOpen}
        onOpenChange={setClientSheetOpen}
        clientToEdit={editingClient}
        onSuccess={() => {
          setClientSheetOpen(false)
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        {triggerAsChild ? (
          <DialogTrigger asChild>{triggerAsChild}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm font-medium">
              <Plus className="w-4 h-4" /> Novo Orçamento
            </Button>
          </DialogTrigger>
        )}

        <DialogContent className="w-full max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-serif text-lg sm:text-xl text-heading">
                {quoteToEdit ? `Editar Orçamento ${quoteToEdit.number}` : 'Novo Orçamento'}
              </DialogTitle>
              <div className="text-xs text-muted-foreground font-mono">Etapa {step} de 5</div>
            </div>

            {/* Stepper progress indicator */}
            <div className="grid grid-cols-5 gap-1.5 pt-3">
              {[
                { s: 1, label: 'Cliente' },
                { s: 2, label: 'Evento' },
                { s: 3, label: 'Serviços' },
                { s: 4, label: 'Pagamento' },
                { s: 5, label: 'Revisão/PDF' },
              ].map((st) => (
                <button
                  key={st.s}
                  type="button"
                  onClick={() => {
                    // allow jumping back anytime
                    if (st.s < step) setStep(st.s as any)
                  }}
                  className={`flex flex-col text-left transition-colors ${
                    st.s === step
                      ? 'text-primary'
                      : st.s < step
                        ? 'text-foreground hover:text-primary cursor-pointer'
                        : 'text-muted-foreground/60 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`h-1.5 w-full rounded-full transition-all ${
                      st.s === step ? 'bg-primary' : st.s < step ? 'bg-primary/50' : 'bg-muted'
                    }`}
                  />
                  <span className="text-[10px] font-medium mt-1 truncate hidden sm:inline">
                    {st.label}
                  </span>
                </button>
              ))}
            </div>
          </DialogHeader>

          {/* Body scrollable (no horizontal scroll) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6">
            {/* ETAPA 1: CLIENTE */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif font-semibold text-base text-heading">
                    1. Identificação do Cliente
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Selecione um cliente existente ou cadastre rapidamente informando apenas nome e
                    WhatsApp.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-medium">Cliente ou Empresa Contratante *</Label>
                  <ClientSelector
                    value={clientId}
                    onChange={(id) => setClientId(id)}
                    onEditClient={(client) => {
                      setEditingClient(client)
                      setClientSheetOpen(true)
                    }}
                    showEditButton={true}
                  />
                </div>

                {selectedClientObj && (
                  <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 space-y-1.5 text-xs animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">
                        {selectedClientObj.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {selectedClientObj.clientType || 'PF'}
                      </span>
                    </div>
                    {selectedClientObj.tradeName && (
                      <p className="text-muted-foreground">
                        Fantasia: {selectedClientObj.tradeName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground pt-1">
                      {selectedClientObj.phone && <span>WhatsApp: {selectedClientObj.phone}</span>}
                      {selectedClientObj.email && <span>E-mail: {selectedClientObj.email}</span>}
                      {selectedClientObj.document && <span>Doc: {selectedClientObj.document}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 2: DADOS DO EVENTO */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif font-semibold text-base text-heading">
                    2. Dados e Cronograma do Evento
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Defina o período exato (inclusive para eventos que atravessam a meia-noite) e
                    localização.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="q-event-name" className="text-xs font-medium">
                    Nome do Evento ou Projeto *
                  </Label>
                  <Input
                    id="q-event-name"
                    required
                    placeholder="Ex: Cobertura Casamento Marina & Pedro"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="text-sm h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="q-event-loc" className="text-xs font-medium">
                    Local do Evento / Plataforma
                  </Label>
                  <Input
                    id="q-event-loc"
                    placeholder="Ex: Espaço Villa Bisutti, Av. Cardoso de Melo, 1200 - SP"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="text-sm h-10"
                  />
                </div>

                {/* Início e Término */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                      Início do Evento
                    </span>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-start-date" className="text-xs font-medium">
                        Data de Início *
                      </Label>
                      <Input
                        id="q-start-date"
                        type="date"
                        required
                        value={eventStartDate}
                        onChange={(e) => {
                          setEventStartDate(e.target.value)
                          // if end date is before new start date, update it
                          if (eventEndDate < e.target.value) {
                            setEventEndDate(e.target.value)
                          }
                        }}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-start-time" className="text-xs font-medium">
                        Horário de Início *
                      </Label>
                      <Input
                        id="q-start-time"
                        type="time"
                        required
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="text-sm h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                      Término do Evento
                    </span>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-end-date" className="text-xs font-medium">
                        Data de Término *
                      </Label>
                      <Input
                        id="q-end-date"
                        type="date"
                        required
                        min={eventStartDate}
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="q-end-time" className="text-xs font-medium">
                        Horário de Término *
                      </Label>
                      <Input
                        id="q-end-time"
                        type="time"
                        required
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-date" className="text-xs font-medium">
                      Data de Emissão
                    </Label>
                    <Input
                      id="q-date"
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="q-validity" className="text-xs font-medium">
                      Validade da Proposta (Dias)
                    </Label>
                    <Input
                      id="q-validity"
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                      className="text-sm h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="q-notes" className="text-xs font-medium">
                    Observações Gerais do Evento
                  </Label>
                  <Textarea
                    id="q-notes"
                    placeholder="Instruções de vestimenta, cronograma de montagem ou alinhamentos prévios..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs min-h-[70px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* ETAPA 3: SERVIÇOS, EQUIPAMENTOS, HORA EXTRA & LOGÍSTICA */}
            {step === 3 && (
              <div className="space-y-6">
                {/* 3.1 Serviços */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-semibold text-base text-heading">
                        3. Serviços Prestados *
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Adicione, edite ou duplique os itens do escopo.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddService}
                      className="text-xs h-8 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Serviço
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                      return (
                        <div
                          key={item.id || index}
                          className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              Serviço #{index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicateService(index)}
                                title="Duplicar linha"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveService(index)}
                                disabled={items.length === 1}
                                title="Excluir linha"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">
                              Descrição do Serviço *
                            </Label>
                            <Input
                              placeholder="Ex: Cobertura Fotográfica com 2 fotógrafos"
                              value={item.description}
                              onChange={(e) => {
                                const next = [...items]
                                next[index].description = e.target.value
                                setItems(next)
                              }}
                              className="text-xs h-9 bg-background"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">Qtd *</Label>
                              <Input
                                type="number"
                                min="1"
                                inputMode="numeric"
                                value={item.quantity}
                                onChange={(e) => {
                                  const next = [...items]
                                  next[index].quantity = Math.max(1, parseInt(e.target.value) || 1)
                                  setItems(next)
                                }}
                                className="text-xs h-9 bg-background"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">Unidade</Label>
                              <Select
                                value={item.unit || 'serviço'}
                                onValueChange={(val) => {
                                  const next = [...items]
                                  next[index].unit = val
                                  setItems(next)
                                }}
                              >
                                <SelectTrigger className="text-xs h-9 bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COMMON_UNITS.map((u) => (
                                    <SelectItem key={u.value} value={u.value}>
                                      {u.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">
                                Valor Unit. (R$) *
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={item.unitPrice || ''}
                                onChange={(e) => {
                                  const next = [...items]
                                  next[index].unitPrice = parseFloat(e.target.value) || 0
                                  setItems(next)
                                }}
                                className="text-xs h-9 bg-background"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1 text-xs">
                            <span className="text-muted-foreground mr-1">Total da linha:</span>
                            <strong className="text-foreground">{formatCurrency(lineTotal)}</strong>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-right text-xs pt-1">
                    <span className="text-muted-foreground">Subtotal Serviços: </span>
                    <strong className="text-foreground text-sm">
                      {formatCurrency(servicesSubtotal)}
                    </strong>
                  </div>
                </div>

                {/* 3.2 Hora Extra */}
                <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-foreground block">
                        Haverá cobrança de hora extra?
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Exibida no PDF como condição contratual adicional (não soma ao total
                        inicial).
                      </p>
                    </div>
                    <Switch
                      checked={overtimeRule.enabled}
                      onCheckedChange={(checked) =>
                        setOvertimeRule((prev) => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>

                  {overtimeRule.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Valor por hora extra (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={overtimeRule.hourlyRate}
                          onChange={(e) =>
                            setOvertimeRule((prev) => ({
                              ...prev,
                              hourlyRate: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tolerância gratuita (minutos)</Label>
                        <Input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={overtimeRule.graceMinutes || 0}
                          onChange={(e) =>
                            setOvertimeRule((prev) => ({
                              ...prev,
                              graceMinutes: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="text-xs h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3.3 Equipamentos Próprios */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-heading">
                        Equipamentos Fornecidos
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Equipamentos próprios inclusos ou locados separadamente.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddEquipment}
                      className="text-xs h-7 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Equipamento
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {equipments.map((eq, index) => (
                      <div
                        key={eq.id || index}
                        className="p-2.5 bg-muted/40 rounded-lg border border-border/50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <Input
                            placeholder="Ex: Kit 3 Luzes Led Aputure + Tripés"
                            value={eq.description}
                            onChange={(e) => {
                              const next = [...equipments]
                              next[index].description = e.target.value
                              setEquipments(next)
                            }}
                            className="text-xs h-8 bg-background flex-1 mr-2"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEquipment(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qtd"
                              value={eq.quantity}
                              onChange={(e) => {
                                const next = [...equipments]
                                next[index].quantity = parseInt(e.target.value) || 1
                                setEquipments(next)
                              }}
                              className="text-xs h-8 bg-background"
                            />
                          </div>
                          <div className="w-28">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={eq.includedInService}
                              placeholder="Valor un."
                              value={eq.includedInService ? '0.00' : eq.unitPrice || ''}
                              onChange={(e) => {
                                const next = [...equipments]
                                next[index].unitPrice = parseFloat(e.target.value) || 0
                                setEquipments(next)
                              }}
                              className="text-xs h-8 bg-background"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <Switch
                              checked={eq.includedInService || false}
                              onCheckedChange={(checked) => {
                                const next = [...equipments]
                                next[index].includedInService = checked
                                setEquipments(next)
                              }}
                              id={`eq-inc-${index}`}
                            />
                            <Label
                              htmlFor={`eq-inc-${index}`}
                              className="text-[11px] text-muted-foreground cursor-pointer"
                            >
                              Incluso no serviço
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3.4 Logística (Refeição, Transporte, Hospedagem) */}
                <div className="p-3.5 bg-muted/30 rounded-xl border border-border/50 space-y-4 text-xs">
                  <h4 className="font-semibold text-xs text-heading flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    Responsabilidades de Logística & Despesas
                  </h4>

                  {/* Refeição */}
                  <div className="space-y-1.5 border-b border-border/40 pb-3">
                    <Label className="text-[11px] font-semibold text-foreground block">
                      Alimentação / Refeição
                    </Label>
                    <Select
                      value={logistics.meal.type}
                      onValueChange={(val: any) =>
                        setLogistics((prev) => ({
                          ...prev,
                          meal: { ...prev.meal, type: val },
                        }))
                      }
                    >
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">
                          Paga / fornecida pelo contratante (responsabilidade direta)
                        </SelectItem>
                        <SelectItem value="contracted">
                          Paga pelo profissional (cobrada no orçamento)
                        </SelectItem>
                        <SelectItem value="not_applicable">Não se aplica</SelectItem>
                      </SelectContent>
                    </Select>
                    {logistics.meal.type === 'contracted' && (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor cobrado da alimentação (R$)"
                        value={logistics.meal.chargedAmount || ''}
                        onChange={(e) =>
                          setLogistics((prev) => ({
                            ...prev,
                            meal: {
                              ...prev.meal,
                              chargedAmount: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="text-xs h-8 bg-background mt-1"
                      />
                    )}
                  </div>

                  {/* Transporte */}
                  <div className="space-y-1.5 border-b border-border/40 pb-3">
                    <Label className="text-[11px] font-semibold text-foreground block">
                      Transporte / Deslocamento
                    </Label>
                    <Select
                      value={logistics.transport.type}
                      onValueChange={(val: any) =>
                        setLogistics((prev) => ({
                          ...prev,
                          transport: { ...prev.transport, type: val },
                        }))
                      }
                    >
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contractor">
                          Pago pelo contratante (responsabilidade direta / van / aéreo)
                        </SelectItem>
                        <SelectItem value="contracted">
                          Pago pelo profissional (cobrado no orçamento)
                        </SelectItem>
                        <SelectItem value="not_applicable">Não se aplica</SelectItem>
                      </SelectContent>
                    </Select>
                    {logistics.transport.type === 'contracted' && (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor cobrado do transporte (R$)"
                        value={logistics.transport.chargedAmount || ''}
                        onChange={(e) =>
                          setLogistics((prev) => ({
                            ...prev,
                            transport: {
                              ...prev.transport,
                              chargedAmount: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="text-xs h-8 bg-background mt-1"
                      />
                    )}
                  </div>

                  {/* Hospedagem */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-foreground block">
                      Hospedagem
                    </Label>
                    <Select
                      value={logistics.lodging.type}
                      onValueChange={(val: any) =>
                        setLogistics((prev) => ({
                          ...prev,
                          lodging: { ...prev.lodging, type: val },
                        }))
                      }
                    >
                      <SelectTrigger className="text-xs h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_applicable">Não necessária</SelectItem>
                        <SelectItem value="contractor">
                          Necessária e paga pelo contratante (reserva direta)
                        </SelectItem>
                        <SelectItem value="contracted">
                          Necessária e cobrada no orçamento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {logistics.lodging.type === 'contracted' && (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor cobrado de hospedagem (R$)"
                        value={logistics.lodging.chargedAmount || ''}
                        onChange={(e) =>
                          setLogistics((prev) => ({
                            ...prev,
                            lodging: {
                              ...prev.lodging,
                              chargedAmount: parseFloat(e.target.value) || 0,
                            },
                          }))
                        }
                        className="text-xs h-8 bg-background mt-1"
                      />
                    )}
                  </div>
                </div>

                {/* 3.5 Descontos */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/40">
                  <div>
                    <Label className="text-xs font-medium">Desconto Comercial (R$)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Abatimento concedido no total da proposta
                    </p>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={discounts || ''}
                      placeholder="0,00"
                      onChange={(e) => setDiscounts(parseFloat(e.target.value) || 0)}
                      className="text-xs h-9 text-right"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: FORMAS E DATAS DE PAGAMENTO */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif font-semibold text-base text-heading">
                    4. Condições e Calendário de Pagamento
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    A soma de todas as parcelas deve ser exatamente o Total Geral:{' '}
                    <strong className="text-foreground">{formatCurrency(grandTotal)}</strong>.
                  </p>
                </div>

                {/* Modelos rápidos */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetPaymentPlan('full')}
                    className="text-xs h-8"
                  >
                    100% à vista
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetPaymentPlan('half_half')}
                    className="text-xs h-8 bg-primary/5 text-primary border-primary/30"
                  >
                    50% sinal + 50% no evento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetPaymentPlan('three_parts')}
                    className="text-xs h-8"
                  >
                    40% + 30% + 30%
                  </Button>
                </div>

                {/* Lista de Parcelas */}
                <div className="space-y-3 pt-2">
                  {paymentSchedule.map((installment, index) => (
                    <div
                      key={installment.id || index}
                      className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Parcela #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveInstallment(index)}
                          disabled={paymentSchedule.length === 1}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Descrição da Parcela *
                          </Label>
                          <Input
                            placeholder="Ex: Sinal para reserva"
                            value={installment.description}
                            onChange={(e) => {
                              const next = [...paymentSchedule]
                              next[index].description = e.target.value
                              setPaymentSchedule(next)
                            }}
                            className="text-xs h-9 bg-background"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Data de Vencimento *
                          </Label>
                          <Input
                            type="date"
                            required
                            value={installment.dueDate}
                            onChange={(e) => {
                              const next = [...paymentSchedule]
                              next[index].dueDate = e.target.value
                              setPaymentSchedule(next)
                            }}
                            className="text-xs h-9 bg-background"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Valor da Parcela (R$) *
                          </Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            inputMode="decimal"
                            value={installment.value || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              const next = [...paymentSchedule]
                              next[index].value = val
                              if (grandTotal > 0) {
                                next[index].percentage = Math.round((val / grandTotal) * 100)
                              }
                              setPaymentSchedule(next)
                            }}
                            className="text-xs h-9 bg-background font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Meio de Pagamento
                          </Label>
                          <Select
                            value={installment.method}
                            onValueChange={(val: PaymentInstallmentMethod) => {
                              const next = [...paymentSchedule]
                              next[index].method = val
                              setPaymentSchedule(next)
                            }}
                          >
                            <SelectTrigger className="text-xs h-9 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PIX">PIX</SelectItem>
                              <SelectItem value="Transferência">Transferência / TED</SelectItem>
                              <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                              <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                              <SelectItem value="Dinheiro">Dinheiro em Espécie</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInstallment}
                    className="w-full text-xs h-9 gap-1.5 border-dashed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Outra Parcela
                  </Button>
                </div>

                {/* Resumo de validação da soma */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    isScheduleBalanced
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isScheduleBalanced ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold block">
                        {isScheduleBalanced
                          ? 'Calendário validado: soma bate exatamente com o total'
                          : 'Soma das parcelas diferente do total do orçamento'}
                      </span>
                      <span className="text-[11px] opacity-80">
                        Soma das parcelas: {formatCurrency(totalScheduleAmount)} | Total Geral:{' '}
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                  {!isScheduleBalanced && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPresetPaymentPlan('half_half')}
                      className="text-[11px] h-7 bg-background text-amber-900 border-amber-500/40"
                    >
                      Ajustar 50/50
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ETAPA 5: REVISÃO & PDF */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-serif font-semibold text-base text-heading">
                    5. Revisão da Proposta & Geração de PDF
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Verifique os detalhes da proposta comercial antes de salvar e compartilhar.
                  </p>
                </div>

                {/* Resumo Card */}
                <div className="p-4 bg-card rounded-xl border border-border/70 space-y-3 text-xs shadow-xs">
                  <div className="flex items-start justify-between border-b border-border/40 pb-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                        Proposta Comercial / Pré-Contrato
                      </span>
                      <h4 className="font-serif font-bold text-base text-foreground mt-0.5">
                        {eventName || 'Evento sem título'}
                      </h4>
                      <p className="text-muted-foreground mt-0.5">
                        Cliente:{' '}
                        <strong className="text-foreground">{selectedClientObj?.name}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">
                        Total Previsto
                      </span>
                      <span className="text-xl font-serif font-bold text-primary">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <span className="text-foreground font-medium block">Cronograma:</span>
                      <span>
                        {formatShortDate(eventStartDate)} às {eventStartTime} até{' '}
                        {formatShortDate(eventEndDate)} às {eventEndTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground font-medium block">Local:</span>
                      <span className="truncate block">{eventLocation || 'A definir'}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/40">
                    <span className="text-foreground font-medium block">Discriminativo:</span>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Serviços ({items.length} itens):</span>
                      <span>{formatCurrency(servicesSubtotal)}</span>
                    </div>
                    {equipmentsSubtotal > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Equipamentos ({equipments.length}):</span>
                        <span>{formatCurrency(equipmentsSubtotal)}</span>
                      </div>
                    )}
                    {logisticsChargedSubtotal > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Despesas de logística:</span>
                        <span>{formatCurrency(logisticsChargedSubtotal)}</span>
                      </div>
                    )}
                    {discounts > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(discounts)}</span>
                      </div>
                    )}
                    {overtimeRule.enabled && (
                      <div className="flex justify-between text-amber-700 dark:text-amber-300">
                        <span>Hora extra (adicional se houver):</span>
                        <span>{formatCurrency(overtimeRule.hourlyRate)} / hora</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações de PDF direto */}
                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground">
                      Proposta com Visual Elegante Studio Freela
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Você pode gerar e compartilhar a proposta em PDF com seus dados profissionais,
                    cronograma, itens contratados, condições de hora extra, responsabilidades e
                    termo de aceite.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mockQuote: Quote = {
                          id: quoteToEdit?.id || 'preview',
                          clientId,
                          number: quoteToEdit?.number || 'ORC-NOVO',
                          date: new Date(`${quoteDate}T12:00:00`).toISOString(),
                          validityDays,
                          status: targetStatus,
                          eventName,
                          eventLocation,
                          eventStartDate,
                          eventStartTime,
                          eventEndDate,
                          eventEndTime,
                          notes,
                          items,
                          equipments,
                          overtimeRule,
                          logistics,
                          paymentSchedule,
                          total: grandTotal,
                        }
                        exportQuoteToPdf(mockQuote, selectedClientObj, user, 'view')
                      }}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Visualizar PDF
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mockQuote: Quote = {
                          id: quoteToEdit?.id || 'preview',
                          clientId,
                          number: quoteToEdit?.number || 'ORC-NOVO',
                          date: new Date(`${quoteDate}T12:00:00`).toISOString(),
                          validityDays,
                          status: targetStatus,
                          eventName,
                          eventLocation,
                          eventStartDate,
                          eventStartTime,
                          eventEndDate,
                          eventEndTime,
                          notes,
                          items,
                          equipments,
                          overtimeRule,
                          logistics,
                          paymentSchedule,
                          total: grandTotal,
                        }
                        exportQuoteToPdf(mockQuote, selectedClientObj, user, 'download')
                      }}
                      className="text-xs h-8 gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5" /> Baixar PDF
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mockQuote: Quote = {
                          id: quoteToEdit?.id || 'preview',
                          clientId,
                          number: quoteToEdit?.number || 'ORC-NOVO',
                          date: new Date(`${quoteDate}T12:00:00`).toISOString(),
                          validityDays,
                          status: targetStatus,
                          eventName,
                          eventLocation,
                          eventStartDate,
                          eventStartTime,
                          eventEndDate,
                          eventEndTime,
                          notes,
                          items,
                          equipments,
                          overtimeRule,
                          logistics,
                          paymentSchedule,
                          total: grandTotal,
                        }
                        shareQuotePdf(mockQuote, selectedClientObj, user)
                      }}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Compartilhar
                    </Button>
                  </div>
                </div>

                {/* Escolha do estado ao salvar */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Como deseja registrar este orçamento agora?
                  </Label>
                  <RadioGroup
                    value={targetStatus}
                    onValueChange={(val: any) => setTargetStatus(val)}
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <RadioGroupItem value="Enviado" id="st-enviado" className="mt-0.5" />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="st-enviado"
                          className="text-xs font-medium cursor-pointer text-foreground flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Salvar como Pré-reserva (Enviado)
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Cria automaticamente o evento na agenda em{' '}
                          <strong>verde (Pré-reserva)</strong> e as parcelas como{' '}
                          <strong>Previstas</strong> no financeiro.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <RadioGroupItem value="Confirmado" id="st-confirmado" className="mt-0.5" />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="st-confirmado"
                          className="text-xs font-medium cursor-pointer text-foreground flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          Salvar como Confirmado (Aprovado)
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          O evento aparece na agenda em <strong>vermelho (Confirmado)</strong> e os
                          recebíveis entram como <strong>Pendentes</strong> a receber.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/60 bg-muted/20">
                      <RadioGroupItem value="Rascunho" id="st-rascunho" className="mt-0.5" />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="st-rascunho"
                          className="text-xs font-medium cursor-pointer text-foreground"
                        >
                          Salvar apenas como Rascunho Interno
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Não aparece na agenda pública nem lança previsão financeira até ser
                          enviado.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </div>

          {/* Fixed bottom bar mobile-first with total and next action */}
          <div className="p-3 sm:p-4 border-t border-border/70 bg-card/95 backdrop-blur-sm shrink-0 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                Total Geral
              </span>
              <span className="text-lg sm:text-xl font-serif font-bold text-foreground">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((prev) => (prev - 1) as any)}
                  className="h-10 px-3 text-xs gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </Button>
              )}

              {step < 5 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextStep}
                  className="h-10 px-4 text-xs font-medium gap-1.5 shadow-sm"
                >
                  Continuar <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveQuote()}
                  className="h-10 px-4 text-xs font-medium gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Salvar Orçamento
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
export default QuoteFormSheet
