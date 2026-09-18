// Webhook genérico de pagamentos (compatibilidade e fallback para Asaas/Stripe)
// Encaminha eventos do Asaas de forma transparente com validação, idempotência e revalidação

routerAdd('POST', '/backend/v1/webhooks/payments', (e) => {
  const reqInfo = e.requestInfo() || {}
  const headers = reqInfo.headers || {}

  const asaasToken =
    headers['asaas-access-token'] ||
    headers['x-asaas-access-token'] ||
    headers['x-webhook-secret'] ||
    headers['stripe-signature'] ||
    ''

  const configuredSecret =
    $os.getenv('ASAAS_WEBHOOK_TOKEN') || $os.getenv('PAYMENT_WEBHOOK_SECRET') || ''

  if (configuredSecret && asaasToken !== configuredSecret) {
    return e.json(401, { error: 'Assinatura inválida do webhook' })
  }

  let body = {}
  try {
    body = reqInfo.body || {}
  } catch (_) {
    body = {}
  }

  // Se o payload for padrão Asaas (tem body.event como PAYMENT_*, SUBSCRIPTION_* ou tem payment/subscription)
  // Processar com a lógica Asaas completa
  const eventType = body.event || body.type || 'payment.unknown'
  const eventId =
    body.id || (body.payment && body.payment.id ? body.payment.id + '_' + eventType : '') || ''

  // Idempotência
  if (eventId) {
    try {
      const existingEvt = $app.findFirstRecordByData('webhook_events', 'event_id', eventId)
      if (existingEvt) {
        return e.json(200, {
          received: true,
          duplicate: true,
          message: 'Evento já processado anteriormente.',
        })
      }
    } catch (_) {}
  }

  const paymentData = body.payment || body.data || {}
  const paymentId = paymentData.id || ''
  const subscriptionId = paymentData.subscription || body.subscription || ''
  const customerId = paymentData.customer || body.customer || ''

  // Revalidação na API Asaas se houver chave e for evento do Asaas
  const asaasKey = $os.getenv('ASAAS_API_KEY') || ''
  const envVal = ($os.getenv('ASAAS_ENV') || '').toLowerCase().trim()
  let asaasUrl = $os.getenv('ASAAS_API_URL') || ''
  if (!asaasUrl) {
    asaasUrl =
      envVal === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
  }
  if (asaasUrl.endsWith('/')) asaasUrl = asaasUrl.slice(0, -1)

  let verifiedPayment = null
  if (asaasKey && paymentId) {
    try {
      const vRes = $http.send({
        url: asaasUrl + '/payments/' + paymentId,
        method: 'GET',
        headers: {
          accept: 'application/json',
          access_token: asaasKey,
          'User-Agent': 'StudioFreela/1.0',
        },
        timeout: 15,
      })
      if (vRes.statusCode === 200 && vRes.json && vRes.json.id) {
        verifiedPayment = vRes.json
      }
    } catch (_) {}
  }

  const currentPay = verifiedPayment || paymentData
  const asaasStatus = currentPay.status || ''

  // Localizar usuário
  let targetUser = null
  const extRef = currentPay.externalReference || ''
  if (extRef) {
    const parts = extRef.split(':')
    try {
      targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', parts[0])
    } catch (_) {}
  }

  if (!targetUser && customerId) {
    try {
      targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'asaas_customer_id', customerId)
    } catch (_) {}
  }

  const customerEmail = currentPay.customer_email || currentPay.email || ''
  if (!targetUser && customerEmail) {
    try {
      targetUser = $app.findAuthRecordByEmail('_pb_users_auth_', customerEmail)
    } catch (_) {}
  }

  // Plano
  let planTier = ''
  if (extRef && extRef.indexOf(':') !== -1) {
    planTier = extRef.split(':')[1]
  }

  // Método
  let methodType = 'other'
  const bType = (currentPay.billingType || currentPay.payment_method || '').toUpperCase()
  if (bType === 'PIX') methodType = 'pix'
  else if (bType === 'BOLETO') methodType = 'boleto'
  else if (bType === 'CREDIT_CARD') methodType = 'credit_card'

  let outcome = 'processed'

  // Pagamento recebido / confirmado
  if (
    eventType === 'PAYMENT_RECEIVED' ||
    eventType === 'PAYMENT_CONFIRMED' ||
    eventType === 'payment.succeeded' ||
    eventType === 'invoice.payment_succeeded' ||
    asaasStatus === 'RECEIVED' ||
    asaasStatus === 'CONFIRMED'
  ) {
    outcome = 'payment_succeeded'

    // Registrar pagamento
    let payRecord = null
    if (paymentId) {
      try {
        payRecord = $app.findFirstRecordByData('payments', 'gateway_payment_id', paymentId)
      } catch (_) {}
    }
    const payCol = $app.findCollectionByNameOrId('payments')
    payRecord = payRecord || new Record(payCol)
    if (targetUser) payRecord.set('user', targetUser.id)
    payRecord.set('amount', currentPay.value || currentPay.amount || 0)
    payRecord.set('currency', currentPay.currency || 'BRL')
    payRecord.set('status', 'succeeded')
    payRecord.set('payment_method_type', methodType)
    payRecord.set('gateway_provider', currentPay.provider || 'asaas')
    payRecord.set('gateway_payment_id', paymentId)
    payRecord.set('gateway_subscription_id', subscriptionId)
    payRecord.set('paid_at', new Date().toISOString())
    if (currentPay.invoiceUrl) payRecord.set('invoice_url', currentPay.invoiceUrl)
    if (currentPay.bankSlipUrl) payRecord.set('bank_slip_url', currentPay.bankSlipUrl)
    $app.save(payRecord)

    // Atualizar assinatura
    let subRecord = null
    if (subscriptionId) {
      try {
        subRecord = $app.findFirstRecordByData(
          'subscriptions',
          'gateway_subscription_id',
          subscriptionId,
        )
      } catch (_) {}
    }
    if (!subRecord && targetUser) {
      try {
        subRecord = $app.findFirstRecordByData('subscriptions', 'user', targetUser.id)
      } catch (_) {}
    }

    if (subRecord) {
      subRecord.set('status', 'active')
      if (planTier) subRecord.set('plan', planTier)
      subRecord.set('current_period_start', new Date().toISOString())
      const nextEnd = new Date()
      nextEnd.setDate(nextEnd.getDate() + 30)
      subRecord.set('current_period_end', nextEnd.toISOString())
      $app.save(subRecord)
    }

    // Liberar plano respeitando pilot_access
    if (targetUser) {
      const isPilot = targetUser.getBool('pilot_access')
      if (!isPilot && planTier) {
        targetUser.set('plan_tier', planTier)
        $app.save(targetUser)
      }
    }
  } else if (eventType === 'PAYMENT_OVERDUE' || asaasStatus === 'OVERDUE') {
    outcome = 'payment_overdue'
    let subRecord = null
    if (subscriptionId) {
      try {
        subRecord = $app.findFirstRecordByData(
          'subscriptions',
          'gateway_subscription_id',
          subscriptionId,
        )
      } catch (_) {}
    }
    if (subRecord) {
      subRecord.set('status', 'past_due')
      $app.save(subRecord)
    }
  } else if (eventType === 'SUBSCRIPTION_DELETED' || eventType === 'subscription.canceled') {
    outcome = 'subscription_canceled'
    if (targetUser && !targetUser.getBool('pilot_access')) {
      targetUser.set('plan_tier', 'economy')
      $app.save(targetUser)
    }
  }

  // Salvar no webhook_events para idempotência
  if (eventId) {
    try {
      const evtCol = $app.findCollectionByNameOrId('webhook_events')
      const evtRec = new Record(evtCol)
      evtRec.set('event_id', eventId)
      evtRec.set('gateway_provider', currentPay.provider || 'asaas')
      evtRec.set('event_type', eventType)
      evtRec.set('status', outcome)
      evtRec.set('processed_at', new Date().toISOString())
      $app.save(evtRec)
    } catch (_) {}
  }

  return e.json(200, {
    received: true,
    processed: true,
    event: eventType,
    outcome: outcome,
  })
})
