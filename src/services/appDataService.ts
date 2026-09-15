import pb from '@/lib/pocketbase/client'
import { Client, AppEvent, Finance, Quote, Contract } from '@/types'

export const appDataService = {
  // Clients
  async getClients(): Promise<Client[]> {
    const records = await pb.collection('clients').getFullList({
      sort: '-created',
    })
    return records.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      document: r.document || '',
      notes: r.notes || '',
      createdAt: r.created,
    }))
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const record = await pb.collection('clients').create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      notes: data.notes,
    })
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone,
      document: record.document,
      notes: record.notes,
      createdAt: record.created,
    }
  },

  async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    const record = await pb.collection('clients').update(id, data)
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      phone: record.phone,
      document: record.document,
      notes: record.notes,
      createdAt: record.created,
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    await pb.collection('clients').delete(id)
    return true
  },

  // Events
  async getEvents(): Promise<AppEvent[]> {
    const records = await pb.collection('events').getFullList({
      sort: 'date',
    })
    return records.map((r: any) => ({
      id: r.id,
      clientId: r.client || '',
      title: r.title || '',
      date: r.date,
      time: r.time || '',
      location: r.location || '',
      value: Number(r.value) || 0,
      status: r.status || 'Pendente',
    }))
  },

  async createEvent(data: Omit<AppEvent, 'id'>): Promise<AppEvent> {
    const record = await pb.collection('events').create({
      client: data.clientId,
      title: data.title,
      date: data.date,
      time: data.time,
      location: data.location,
      value: data.value,
      status: data.status,
    })
    return {
      id: record.id,
      clientId: record.client,
      title: record.title,
      date: record.date,
      time: record.time,
      location: record.location,
      value: Number(record.value) || 0,
      status: record.status,
    }
  },

  async updateEvent(id: string, data: Partial<Omit<AppEvent, 'id'>>): Promise<AppEvent> {
    const payload: any = { ...data }
    if (data.clientId) {
      payload.client = data.clientId
      delete payload.clientId
    }
    const record = await pb.collection('events').update(id, payload)
    return {
      id: record.id,
      clientId: record.client,
      title: record.title,
      date: record.date,
      time: record.time,
      location: record.location,
      value: Number(record.value) || 0,
      status: record.status,
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    await pb.collection('events').delete(id)
    return true
  },

  // Finances
  async getFinances(): Promise<Finance[]> {
    const records = await pb.collection('finances').getFullList({
      sort: 'dueDate',
    })
    return records.map((r: any) => ({
      id: r.id,
      clientId: r.client || '',
      eventId: r.event || '',
      title: r.title || '',
      value: Number(r.value) || 0,
      dueDate: r.dueDate,
      status: r.status || 'Pendente',
    }))
  },

  async createFinance(data: Omit<Finance, 'id'>): Promise<Finance> {
    const record = await pb.collection('finances').create({
      client: data.clientId || null,
      event: data.eventId || null,
      title: data.title,
      value: data.value,
      dueDate: data.dueDate,
      status: data.status,
    })
    return {
      id: record.id,
      clientId: record.client || '',
      eventId: record.event || '',
      title: record.title,
      value: Number(record.value) || 0,
      dueDate: record.dueDate,
      status: record.status,
    }
  },

  async updateFinance(id: string, data: Partial<Omit<Finance, 'id'>>): Promise<Finance> {
    const payload: any = { ...data }
    if (data.clientId !== undefined) {
      payload.client = data.clientId || null
      delete payload.clientId
    }
    if (data.eventId !== undefined) {
      payload.event = data.eventId || null
      delete payload.eventId
    }
    const record = await pb.collection('finances').update(id, payload)
    return {
      id: record.id,
      clientId: record.client || '',
      eventId: record.event || '',
      title: record.title,
      value: Number(record.value) || 0,
      dueDate: record.dueDate,
      status: record.status,
    }
  },

  async deleteFinance(id: string): Promise<boolean> {
    await pb.collection('finances').delete(id)
    return true
  },

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    const records = await pb.collection('quotes').getFullList({
      sort: '-date',
    })
    return records.map((r: any) => ({
      id: r.id,
      clientId: r.client || '',
      number: r.number || '',
      date: r.date,
      items: r.items || [],
      total: Number(r.total) || 0,
      status: r.status || 'Rascunho',
    }))
  },

  async createQuote(data: Omit<Quote, 'id' | 'number'> & { number?: string }): Promise<Quote> {
    const existing = await pb.collection('quotes').getList(1, 1, { sort: '-created' })
    const seq = (existing.totalItems + 1).toString().padStart(3, '0')
    const number = data.number || `ORC-${seq}`

    const record = await pb.collection('quotes').create({
      client: data.clientId,
      number,
      date: data.date,
      items: data.items,
      total: data.total,
      status: data.status,
    })
    return {
      id: record.id,
      clientId: record.client,
      number: record.number,
      date: record.date,
      items: record.items,
      total: Number(record.total) || 0,
      status: record.status,
    }
  },

  async updateQuote(id: string, data: Partial<Omit<Quote, 'id'>>): Promise<Quote> {
    const payload: any = { ...data }
    if (data.clientId) {
      payload.client = data.clientId
      delete payload.clientId
    }
    const record = await pb.collection('quotes').update(id, payload)
    return {
      id: record.id,
      clientId: record.client,
      number: record.number,
      date: record.date,
      items: record.items,
      total: Number(record.total) || 0,
      status: record.status,
    }
  },

  async deleteQuote(id: string): Promise<boolean> {
    await pb.collection('quotes').delete(id)
    return true
  },

  // Contracts
  async getContracts(): Promise<Contract[]> {
    const records = await pb.collection('contracts').getFullList({
      sort: '-date',
    })
    return records.map((r: any) => ({
      id: r.id,
      clientId: r.client || '',
      quoteId: r.quote || undefined,
      number: r.number || '',
      date: r.date,
      content: r.content || '',
      formData: r.formData || undefined,
      status: r.status || 'Rascunho',
    }))
  },

  async createContract(
    data: Omit<Contract, 'id' | 'number'> & { number?: string },
  ): Promise<Contract> {
    const existing = await pb.collection('contracts').getList(1, 1, { sort: '-created' })
    const seq = (existing.totalItems + 1).toString().padStart(3, '0')
    const number = data.number || `CTR-${seq}`

    const record = await pb.collection('contracts').create({
      client: data.clientId,
      quote: data.quoteId || null,
      number,
      date: data.date,
      content: data.content,
      formData: data.formData || null,
      status: data.status,
    })
    return {
      id: record.id,
      clientId: record.client,
      quoteId: record.quote || undefined,
      number: record.number,
      date: record.date,
      content: record.content,
      formData: record.formData,
      status: record.status,
    }
  },

  async updateContract(id: string, data: Partial<Omit<Contract, 'id'>>): Promise<Contract> {
    const payload: any = { ...data }
    if (data.clientId) {
      payload.client = data.clientId
      delete payload.clientId
    }
    if (data.quoteId !== undefined) {
      payload.quote = data.quoteId || null
      delete payload.quoteId
    }
    const record = await pb.collection('contracts').update(id, payload)
    return {
      id: record.id,
      clientId: record.client,
      quoteId: record.quote || undefined,
      number: record.number,
      date: record.date,
      content: record.content,
      formData: record.formData,
      status: record.status,
    }
  },

  async deleteContract(id: string): Promise<boolean> {
    await pb.collection('contracts').delete(id)
    return true
  },

  // Export full user data for LGPD
  async exportUserData(userId: string) {
    const [clients, events, finances, quotes, contracts] = await Promise.all([
      pb.collection('clients').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('events').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('finances').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('quotes').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('contracts').getFullList({ filter: `user = "${userId}"` }),
    ])

    return {
      exportedAt: new Date().toISOString(),
      platform: 'Studio Freela (studiofreela.com)',
      controller: 'Studio Freela',
      user: pb.authStore.model,
      clients,
      events,
      finances,
      quotes,
      contracts,
    }
  },

  // Account deletion (LGPD Right to Erasure)
  async deleteAccount(userId: string) {
    // Delete user record — cascade delete configured on collections will clean up child records
    await pb.collection('users').delete(userId)
    pb.authStore.clear()
    return true
  },
}
