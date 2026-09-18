// Server-side enforcement of tier limits for Professional Services in Studio Freela
// Economy: max 5 services. Intermediate/Advanced: unlimited.

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

  // Pilot users have unlimited services
  if (!isPilotGuest) {
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
