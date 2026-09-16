export type ClientType = 'PF' | 'PJ'

export type ClientAddress = {
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

export type ClientAdditionalContact = {
  id: string
  name: string
  role?: string
  phone?: string
  email?: string
}

export type Client = {
  id: string
  name: string
  tradeName?: string
  clientType?: ClientType
  email: string
  phone: string
  document: string
  notes: string
  addressData?: ClientAddress
  additionalContacts?: ClientAdditionalContact[]
  preferences?: string
  createdAt: string
}

export type EventStatus = 'Confirmado' | 'Pendente' | 'Concluído' | 'Pré-reserva' | 'Cancelado'

export type AppEvent = {
  id: string
  title: string
  clientId: string
  quoteId?: string
  date: string
  endDate?: string
  time: string
  endTime?: string
  location: string
  value: number
  status: EventStatus
  eventType?: 'event' | 'pre_reservation' | 'receivable'
  notes?: string
}

export type FinanceStatus = 'Pago' | 'Pendente' | 'Atrasado' | 'Previsto' | 'Cancelado'

export type Finance = {
  id: string
  eventId?: string
  clientId?: string
  quoteId?: string
  paymentScheduleItemId?: string
  paymentMethod?: string
  title: string
  value: number // in cents or standard decimal; formatted cleanly
  dueDate: string
  paidAt?: string
  status: FinanceStatus
}

export type PlanTier = 'economy' | 'intermediate' | 'advanced' | 'premium'

export type UserProfile = {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  profession?: string
  address?: string
  plan_tier?: PlanTier
  created?: string
  updated?: string
}

export type ServiceUnit = 'serviço' | 'diária' | 'hora' | 'profissional' | 'peça' | 'outro'

export type QuoteItem = {
  id?: string
  description: string
  quantity: number
  unit?: ServiceUnit | string
  unitPrice: number
}

export type QuoteEquipmentItem = {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  includedInService?: boolean
}

export type OvertimeRule = {
  enabled: boolean
  hourlyRate: number
  graceMinutes?: number
  notes?: string
}

export type ResponsibilityType =
  | 'contractor' // Paga pelo contratante (responsabilidade direta)
  | 'contracted' // Paga pelo profissional (cobrada no total se houver valor)
  | 'not_applicable' // Não se aplica

export type LogisticsConfig = {
  meal: {
    type: ResponsibilityType
    notes?: string
    chargedAmount?: number
  }
  transport: {
    type: ResponsibilityType
    originDestination?: string
    notes?: string
    chargedAmount?: number
  }
  lodging: {
    type: ResponsibilityType
    nightsCount?: number
    notes?: string
    chargedAmount?: number
  }
}

export type PaymentInstallmentMethod =
  | 'PIX'
  | 'Transferência'
  | 'Dinheiro'
  | 'Cartão'
  | 'Boleto'
  | 'Outro'

export type QuotePaymentInstallment = {
  id: string
  description: string
  dueDate: string
  value: number // in currency value
  percentage?: number
  method: PaymentInstallmentMethod
  notes?: string
}

export type PriceSummary = {
  servicesSubtotal: number
  equipmentsSubtotal: number
  expensesSubtotal: number
  discounts: number
  grandTotal: number
  overtimeSeparated: boolean
}

export type QuoteStatus =
  | 'Rascunho'
  | 'Enviado' // Pré-reserva
  | 'Confirmado'
  | 'Rejeitado'
  | 'Cancelado'
  | 'Expirado'
  | 'Aprovado' // legacy mapped to Confirmado

export type StatusHistoryEntry = {
  status: QuoteStatus
  timestamp: string
  note?: string
}

export type PdfHistoryEntry = {
  version: number
  generatedAt: string
  url?: string
}

export type Quote = {
  id: string
  clientId: string
  number: string
  date: string
  validityDays?: number
  status: QuoteStatus

  // Event info
  eventName?: string
  eventLocation?: string
  eventStartDate?: string
  eventStartTime?: string
  eventEndDate?: string
  eventEndTime?: string
  notes?: string

  // Items and logistics
  items: QuoteItem[]
  equipments?: QuoteEquipmentItem[]
  overtimeRule?: OvertimeRule
  logistics?: LogisticsConfig
  paymentSchedule?: QuotePaymentInstallment[]
  priceSummary?: PriceSummary

  total: number

  // Sync status
  syncStatus?: 'pending' | 'synced' | 'error'
  lastSyncAt?: string
  syncError?: string

  // Audit
  statusHistory?: StatusHistoryEntry[]
  pdfHistory?: PdfHistoryEntry[]
}

export type ContractDeliverable = {
  id?: string
  index?: number
  description: string
  date: string
}

export type ContractPaymentInstallment = {
  id?: string
  installmentNumber?: number
  amount: number
  date: string
}

export type ContractFormData = {
  // Contratante
  clientName: string
  clientDoc: string // CPF/CNPJ
  clientAddress: string
  clientLegalRep?: string
  clientEmail: string
  clientPhone: string

  // Contratado
  contractorName: string
  contractorCpf: string
  contractorRg: string
  contractorAddress: string
  contractorProfession: string
  contractorEmail: string
  contractorPhone: string

  // Cláusula 1 - Objeto
  serviceScope: string

  // Cláusula 2 - Prazo
  startDate: string
  endDate: string

  // Cláusula 3 - Entregas
  deliverables: ContractDeliverable[]
  acceptanceDays: number | string

  // Cláusula 4 - Valor e Forma de Cobrança
  totalValue: number
  billingType: 'fixed' | 'monthly' | 'hourly' | 'other'
  billingTypeOther?: string

  // Cláusula 5 - Forma de Pagamento e Dados Bancários
  paymentMethod: 'pix' | 'bank_transfer' | 'ted' | 'boleto' | 'other'
  paymentMethodOther?: string
  bankName?: string
  bankAgency?: string
  bankAccount?: string
  pixKey?: string
  paymentSchedule: ContractPaymentInstallment[]

  // Cláusula 6 - Atraso no Pagamento
  lateFinePercent: number | string
  lateInterestMonthlyPercent: number | string

  // Cláusula 10 - Confidencialidade
  confidentialityPenaltyType: 'fixed' | 'percent'
  confidentialityPenaltyValue: number | string

  // Cláusula 11 - LGPD
  dataController: string
  dataOperator: string

  // Cláusula 12 - Propriedade Intelectual
  intellectualPropertyMaterials: string
  portfolioPermission: 'allowed' | 'not_allowed'

  // Cláusula 14 - Rescisão
  noticePeriodDays: number | string

  // Cláusula 15 - Penalidades gerais
  generalPenaltyPercent: number | string

  // Cláusula 16 - Foro
  forumCity: string

  // Assinaturas
  signatureLocation: string
  signatureDate: string
  witness1Name?: string
  witness1Cpf?: string
  witness2Name?: string
  witness2Cpf?: string
}

export type Contract = {
  id: string
  clientId: string
  quoteId?: string
  number: string
  date: string
  content: string
  formData?: ContractFormData
  status: 'Rascunho' | 'Enviado' | 'Assinado'
}
