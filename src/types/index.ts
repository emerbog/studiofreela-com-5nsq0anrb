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
  cpfCnpj?: string
  plan_tier?: PlanTier
  pilot_access?: boolean
  is_blocked?: boolean
  blocked_reason?: string
  last_login_at?: string
  created?: string
  updated?: string
}

// -------------------------------------------------------------
// ADMIN & GOVERNANÇA (Studio Freela Admin)
// -------------------------------------------------------------

export type AdminRole = 'admin' | 'financeiro' | 'suporte' | 'analista' | 'freelancer'

export type AdminUserItem = {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  profession?: string
  plan_tier: PlanTier
  pilot_access?: boolean
  is_blocked?: boolean
  blocked_reason?: string
  last_login_at?: string
  created: string
  updated: string
  role: AdminRole
  counts: {
    clients: number
    quotes: number
    contracts: number
    events: number
    finances: number
  }
}

export type AdminAuditLog = {
  id: string
  admin_user?: string
  admin_email?: string
  action: string
  target_type?: string
  target_id?: string
  details?: Record<string, any>
  ip_address?: string
  created: string
}

export type UsageEvent = {
  id: string
  user: string
  event_type:
    | 'login'
    | 'client_created'
    | 'quote_created'
    | 'quote_confirmed'
    | 'pdf_generated'
    | 'event_created'
    | 'receivable_created'
    | 'contract_generated'
    | 'contract_sent'
    | 'contract_signed'
    | 'resume_generated'
    | 'equipment_created'
    | 'service_created'
    | 'page_view'
    | string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  created: string
}

export type SubscriptionItem = {
  id: string
  user: string
  plan: PlanTier
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
  price?: number
  billing_interval?: 'monthly' | 'yearly'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end?: boolean
  canceled_at?: string
  trial_end?: string
  gateway_provider?: string
  gateway_customer_id?: string
  gateway_subscription_id?: string
  checkout_url?: string
  billing_type?: string
  next_due_date?: string
  created: string
}

export type PaymentItem = {
  id: string
  user: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  payment_method_type?: 'pix' | 'credit_card' | 'boleto' | 'other'
  gateway_provider?: string
  gateway_payment_id?: string
  gateway_subscription_id?: string
  invoice_url?: string
  bank_slip_url?: string
  due_date?: string
  paid_at?: string
  failure_reason?: string
  created: string
}

export type PlanConfig = {
  id: PlanTier
  name: string
  price: number
  currency: string
  billingInterval: 'monthly' | 'yearly'
  badge?: string
  features: string[]
}

export type BillingConfigResponse = {
  configured: boolean
  environment: 'sandbox' | 'production'
  plans: PlanConfig[]
}

export type CreateCheckoutParams = {
  plan: PlanTier
  cpfCnpj?: string
}

export type CreateCheckoutResponse = {
  success: boolean
  subscriptionId: string
  customerId: string
  plan: PlanTier
  price: number
  checkoutUrl: string
  invoiceUrl?: string
  message: string
}

export type SupportTicket = {
  id: string
  user: string
  subject: string
  description: string
  status: 'aberto' | 'em_atendimento' | 'resolvido' | 'fechado'
  priority?: 'baixa' | 'media' | 'alta' | 'urgente'
  assigned_admin?: string
  responses?: Array<{
    sender_id: string
    sender_email: string
    sender_type: 'admin' | 'user'
    message: string
    created_at: string
  }>
  created: string
  updated: string
}

export type AppNotification = {
  id: string
  user: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'payment' | 'system'
  read?: boolean
  link?: string
  created: string
  updated: string
}

export type AdminOverviewData = {
  userRole: AdminRole
  counts: {
    totalUsers: number
    totalClients: number
    totalEvents: number
    totalFinances: number
    totalQuotes: number
    confirmedQuotes: number
    totalContracts: number
    totalEquipments: number
    totalServices: number
    totalProfiles: number
    totalSubscriptions: number
    totalPayments: number
    totalTickets: number
    paidFinancesValue: number
  }
  users: AdminUserItem[]
  auditLogs: AdminAuditLog[]
  usageEvents: UsageEvent[]
  subscriptions: SubscriptionItem[]
  payments: PaymentItem[]
  supportTickets: SupportTicket[]
}

