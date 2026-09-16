migrate(
  (app) => {
    // 1. Expand clients
    const clients = app.findCollectionByNameOrId('clients')
    if (!clients.fields.getByName('tradeName')) {
      clients.fields.add(new TextField({ name: 'tradeName', required: false }))
    }
    if (!clients.fields.getByName('clientType')) {
      clients.fields.add(
        new SelectField({
          name: 'clientType',
          required: false,
          values: ['PF', 'PJ'],
          maxSelect: 1,
        }),
      )
    }
    if (!clients.fields.getByName('addressData')) {
      clients.fields.add(new JSONField({ name: 'addressData', required: false }))
    }
    if (!clients.fields.getByName('additionalContacts')) {
      clients.fields.add(new JSONField({ name: 'additionalContacts', required: false }))
    }
    if (!clients.fields.getByName('preferences')) {
      clients.fields.add(new TextField({ name: 'preferences', required: false }))
    }
    app.save(clients)

    const quotesCollectionId = app.findCollectionByNameOrId('quotes').id

    // 2. Expand events
    const events = app.findCollectionByNameOrId('events')
    if (!events.fields.getByName('quote')) {
      events.fields.add(
        new RelationField({
          name: 'quote',
          required: false,
          collectionId: quotesCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!events.fields.getByName('endDate')) {
      events.fields.add(new DateField({ name: 'endDate', required: false }))
    }
    if (!events.fields.getByName('endTime')) {
      events.fields.add(new TextField({ name: 'endTime', required: false }))
    }
    if (!events.fields.getByName('eventType')) {
      events.fields.add(
        new SelectField({
          name: 'eventType',
          required: false,
          values: ['event', 'pre_reservation', 'receivable'],
          maxSelect: 1,
        }),
      )
    }
    if (!events.fields.getByName('notes')) {
      events.fields.add(new TextField({ name: 'notes', required: false }))
    }

    // Update status values in events: allow 'Pré-reserva', 'Confirmado', 'Pendente', 'Concluído', 'Cancelado'
    const eventStatusField = events.fields.getByName('status')
    if (eventStatusField) {
      events.fields.removeByName('status')
      events.fields.add(
        new SelectField({
          name: 'status',
          required: true,
          values: ['Pré-reserva', 'Confirmado', 'Pendente', 'Concluído', 'Cancelado'],
          maxSelect: 1,
        }),
      )
    }
    events.addIndex('idx_events_quote', false, 'quote', '')
    app.save(events)

    // 3. Expand finances
    const finances = app.findCollectionByNameOrId('finances')
    if (!finances.fields.getByName('quote')) {
      finances.fields.add(
        new RelationField({
          name: 'quote',
          required: false,
          collectionId: quotesCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!finances.fields.getByName('paymentScheduleItemId')) {
      finances.fields.add(new TextField({ name: 'paymentScheduleItemId', required: false }))
    }
    if (!finances.fields.getByName('paymentMethod')) {
      finances.fields.add(new TextField({ name: 'paymentMethod', required: false }))
    }
    if (!finances.fields.getByName('paidAt')) {
      finances.fields.add(new DateField({ name: 'paidAt', required: false }))
    }

    // Update status values in finances to support 'Previsto', 'Pendente', 'Pago', 'Atrasado', 'Cancelado'
    const financeStatusField = finances.fields.getByName('status')
    if (financeStatusField) {
      finances.fields.removeByName('status')
      finances.fields.add(
        new SelectField({
          name: 'status',
          required: true,
          values: ['Previsto', 'Pendente', 'Pago', 'Atrasado', 'Cancelado'],
          maxSelect: 1,
        }),
      )
    }
    finances.addIndex('idx_finances_quote', false, 'quote', '')
    app.save(finances)

    // 4. Expand quotes
    const quotes = app.findCollectionByNameOrId('quotes')
    if (!quotes.fields.getByName('eventName')) {
      quotes.fields.add(new TextField({ name: 'eventName', required: false }))
    }
    if (!quotes.fields.getByName('eventLocation')) {
      quotes.fields.add(new TextField({ name: 'eventLocation', required: false }))
    }
    if (!quotes.fields.getByName('eventStartDate')) {
      quotes.fields.add(new DateField({ name: 'eventStartDate', required: false }))
    }
    if (!quotes.fields.getByName('eventStartTime')) {
      quotes.fields.add(new TextField({ name: 'eventStartTime', required: false }))
    }
    if (!quotes.fields.getByName('eventEndDate')) {
      quotes.fields.add(new DateField({ name: 'eventEndDate', required: false }))
    }
    if (!quotes.fields.getByName('eventEndTime')) {
      quotes.fields.add(new TextField({ name: 'eventEndTime', required: false }))
    }
    if (!quotes.fields.getByName('validityDays')) {
      quotes.fields.add(new NumberField({ name: 'validityDays', required: false, min: 1 }))
    }
    if (!quotes.fields.getByName('notes')) {
      quotes.fields.add(new TextField({ name: 'notes', required: false }))
    }
    if (!quotes.fields.getByName('overtimeRule')) {
      quotes.fields.add(new JSONField({ name: 'overtimeRule', required: false }))
    }
    if (!quotes.fields.getByName('equipments')) {
      quotes.fields.add(new JSONField({ name: 'equipments', required: false }))
    }
    if (!quotes.fields.getByName('logistics')) {
      quotes.fields.add(new JSONField({ name: 'logistics', required: false }))
    }
    if (!quotes.fields.getByName('paymentSchedule')) {
      quotes.fields.add(new JSONField({ name: 'paymentSchedule', required: false }))
    }
    if (!quotes.fields.getByName('priceSummary')) {
      quotes.fields.add(new JSONField({ name: 'priceSummary', required: false }))
    }
    if (!quotes.fields.getByName('pdfHistory')) {
      quotes.fields.add(new JSONField({ name: 'pdfHistory', required: false }))
    }
    if (!quotes.fields.getByName('statusHistory')) {
      quotes.fields.add(new JSONField({ name: 'statusHistory', required: false }))
    }

    // Update status values in quotes to: 'Rascunho', 'Enviado', 'Confirmado', 'Rejeitado', 'Cancelado', 'Expirado', 'Aprovado' (keep Aprovado for backwards compat)
    const quoteStatusField = quotes.fields.getByName('status')
    if (quoteStatusField) {
      quotes.fields.removeByName('status')
      quotes.fields.add(
        new SelectField({
          name: 'status',
          required: true,
          values: [
            'Rascunho',
            'Enviado',
            'Confirmado',
            'Rejeitado',
            'Cancelado',
            'Expirado',
            'Aprovado',
          ],
          maxSelect: 1,
        }),
      )
    }
    app.save(quotes)
  },
  (app) => {
    // Non-destructive down: keep data intact
  },
)
