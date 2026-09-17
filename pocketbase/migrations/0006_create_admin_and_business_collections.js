migrate(
  (app) => {
    // 1. Add is_blocked and blocked_reason fields to users collection if not present
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('is_blocked')) {
      users.fields.add(new BoolField({ name: 'is_blocked' }))
    }
    if (!users.fields.getByName('blocked_reason')) {
      users.fields.add(new TextField({ name: 'blocked_reason' }))
    }
    if (!users.fields.getByName('last_login_at')) {
      users.fields.add(new DateField({ name: 'last_login_at' }))
    }
    app.save(users)

    // 2. Collection: admin_roles
    // Roles: admin (total), financeiro, suporte, analista, freelancer
    if (!app.hasTable('admin_roles')) {
      const adminRoles = new Collection({
        name: 'admin_roles',
        type: 'base',
        // Read: authenticated users can view their own role; server handles admin permissions
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: null, // superuser or server-side hook only
        updateRule: null, // superuser or server-side hook only
        deleteRule: null, // superuser or server-side hook only
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
            name: 'role',
            type: 'select',
            required: true,
            values: ['admin', 'financeiro', 'suporte', 'analista', 'freelancer'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_admin_roles_user ON admin_roles (user)'],
      })
      app.save(adminRoles)
    }

    // 3. Collection: admin_audit_logs
    if (!app.hasTable('admin_audit_logs')) {
      const auditLogs = new Collection({
        name: 'admin_audit_logs',
        type: 'base',
        listRule: null, // Server/Hook or verified admin hook only
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'admin_user',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'admin_email', type: 'email', required: false },
          { name: 'action', type: 'text', required: true },
          { name: 'target_type', type: 'text', required: false },
          { name: 'target_id', type: 'text', required: false },
          { name: 'details', type: 'json', required: false },
          { name: 'ip_address', type: 'text', required: false },
          { name: 'user_agent', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_admin_audit_action ON admin_audit_logs (action)',
          'CREATE INDEX idx_admin_audit_created ON admin_audit_logs (created DESC)',
        ],
      })
      app.save(auditLogs)
    }

    // 4. Collection: subscriptions
    if (!app.hasTable('subscriptions')) {
      const subscriptions = new Collection({
        name: 'subscriptions',
        type: 'base',
        listRule: "@request.auth.id != '' && (user = @request.auth.id)",
        viewRule: "@request.auth.id != '' && (user = @request.auth.id)",
        createRule: null, // Managed by server/webhook/admin
        updateRule: null,
        deleteRule: null,
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
            name: 'plan',
            type: 'select',
            required: true,
            values: ['economy', 'intermediate', 'advanced', 'premium'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['active', 'past_due', 'canceled', 'trialing', 'incomplete'],
            maxSelect: 1,
          },
          { name: 'price', type: 'number', required: false, min: 0 },
          {
            name: 'billing_interval',
            type: 'select',
            required: false,
            values: ['monthly', 'yearly'],
            maxSelect: 1,
          },
          { name: 'current_period_start', type: 'date', required: false },
          { name: 'current_period_end', type: 'date', required: false },
          { name: 'cancel_at_period_end', type: 'bool', required: false },
          { name: 'canceled_at', type: 'date', required: false },
          { name: 'trial_end', type: 'date', required: false },
          { name: 'gateway_provider', type: 'text', required: false },
          { name: 'gateway_customer_id', type: 'text', required: false },
          { name: 'gateway_subscription_id', type: 'text', required: false },
          { name: 'metadata', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_subscriptions_user ON subscriptions (user)',
          'CREATE INDEX idx_subscriptions_status ON subscriptions (status)',
        ],
      })
      app.save(subscriptions)
    }

    // 5. Collection: payments
    if (!app.hasTable('payments')) {
      const payments = new Collection({
        name: 'payments',
        type: 'base',
        listRule: "@request.auth.id != '' && (user = @request.auth.id)",
        viewRule: "@request.auth.id != '' && (user = @request.auth.id)",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'amount', type: 'number', required: true, min: 0 },
          { name: 'currency', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['succeeded', 'pending', 'failed', 'refunded'],
            maxSelect: 1,
          },
          {
            name: 'payment_method_type',
            type: 'select',
            required: false,
            values: ['pix', 'credit_card', 'boleto', 'other'],
            maxSelect: 1,
          },
          { name: 'gateway_provider', type: 'text', required: false },
          { name: 'gateway_payment_id', type: 'text', required: false },
          { name: 'gateway_subscription_id', type: 'text', required: false },
          { name: 'paid_at', type: 'date', required: false },
          { name: 'failure_reason', type: 'text', required: false },
          { name: 'metadata', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_payments_user ON payments (user)',
          'CREATE INDEX idx_payments_status ON payments (status)',
          'CREATE INDEX idx_payments_created ON payments (created DESC)',
        ],
      })
      app.save(payments)
    }

    // 6. Collection: usage_events
    if (!app.hasTable('usage_events')) {
      const usageEvents = new Collection({
        name: 'usage_events',
        type: 'base',
        listRule: "@request.auth.id != '' && user = @request.auth.id",
        viewRule: "@request.auth.id != '' && user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
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
            name: 'event_type',
            type: 'select',
            required: true,
            values: [
              'login',
              'client_created',
              'quote_created',
              'quote_confirmed',
              'pdf_generated',
              'event_created',
              'receivable_created',
              'contract_generated',
              'contract_sent',
              'contract_signed',
              'resume_generated',
              'equipment_created',
              'service_created',
              'page_view',
            ],
            maxSelect: 1,
          },
          { name: 'resource_id', type: 'text', required: false },
          { name: 'details', type: 'json', required: false },
          { name: 'ip_address', type: 'text', required: false },
          { name: 'user_agent', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_usage_user ON usage_events (user)',
          'CREATE INDEX idx_usage_type ON usage_events (event_type)',
          'CREATE INDEX idx_usage_created ON usage_events (created DESC)',
        ],
      })
      app.save(usageEvents)
    }

    // 7. Collection: support_tickets
    if (!app.hasTable('support_tickets')) {
      const supportTickets = new Collection({
        name: 'support_tickets',
        type: 'base',
        listRule: "@request.auth.id != '' && (user = @request.auth.id)",
        viewRule: "@request.auth.id != '' && (user = @request.auth.id)",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && (user = @request.auth.id)",
        deleteRule: null,
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'subject', type: 'text', required: true },
          { name: 'description', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['aberto', 'em_atendimento', 'resolvido', 'fechado'],
            maxSelect: 1,
          },
          {
            name: 'priority',
            type: 'select',
            required: false,
            values: ['baixa', 'media', 'alta', 'urgente'],
            maxSelect: 1,
          },
          {
            name: 'assigned_admin',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'responses', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_support_user ON support_tickets (user)',
          'CREATE INDEX idx_support_status ON support_tickets (status)',
          'CREATE INDEX idx_support_created ON support_tickets (created DESC)',
        ],
      })
      app.save(supportTickets)
    }

    // 8. Collection: notifications
    if (!app.hasTable('notifications')) {
      const notifications = new Collection({
        name: 'notifications',
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
          { name: 'title', type: 'text', required: true },
          { name: 'message', type: 'text', required: true },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: ['info', 'warning', 'success', 'payment', 'system'],
            maxSelect: 1,
          },
          { name: 'read', type: 'bool', required: false },
          { name: 'link', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_notifications_user ON notifications (user)'],
      })
      app.save(notifications)
    }

    // Seed default admin role for emerbog@gmail.com
    try {
      const defaultAdmin = app.findAuthRecordByEmail('_pb_users_auth_', 'emerbog@gmail.com')
      if (defaultAdmin) {
        const adminRolesCol = app.findCollectionByNameOrId('admin_roles')
        try {
          app.findFirstRecordByData('admin_roles', 'user', defaultAdmin.id)
        } catch (_) {
          const roleRecord = new Record(adminRolesCol)
          roleRecord.set('user', defaultAdmin.id)
          roleRecord.set('role', 'admin')
          roleRecord.set('notes', 'Administrador principal configurado na migração')
          app.save(roleRecord)
        }
      }
    } catch (_) {}
  },
  (app) => {
    const list = [
      'notifications',
      'support_tickets',
      'usage_events',
      'payments',
      'subscriptions',
      'admin_audit_logs',
      'admin_roles',
    ]
    for (const name of list) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