// -------------------------------------------------------------
// CENTRO PROFISSIONAL - FASES 1 & 2
// -------------------------------------------------------------

export type WorkMode = 'presencial' | 'remoto' | 'hibrido'

export type SocialLinks = {
  instagram?: string
  linkedin?: string
  youtube?: string
  website?: string
  other?: string
}

export type ResumeBlockConfig = {
  id: string
  key:
    | 'summary'
    | 'experiences'
    | 'education'
    | 'services'
    | 'skills'
    | 'clients_served'
    | 'featured_projects'
    | 'testimonials'
    | 'languages'
    | 'equipment'
    | 'contacts'
    | 'links'
    | 'commercial_notes'
  title: string
  visibleInCv: boolean
  visibleInPublic: boolean
  order: number
}

export type ProfessionalProfileData = {
  id?: string
  user?: string
  commercial_name?: string
  city?: string
  state?: string
  professional_phone?: string
  professional_email?: string
  hide_residential_address?: boolean
  social_links?: SocialLinks
  professional_title?: string
  headline?: string // ~120 chars
  bio?: string // ~1000 chars
  years_experience?: number
  travel_availability?: boolean
  work_mode?: WorkMode
  languages?: string[]
  served_regions?: string
  resume_blocks_config?: ResumeBlockConfig[]
  show_updated_at_in_cv?: boolean
  created?: string
  updated?: string
}

export type ProfessionalExperience = {
  id?: string
  user?: string
  company_client: string
  role: string
  start_date?: string
  end_date?: string
  current?: boolean
  location_or_mode?: string
  description?: string
  results_projects?: string
  show_in_cv?: boolean
  show_in_public?: boolean
  order?: number
  created?: string
  updated?: string
}

export type EducationType = 'graduacao' | 'pos_graduacao' | 'curso_livre' | 'certificacao'

export type ProfessionalEducation = {
  id?: string
  user?: string
  institution: string
  course_name: string
  period_or_year?: string
  certificate_url?: string
  type?: EducationType
  show_in_cv?: boolean
  show_in_public?: boolean
  order?: number
  created?: string
  updated?: string
}

export type ServiceCategory =
  | 'audiovisual'
  | 'fotografia'
  | 'video'
  | 'design'
  | 'producao'
  | 'sonorizacao'
  | 'iluminacao'
  | 'cenografia'
  | 'tecnologia'
  | 'traducao'
  | 'suporte_tecnico'
  | 'outro'

export type ServiceBillingUnit = 'hora' | 'diaria' | 'servico' | 'projeto' | 'outro'

export type ProfessionalService = {
  id?: string
  user?: string
  name: string
  short_description?: string
  category?: ServiceCategory
  billing_unit?: ServiceBillingUnit
  starting_price?: number
  price_range?: string
  is_available?: boolean
  show_in_cv?: boolean
  show_in_public?: boolean
  order?: number
  created?: string
  updated?: string
}

export type EquipmentCategory =
  | 'cameras'
  | 'lentes'
  | 'iluminacao'
  | 'audio'
  | 'sonorizacao'
  | 'paineis_led'
  | 'projetores'
  | 'computadores'
  | 'estruturas'
  | 'cenografia'
  | 'moveis_acessorios'
  | 'cabos_perifericos'
  | 'outros'

export type EquipmentCondition = 'novo' | 'excelente' | 'bom' | 'marcas_uso'

export type EquipmentStatus = 'disponivel' | 'reservado' | 'manutencao' | 'indisponivel'

export type ProfessionalEquipment = {
  id?: string
  user?: string
  name: string
  category?: EquipmentCategory
  brand?: string
  model?: string
  quantity: number
  technical_description?: string
  condition?: EquipmentCondition
  hourly_rate?: number
  daily_rate?: number
  event_rate?: number
  deposit_or_commercial_note?: string
  approximate_location?: string
  needs_operator?: boolean
  status: EquipmentStatus
  show_in_public?: boolean
  show_in_cv?: boolean
  offer_in_quotes?: boolean
  order?: number
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
