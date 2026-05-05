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
  eventId: string
  clientId: string
  title: string
  value: number
  dueDate: string
  status: FinanceStatus
}

export type PlanTier = 'economy' | 'intermediate' | 'premium'

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

export type Contract = {
  id: string
  clientId: string
  quoteId?: string
  number: string
  date: string
  content: string
  status: 'Rascunho' | 'Enviado' | 'Assinado'
}
