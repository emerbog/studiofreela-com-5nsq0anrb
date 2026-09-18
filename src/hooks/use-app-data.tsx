import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { Client, AppEvent, Finance, PlanTier, Quote, Contract } from '@/types'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { appDataService } from '@/services/appDataService'
import pb from '@/lib/pocketbase/client'

type AppDataContextType = {
  currentTier: PlanTier
  isPilotUser: boolean
  setCurrentTier: (tier: PlanTier) => Promise<void>
  clients: Client[]
  events: AppEvent[]
  finances: Finance[]
  quotes: Quote[]
  contracts: Contract[]
  isLoadingData: boolean
  refreshData: () => Promise<void>
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client | null>
  updateClient: (id: string, client: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<boolean>
  deleteClient: (id: string) => Promise<boolean>
  addEvent: (event: Omit<AppEvent, 'id'>) => Promise<AppEvent | null>
  updateEvent: (id: string, event: Partial<Omit<AppEvent, 'id'>>) => Promise<boolean>
  deleteEvent: (id: string) => Promise<boolean>
  markFinanceAsPaid: (id: string, paidDate?: string) => Promise<boolean>
  addFinance: (finance: Omit<Finance, 'id'>) => Promise<Finance | null>
  updateFinance: (id: string, finance: Partial<Omit<Finance, 'id'>>) => Promise<boolean>
  deleteFinance: (id: string) => Promise<boolean>
  addQuote: (quote: Omit<Quote, 'id' | 'number'> & { number?: string }) => Promise<Quote | null>
  updateQuote: (id: string, quote: Partial<Omit<Quote, 'id'>>) => Promise<boolean>
  deleteQuote: (id: string) => Promise<boolean>
  resyncQuote: (id: string) => Promise<boolean>
  addContract: (
    contract: Omit<Contract, 'id' | 'number'> & { number?: string },
  ) => Promise<Contract | null>
  updateContract: (id: string, contract: Partial<Omit<Contract, 'id'>>) => Promise<boolean>
  deleteContract: (id: string) => Promise<boolean>
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, updateProfile } = useAuth()
  const isPilotUser = !!user?.pilot_access
  const [currentTier, setCurrentTierState] = useState<PlanTier>(() =>
    user?.pilot_access ? 'advanced' : user?.plan_tier || 'intermediate',
  )

  const [clients, setClients] = useState<Client[]>([])
  const [events, setEvents] = useState<AppEvent[]>([])
  const [finances, setFinances] = useState<Finance[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)

  // Sync tier with user profile
  useEffect(() => {
    if (user?.pilot_access) {
      if (currentTier !== 'advanced') {
        setCurrentTierState('advanced')
      }
    } else if (user?.plan_tier && user.plan_tier !== currentTier) {
      setCurrentTierState(user.plan_tier)
    }
  }, [user?.plan_tier, user?.pilot_access])

  const setCurrentTier = async (tier: PlanTier) => {
    setCurrentTierState(tier)
    if (user?.id) {
      await updateProfile({ plan_tier: tier })
    }
  }

  // Load real data from backend when user is authenticated
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !pb.authStore.isValid) {
      setClients([])
      setEvents([])
      setFinances([])
      setQuotes([])
      setContracts([])
      setIsLoadingData(false)
      return
    }

    setIsLoadingData(true)
    try {
      const [c, e, f, q, ct] = await Promise.all([
        appDataService.getClients().catch((err) => {
          console.warn('Erro ao carregar clientes:', err)
          return []
        }),
        appDataService.getEvents().catch((err) => {
          console.warn('Erro ao carregar eventos:', err)
          return []
        }),
        appDataService.getFinances().catch((err) => {
          console.warn('Erro ao carregar recebíveis:', err)
          return []
        }),
        appDataService.getQuotes().catch((err) => {
          console.warn('Erro ao carregar orçamentos:', err)
          return []
        }),
        appDataService.getContracts().catch((err) => {
          console.warn('Erro ao carregar contratos:', err)
          return []
        }),
      ])

      setClients(c)
      setEvents(e)
      setFinances(f)
      setQuotes(q)
      setContracts(ct)
    } finally {
      setIsLoadingData(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Clients CRUD
  const addClient = async (
    clientData: Omit<Client, 'id' | 'createdAt'>,
  ): Promise<Client | null> => {
    try {
      const created = await appDataService.createClient(clientData)
      setClients((prev) => [created, ...prev])
      toast.success('Cliente cadastrado com sucesso!')
      return created
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao cadastrar cliente.'
      toast.error('Erro no cadastro', { description: msg })
      return null
    }
  }

  const updateClient = async (
    id: string,
    clientData: Partial<Omit<Client, 'id' | 'createdAt'>>,
  ): Promise<boolean> => {
    try {
      const updated = await appDataService.updateClient(id, clientData)
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)))
      toast.success('Cliente atualizado com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao atualizar cliente.'
      toast.error('Erro ao atualizar', { description: msg })
      return false
    }
  }

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      await appDataService.deleteClient(id)
      setClients((prev) => prev.filter((c) => c.id !== id))
      toast.success('Cliente excluído com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao excluir cliente.'
      toast.error('Erro ao excluir', { description: msg })
      return false
    }
  }

  // Events CRUD
  const addEvent = async (eventData: Omit<AppEvent, 'id'>): Promise<AppEvent | null> => {
    try {
      const createdEvent = await appDataService.createEvent(eventData)
      setEvents((prev) => [...prev, createdEvent])

      // Auto-generate finance receivable on backend
      try {
        const createdFinance = await appDataService.createFinance({
          clientId: createdEvent.clientId,
          eventId: createdEvent.id,
          quoteId: createdEvent.quoteId,
          title: `Pagamento: ${createdEvent.title}`,
          value: createdEvent.value,
          dueDate: createdEvent.date,
          status: 'Pendente',
        })
        setFinances((prev) => [...prev, createdFinance])
      } catch (fErr: any) {
        console.error('Erro ao auto-gerar título financeiro:', fErr)
        toast.warning('Evento agendado, mas a geração do título financeiro falhou.', {
          description: fErr?.message || 'Verifique o Financeiro para lançar a parcela manualmente.',
        })
        return createdEvent
      }

      toast.success('Evento agendado e título financeiro gerado!')
      return createdEvent
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao agendar evento.'
      toast.error('Erro no agendamento', { description: msg })
      return null
    }
  }

  const updateEvent = async (
    id: string,
    eventData: Partial<Omit<AppEvent, 'id'>>,
  ): Promise<boolean> => {
    try {
      const updated = await appDataService.updateEvent(id, eventData)
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
      toast.success('Evento atualizado com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao atualizar evento.'
      toast.error('Erro ao atualizar', { description: msg })
      return false
    }
  }

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      await appDataService.deleteEvent(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success('Evento excluído com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao excluir evento.'
      toast.error('Erro ao excluir', { description: msg })
      return false
    }
  }

  // Finances CRUD
  const markFinanceAsPaid = async (id: string, paidDate?: string): Promise<boolean> => {
    try {
      const updated = await appDataService.updateFinance(id, {
        status: 'Pago',
        paidAt: paidDate || new Date().toISOString(),
      })
      setFinances((prev) => prev.map((f) => (f.id === id ? updated : f)))
      toast.success('Pagamento confirmado com sucesso!', {
        description: 'O saldo foi atualizado em suas contas.',
      })
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao confirmar pagamento.'
      toast.error('Erro ao atualizar', { description: msg })
      return false
    }
  }

  const updateFinance = async (
    id: string,
    financeData: Partial<Omit<Finance, 'id'>>,
  ): Promise<boolean> => {
    try {
      const updated = await appDataService.updateFinance(id, financeData)
      setFinances((prev) => prev.map((f) => (f.id === id ? updated : f)))
      toast.success('Título financeiro atualizado!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao atualizar título.'
      toast.error('Erro ao atualizar', { description: msg })
      return false
    }
  }

  const addFinance = async (financeData: Omit<Finance, 'id'>): Promise<Finance | null> => {
    try {
      const created = await appDataService.createFinance(financeData)
      setFinances((prev) => [...prev, created])
      toast.success('Título financeiro adicionado!')
      return created
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao adicionar título.'
      toast.error('Erro financeiro', { description: msg })
      return null
    }
  }

  const deleteFinance = async (id: string): Promise<boolean> => {
    try {
      await appDataService.deleteFinance(id)
      setFinances((prev) => prev.filter((f) => f.id !== id))
      toast.success('Título excluído com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao excluir título.'
      toast.error('Erro ao excluir', { description: msg })
      return false
    }
  }

  // Quotes CRUD
  const addQuote = async (
    quoteData: Omit<Quote, 'id' | 'number'> & { number?: string },
  ): Promise<Quote | null> => {
    try {
      const created = await appDataService.createQuote(quoteData)
      setQuotes((prev) => [created, ...prev])
      // Recarrega dados para capturar o evento da agenda e as parcelas criadas
      await loadData()
      toast.success('Orçamento salvo e sincronizado com sucesso!', {
        description:
          created.status === 'Confirmado'
            ? 'Evento confirmado na agenda (vermelho) e parcelas pendentes.'
            : 'Pré-reserva criada na agenda (verde) e parcelas previstas no financeiro.',
      })
      return created
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao criar orçamento.'
      console.error('[StudioFreela] Falha em addQuote:', err)
      await loadData()
      toast.error('Atenção na sincronização', {
        description: msg,
      })
      return null
    }
  }

  const updateQuote = async (
    id: string,
    quoteData: Partial<Omit<Quote, 'id'>>,
  ): Promise<boolean> => {
    try {
      const updated = await appDataService.updateQuote(id, quoteData)
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)))
      // Recarrega agenda e financeiro com as alterações sincronizadas
      await loadData()
      toast.success('Orçamento atualizado com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao atualizar orçamento.'
      console.error('[StudioFreela] Falha em updateQuote:', err)
      await loadData()
      toast.error('Atenção na sincronização', {
        description: msg,
      })
      return false
    }
  }

  const resyncQuote = async (id: string): Promise<boolean> => {
    try {
      const updated = await appDataService.resyncQuote(id)
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)))
      await loadData()
      toast.success('Sincronização concluída com sucesso!', {
        description: 'Vínculos de agenda e financeiro reprocessados e atualizados.',
      })
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Falha ao reprocessar sincronização.'
      console.error('[StudioFreela] Falha em resyncQuote:', err)
      await loadData()
      toast.error('Falha na sincronização', {
        description: msg,
      })
      return false
    }
  }

  const deleteQuote = async (id: string): Promise<boolean> => {
    try {
      await appDataService.deleteQuote(id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      toast.success('Orçamento excluído com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao excluir orçamento.'
      toast.error('Erro ao excluir', { description: msg })
      return false
    }
  }

  // Contracts CRUD
  const addContract = async (
    contractData: Omit<Contract, 'id' | 'number'> & { number?: string },
  ): Promise<Contract | null> => {
    try {
      const created = await appDataService.createContract(contractData)
      setContracts((prev) => [created, ...prev])
      toast.success('Contrato gerado com sucesso!')
      return created
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao gerar contrato.'
      toast.error('Erro no contrato', { description: msg })
      return null
    }
  }

  const updateContract = async (
    id: string,
    contractData: Partial<Omit<Contract, 'id'>>,
  ): Promise<boolean> => {
    try {
      const updated = await appDataService.updateContract(id, contractData)
      setContracts((prev) => prev.map((ct) => (ct.id === id ? updated : ct)))
      toast.success('Contrato atualizado com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao atualizar contrato.'
      toast.error('Erro ao atualizar', { description: msg })
      return false
    }
  }

  const deleteContract = async (id: string): Promise<boolean> => {
    try {
      await appDataService.deleteContract(id)
      setContracts((prev) => prev.filter((ct) => ct.id !== id))
      toast.success('Contrato excluído com sucesso!')
      return true
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Erro ao excluir contrato.'
      toast.error('Erro ao excluir', { description: msg })
      return false
    }
  }

  return (
    <AppDataContext.Provider
      value={{
        currentTier,
        isPilotUser,
        setCurrentTier,
        clients,
        events,
        finances,
        quotes,
        contracts,
        isLoadingData,
        refreshData: loadData,
        addClient,
        updateClient,
        deleteClient,
        addEvent,
        updateEvent,
        deleteEvent,
        markFinanceAsPaid,
        addFinance,
        updateFinance,
        deleteFinance,
        addQuote,
        updateQuote,
        deleteQuote,
        resyncQuote,
        addContract,
        updateContract,
        deleteContract,
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
