import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Client, AppEvent, Finance } from '@/types'
import { toast } from 'sonner'

type AppDataContextType = {
  clients: Client[]
  events: AppEvent[]
  finances: Finance[]
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void
  addEvent: (event: Omit<AppEvent, 'id'>) => void
  markFinanceAsPaid: (id: string) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const initialClients: Client[] = [
  {
    id: 'c1',
    name: 'Empresa Alpha',
    email: 'contato@alpha.com',
    phone: '(11) 99999-1111',
    document: '12.345.678/0001-90',
    notes: 'Cliente VIP',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Studio Beta',
    email: 'ola@studiobeta.com',
    phone: '(21) 98888-2222',
    document: '98.765.432/0001-10',
    notes: 'Agência parceira',
    createdAt: new Date().toISOString(),
  },
]

const initialEvents: AppEvent[] = [
  {
    id: 'e1',
    title: 'Cobertura Lançamento',
    clientId: 'c1',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    time: '19:00',
    location: 'Hotel Fasano, SP',
    value: 4500,
    status: 'Confirmado',
  },
  {
    id: 'e2',
    title: 'Ensaio Corporativo',
    clientId: 'c2',
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    time: '14:00',
    location: 'Studio Beta',
    value: 2800,
    status: 'Pendente',
  },
]

const initialFinances: Finance[] = [
  {
    id: 'f1',
    eventId: 'e1',
    clientId: 'c1',
    title: 'Adiantamento Lançamento',
    value: 2250,
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    status: 'Pago',
  },
  {
    id: 'f2',
    eventId: 'e1',
    clientId: 'c1',
    title: 'Restante Lançamento',
    value: 2250,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'Pendente',
  },
  {
    id: 'f3',
    eventId: 'e2',
    clientId: 'c2',
    title: 'Sinal Ensaio',
    value: 1400,
    dueDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'Atrasado',
  },
]

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [events, setEvents] = useState<AppEvent[]>(initialEvents)
  const [finances, setFinances] = useState<Finance[]>(initialFinances)

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    setClients((prev) => [newClient, ...prev])
    toast.success('Cliente adicionado com sucesso!')
  }

  const addEvent = (eventData: Omit<AppEvent, 'id'>) => {
    const newEvent: AppEvent = { ...eventData, id: generateId() }
    setEvents((prev) => [...prev, newEvent])

    // Automatically generate a receivable for the new event
    const newFinance: Finance = {
      id: generateId(),
      eventId: newEvent.id,
      clientId: newEvent.clientId,
      title: `Pagamento: ${newEvent.title}`,
      value: newEvent.value,
      dueDate: newEvent.date,
      status: 'Pendente',
    }
    setFinances((prev) => [...prev, newFinance])
    toast.success('Evento agendado e título financeiro gerado!')
  }

  const markFinanceAsPaid = (id: string) => {
    setFinances((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'Pago' } : f)))
    toast.success('Pagamento confirmado com sucesso!', {
      description: 'O saldo foi atualizado em suas contas.',
    })
  }

  return (
    <AppDataContext.Provider
      value={{ clients, events, finances, addClient, addEvent, markFinanceAsPaid }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used within AppDataProvider')
  return context
}
