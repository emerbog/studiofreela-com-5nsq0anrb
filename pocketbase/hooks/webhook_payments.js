// Webhook receiver for future payment gateways (Stripe, Asaas, etc.)
// Validates WEBHOOK_SECRET env var / header and creates audit log and updates records

routerAdd('POST', '/backend/v1/webhooks/payments', (e) => {
  const reqInfo = e.requestInfo() || {}
  const headers = reqInfo.headers || {}
  const signature = headers['x-webhook-secret'] || headers['stripe-signature'] || ''
  const configuredSecret = $os.getenv('PAYMENT_WEBHOOK_SECRET') || ''

  // Validate secret if configured
  if (configuredSecret && signature !== configuredSecret) {
    return e.json(401, { error: 'Assinatura inválida do webhook' })
  }

  let body = {}
  try {
    body = reqInfo.body || {}
  } catch (_) {
    body = {}
  }

  const eventType = body.event || body.type || 'payment.unknown'
  const data = body.data || {}
  const customerEmail = data.customer_email || data.email || ''

  // Log in admin_audit_logs
  try {
    const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
    const auditRec = new Record(auditCol)
    auditRec.set('action', 'webhook_payment_received')
    auditRec.set('admin_email', 'system@webhook')
    auditRec.set('target_type', 'webhook')
    auditRec.set('target_id', data.id || '')
    auditRec.set('details', {
      event: eventType,
      provider: data.provider || 'gateway',
      customer_email: customerEmail,
      amount: data.amount,
      status: data.status,
    })
    $app.save(auditRec)
  } catch (err) {}

  // Find user by email if provided
  let targetUser = null
  if (customerEmail) {
    try {
      targetUser = $app.findAuthRecordByEmail('_pb_users_auth_', customerEmail)
    } catch (_) {}
  }

  // Handle events
  if (eventType === 'payment.succeeded' || eventType === 'invoice.payment_succeeded') {
    if (targetUser) {
      try {
        const payCol = $app.findCollectionByNameOrId('payments')
        const payRec = new Record(payCol)
        payRec.set('user', targetUser.id)
        payRec.set('amount', data.amount || 0)
        payRec.set('currency', data.currency || 'BRL')
        payRec.set('status', 'succeeded')
        payRec.set('payment_method_type', data.payment_method || 'credit_card')
        payRec.set('gateway_provider', data.provider || 'gateway')
        payRec.set('gateway_payment_id', data.id || '')
        payRec.set('paid_at', new Date().toISOString())
        $app.save(payRec)

        // Upgrade user plan if specified
        if (data.plan_tier) {
          targetUser.set('plan_tier', data.plan_tier)
          $app.save(targetUser)
        }
      } catch (_) {}
    }
  } else if (eventType === 'payment.failed' || eventType === 'invoice.payment_failed') {
    if (targetUser) {
      try {
        const payCol = $app.findCollectionByNameOrId('payments')
        const payRec = new Record(payCol)
        payRec.set('user', targetUser.id)
        payRec.set('amount', data.amount || 0)
        payRec.set('currency', data.currency || 'BRL')
        payRec.set('status', 'failed')
        payRec.set('failure_reason', data.failure_reason || 'Cobrança recusada')
        payRec.set('gateway_provider', data.provider || 'gateway')
        $app.save(payRec)
      } catch (_) {}
    }
  } else if (eventType === 'subscription.canceled') {
    if (targetUser) {
      targetUser.set('plan_tier', 'economy')
      try {
        $app.save(targetUser)
      } catch (_) {}
    }
  }

  return e.json(200, {
    received: true,
    event: eventType,
    processed: true,
  })
})
