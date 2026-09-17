// Automatic server-side usage_event logger for status updates (e.g. quote confirmed, contract signed)

onRecordAfterUpdateSuccess(
  (e) => {
    const record = e.record
    const colName = record.collection().name
    const userId = record.getString('user')

    if (!userId) {
      e.next()
      return
    }

    const orig = record.original()
    let eventType = ''

    if (colName === 'quotes') {
      const newStatus = record.getString('status')
      const oldStatus = orig ? orig.getString('status') : ''
      if (
        (newStatus === 'Confirmado' || newStatus === 'Aprovado') &&
        oldStatus !== 'Confirmado' &&
        oldStatus !== 'Aprovado'
      ) {
        eventType = 'quote_confirmed'
      }
    } else if (colName === 'contracts') {
      const newStatus = record.getString('status')
      const oldStatus = orig ? orig.getString('status') : ''
      if (newStatus === 'Assinado' && oldStatus !== 'Assinado') {
        eventType = 'contract_signed'
      } else if (newStatus === 'Enviado' && oldStatus !== 'Enviado') {
        eventType = 'contract_sent'
      }
    }

    if (eventType) {
      try {
        const usageCol = $app.findCollectionByNameOrId('usage_events')
        const usage = new Record(usageCol)
        usage.set('user', userId)
        usage.set('event_type', eventType)
        usage.set('resource_id', record.id)
        $app.save(usage)
      } catch (err) {}
    }

    e.next()
  },
  'quotes',
  'contracts',
)
