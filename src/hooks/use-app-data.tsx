import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Client, AppEvent, Finance, PlanTier, Quote, Contract } from '@/types'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

type AppDataContextType = {
  currentTier: PlanTier
  setCurrentTier: (tier: PlanTier) => void
  clients: Client[]
  events: AppEvent[]
  finances: Finance[]
  quotes: Quote[]
  contracts: Contract[]
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void
  addEvent: (event: Omit<AppEvent, 'id'>) => void
  markFinanceAsPaid: (id: string) => void
  addQuote: (quote: Omit<Quote, 'id' | 'number'>) => void
  addContract: (contract: Omit<Contract, 'id' | 'number'>) => void
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

const initialQuotes: Quote[] = [
  {
    id: 'q1',
    clientId: 'c1',
    number: 'ORC-001',
    date: new Date().toISOString(),
    items: [
      { id: 'i1', description: 'Cobertura Fotográfica (4h)', quantity: 1, unitPrice: 2000 },
      { id: 'i2', description: 'Edição de Imagens (50 fotos)', quantity: 1, unitPrice: 500 },
    ],
    total: 2500,
    status: 'Aprovado',
  },
]

const initialContracts: Contract[] = [
  {
    id: 'ct1',
    clientId: 'c1',
    quoteId: 'q1',
    number: 'CTR-001',
    date: new Date().toISOString(),
    content:
      'Pelo presente instrumento particular, as partes firmam o presente contrato de prestação de serviços fotográficos.\n\nFica acordado o valor de R$2.500,00 referente à cobertura de evento...',
    formData: {
      clientName: 'Empresa Alpha Ltda',
      clientDoc: '12.345.678/0001-90',
      clientAddress: 'Av. Paulista, 1000 - São Paulo/SP',
      clientLegalRep: 'Carlos Mendes',
      clientEmail: 'contato@alpha.com',
      clientPhone: '(11) 99999-1111',
      contractorName: 'Felipe Freelancer',
      contractorCpf: '123.456.789-00',
      contractorRg: '12.345.678-9 SSP/SP',
      contractorAddress: 'Rua Augusta, 500, Apto 42 - São Paulo/SP',
      contractorProfession: 'Desenvolvedor / Especialista Digital',
      contractorEmail: 'felipe@freelance.com',
      contractorPhone: '(11) 98765-4321',
      serviceScope:
        'Desenvolvimento e integração de plataforma web responsiva, incluindo módulos de gestão, agendamento e emissão de propostas.',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      deliverables: [
        {
          description: 'Arquitetura do sistema e layout aprovado',
          date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        },
        {
          description: 'Módulo de clientes e agenda funcional',
          date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
        },
        {
          description: 'Módulo financeiro e gerador de contratos',
          date: new Date(Date.now() + 86400000 * 22).toISOString().slice(0, 10),
        },
        {
          description: 'Testes de homologação, ajustes finais e deploy',
          date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
        },
      ],
      acceptanceDays: 5,
      totalValue: 2500,
      billingType: 'fixed',
      paymentMethod: 'pix',
      pixKey: 'felipe@freelance.com (Chave E-mail)',
      bankName: 'Nubank (260)',
      bankAgency: '0001',
      bankAccount: '1234567-8',
      paymentSchedule: [
        { installmentNumber: 1, amount: 1250, date: new Date().toISOString().slice(0, 10) },
        {
          installmentNumber: 2,
          amount: 1250,
          date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
        },
      ],
      lateFinePercent: 2,
      lateInterestMonthlyPercent: 1,
      confidentialityPenaltyType: 'percent',
      confidentialityPenaltyValue: 20,
      dataController: 'Empresa Alpha Ltda',
      dataOperator: 'Felipe Freelancer',
      intellectualPropertyMaterials:
        'Código-fonte customizado, documentação da API e assets visuais desenvolvidos especificamente para o projeto.',
      portfolioPermission: 'allowed',
      noticePeriodDays: 15,
      generalPenaltyPercent: 10,
      forumCity: 'São Paulo/SP',
      signatureLocation: 'São Paulo/SP',
      signatureDate: new Date().toISOString().slice(0, 10),
      witness1Name: 'Mariana Souza',
      witness1Cpf: '111.222.333-44',
      witness2Name: 'Roberto Lima',
      witness2Cpf: '555.666.777-88',
    },
    status: 'Assinado',
  },
]

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuth()
  const [currentTier, setCurrentTierState] = useState<PlanTier>(
    () => user?.plan_tier || 'intermediate',
  )
  const [clients, setClients] = useState<Client[]>(initialClients)

  // Sync tier with user profile
  React.useEffect(() => {
    if (user?.plan_tier && user.plan_tier !== currentTier) {
      setCurrentTierState(user.plan_tier)
    }
  }, [user?.plan_tier])

  const setCurrentTier = (tier: PlanTier) => {
    setCurrentTierState(tier)
    if (user?.id) {
      updateProfile({ plan_tier: tier })
    }
  }
  const [events, setEvents] = useState<AppEvent[]>(initialEvents)
  const [finances, setFinances] = useState<Finance[]>(initialFinances)
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes)
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)

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

  const addQuote = (quoteData: Omit<Quote, 'id' | 'number'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: generateId(),
      number: `ORC-${(quotes.length + 1).toString().padStart(3, '0')}`,
    }
    setQuotes((prev) => [newQuote, ...prev])
    toast.success('Orçamento criado com sucesso!')
  }

  const addContract = (contractData: Omit<Contract, 'id' | 'number'>) => {
    const newContract: Contract = {
      ...contractData,
      id: generateId(),
      number: `CTR-${(contracts.length + 1).toString().padStart(3, '0')}`,
    }
    setContracts((prev) => [newContract, ...prev])
    toast.success('Contrato gerado com sucesso!')
  }

  return (
    <AppDataContext.Provider
      value={{
        currentTier,
        setCurrentTier,
        clients,
        events,
        finances,
        quotes,
        contracts,
        addClient,
        addEvent,
        markFinanceAsPaid,
        addQuote,
        addContract,
      }}
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
