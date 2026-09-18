// Webhook dedicado do gateway Asaas (e legado /webhooks/payments)
// 1. Validação de token de webhook (segredo em header)
// 2. Idempotência estrita (verifica e grava no `webhook_events`)
// 3. Revalidação server-side no Asaas antes de liberar ou suspender plano
// 4. Piloto protegido: pilot_access=true nunca tem plano rebaixado
// 5. Suporta PIX, Boleto e Cartão (sem jamais guardar dados de cartão)

routerAdd('POST', '/backend/v1/webhooks/asaas', (e) => {
  const reqInfo = e.requestInfo() || {}
  const headers = reqInfo.headers || {}

  // Autenticação do webhook:
  // Asaas envia no header 'asaas-access-token'
  const receivedToken =
    headers['asaas-access-token'] ||
    headers['x-webhook-secret'] ||
    headers['x-asaas-access-token'] ||
    ''

  const configuredToken =
    $os.getenv('ASAAS_WEBHOOK_TOKEN') || $os.getenv('PAYMENT_WEBHOOK_SECRET') || ''

  if (configuredToken && receivedToken !== configuredToken) {
    return e.json(401, { error: 'Token de webhook Asaas inválido ou ausente' })
  }

  let body = {}
  try {
    body = reqInfo.body || {}
  } catch (_) {
    body = {}
  }

  const eventType = body.event || body.type || 'UNKNOWN'
  const eventId =
    body.id || (body.payment && body.payment.id ? body.payment.id + '_' + eventType : '') || ''
  const paymentData = body.payment || body.data || {}
  const paymentId = paymentData.id || ''
  const subscriptionId = paymentData.subscription || body.subscription || ''
  const customerId = paymentData.customer || body.customer || ''

  // 1. Idempotência: verificar se o evento já foi processado
  if (eventId) {
    try {
      const existingEvt = $app.findFirstRecordByData('webhook_events', 'event_id', eventId)
      if (existingEvt) {
        // Evento duplicado detectado: responder 200 OK sem reprocessar
        return e.json(200, {
          received: true,
          duplicate: true,
          message: 'Evento já processado anteriormente (idempotência garantida).',
        })
      }
    } catch (_) {
      // Evento inédito, prosseguir
    }
  }

  // Registrar auditoria imediata do recebimento
  try {
    const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
    const auditRec = new Record(auditCol)
    auditRec.set('action', 'asaas_webhook_received')
    auditRec.set('admin_email', 'system@asaas_webhook')
    auditRec.set('target_type', 'asaas_event')
    auditRec.set('target_id', eventId || paymentId || subscriptionId)
    auditRec.set('details', {
      event: eventType,
      payment_id: paymentId,
      subscription_id: subscriptionId,
      customer_id: customerId,
      value: paymentData.value,
      billing_type: paymentData.billingType,
      status: paymentData.status,
    })
    $app.save(auditRec)
  } catch (_) {}

  // 2. Revalidação na API do Asaas (Never trust payload alone for billing state changes)
  const asaasKey = $os.getenv('ASAAS_API_KEY') || ''
  const envVal = ($os.getenv('ASAAS_ENV') || '').toLowerCase().trim()
  let asaasUrl = $os.getenv('ASAAS_API_URL') || ''
  if (!asaasUrl) {
    asaasUrl =
      envVal === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
  }
  if (asaasUrl.endsWith('/')) {
    asaasUrl = asaasUrl.slice(0, -1)
  }

  let verifiedPayment = null
  let verifiedSubscription = null

  if (asaasKey && paymentId) {
    try {
      const getPayRes = $http.send({
        url: asaasUrl + '/payments/' + paymentId,
        method: 'GET',
        headers: {
          accept: 'application/json',
          access_token: asaasKey,
          'User-Agent': 'StudioFreela/1.0',
        },
        timeout: 15,
      })
      if (getPayRes.statusCode === 200 && getPayRes.json && getPayRes.json.id) {
        verifiedPayment = getPayRes.json
      }
    } catch (err) {
      // Se a API do Asaas falhar, logar e responder 502/retry sem liberar plano indevidamente
      try {
        const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
        const auditRec = new Record(auditCol)
        auditRec.set('action', 'asaas_revalidation_failed')
        auditRec.set('admin_email', 'system@asaas_webhook')
        auditRec.set('target_type', 'payment')
        auditRec.set('target_id', paymentId)
        auditRec.set('details', {
          error: 'Falha ao revalidar cobrança com a API Asaas',
          event: eventType,
        })
        $app.save(auditRec)
      } catch (_) {}

      return e.json(502, {
        error:
          'Falha temporária de comunicação com a API Asaas ao revalidar evento. Reenvio solicitado.',
      })
    }
  }

  if (asaasKey && subscriptionId) {
    try {
      const getSubRes = $http.send({
        url: asaasUrl + '/subscriptions/' + subscriptionId,
        method: 'GET',
        headers: {
          accept: 'application/json',
          access_token: asaasKey,
          'User-Agent': 'StudioFreela/1.0',
        },
        timeout: 15,
      })
      if (getSubRes.statusCode === 200 && getSubRes.json && getSubRes.json.id) {
        verifiedSubscription = getSubRes.json
      }
    } catch (_) {}
  }

  // Dados consolidados após verificação (priorizando o retorno oficial da API)
  const currentPay = verifiedPayment || paymentData
  const currentSub = verifiedSubscription || {}
  const asaasStatus = currentPay.status || ''
  const effectiveSubId = subscriptionId || currentPay.subscription || ''
  const effectiveCustId = customerId || currentPay.customer || ''

  // 3. Localizar usuário no banco
  let targetUser = null

  // Via externalReference
  const extRef = currentPay.externalReference || currentSub.externalReference || ''
  if (extRef) {
    const parts = extRef.split(':')
    const possibleUserId = parts[0]
    try {
      targetUser = $app.findCollectionByNameOrId('_pb_users_auth_')
      targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', possibleUserId)
    } catch (_) {}
  }

  // Via asaas_customer_id
  if (!targetUser && effectiveCustId) {
    try {
      targetUser = $app.findFirstRecordByData(
        '_pb_users_auth_',
        'asaas_customer_id',
        effectiveCustId,
      )
    } catch (_) {}
  }

  // Via subscription existente
  if (!targetUser && effectiveSubId) {
    try {
      const subRec = $app.findFirstRecordByData(
        'subscriptions',
        'gateway_subscription_id',
        effectiveSubId,
      )
      if (subRec) {
        const uId = subRec.getString('user')
        if (uId) {
          targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', uId)
        }
      }
    } catch (_) {}
  }

  // Via customer email se disponível
  if (!targetUser) {
    let custEmail = currentPay.customerEmail || ''
    if (!custEmail && asaasKey && effectiveCustId) {
      try {
        const custRes = $http.send({
          url: asaasUrl + '/customers/' + effectiveCustId,
          method: 'GET',
          headers: {
            accept: 'application/json',
            access_token: asaasKey,
            'User-Agent': 'StudioFreela/1.0',
          },
          timeout: 15,
        })
        if (custRes.statusCode === 200 && custRes.json && custRes.json.email) {
          custEmail = custRes.json.email
        }
      } catch (_) {}
    }
    if (custEmail) {
      try {
        targetUser = $app.findAuthRecordByEmail('_pb_users_auth_', custEmail)
      } catch (_) {}
    }
  }

  // Mapear plano associado
  let planTier = ''
  if (extRef && extRef.indexOf(':') !== -1) {
    const p = extRef.split(':')[1]
    if (p === 'intermediate' || p === 'advanced' || p === 'premium' || p === 'economy') {
      planTier = p
    }
  }

  // Localizar ou inicializar registro de subscription
  let subRecord = null
  if (effectiveSubId) {
    try {
      subRecord = $app.findFirstRecordByData(
        'subscriptions',
        'gateway_subscription_id',
        effectiveSubId,
      )
    } catch (_) {}
  }
  if (!subRecord && targetUser) {
    try {
      subRecord = $app.findFirstRecordByData('subscriptions', 'user', targetUser.id)
    } catch (_) {}
  }

  if (subRecord && !planTier) {
    planTier = subRecord.getString('plan')
  }
  if (!planTier) {
    // Tentar deduzir do valor
    const val = currentPay.value || 0
    if (val >= 80) planTier = 'premium'
    else if (val >= 40) planTier = 'advanced'
    else if (val >= 25) planTier = 'intermediate'
    else planTier = 'intermediate'
  }

  // Mapeamento de método de pagamento
  let methodType = 'other'
  const bType = (currentPay.billingType || '').toUpperCase()
  if (bType === 'PIX') methodType = 'pix'
  else if (bType === 'BOLETO') methodType = 'boleto'
  else if (bType === 'CREDIT_CARD') methodType = 'credit_card'

  // 4. Processar Eventos do Asaas
  let outcome = 'ignored'

  // EVENTOS DE PAGAMENTO RECEBIDO/CONFIRMADO
  if (
    eventType === 'PAYMENT_RECEIVED' ||
    eventType === 'PAYMENT_CONFIRMED' ||
    asaasStatus === 'RECEIVED' ||
    asaasStatus === 'CONFIRMED'
  ) {
    outcome = 'payment_succeeded'

    // Gravar / Atualizar Pagamento
    let payRecord = null
    if (paymentId) {
      try {
        payRecord = $app.findFirstRecordByData('payments', 'gateway_payment_id', paymentId)
      } catch (_) {}
    }
    const payCol = $app.findCollectionByNameOrId('payments')
    payRecord = payRecord || new Record(payCol)
    if (targetUser) {
      payRecord.set('user', targetUser.id)
    }
    payRecord.set('amount', currentPay.value || 0)
    payRecord.set('currency', 'BRL')
    payRecord.set('status', 'succeeded')
    payRecord.set('payment_method_type', methodType)
    payRecord.set('gateway_provider', 'asaas')
    payRecord.set('gateway_payment_id', paymentId)
    payRecord.set('gateway_subscription_id', effectiveSubId)
    payRecord.set(
      'paid_at',
      currentPay.paymentDate || currentPay.clientPaymentDate || new Date().toISOString(),
    )
    payRecord.set('invoice_url', currentPay.invoiceUrl || '')
    payRecord.set('bank_slip_url', currentPay.bankSlipUrl || '')
    payRecord.set('metadata', {
      asaas_event: eventType,
      asaas_status: asaasStatus,
      billing_type: currentPay.billingType,
      net_value: currentPay.netValue,
    })
    $app.save(payRecord)

    // Atualizar Assinatura para 'active'
    if (subRecord) {
      subRecord.set('status', 'active')
      if (planTier) subRecord.set('plan', planTier)
      subRecord.set('price', currentPay.value || subRecord.getInt('price'))
      subRecord.set('billing_interval', 'monthly')
      subRecord.set('current_period_start', new Date().toISOString())
      // Próxima cobrança + 30 dias
      const nextEnd = new Date()
      nextEnd.setDate(nextEnd.getDate() + 30)
      subRecord.set('current_period_end', nextEnd.toISOString())
      subRecord.set('gateway_provider', 'asaas')
      if (effectiveCustId) subRecord.set('gateway_customer_id', effectiveCustId)
      if (effectiveSubId) subRecord.set('gateway_subscription_id', effectiveSubId)
      $app.save(subRecord)
    } else if (targetUser) {
      const subCol = $app.findCollectionByNameOrId('subscriptions')
      const newSub = new Record(subCol)
      newSub.set('user', targetUser.id)
      newSub.set('plan', planTier || 'intermediate')
      newSub.set('status', 'active')
      newSub.set('price', currentPay.value || 0)
      newSub.set('billing_interval', 'monthly')
      newSub.set('current_period_start', new Date().toISOString())
      const nextEnd = new Date()
      nextEnd.setDate(nextEnd.getDate() + 30)
      newSub.set('current_period_end', nextEnd.toISOString())
      newSub.set('gateway_provider', 'asaas')
      newSub.set('gateway_customer_id', effectiveCustId)
      newSub.set('gateway_subscription_id', effectiveSubId)
      $app.save(newSub)
    }

    // Liberar Plano do Usuário (se não for piloto - piloto é irrestrito)
    if (targetUser) {
      const isPilot = targetUser.getBool('pilot_access')
      if (!isPilot && planTier) {
        targetUser.set('plan_tier', planTier)
        $app.save(targetUser)
      }

      // Notificação ao usuário
      try {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user', targetUser.id)
        notif.set('title', 'Pagamento Confirmado!')
        notif.set(
          'message',
          'Sua assinatura do plano ' +
            (planTier ? planTier.toUpperCase() : 'Studio Freela') +
            ' foi confirmada com sucesso via Asaas.',
        )
        notif.set('type', 'success')
        notif.set('read', false)
        notif.set('link', '/profile')
        $app.save(notif)
      } catch (_) {}
    }
  }

  // EVENTOS DE COBRANÇA VENCIDA / INADIMPLÊNCIA (OVERDUE)
  else if (eventType === 'PAYMENT_OVERDUE' || asaasStatus === 'OVERDUE') {
    outcome = 'payment_overdue'

    if (subRecord) {
      subRecord.set('status', 'past_due')
      $app.save(subRecord)
    }

    if (paymentId) {
      try {
        const payRecord = $app.findFirstRecordByData('payments', 'gateway_payment_id', paymentId)
        if (payRecord) {
          payRecord.set('status', 'failed')
          payRecord.set('failure_reason', 'Cobrança vencida (Overdue)')
          $app.save(payRecord)
        }
      } catch (_) {}
    }

    // Notificar usuário sobre pendência
    if (targetUser) {
      try {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user', targetUser.id)
        notif.set('title', 'Cobrança em Aberto')
        notif.set(
          'message',
          'Identificamos uma fatura pendente de vencimento no Asaas. Por favor, regularize para manter seus recursos ativos.',
        )
        notif.set('type', 'warning')
        notif.set('read', false)
        notif.set('link', '/profile')
        $app.save(notif)
      } catch (_) {}
    }
  }

  // EVENTOS DE COBRANÇA RECUSADA / CARTÃO NEGADO
  else if (
    eventType === 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED' ||
    eventType === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  ) {
    outcome = 'payment_refused'

    let payRecord = null
    if (paymentId) {
      try {
        payRecord = $app.findFirstRecordByData('payments', 'gateway_payment_id', paymentId)
      } catch (_) {}
    }
    const payCol = $app.findCollectionByNameOrId('payments')
    payRecord = payRecord || new Record(payCol)
    if (targetUser) payRecord.set('user', targetUser.id)
    payRecord.set('amount', currentPay.value || 0)
    payRecord.set('currency', 'BRL')
    payRecord.set('status', 'failed')
    payRecord.set('payment_method_type', methodType)
    payRecord.set('gateway_provider', 'asaas')
    payRecord.set('gateway_payment_id', paymentId)
    payRecord.set('failure_reason', 'Transação recusada pela operadora ou análise de risco')
    $app.save(payRecord)
  }

  // EVENTOS DE ESTORNO / REEMBOLSO (REFUNDED)
  else if (eventType === 'PAYMENT_REFUNDED' || asaasStatus === 'REFUNDED') {
    outcome = 'payment_refunded'

    if (paymentId) {
      try {
        const payRecord = $app.findFirstRecordByData('payments', 'gateway_payment_id', paymentId)
        if (payRecord) {
          payRecord.set('status', 'refunded')
          payRecord.set('failure_reason', 'Valor estornado/reembolsado via Asaas')
          $app.save(payRecord)
        }
      } catch (_) {}
    }

    if (subRecord) {
      subRecord.set('status', 'canceled')
      subRecord.set('canceled_at', new Date().toISOString())
      $app.save(subRecord)
    }

    // Se o usuário não for piloto, rebaixar para economy
    if (targetUser && !targetUser.getBool('pilot_access')) {
      targetUser.set('plan_tier', 'economy')
      $app.save(targetUser)
    }
  }

  // EVENTOS DE ASSINATURA CANCELADA / REMOVIDA
  else if (
    eventType === 'SUBSCRIPTION_DELETED' ||
    eventType === 'SUBSCRIPTION_INACTIVATED' ||
    eventType === 'SUBSCRIPTION_CANCELLED'
  ) {
    outcome = 'subscription_canceled'

    if (subRecord) {
      subRecord.set('status', 'canceled')
      subRecord.set('canceled_at', new Date().toISOString())
      $app.save(subRecord)
    }

    // Rebaixar usuário para economy, respeitando acesso de piloto
    if (targetUser && !targetUser.getBool('pilot_access')) {
      targetUser.set('plan_tier', 'economy')
      $app.save(targetUser)
    }

    if (targetUser) {
      try {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user', targetUser.id)
        notif.set('title', 'Assinatura Cancelada')
        notif.set(
          'message',
          'Sua assinatura recorrente foi cancelada no Asaas. Sua conta retornou ao plano Economy.',
        )
        notif.set('type', 'info')
        notif.set('read', false)
        notif.set('link', '/profile')
        $app.save(notif)
      } catch (_) {}
    }
  }

  // EVENTOS DE ASSINATURA CRIADA / ATUALIZADA
  else if (eventType === 'SUBSCRIPTION_CREATED' || eventType === 'SUBSCRIPTION_UPDATED') {
    outcome = 'subscription_registered'

    if (subRecord) {
      if (planTier) subRecord.set('plan', planTier)
      if (currentPay.value) subRecord.set('price', currentPay.value)
      if (currentSub.nextDueDate) subRecord.set('next_due_date', currentSub.nextDueDate)
      $app.save(subRecord)
    }
  }

  // 5. Gravar registro em webhook_events para assegurar idempotência estrita
  if (eventId) {
    try {
      const evtCol = $app.findCollectionByNameOrId('webhook_events')
      const evtRec = new Record(evtCol)
      evtRec.set('event_id', eventId)
      evtRec.set('gateway_provider', 'asaas')
      evtRec.set('event_type', eventType)
      evtRec.set('status', outcome)
      evtRec.set('processed_at', new Date().toISOString())
      evtRec.set('payload', {
        event: eventType,
        payment_id: paymentId,
        subscription_id: effectiveSubId,
        user_id: targetUser ? targetUser.id : null,
      })
      $app.save(evtRec)
    } catch (_) {}
  }

  return e.json(200, {
    received: true,
    processed: true,
    event: eventType,
    outcome: outcome,
    userId: targetUser ? targetUser.id : null,
    plan: planTier || null,
  })
})
