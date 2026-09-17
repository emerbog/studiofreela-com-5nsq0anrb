// Automatic server-side usage_event logger on resource creation

onRecordAfterCreateSuccess(
  (e) => {
    const record = e.record
    const colName = record.collection().name
    const userId = record.getString('user')

    if (!userId) {
      e.next()
      return
    }

    let eventType = ''
    if (colName === 'clients') eventType = 'client_created'
    else if (colName === 'quotes') eventType = 'quote_created'
    else if (colName === 'contracts') eventType = 'contract_generated'
    else if (colName === 'events') eventType = 'event_created'
    else if (colName === 'finances') eventType = 'receivable_created'
    else if (colName === 'professional_equipment') eventType = 'equipment_created'
    else if (colName === 'professional_services') eventType = 'service_created'

    if (eventType) {
      try {
        const usageCol = $app.findCollectionByNameOrId('usage_events')
        const usage = new Record(usageCol)
        usage.set('user', userId)
        usage.set('event_type', eventType)
        usage.set('resource_id', record.id)
        $app.save(usage)
      } catch (err) {
        // Non-blocking for usage tracking
      }
    }

    e.next()
  },
  'clients',
  'quotes',
  'contracts',
  'events',
  'finances',
  'professional_equipment',
  'professional_services',
)
