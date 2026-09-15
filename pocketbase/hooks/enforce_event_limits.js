// Server-side enforcement of tier limits for Events in Studio Freela

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  const planTier = auth.getString('plan_tier') || 'economy'

  // Economy limit: up to 20 events
  if (planTier === 'economy') {
    const totalEvents = $app.countRecords('events', $dbx.exp('user = {:u}', { u: auth.id }))
    if (totalEvents >= 20) {
      throw new BadRequestError(
        'Limite do plano Economy atingido (máximo 20 eventos). Faça upgrade para o plano Intermediate ou Advanced para eventos ilimitados.',
      )
    }
  }

  e.next()
}, 'events')
