// Endpoint para simulação de cenários de teste Asaas no ambiente Sandbox
// Permite testar pagamento aprovado, recusado, vencido, estorno, cancelamento, etc.
// Enforça autenticação (usuário comum simula sua própria assinatura; admin pode simular qualquer uma)

routerAdd(
  'POST',
  '/backend/v1/billing/simulate-scenario',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { error: 'Autenticação necessária' })
    }

    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    const scenario = body.scenario || 'payment_confirmed'
    const planTier = body.plan_tier || 'intermediate'
    const targetUserId = body.user_id || auth.id

    // Verificar se usuário tem acesso (apenas ele mesmo ou admin)
    const isAdmin = auth.getString('email') === 'emerbog@gmail.com'
    if (targetUserId !== auth.id && !isAdmin) {
      return e.json(403, { error: 'Acesso negado para simular em outro usuário' })
    }

    let targetUser = auth
    if (targetUserId !== auth.id) {
      try {
        targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.json(404, { error: 'Usuário não encontrado' })
      }
    }

    const simEventId = 'sim_' + scenario + '_' + Date.now()
    const simSubId = 'sub_sim_' + Date.now()
    const simPayId = 'pay_sim_' + Date.now()
    const asaasCustId = targetUser.getString('asaas_customer_id') || 'cus_sim_' + targetUser.id

    const prices = {
      economy: 0,
      intermediate: 29.9,
      advanced: 49.9,
      premium: 89.9,
    }
    const amount = prices[planTier] || 29.9

    // Montar payload simulado
    const webhookPayload = {
      id: simEventId,
      event: 'UNKNOWN',
      dateCreated: new Date().toISOString(),
      payment: {
        id: simPayId,
        customer: asaasCustId,
        subscription: simSubId,
        value: amount,
        netValue: amount - 1.5,
        billingType: body.billing_type || 'PIX',
        status: 'PENDING',
        externalReference: targetUser.id + ':' + planTier,
        invoiceUrl: 'https://sandbox.asaas.com/i/' + simPayId,
        bankSlipUrl: 'https://sandbox.asaas.com/b/pdf/' + simPayId,
      },
    }

    if (scenario === 'payment_confirmed' || scenario === 'payment_received') {
      webhookPayload.event = 'PAYMENT_RECEIVED'
      webhookPayload.payment.status = 'RECEIVED'
      webhookPayload.payment.paymentDate = new Date().toISOString()
    } else if (scenario === 'payment_overdue') {
      webhookPayload.event = 'PAYMENT_OVERDUE'
      webhookPayload.payment.status = 'OVERDUE'
    } else if (scenario === 'payment_refused') {
      webhookPayload.event = 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
      webhookPayload.payment.status = 'REFUSED'
    } else if (scenario === 'payment_refunded') {
      webhookPayload.event = 'PAYMENT_REFUNDED'
      webhookPayload.payment.status = 'REFUNDED'
    } else if (scenario === 'subscription_canceled') {
      webhookPayload.event = 'SUBSCRIPTION_DELETED'
      webhookPayload.subscription = simSubId
    }

    // Executar a lógica interna de processamento
    let outcome = 'simulated_' + scenario

    if (scenario === 'payment_confirmed' || scenario === 'payment_received') {
      // 1. Criar pagamento
      const payCol = $app.findCollectionByNameOrId('payments')
      const payRec = new Record(payCol)
      payRec.set('user', targetUser.id)
      payRec.set('amount', amount)
      payRec.set('currency', 'BRL')
      payRec.set('status', 'succeeded')
      payRec.set('payment_method_type', (body.billing_type || 'pix').toLowerCase())
      payRec.set('gateway_provider', 'asaas')
      payRec.set('gateway_payment_id', simPayId)
      payRec.set('gateway_subscription_id', simSubId)
      payRec.set('paid_at', new Date().toISOString())
      payRec.set('invoice_url', webhookPayload.payment.invoiceUrl)
      payRec.set('bank_slip_url', webhookPayload.payment.bankSlipUrl)
      payRec.set('metadata', { simulated: true, scenario: scenario })
      $app.save(payRec)

      // 2. Atualizar ou criar assinatura
      let subRec = null
      try {
        subRec = $app.findFirstRecordByData('subscriptions', 'user', targetUser.id)
      } catch (_) {}
      const subCol = $app.findCollectionByNameOrId('subscriptions')
      subRec = subRec || new Record(subCol)
      subRec.set('user', targetUser.id)
      subRec.set('plan', planTier)
      subRec.set('status', 'active')
      subRec.set('price', amount)
      subRec.set('billing_interval', 'monthly')
      subRec.set('current_period_start', new Date().toISOString())
      const nextEnd = new Date()
      nextEnd.setDate(nextEnd.getDate() + 30)
      subRec.set('current_period_end', nextEnd.toISOString())
      subRec.set('gateway_provider', 'asaas')
      subRec.set('gateway_customer_id', asaasCustId)
      subRec.set('gateway_subscription_id', simSubId)
      subRec.set('checkout_url', webhookPayload.payment.invoiceUrl)
      $app.save(subRec)

      // 3. Atualizar plano do usuário se não for piloto
      if (!targetUser.getBool('pilot_access')) {
        targetUser.set('plan_tier', planTier)
        $app.save(targetUser)
      }

      // Notificação
      try {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user', targetUser.id)
        notif.set('title', 'Assinatura Confirmada [Simulação Sandbox]')
        notif.set(
          'message',
          'Pagamento simulado de ' +
            planTier.toUpperCase() +
            ' aprovado com sucesso via Sandbox Asaas.',
        )
        notif.set('type', 'success')
        notif.set('read', false)
        notif.set('link', '/profile')
        $app.save(notif)
      } catch (_) {}
    } else if (scenario === 'payment_overdue') {
      try {
        const subRec = $app.findFirstRecordByData('subscriptions', 'user', targetUser.id)
        if (subRec) {
          subRec.set('status', 'past_due')
          $app.save(subRec)
        }
      } catch (_) {}
    } else if (scenario === 'subscription_canceled' || scenario === 'payment_refunded') {
      try {
        const subRec = $app.findFirstRecordByData('subscriptions', 'user', targetUser.id)
        if (subRec) {
          subRec.set('status', 'canceled')
          subRec.set('canceled_at', new Date().toISOString())
          $app.save(subRec)
        }
      } catch (_) {}

      if (!targetUser.getBool('pilot_access')) {
        targetUser.set('plan_tier', 'economy')
        $app.save(targetUser)
      }
    }

    // Gravar em webhook_events
    try {
      const evtCol = $app.findCollectionByNameOrId('webhook_events')
      const evtRec = new Record(evtCol)
      evtRec.set('event_id', simEventId)
      evtRec.set('gateway_provider', 'asaas_sandbox')
      evtRec.set('event_type', webhookPayload.event)
      evtRec.set('status', outcome)
      evtRec.set('processed_at', new Date().toISOString())
      evtRec.set('payload', webhookPayload)
      $app.save(evtRec)
    } catch (_) {}

    return e.json(200, {
      success: true,
      simulated: true,
      scenario: scenario,
      outcome: outcome,
      userId: targetUser.id,
      planTier: targetUser.getString('plan_tier'),
      pilotAccess: targetUser.getBool('pilot_access'),
      paymentId: simPayId,
      subscriptionId: simSubId,
      message: 'Cenário ' + scenario + ' simulado com sucesso no Sandbox.',
    })
  },
  $apis.requireAuth(),
)
