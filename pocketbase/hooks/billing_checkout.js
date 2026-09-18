// Endpoint para criar cliente e assinatura no Asaas
// Gera link de pagamento/checkout URL para o freelancer assinar via Pix, Boleto ou Cartão
// NUNCA recebe nem armazena dados de cartão de crédito no Studio Freela

routerAdd(
  'POST',
  '/backend/v1/billing/create-checkout',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { error: 'Autenticação necessária' })
    }

    const userId = auth.id
    const userEmail = (auth.getString('email') || '').trim()
    const userName = (auth.getString('name') || '').trim() || 'Freelancer Studio Freela'
    const userPhone = (auth.getString('phone') || '').trim()
    const userAddress = (auth.getString('address') || '').trim()
    const isPilot = auth.getBool('pilot_access')

    // Parse body
    let reqBody = {}
    try {
      reqBody = e.requestInfo().body || {}
    } catch (_) {
      reqBody = {}
    }

    const planTier = (reqBody.plan || reqBody.plan_tier || '').toLowerCase().trim()
    const validPlans = {
      intermediate: { name: 'Plano Intermediate', price: 29.9 },
      advanced: { name: 'Plano Advanced', price: 49.9 },
      premium: { name: 'Plano Premium', price: 89.9 },
    }

    if (!validPlans[planTier]) {
      return e.json(400, {
        error:
          'Plano inválido para checkout recorrente. Planos disponíveis: intermediate, advanced, premium.',
      })
    }

    const planInfo = validPlans[planTier]
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

    // Degradação segura se chave não configurada
    if (!asaasKey) {
      return e.json(503, {
        error:
          'O gateway de pagamentos Asaas ainda não está configurado neste ambiente. A chave de integração não foi definida nos Secrets.',
        code: 'GATEWAY_NOT_CONFIGURED',
      })
    }

    const headers = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      access_token: asaasKey,
      'User-Agent': 'StudioFreela/1.0',
    }

    // 1. Obter ou Criar Cliente no Asaas
    let asaasCustomerId = auth.getString('asaas_customer_id') || ''

    if (!asaasCustomerId) {
      // Buscar se cliente já existe por email no Asaas
      try {
        const searchRes = $http.send({
          url: asaasUrl + '/customers?email=' + encodeURIComponent(userEmail),
          method: 'GET',
          headers: headers,
          timeout: 15,
        })

        if (
          searchRes.statusCode === 200 &&
          searchRes.json &&
          searchRes.json.data &&
          searchRes.json.data.length > 0
        ) {
          asaasCustomerId = searchRes.json.data[0].id
        }
      } catch (err) {
        // Falha silenciosa de busca prévia, criaremos
      }
    }

    // Se ainda não tiver ID, criar o cliente no Asaas
    if (!asaasCustomerId) {
      const customerPayload = {
        name: userName,
        email: userEmail,
        phone: userPhone || undefined,
        mobilePhone: userPhone || undefined,
        address: userAddress || undefined,
        externalReference: userId,
        notificationDisabled: false,
      }

      const cpfCnpj = reqBody.cpfCnpj || auth.getString('cpf_cnpj') || ''
      if (cpfCnpj) {
        customerPayload.cpfCnpj = cpfCnpj.replace(/\D/g, '')
      }

      try {
        const createCustRes = $http.send({
          url: asaasUrl + '/customers',
          method: 'POST',
          headers: headers,
          body: JSON.stringify(customerPayload),
          timeout: 15,
        })

        if (
          createCustRes.statusCode >= 200 &&
          createCustRes.statusCode < 300 &&
          createCustRes.json
        ) {
          asaasCustomerId = createCustRes.json.id
          auth.set('asaas_customer_id', asaasCustomerId)
          if (customerPayload.cpfCnpj) {
            auth.set('cpf_cnpj', customerPayload.cpfCnpj)
          }
          $app.save(auth)
        } else {
          const errDetail =
            createCustRes.json && createCustRes.json.errors
              ? createCustRes.json.errors.map((x) => x.description).join(', ')
              : 'Erro ao registrar cliente no gateway'
          return e.json(400, { error: errDetail })
        }
      } catch (err) {
        return e.json(502, {
          error:
            'Falha de comunicação com o gateway Asaas ao criar cliente. Tente novamente em instantes.',
        })
      }
    }

    // 2. Data de vencimento da primeira cobrança (hoje + 1 dia útil ou amanhã no padrão YYYY-MM-DD)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 1)
    const yyyy = dueDate.getFullYear()
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0')
    const dd = String(dueDate.getDate()).padStart(2, '0')
    const nextDueDateStr = yyyy + '-' + mm + '-' + dd

    // 3. Criar a Assinatura no Asaas
    // Permite pagamento por PIX, Boleto ou Cartão (billingType: UNDEFINED)
    const subscriptionPayload = {
      customer: asaasCustomerId,
      billingType: 'UNDEFINED',
      value: planInfo.price,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description: 'Studio Freela - ' + planInfo.name + ' (Cobrança Recorrente Mensal)',
      externalReference: userId + ':' + planTier,
      maxPayments: undefined,
    }

    let createdSubscription = null
    try {
      const subRes = $http.send({
        url: asaasUrl + '/subscriptions',
        method: 'POST',
        headers: headers,
        body: JSON.stringify(subscriptionPayload),
        timeout: 15,
      })

      if (subRes.statusCode >= 200 && subRes.statusCode < 300 && subRes.json) {
        createdSubscription = subRes.json
      } else {
        const errDetail =
          subRes.json && subRes.json.errors
            ? subRes.json.errors.map((x) => x.description).join(', ')
            : 'Erro ao criar assinatura no gateway'
        return e.json(400, { error: errDetail })
      }
    } catch (err) {
      return e.json(502, {
        error:
          'Falha de comunicação com o Asaas ao criar assinatura. Tente novamente em instantes.',
      })
    }

    // 4. Obter a primeira cobrança da assinatura para obter o checkoutUrl / invoiceUrl / bankSlipUrl
    const subId = createdSubscription.id
    let invoiceUrl = ''
    let bankSlipUrl = ''
    let paymentId = ''

    try {
      const paymentsRes = $http.send({
        url: asaasUrl + '/subscriptions/' + subId + '/payments',
        method: 'GET',
        headers: headers,
        timeout: 15,
      })

      if (
        paymentsRes.statusCode === 200 &&
        paymentsRes.json &&
        paymentsRes.json.data &&
        paymentsRes.json.data.length > 0
      ) {
        const firstPayment = paymentsRes.json.data[0]
        paymentId = firstPayment.id
        invoiceUrl = firstPayment.invoiceUrl || ''
        bankSlipUrl = firstPayment.bankSlipUrl || ''
      }
    } catch (_) {}

    // Fallback: se não tiver invoiceUrl de imediato, cria paymentLink recorrente ou link padrão do Asaas
    let checkoutUrl = invoiceUrl
    if (!checkoutUrl) {
      // Criar link de pagamento recorrente do Asaas
      try {
        const linkRes = $http.send({
          url: asaasUrl + '/paymentLinks',
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            name: 'Studio Freela - ' + planInfo.name,
            description: 'Assinatura mensal do ' + planInfo.name + ' com recursos ilimitados.',
            value: planInfo.price,
            billingType: 'UNDEFINED',
            chargeType: 'RECURRENT',
            subscriptionCycle: 'MONTHLY',
            externalReference: userId + ':' + planTier + ':' + subId,
          }),
          timeout: 15,
        })
        if (
          linkRes.statusCode >= 200 &&
          linkRes.statusCode < 300 &&
          linkRes.json &&
          linkRes.json.url
        ) {
          checkoutUrl = linkRes.json.url
        }
      } catch (_) {}
    }

    // 5. Registrar em `subscriptions` como 'incomplete' ou 'trialing' (NÃO ativa o plano até webhook confirmar!)
    let existingSub = null
    try {
      existingSub = $app.findFirstRecordByData('subscriptions', 'gateway_subscription_id', subId)
    } catch (_) {}

    const subCol = $app.findCollectionByNameOrId('subscriptions')
    const subRec = existingSub || new Record(subCol)
    subRec.set('user', userId)
    subRec.set('plan', planTier)
    // Estado inicial: 'incomplete' (aguardando primeiro pagamento)
    subRec.set('status', 'incomplete')
    subRec.set('price', planInfo.price)
    subRec.set('billing_interval', 'monthly')
    subRec.set('gateway_provider', 'asaas')
    subRec.set('gateway_customer_id', asaasCustomerId)
    subRec.set('gateway_subscription_id', subId)
    subRec.set('checkout_url', checkoutUrl)
    subRec.set('billing_type', 'UNDEFINED')
    if (nextDueDateStr) {
      subRec.set('next_due_date', nextDueDateStr)
    }
    subRec.set('metadata', {
      created_via: 'checkout_request',
      asaas_data: createdSubscription,
      first_payment_id: paymentId,
      checkout_url: checkoutUrl,
    })
    $app.save(subRec)

    // Se já tiver primeira cobrança, registrar em `payments` como pending
    if (paymentId) {
      try {
        const payCol = $app.findCollectionByNameOrId('payments')
        const payRec = new Record(payCol)
        payRec.set('user', userId)
        payRec.set('amount', planInfo.price)
        payRec.set('currency', 'BRL')
        payRec.set('status', 'pending')
        payRec.set('payment_method_type', 'other')
        payRec.set('gateway_provider', 'asaas')
        payRec.set('gateway_payment_id', paymentId)
        payRec.set('gateway_subscription_id', subId)
        payRec.set('invoice_url', invoiceUrl)
        payRec.set('bank_slip_url', bankSlipUrl)
        payRec.set('metadata', {
          subscription_id: subId,
          plan: planTier,
        })
        $app.save(payRec)
      } catch (_) {}
    }

    // Registrar no admin_audit_logs
    try {
      const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
      const auditRec = new Record(auditCol)
      auditRec.set('action', 'subscription_checkout_created')
      auditRec.set('admin_email', userEmail)
      auditRec.set('admin_user', userId)
      auditRec.set('target_type', 'subscription')
      auditRec.set('target_id', subId)
      auditRec.set('details', {
        plan: planTier,
        price: planInfo.price,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: subId,
        checkout_url: checkoutUrl,
      })
      $app.save(auditRec)
    } catch (_) {}

    return e.json(200, {
      success: true,
      subscriptionId: subId,
      customerId: asaasCustomerId,
      plan: planTier,
      price: planInfo.price,
      checkoutUrl: checkoutUrl,
      invoiceUrl: invoiceUrl,
      message: 'Assinatura criada com sucesso. Redirecionando para o checkout do Asaas.',
    })
  },
  $apis.requireAuth(),
)
