// Server-side tier access enforcement for Contracts

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  const planTier = auth.getString('plan_tier') || 'economy'

  // Only advanced and premium can create contracts
  if (planTier !== 'advanced' && planTier !== 'premium') {
    throw new BadRequestError(
      'O gerador interativo de contratos com validade jurídica é exclusivo do plano Advanced. Faça upgrade para gerar contratos ilimitados.',
    )
  }

  e.next()
}, 'contracts')
