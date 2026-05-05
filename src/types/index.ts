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
