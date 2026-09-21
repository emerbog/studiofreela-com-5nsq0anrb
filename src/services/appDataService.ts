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
    const currentUserId = pb.authStore.model?.id || ''
    const record = await pb.collection('clients').create({
      user: currentUserId,
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
    const currentUserId = pb.authStore.model?.id || ''
    const record = await pb.collection('events').create({
      user: currentUserId,
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
    const currentUserId = pb.authStore.model?.id || ''
    if (!currentUserId) {
      throw new Error('Usuário não autenticado para criar registro financeiro.')
    }
    const record = await pb.collection('finances').create({
      user: currentUserId,
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
    const currentUserId = pb.authStore.model?.id
    if (currentUserId) {
      payload.user = currentUserId
    }
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
      syncStatus: r.syncStatus || undefined,
      lastSyncAt: r.lastSyncAt || undefined,
      syncError: r.syncError || undefined,
      statusHistory: r.statusHistory || [],
      pdfHistory: r.pdfHistory || [],
    }))
  },

  async createQuote(data: Omit<Quote, 'id' | 'number'> & { number?: string }): Promise<Quote> {
    const currentUserId = pb.authStore.model?.id || ''
    const existing = await pb.collection('quotes').getList(1, 1, { sort: '-created' })
    const seq = (existing.totalItems + 1).toString().padStart(3, '0')
    const number = data.number || `ORC-${seq}`

    // Regra: O salvamento de um orçamento completo com data e horário válidos
    // define automaticamente o status para Pré-reserva (Enviado) caso não seja Confirmado
    let initialStatus = data.status
    const hasValidSchedule = !!(
      (data.eventStartDate || data.date) &&
      data.eventName &&
      data.eventName.trim().length > 0
    )
    if (
      initialStatus !== 'Confirmado' &&
      initialStatus !== 'Aprovado' &&
      initialStatus !== 'Rascunho'
    ) {
      initialStatus = 'Enviado' // Pré-reserva
    } else if (
      initialStatus === 'Rascunho' &&
      hasValidSchedule &&
      data.items &&
      data.items.length > 0
    ) {
      // Orçamento com dados completos não fica preso em rascunho sem pré-reserva
      initialStatus = 'Enviado'
    }

    const record = await pb.collection('quotes').create({
      user: currentUserId,
      client: data.clientId,
      number,
      date: data.date,
      validityDays: data.validityDays || 15,
      status: initialStatus,
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
      syncStatus: 'pending',
      lastSyncAt: null,
      syncError: null,
      statusHistory: data.statusHistory || [
        { status: initialStatus, timestamp: new Date().toISOString() },
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
      syncStatus: 'pending',
      lastSyncAt: undefined,
      syncError: undefined,
      statusHistory: record.statusHistory || [],
      pdfHistory: record.pdfHistory || [],
    }

    // Auto-sync side effects com persistência do status de sincronização
    try {
      await this.syncQuoteToAgendaAndFinances(quote)
      await pb.collection('quotes').update(quote.id, {
        syncStatus: 'synced',
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      })
      quote.syncStatus = 'synced'
      quote.lastSyncAt = new Date().toISOString()
      quote.syncError = undefined
    } catch (syncErr: any) {
      const errMsg = syncErr?.message || String(syncErr)
      console.error('[StudioFreela] Erro na sincronização automática do orçamento:', syncErr)
      await pb
        .collection('quotes')
        .update(quote.id, {
          syncStatus: 'error',
          lastSyncAt: new Date().toISOString(),
          syncError: errMsg,
        })
        .catch(() => {})
      quote.syncStatus = 'error'
      quote.syncError = errMsg
      throw new Error(
        `Orçamento salvo, mas a sincronização com Agenda/Financeiro falhou: ${errMsg}`,
      )
    }

    return quote
  },

  async updateQuote(id: string, data: Partial<Omit<Quote, 'id'>>): Promise<Quote> {
    const payload: any = { ...data }
    const currentUserId = pb.authStore.model?.id
    if (currentUserId) {
      payload.user = currentUserId
    }
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
      syncStatus: record.syncStatus || undefined,
      lastSyncAt: record.lastSyncAt || undefined,
      syncError: record.syncError || undefined,
      statusHistory: record.statusHistory || [],
      pdfHistory: record.pdfHistory || [],
    }

    // Auto-sync side effects com rastreamento de falhas
    try {
      await this.syncQuoteToAgendaAndFinances(quote)
      await pb.collection('quotes').update(quote.id, {
        syncStatus: 'synced',
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      })
      quote.syncStatus = 'synced'
      quote.lastSyncAt = new Date().toISOString()
      quote.syncError = undefined
    } catch (syncErr: any) {
      const errMsg = syncErr?.message || String(syncErr)
      console.error('[StudioFreela] Erro ao sincronizar atualização do orçamento:', syncErr)
      await pb
        .collection('quotes')
        .update(quote.id, {
          syncStatus: 'error',
          lastSyncAt: new Date().toISOString(),
          syncError: errMsg,
        })
        .catch(() => {})
      quote.syncStatus = 'error'
      quote.syncError = errMsg
      throw new Error(
        `Orçamento salvo, mas a sincronização com Agenda/Financeiro falhou: ${errMsg}`,
      )
    }

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
  // Idempotente: chave única quoteId para eventos e quoteId + paymentScheduleItemId para parcelas
  // -------------------------------------------------------------
  async syncQuoteToAgendaAndFinances(quote: Quote): Promise<void> {
    const quoteId = quote.id
    const startDate = quote.eventStartDate || quote.date
    const status = quote.status
    const currentUserId = pb.authStore.model?.id || ''

    if (!currentUserId) {
      throw new Error('Sessão expirada. Faça login novamente para sincronizar.')
    }

    // 1. Agenda sync for the event
    // Find existing event(s) linked to this quoteId
    const foundEvents = await pb.collection('events').getFullList({
      filter: `quote = "${quoteId}"`,
      sort: 'created',
    })

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

      if (foundEvents.length > 0) {
        // Atualiza exatamente o primeiro evento
        const primaryEvent = foundEvents[0]
        await pb.collection('events').update(primaryEvent.id, {
          user: currentUserId,
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

        // Idempotência: caso existam duplicatas antigas acidentais, remove as excedentes
        if (foundEvents.length > 1) {
          for (let i = 1; i < foundEvents.length; i++) {
            await pb
              .collection('events')
              .delete(foundEvents[i].id)
              .catch((err) => {
                console.warn('[StudioFreela] Erro ao limpar evento duplicado excedente:', err)
              })
          }
        }
      } else {
        // Criação de evento novo vinculado ao quoteId
        await pb.collection('events').create({
          user: currentUserId,
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
    } else if (foundEvents.length > 0) {
      // Draft, rejected, canceled, expired: update to Cancelado or remove
      for (const ev of foundEvents) {
        if (status === 'Rascunho') {
          await pb
            .collection('events')
            .delete(ev.id)
            .catch((err) => {
              console.warn('[StudioFreela] Erro ao remover evento de rascunho:', err)
            })
        } else {
          await pb
            .collection('events')
            .update(ev.id, {
              user: currentUserId,
              status: 'Cancelado',
            })
            .catch((err) => {
              console.warn('[StudioFreela] Erro ao cancelar evento vinculado:', err)
            })
        }
      }
    }

    // 2. Finance sync for installments
    // Busca todas as parcelas já vinculadas a este quoteId
    const existingFinances = await pb.collection('finances').getFullList({
      filter: `quote = "${quoteId}"`,
      sort: 'dueDate',
    })

    const schedule = quote.paymentSchedule || []

    if (
      schedule.length > 0 &&
      status !== 'Rascunho' &&
      status !== 'Cancelado' &&
      status !== 'Rejeitado'
    ) {
      // Previsto quando pré-reserva (Enviado); Pendente quando Confirmado ou Aprovado
      const financeStatus =
        status === 'Confirmado' || status === 'Aprovado' ? 'Pendente' : 'Previsto'

      // Manter registro de quais ids foram associados para evitar duplicações
      const processedFinanceIds = new Set<string>()

      for (let i = 0; i < schedule.length; i++) {
        const item = schedule[i]
        const fallbackTitle = `Parcela ${i + 1}/${schedule.length}`
        const title = `${quote.number} - ${item.description || fallbackTitle}`
        const dueDate = item.dueDate || startDate

        // Localiza por quoteId + paymentScheduleItemId (ou por fallback de descrição se item legado)
        const matchedFinances = existingFinances.filter(
          (f) =>
            !processedFinanceIds.has(f.id) &&
            (f.paymentScheduleItemId === item.id ||
              (!f.paymentScheduleItemId && f.title.includes(`Parcela ${i + 1}`))),
        )

        const existing = matchedFinances[0]

        if (existing) {
          processedFinanceIds.add(existing.id)
          // Se já foi baixado (Pago), preserva status e data de quitação
          if (existing.status !== 'Pago') {
            await pb.collection('finances').update(existing.id, {
              user: currentUserId,
              client: quote.clientId,
              title,
              value: item.value,
              dueDate,
              paymentScheduleItemId: item.id,
              paymentMethod: item.method,
              status: financeStatus,
            })
          }

          // Se por ventura havia mais de uma duplicata para o mesmo itemId, remove as sobressalentes
          if (matchedFinances.length > 1) {
            for (let d = 1; d < matchedFinances.length; d++) {
              if (matchedFinances[d].status !== 'Pago') {
                await pb
                  .collection('finances')
                  .delete(matchedFinances[d].id)
                  .catch((err) => {
                    console.warn('[StudioFreela] Erro ao deletar parcela duplicada excedente:', err)
                  })
              }
            }
          }
        } else {
          // Cria nova parcela com o proprietário explícito autenticado
          const created = await pb.collection('finances').create({
            user: currentUserId,
            quote: quoteId,
            client: quote.clientId,
            title,
            value: item.value,
            dueDate,
            paymentScheduleItemId: item.id,
            paymentMethod: item.method,
            status: financeStatus,
          })
          processedFinanceIds.add(created.id)
        }
      }

      // Remover parcelas não pagas que foram excluídas do cronograma
      const scheduleIds = new Set(schedule.map((s) => s.id))
      for (const f of existingFinances) {
        if (
          !processedFinanceIds.has(f.id) &&
          f.paymentScheduleItemId &&
          !scheduleIds.has(f.paymentScheduleItemId) &&
          f.status !== 'Pago'
        ) {
          await pb
            .collection('finances')
            .delete(f.id)
            .catch((err) => {
              console.warn('[StudioFreela] Erro ao remover parcela excluída:', err)
            })
        }
      }
    } else if (status === 'Rascunho' || status === 'Cancelado' || status === 'Rejeitado') {
      for (const f of existingFinances) {
        if (f.status !== 'Pago') {
          if (status === 'Rascunho') {
            await pb
              .collection('finances')
              .delete(f.id)
              .catch((err) => {
                console.warn('[StudioFreela] Erro ao remover parcela de rascunho:', err)
              })
          } else {
            await pb
              .collection('finances')
              .update(f.id, {
                user: currentUserId,
                status: 'Cancelado',
              })
              .catch((err) => {
                console.warn('[StudioFreela] Erro ao marcar parcela como cancelada:', err)
              })
          }
        }
      }
    }
  },

  // Reprocessamento / Ressincronização explícita de um orçamento
  async resyncQuote(quoteId: string): Promise<Quote> {
    const quoteRecord = await pb.collection('quotes').getOne(quoteId)
    const quote: Quote = {
      id: quoteRecord.id,
      clientId: quoteRecord.client,
      number: quoteRecord.number,
      date: quoteRecord.date,
      validityDays: quoteRecord.validityDays || 15,
      status: quoteRecord.status,
      eventName: quoteRecord.eventName || '',
      eventLocation: quoteRecord.eventLocation || '',
      eventStartDate: quoteRecord.eventStartDate || '',
      eventStartTime: quoteRecord.eventStartTime || '',
      eventEndDate: quoteRecord.eventEndDate || '',
      eventEndTime: quoteRecord.eventEndTime || '',
      notes: quoteRecord.notes || '',
      items: quoteRecord.items || [],
      equipments: quoteRecord.equipments || [],
      overtimeRule: quoteRecord.overtimeRule || undefined,
      logistics: quoteRecord.logistics || undefined,
      paymentSchedule: quoteRecord.paymentSchedule || [],
      priceSummary: quoteRecord.priceSummary || undefined,
      total: Number(quoteRecord.total) || 0,
      syncStatus: quoteRecord.syncStatus || undefined,
      lastSyncAt: quoteRecord.lastSyncAt || undefined,
      syncError: quoteRecord.syncError || undefined,
      statusHistory: quoteRecord.statusHistory || [],
      pdfHistory: quoteRecord.pdfHistory || [],
    }

    try {
      await this.syncQuoteToAgendaAndFinances(quote)
      const now = new Date().toISOString()
      await pb.collection('quotes').update(quote.id, {
        syncStatus: 'synced',
        lastSyncAt: now,
        syncError: null,
      })
      quote.syncStatus = 'synced'
      quote.lastSyncAt = now
      quote.syncError = undefined
      return quote
    } catch (err: any) {
      const errMsg = err?.message || String(err)
      console.error('[StudioFreela] Falha no reprocessamento da sincronização:', err)
      const now = new Date().toISOString()
      await pb
        .collection('quotes')
        .update(quote.id, {
          syncStatus: 'error',
          lastSyncAt: now,
          syncError: errMsg,
        })
        .catch(() => {})
      quote.syncStatus = 'error'
      quote.lastSyncAt = now
      quote.syncError = errMsg
      throw new Error(
        `Orçamento salvo, mas a sincronização com Agenda/Financeiro falhou: ${errMsg}`,
      )
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
    const currentUserId = pb.authStore.model?.id || ''
    const existing = await pb.collection('contracts').getList(1, 1, { sort: '-created' })
    const seq = (existing.totalItems + 1).toString().padStart(3, '0')
    const number = data.number || `CTR-${seq}`

    const record = await pb.collection('contracts').create({
      user: currentUserId,
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
    const currentUserId = pb.authStore.model?.id
    if (currentUserId) {
      payload.user = currentUserId
    }
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
    const [
      clients,
      events,
      finances,
      quotes,
      contracts,
      profProfile,
      profExperiences,
      profEducation,
      profServices,
      profEquipment,
      profQualifications,
    ] = await Promise.all([
      pb.collection('clients').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('events').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('finances').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('quotes').getFullList({ filter: `user = "${userId}"` }),
      pb.collection('contracts').getFullList({ filter: `user = "${userId}"` }),
      pb
        .collection('professional_profiles')
        .getFullList({ filter: `user = "${userId}"` })
        .catch(() => []),
      pb
        .collection('professional_experiences')
        .getFullList({ filter: `user = "${userId}"` })
        .catch(() => []),
      pb
        .collection('professional_education')
        .getFullList({ filter: `user = "${userId}"` })
        .catch(() => []),
      pb
        .collection('professional_services')
        .getFullList({ filter: `user = "${userId}"` })
        .catch(() => []),
      pb
        .collection('professional_equipment')
        .getFullList({ filter: `user = "${userId}"` })
        .catch(() => []),
      pb
        .collection('professional_qualifications')
        .getFullList({ filter: `user = "${userId}"` })
        .catch(() => []),
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
      professionalProfile: profProfile,
      professionalExperiences: profExperiences,
      professionalEducation: profEducation,
      professionalServices: profServices,
      professionalEquipment: profEquipment,
      professionalQualifications: profQualifications,
    }
  },

  // LGPD Deletion
  async deleteAccount(userId: string) {
    await pb.collection('users').delete(userId)
    pb.authStore.clear()
    return true
  },
}
