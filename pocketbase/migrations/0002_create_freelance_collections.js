migrate(
  (app) => {
    // 1. Clients collection
    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'email', type: 'email', required: false },
        { name: 'phone', type: 'text', required: false },
        { name: 'document', type: 'text', required: false },
        { name: 'notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_clients_user ON clients (user)'],
    })
    app.save(clients)

    const clientsCollectionId = app.findCollectionByNameOrId('clients').id

    // 2. Events collection
    const events = new Collection({
      name: 'events',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsCollectionId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'time', type: 'text', required: false },
        { name: 'location', type: 'text', required: false },
        { name: 'value', type: 'number', required: false, min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Confirmado', 'Pendente', 'Concluído'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_events_user ON events (user)',
        'CREATE INDEX idx_events_client ON events (client)',
      ],
    })
    app.save(events)

    const eventsCollectionId = app.findCollectionByNameOrId('events').id

    // 3. Finances (Receivables) collection
    const finances = new Collection({
      name: 'finances',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'client',
          type: 'relation',
          required: false,
          collectionId: clientsCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'event',
          type: 'relation',
          required: false,
          collectionId: eventsCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'value', type: 'number', required: true, min: 0 },
        { name: 'dueDate', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pago', 'Pendente', 'Atrasado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_finances_user ON finances (user)'],
    })
    app.save(finances)

    // 4. Quotes collection
    const quotes = new Collection({
      name: 'quotes',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsCollectionId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'number', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'items', type: 'json', required: true },
        { name: 'total', type: 'number', required: true, min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Enviado', 'Aprovado', 'Rejeitado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_quotes_user ON quotes (user)'],
    })
    app.save(quotes)

    const quotesCollectionId = app.findCollectionByNameOrId('quotes').id

    // 5. Contracts collection
    const contracts = new Collection({
      name: 'contracts',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'quote',
          type: 'relation',
          required: false,
          collectionId: quotesCollectionId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'number', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        { name: 'content', type: 'text', required: false },
        { name: 'formData', type: 'json', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Rascunho', 'Enviado', 'Assinado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contracts_user ON contracts (user)'],
    })
    app.save(contracts)
  },
  (app) => {
    const list = ['contracts', 'quotes', 'finances', 'events', 'clients']
    for (const name of list) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
