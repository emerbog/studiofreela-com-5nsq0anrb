// Admin-only data query endpoint for management
// Returns users, aggregates, audit logs, usage events, support tickets
// Enforces server-side authorization check!

routerAdd(
  'GET',
  '/backend/v1/studio-admin/overview-data',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { error: 'Autenticação necessária' })
    }

    const userEmail = (auth.getString('email') || '').toLowerCase().trim()
    const userId = auth.id

    const adminEmailsEnv = $os.getenv('ADMIN_EMAILS') || ''
    const adminEmailsList = adminEmailsEnv
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    let role = ''
    if (userEmail === 'emerbog@gmail.com' || adminEmailsList.indexOf(userEmail) !== -1) {
      role = 'admin'
    } else {
      try {
        const roleRec = $app.findFirstRecordByData('admin_roles', 'user', userId)
        if (roleRec) {
          role = roleRec.getString('role')
        }
      } catch (_) {}
    }

    if (!role || role === 'freelancer') {
      return e.json(403, { error: 'Acesso negado. Apenas administradores e equipe autorizada.' })
    }

    // 1. Fetch counts
    const totalUsers = $app.countRecords('_pb_users_auth_')
    const totalClients = $app.countRecords('clients')
    const totalEvents = $app.countRecords('events')
    const totalFinances = $app.countRecords('finances')
    const totalQuotes = $app.countRecords('quotes')
    const totalContracts = $app.countRecords('contracts')
    const totalEquipments = $app.countRecords('professional_equipment')
    const totalServices = $app.countRecords('professional_services')
    const totalProfiles = $app.countRecords('professional_profiles')
    const totalSubscriptions = $app.countRecords('subscriptions')
    const totalPayments = $app.countRecords('payments')
    const totalTickets = $app.countRecords('support_tickets')

    // Confirmed quotes count
    let confirmedQuotes = 0
    try {
      confirmedQuotes = $app.countRecords(
        'quotes',
        $dbx.exp("status = 'Confirmado' || status = 'Aprovado'"),
      )
    } catch (_) {}

    // Active / Paid finances
    let paidFinancesValue = 0
    try {
      const paidRecords = $app.findRecordsByFilter(
        'finances',
        "status = 'Pago'",
        '-created',
        100,
        0,
      )
      for (let i = 0; i < paidRecords.length; i++) {
        paidFinancesValue += paidRecords[i].getInt('value')
      }
    } catch (_) {}

    // Users list (clean, no passwords or private security hashes)
    const usersList = []
    const rawUsers = $app.findRecordsByFilter('_pb_users_auth_', '', '-created', 100, 0)
    for (let i = 0; i < rawUsers.length; i++) {
      const u = rawUsers[i]
      const uId = u.id

      // Counts per user
      const uClients = $app.countRecords('clients', $dbx.exp('user = {:u}', { u: uId }))
      const uQuotes = $app.countRecords('quotes', $dbx.exp('user = {:u}', { u: uId }))
      const uContracts = $app.countRecords('contracts', $dbx.exp('user = {:u}', { u: uId }))
      const uEvents = $app.countRecords('events', $dbx.exp('user = {:u}', { u: uId }))
      const uFinances = $app.countRecords('finances', $dbx.exp('user = {:u}', { u: uId }))

      let userRole = 'freelancer'
      try {
        const r = $app.findFirstRecordByData('admin_roles', 'user', uId)
        if (r) userRole = r.getString('role')
      } catch (_) {}

      usersList.push({
        id: uId,
        name: u.getString('name') || 'Sem Nome',
        email: u.getString('email'),
        phone: u.getString('phone'),
        address: u.getString('address'),
        profession: u.getString('profession'),
        plan_tier: u.getString('plan_tier') || 'economy',
        pilot_access: u.getBool('pilot_access'),
        is_blocked: u.getBool('is_blocked'),
        blocked_reason: u.getString('blocked_reason'),
        last_login_at: u.getString('last_login_at'),
        created: u.getString('created'),
        updated: u.getString('updated'),
        role: userRole,
        counts: {
          clients: uClients,
          quotes: uQuotes,
          contracts: uContracts,
          events: uEvents,
          finances: uFinances,
        },
      })
    }

    // Audit logs (latest 50)
    const auditLogs = []
    try {
      const rawLogs = $app.findRecordsByFilter('admin_audit_logs', '', '-created', 50, 0)
      for (let i = 0; i < rawLogs.length; i++) {
        const l = rawLogs[i]
        auditLogs.push({
          id: l.id,
          admin_user: l.getString('admin_user'),
          admin_email: l.getString('admin_email'),
          action: l.getString('action'),
          target_type: l.getString('target_type'),
          target_id: l.getString('target_id'),
          details: l.get('details'),
          ip_address: l.getString('ip_address'),
          created: l.getString('created'),
        })
      }
    } catch (_) {}

    // Usage events (latest 50)
    const usageEvents = []
    try {
      const rawEvents = $app.findRecordsByFilter('usage_events', '', '-created', 50, 0)
      for (let i = 0; i < rawEvents.length; i++) {
        const ev = rawEvents[i]
        usageEvents.push({
          id: ev.id,
          user: ev.getString('user'),
          event_type: ev.getString('event_type'),
          resource_id: ev.getString('resource_id'),
          details: ev.get('details'),
          ip_address: ev.getString('ip_address'),
          created: ev.getString('created'),
        })
      }
    } catch (_) {}

    // Subscriptions & Payments
    const subscriptionsList = []
    try {
      const rawSubs = $app.findRecordsByFilter('subscriptions', '', '-created', 100, 0)
      for (let i = 0; i < rawSubs.length; i++) {
        const s = rawSubs[i]
        subscriptionsList.push({
          id: s.id,
          user: s.getString('user'),
          plan: s.getString('plan'),
          status: s.getString('status'),
          price: s.getInt('price'),
          billing_interval: s.getString('billing_interval'),
          current_period_start: s.getString('current_period_start'),
          current_period_end: s.getString('current_period_end'),
          cancel_at_period_end: s.getBool('cancel_at_period_end'),
          canceled_at: s.getString('canceled_at'),
          trial_end: s.getString('trial_end'),
          gateway_provider: s.getString('gateway_provider'),
          gateway_customer_id: s.getString('gateway_customer_id'),
          gateway_subscription_id: s.getString('gateway_subscription_id'),
          checkout_url: s.getString('checkout_url'),
          billing_type: s.getString('billing_type'),
          next_due_date: s.getString('next_due_date'),
          created: s.getString('created'),
        })
      }
    } catch (_) {}

    const paymentsList = []
    try {
      const rawPays = $app.findRecordsByFilter('payments', '', '-created', 100, 0)
      for (let i = 0; i < rawPays.length; i++) {
        const p = rawPays[i]
        paymentsList.push({
          id: p.id,
          user: p.getString('user'),
          amount: p.getInt('amount'),
          currency: p.getString('currency') || 'BRL',
          status: p.getString('status'),
          payment_method_type: p.getString('payment_method_type'),
          gateway_provider: p.getString('gateway_provider'),
          gateway_payment_id: p.getString('gateway_payment_id'),
          gateway_subscription_id: p.getString('gateway_subscription_id'),
          invoice_url: p.getString('invoice_url'),
          bank_slip_url: p.getString('bank_slip_url'),
          paid_at: p.getString('paid_at'),
          due_date: p.getString('due_date'),
          failure_reason: p.getString('failure_reason'),
          created: p.getString('created'),
        })
      }
    } catch (_) {}

    // Support tickets
    const ticketsList = []
    try {
      const rawTickets = $app.findRecordsByFilter('support_tickets', '', '-created', 50, 0)
      for (let i = 0; i < rawTickets.length; i++) {
        const t = rawTickets[i]
        ticketsList.push({
          id: t.id,
          user: t.getString('user'),
          subject: t.getString('subject'),
          description: t.getString('description'),
          status: t.getString('status'),
          priority: t.getString('priority'),
          assigned_admin: t.getString('assigned_admin'),
          responses: t.get('responses') || [],
          created: t.getString('created'),
          updated: t.getString('updated'),
        })
      }
    } catch (_) {}

    return e.json(200, {
      userRole: role,
      counts: {
        totalUsers: totalUsers,
        totalClients: totalClients,
        totalEvents: totalEvents,
        totalFinances: totalFinances,
        totalQuotes: totalQuotes,
        confirmedQuotes: confirmedQuotes,
        totalContracts: totalContracts,
        totalEquipments: totalEquipments,
        totalServices: totalServices,
        totalProfiles: totalProfiles,
        totalSubscriptions: totalSubscriptions,
        totalPayments: totalPayments,
        totalTickets: totalTickets,
        paidFinancesValue: paidFinancesValue,
      },
      users: usersList,
      auditLogs: auditLogs,
      usageEvents: usageEvents,
      subscriptions: subscriptionsList,
      payments: paymentsList,
      supportTickets: ticketsList,
    })
  },
  $apis.requireAuth(),
)
