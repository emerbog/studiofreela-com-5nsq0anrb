export type Client = {
  id: string
  name: string
  email: string
  phone: string
  document: string
  notes: string
  createdAt: string
}

export type EventStatus = 'Confirmado' | 'Pendente' | 'Concluído'

export type AppEvent = {
  id: string
  title: string
  clientId: string
  date: string
  time: string
  location: string
  value: number
  status: EventStatus
}

export type FinanceStatus = 'Pago' | 'Pendente' | 'Atrasado'

export type Finance = {
  id: string
  eventId?: string
  clientId?: string
  title: string
  value: number
  dueDate: string
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

export type QuoteItem = {
  id?: string
  description: string
  quantity: number
  unitPrice: number
}

export type Quote = {
  id: string
  clientId: string
  number: string
  date: string
  items: QuoteItem[]
  total: number
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Rejeitado'
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
