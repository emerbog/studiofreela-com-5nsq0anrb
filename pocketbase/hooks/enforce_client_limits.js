// Server-side enforcement of tier limits for Studio Freela
// Keeps business rules secure on the backend (pb_hooks)

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

  // Pilot users have unlimited access
  if (!isPilotGuest) {
    const planTier = auth.getString('plan_tier') || 'economy'

    // Economy limit: up to 10 clients
    if (planTier === 'economy') {
      const totalClients = $app.countRecords('clients', $dbx.exp('user = {:u}', { u: auth.id }))
      if (totalClients >= 10) {
        throw new BadRequestError(
          'Limite do plano Economy atingido (máximo 10 clientes). Faça upgrade para o plano Intermediate ou Advanced para cadastros ilimitados.',
        )
      }
    }
  }

  e.next()
}, 'clients')
