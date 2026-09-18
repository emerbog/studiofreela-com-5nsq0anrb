// Server-side enforcement of tier limits for Events in Studio Freela

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  const isPilot = auth.getBool('pilot_access')
  const authEmail = (auth.getString('email') || '').toLowerCase().trim()
  const pilotEmailsEnv = ($os.getenv('PILOT_EMAILS') || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const isPilotGuest = isPilot || pilotEmailsEnv.indexOf(authEmail) !== -1

  // Pilot users have unlimited events
  if (!isPilotGuest) {
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
  }

  e.next()
}, 'events')
