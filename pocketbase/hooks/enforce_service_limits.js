// Server-side enforcement of tier limits for Professional Services in Studio Freela
// Economy: max 5 services. Intermediate/Advanced: unlimited.

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  const planTier = auth.getString('plan_tier') || 'economy'

  // Economy limit: up to 5 services
  if (planTier === 'economy') {
    const totalServices = $app.countRecords(
      'professional_services',
      $dbx.exp('user = {:u}', { u: auth.id }),
    )
    if (totalServices >= 5) {
      throw new BadRequestError(
        'Limite do plano Economy atingido (máximo 5 serviços). Faça upgrade para o plano Intermediate ou Advanced para cadastrar serviços ilimitados.',
      )
    }
  }

  e.next()
}, 'professional_services')

onRecordUpdateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }
  e.record.set('user', auth.id)
  e.next()
}, 'professional_services')
