// Server-side tier access enforcement for Contracts

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

  // Pilot users have full access to interactive contracts
  if (!isPilotGuest) {
    const planTier = auth.getString('plan_tier') || 'economy'

    // Only advanced and premium can create contracts
    if (planTier !== 'advanced' && planTier !== 'premium') {
      throw new BadRequestError(
        'O gerador interativo de contratos com validade jurídica é exclusivo do plano Advanced. Faça upgrade para gerar contratos ilimitados.',
      )
    }
  }

  e.next()
}, 'contracts')
