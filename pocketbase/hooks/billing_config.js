// Endpoint para obter configurações públicas de cobrança (status de integração, sandbox, planos)
// Não expõe secrets!

routerAdd(
  'GET',
  '/backend/v1/billing/config',
  (e) => {
    const asaasKey = $os.getenv('ASAAS_API_KEY') || ''
    const envVal = ($os.getenv('ASAAS_ENV') || '').toLowerCase().trim()
    let rawUrl = $os.getenv('ASAAS_API_URL') || ''
    if (!rawUrl) {
      rawUrl =
        envVal === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
    }
    const isSandbox = envVal === 'production' ? false : rawUrl.indexOf('sandbox') !== -1

    return e.json(200, {
      configured: Boolean(asaasKey && asaasKey.trim().length > 0),
      environment: isSandbox ? 'sandbox' : 'production',
      plans: [
        {
          id: 'economy',
          name: 'Economy',
          price: 0,
          currency: 'BRL',
          billingInterval: 'monthly',
          features: [
            'Agenda de eventos (até 20 eventos)',
            'Base de clientes (até 10 clientes)',
            'Contas a receber e financeiro básico',
            'Orçamentos com itens e taxas',
            'Suporte padrão por e-mail',
          ],
        },
        {
          id: 'intermediate',
          name: 'Intermediate',
          price: 29.9,
          currency: 'BRL',
          billingInterval: 'monthly',
          badge: 'Mais Popular',
          features: [
            'Agenda de eventos ilimitada',
            'Base de clientes ilimitada',
            'Emissão de orçamentos completos em PDF',
            'Controle financeiro avançado e parcelas',
            'Suporte prioritário',
          ],
        },
        {
          id: 'advanced',
          name: 'Advanced',
          price: 49.9,
          currency: 'BRL',
          billingInterval: 'monthly',
          badge: 'Completo',
          features: [
            'Tudo do Intermediate incluso',
            'Gerador interativo de contratos com validade jurídica',
            'Exportação e impressão direta de contratos',
            'Modelos jurídicos LGPD, confidencialidade e foro',
            'Suporte VIP 24/7',
          ],
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 89.9,
          currency: 'BRL',
          billingInterval: 'monthly',
          badge: 'Enterprise',
          features: [
            'Tudo do Advanced incluso',
            'Múltiplos usuários e operadores',
            'Auditoria comercial completa',
            'Atendimento consultivo e onboarding assistido',
          ],
        },
      ],
    })
  },
  $apis.requireAuth(),
)
