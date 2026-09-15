// Server-side tier access enforcement for Quotes

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  const planTier = auth.getString('plan_tier') || 'economy'

  // Economy cannot create quotes
  if (planTier === 'economy') {
    throw new BadRequestError(
      'A emissão de orçamentos está disponível a partir do plano Intermediate. Faça upgrade do seu plano para liberar orçamentos ilimitados.',
    )
  }

  e.next()
}, 'quotes')
