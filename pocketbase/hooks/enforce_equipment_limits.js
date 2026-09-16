// Server-side enforcement of tier limits for Professional Equipment in Studio Freela
// Economy: max 5 equipment items. Intermediate/Advanced: unlimited.

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  const planTier = auth.getString('plan_tier') || 'economy'

  // Economy limit: up to 5 equipment items
  if (planTier === 'economy') {
    const totalEquipment = $app.countRecords(
      'professional_equipment',
      $dbx.exp('user = {:u}', { u: auth.id }),
    )
    if (totalEquipment >= 5) {
      throw new BadRequestError(
        'Limite do plano Economy atingido (máximo 5 equipamentos para locação). Faça upgrade para o plano Intermediate ou Advanced para cadastros ilimitados.',
      )
    }
  }

  e.next()
}, 'professional_equipment')

onRecordUpdateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }
  e.record.set('user', auth.id)
  e.next()
}, 'professional_equipment')
