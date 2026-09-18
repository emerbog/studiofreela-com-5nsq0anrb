migrate(
  (app) => {
    // 1. Tabela webhook_events para idempotência estrita de webhooks
    if (!app.hasTable('webhook_events')) {
      const webhookEvents = new Collection({
        name: 'webhook_events',
        type: 'base',
        listRule: null, // interno / admin / server-side
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'event_id', type: 'text', required: true },
          { name: 'gateway_provider', type: 'text', required: true },
          { name: 'event_type', type: 'text', required: true },
          { name: 'status', type: 'text', required: false },
          { name: 'payload', type: 'json', required: false },
          { name: 'processed_at', type: 'date', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_webhook_events_unique ON webhook_events (gateway_provider, event_id)',
          'CREATE INDEX idx_webhook_events_created ON webhook_events (created DESC)',
        ],
      })
      app.save(webhookEvents)
    }

    // 2. Adicionar campos em subscriptions se não existirem
    const subs = app.findCollectionByNameOrId('subscriptions')
    if (!subs.fields.getByName('checkout_url')) {
      subs.fields.add(new URLField({ name: 'checkout_url' }))
    }
    if (!subs.fields.getByName('billing_type')) {
      subs.fields.add(new TextField({ name: 'billing_type' }))
    }
    if (!subs.fields.getByName('next_due_date')) {
      subs.fields.add(new DateField({ name: 'next_due_date' }))
    }
    app.save(subs)

    // 3. Adicionar campos em payments se não existirem
    const payments = app.findCollectionByNameOrId('payments')
    if (!payments.fields.getByName('invoice_url')) {
      payments.fields.add(new URLField({ name: 'invoice_url' }))
    }
    if (!payments.fields.getByName('bank_slip_url')) {
      payments.fields.add(new URLField({ name: 'bank_slip_url' }))
    }
    if (!payments.fields.getByName('pix_qr_code')) {
      payments.fields.add(new TextField({ name: 'pix_qr_code' }))
    }
    if (!payments.fields.getByName('due_date')) {
      payments.fields.add(new DateField({ name: 'due_date' }))
    }
    app.save(payments)

    // 4. Adicionar asaas_customer_id em users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('asaas_customer_id')) {
      users.fields.add(new TextField({ name: 'asaas_customer_id' }))
    }
    if (!users.fields.getByName('cpf_cnpj')) {
      users.fields.add(new TextField({ name: 'cpf_cnpj' }))
    }
    app.save(users)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('webhook_events')
      app.delete(col)
    } catch (_) {}
  },
)
