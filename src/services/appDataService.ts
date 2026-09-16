import pb from '@/lib/pocketbase/client'
import {
  Client,
  AppEvent,
  Finance,
  Quote,
  Contract,
  QuotePaymentInstallment,
  QuoteStatus,
} from '@/types'

export const appDataService = {
  // Clients
  async getClients(): Promise<Client[]> {
    const records = await pb.collection('clients').getFullList({
      sort: '-created',
    })
    return records.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      tradeName: r.tradeName || '',
      clientType: r.clientType || 'PF',
      email: r.email || '',
      phone: r.phone || '',
      document: r.document || '',
      notes: r.notes || '',
      addressData: r.addressData || undefined,
      additionalContacts: r.additionalContacts || [],
      preferences: r.preferences || '',
      createdAt: r.created,
    }))
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const record = await pb.collection('clients').create({
      name: data.name,
      tradeName: data.tradeName || null,
      clientType: data.clientType || 'PF',
      email: data.email || null,
      phone: data.phone || null,
      document: data.document || null,
      notes: data.notes || null,
      addressData: data.addressData || null,
      additionalContacts: data.additionalContacts || null,
      preferences: data.preferences || null,
    })
    return {
      id: record.id,
      name: record.name,
      tradeName: record.tradeName || '',
      clientType: record.clientType || 'PF',
      email: record.email || '',
      phone: record.phone || '',
      document: record.document || '',
      notes: record.notes || '',
      addressData: record.addressData || undefined,
      additionalContacts: record.additionalContacts || [],
      preferences: record.preferences || '',
      createdAt: record.created,
    }
  },

  async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    const record = await pb.collection('clients').update(id, data)
    return {
      id: record.id,
      name: record.name,
      tradeName: record.tradeName || '',
      clientType: record.clientType || 'PF',
      email: record.email || '',
      phone: record.phone || '',
      document: record.document || '',
      notes: record.notes || '',
      addressData: record.addressData || undefined,
      additionalContacts: record.additionalContacts || [],
      preferences: record.preferences || '',
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
      quoteId: r.quote || undefined,
      title: r.title || '',
      date: r.date,
      endDate: r.endDate || undefined,
      time: r.time || '',
      endTime: r.endTime || '',
      location: r.location || '',
      value: Number(r.value) || 0,
      status: r.status || 'Pendente',
      eventType: r.eventType || 'event',
      notes: r.notes || '',
    }))
  },

  async createEvent(data: Omit<AppEvent, 'id'>): Promise<AppEvent> {
    const record = await pb.collection('events').create({
      client: data.clientId,
      quote: data.quoteId || null,
      title: data.title,
      date: data.date,
      endDate: data.endDate || null,
      time: data.time || null,
      endTime: data.endTime || null,
      location: data.location || null,
      value: data.value,
      status: data.status,
      eventType: data.eventType || 'event',
      notes: data.notes || null,
    })
    return {
      id: record.id,
      clientId: record.client,
      quoteId: record.quote || undefined,
      title: record.title,
      date: record.date,
      endDate: record.endDate || undefined,
      time: record.time || '',
      endTime: record.endTime || '',
      location: record.location || '',
      value: Number(record.value) || 0,
      status: record.status,
      eventType: record.eventType || 'event',
      notes: record.notes || '',
    }
  },

  async updateEvent(id: string, data: Partial<Omit<AppEvent, 'id'>>): Promise<AppEvent> {
    const payload: any = { ...data }
    if (data.clientId) {
      payload.client = data.clientId
      delete payload.clientId
    }
    if (data.quoteId !== undefined) {
      payload.quote = data.quoteId || null
      delete payload.quoteId
    }
    const record = await pb.collection('events').update(id, payload)
    return {
      id: record.id,
      clientId: record.client,
      quoteId: record.quote || undefined,
      title: record.title,
      date: record.date,
      endDate: record.endDate || undefined,
      time: record.time || '',
      endTime: record.endTime || '',
      location: record.location || '',
      value: Number(record.value) || 0,
      status: record.status,
      eventType: record.eventType || 'event',
      notes: record.notes || '',
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
      quoteId: r.quote || undefined,
      paymentScheduleItemId: r.paymentScheduleItemId || undefined,
      paymentMethod: r.paymentMethod || undefined,
      title: r.title || '',
      value: Number(r.value) || 0,
      dueDate: r.dueDate,
      paidAt: r.paidAt || undefined,
      status: r.status || 'Pendente',
    }))
  },

  async createFinance(data: Omit<Finance, 'id'>): Promise<Finance> {
    const record = await pb.collection('finances').create({
      client: data.clientId || null,
      event: data.eventId || null,
      quote: data.quoteId || null,
      paymentScheduleItemId: data.paymentScheduleItemId || null,
      paymentMethod: data.paymentMethod || null,
      title: data.title,
      value: data.value,
      dueDate: data.dueDate,
      paidAt: data.paidAt || null,
      status: data.status,
    })
    return {
      id: record.id,
      clientId: record.client || '',
      eventId: record.event || '',
      quoteId: record.quote || undefined,
      paymentScheduleItemId: record.paymentScheduleItemId || undefined,
      paymentMethod: record.paymentMethod || undefined,
      title: record.title,
      value: Number(record.value) || 0,
      dueDate: record.dueDate,
      paidAt: record.paidAt || undefined,
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
    if (data.quoteId !== undefined) {
      payload.quote = data.quoteId || null
      delete payload.quoteId
    }
    const record = await pb.collection('finances').update(id, payload)
    return {
      id: record.id,
      clientId: record.client || '',
      eventId: record.event || '',
      quoteId: record.quote || undefined,
      paymentScheduleItemId: record.paymentScheduleItemId || undefined,
      paymentMethod: record.paymentMethod || undefined,
      title: record.title,
      value: Number(record.value) || 0,
      dueDate: record.dueDate,
      paidAt: record.paidAt || undefined,
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
      validityDays: r.validityDays || 15,
      status: r.status || 'Rascunho',
      eventName: r.eventName || '',
      eventLocation: r.eventLocation || '',
      eventStartDate: r.eventStartDate || '',
      eventStartTime: r.eventStartTime || '',
      eventEndDate: r.eventEndDate || '',
      eventEndTime: r.eventEndTime || '',
      notes: r.notes || '',
      items: r.items || [],
      equipments: r.equipments || [],
      overtimeRule: r.overtimeRule || undefined,
      logistics: r.logistics || undefined,
      paymentSchedule: r.paymentSchedule || [],
      priceSummary: r.priceSummary || undefined,
      total: Number(r.total) || 0,
      statusHistory: r.statusHistory || [],
      pdfHistory: r.pdfHistory || [],
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
      validityDays: data.validityDays || 15,
      status: data.status,
      eventName: data.eventName || null,
      eventLocation: data.eventLocation || null,
      eventStartDate: data.eventStartDate || null,
      eventStartTime: data.eventStartTime || null,
      eventEndDate: data.eventEndDate || null,
      eventEndTime: data.eventEndTime || null,
      notes: data.notes || null,
      items: data.items,
      equipments: data.equipments || null,
      overtimeRule: data.overtimeRule || null,
      logistics: data.logistics || null,
      paymentSchedule: data.paymentSchedule || null,
      priceSummary: data.priceSummary || null,
      total: data.total,
      statusHistory: data.statusHistory || [
        { status: data.status, timestamp: new Date().toISOString() },
      ],
      pdfHistory: data.pdfHistory || null,
    })

    const quote: Quote = {
      id: record.id,
      clientId: record.client,
      number: record.number,
      date: record.date,
      validityDays: record.validityDays || 15,
      status: record.status,
      eventName: record.eventName || '',
      eventLocation: record.eventLocation || '',
      eventStartDate: record.eventStartDate || '',
      eventStartTime: record.eventStartTime || '',
      eventEndDate: record.eventEndDate || '',
      eventEndTime: record.eventEndTime || '',
      notes: record.notes || '',
      items: record.items || [],
      equipments: record.equipments || [],
      overtimeRule: record.overtimeRule || undefined,
      logistics: record.logistics || undefined,
      paymentSchedule: record.paymentSchedule || [],
      priceSummary: record.priceSummary || undefined,
      total: Number(record.total) || 0,
      statusHistory: record.statusHistory || [],
      pdfHistory: record.pdfHistory || [],
    }

    // Auto-sync side effects
    await this.syncQuoteToAgendaAndFinances(quote)

    return quote
  },

  async updateQuote(id: string, data: Partial<Omit<Quote, 'id'>>): Promise<Quote> {
    const payload: any = { ...data }
    if (data.clientId) {
      payload.client = data.clientId
      delete payload.clientId
    }
    const record = await pb.collection('quotes').update(id, payload)
    const quote: Quote = {
      id: record.id,
      clientId: record.client,
      number: record.number,
      date: record.date,
      validityDays: record.validityDays || 15,
      status: record.status,
      eventName: record.eventName || '',
      eventLocation: record.eventLocation || '',
      eventStartDate: record.eventStartDate || '',
      eventStartTime: record.eventStartTime || '',
      eventEndDate: record.eventEndDate || '',
      eventEndTime: record.eventEndTime || '',
      notes: record.notes || '',
      items: record.items || [],
      equipments: record.equipments || [],
      overtimeRule: record.overtimeRule || undefined,
      logistics: record.logistics || undefined,
      paymentSchedule: record.paymentSchedule || [],
      priceSummary: record.priceSummary || undefined,
      total: Number(record.total) || 0,
      statusHistory: record.statusHistory || [],
      pdfHistory: record.pdfHistory || [],
    }

    // Auto-sync side effects
    await this.syncQuoteToAgendaAndFinances(quote)

    return quote
  },

  async deleteQuote(id: string): Promise<boolean> {
    // Clean up linked events and finances
    try {
      const linkedEvents = await pb.collection('events').getFullList({ filter: `quote = "${id}"` })
      for (const ev of linkedEvents) {
        await pb
          .collection('events')
          .delete(ev.id)
          .catch(() => {})
      }
      const linkedFinances = await pb
        .collection('finances')
        .getFullList({ filter: `quote = "${id}"` })
      for (const f of linkedFinances) {
        // Only delete unpaid ones if needed, or all since the quote itself is deleted
        if (f.status !== 'Pago') {
          await pb
            .collection('finances')
            .delete(f.id)
            .catch(() => {})
        }
      }
    } catch (e) {
      console.warn('Erro ao limpar vínculos do orçamento:', e)
    }

    await pb.collection('quotes').delete(id)
    return true
  },

  // -------------------------------------------------------------
  // SYNC QUOTE WITH AGENDA AND FINANCES (CRITICAL CORE LOGIC)
  // -------------------------------------------------------------
  async syncQuoteToAgendaAndFinances(quote: Quote): Promise<void> {
    const quoteId = quote.id
    const startDate = quote.eventStartDate || quote.date
    const status = quote.status

    // 1. Agenda sync for the event
    // Find existing event linked to this quote
    let existingEvent: any = null
    try {
      const found = await pb.collection('events').getFullList({
        filter: `quote = "${quoteId}"`,
      })
      if (found.length > 0) {
        existingEvent = found[0]
      }
    } catch {
      /* intentionally ignored */
    }

    const isVisibleInAgenda =
      status === 'Enviado' || status === 'Confirmado' || status === 'Aprovado'

    if (isVisibleInAgenda && startDate) {
      const eventStatus =
        status === 'Confirmado' || status === 'Aprovado' ? 'Confirmado' : 'Pré-reserva'
      const eventType =
        status === 'Confirmado' || status === 'Aprovado' ? 'event' : 'pre_reservation'
      const eventTitle = quote.eventName || `Orçamento ${quote.number}`
      const startTime = quote.eventStartTime || '09:00'
      const endTime = quote.eventEndTime || ''
      const endDate = quote.eventEndDate || startDate

      if (existingEvent) {
        await pb.collection('events').update(existingEvent.id, {
          client: quote.clientId,
          title: eventTitle,
          date: startDate,
          endDate: endDate,
          time: startTime,
          endTime: endTime,
          location: quote.eventLocation || '',
          value: quote.total,
          status: eventStatus,
          eventType: eventType,
          notes: quote.notes || '',
        })
      } else {
        await pb.collection('events').create({
          quote: quoteId,
          client: quote.clientId,
          title: eventTitle,
          date: startDate,
          endDate: endDate,
          time: startTime,
          endTime: endTime,
          location: quote.eventLocation || '',
          value: quote.total,
          status: eventStatus,
          eventType: eventType,
          notes: quote.notes || '',
        })
      }
    } else if (existingEvent) {
      // Draft, rejected, canceled, expired: update to Cancelado or remove
      if (status === 'Rascunho') {
        // Drafts without pre-reservation must not appear in agenda
        await pb
          .collection('events')
          .delete(existingEvent.id)
          .catch(() => {})
      } else {
        // Rejeitado/Cancelado/Expirado: mark as Cancelado to keep history
        await pb
          .collection('events')
          .update(existingEvent.id, {
            status: 'Cancelado',
          })
          .catch(() => {})
      }
    }

    // 2. Finance sync for installments
    // Check existing finances for this quote
    let existingFinances: any[] = []
    try {
      existingFinances = await pb.collection('finances').getFullList({
        filter: `quote = "${quoteId}"`,
      })
    } catch {
      /* intentionally ignored */
    }

    const schedule = quote.paymentSchedule || []

    if (
      schedule.length > 0 &&
      status !== 'Rascunho' &&
      status !== 'Cancelado' &&
      status !== 'Rejeitado'
    ) {
      const financeStatus =
        status === 'Confirmado' || status === 'Aprovado' ? 'Pendente' : 'Previsto'

      for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i]
        const existing = existingFinances.find(
          (f) =>
            f.paymentScheduleItemId === item.id ||
            (!f.paymentScheduleItemId && f.title.includes(`Parcela ${i + 1}`)),
        )

        const title = `${quote.number} - ${item.description || `Parcela ${i + 1}/${schedule.length}`}`
        const dueDate = item.dueDate || startDate

        if (existing) {
          // If already paid, DO NOT overwrite paid status or paid date
          if (existing.status !== 'Pago') {
            await pb
              .collection('finances')
              .update(existing.id, {
                client: quote.clientId,
                title,
                value: item.value,
                dueDate,
                paymentScheduleItemId: item.id,
                paymentMethod: item.method,
                status: financeStatus,
              })
              .catch(() => {})
          }
        } else {
          await pb
            .collection('finances')
            .create({
              quote: quoteId,
              client: quote.clientId,
              title,
              value: item.value,
              dueDate,
              paymentScheduleItemId: item.id,
              paymentMethod: item.method,
              status: financeStatus,
            })
            .catch(() => {})
        }
      }

      // Remove removed installments that aren't paid
      const scheduleIds = new Set(schedule.map((s) => s.id))
      for (const f of existingFinances) {
        if (
          f.paymentScheduleItemId &&
          !scheduleIds.has(f.paymentScheduleItemId) &&
          f.status !== 'Pago'
        ) {
          await pb
            .collection('finances')
            .delete(f.id)
            .catch(() => {})
        }
      }
    } else if (status === 'Rascunho' || status === 'Cancelado' || status === 'Rejeitado') {
      // For draft/cancelled quotes, non-paid finances should be removed or marked Cancelado
      for (const f of existingFinances) {
        if (f.status !== 'Pago') {
          if (status === 'Rascunho') {
            await pb
              .collection('finances')
              .delete(f.id)
              .catch(() => {})
          } else {
            await pb
              .collection('finances')
              .update(f.id, { status: 'Cancelado' })
              .catch(() => {})
          }
        }
      }
    }
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

  // LGPD Export
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

  // LGPD Deletion
  async deleteAccount(userId: string) {
    await pb.collection('users').delete(userId)
    pb.authStore.clear()
    return true
  },
}
