// Server-side tier access and owner enforcement for Quotes in Studio Freela

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Ensure record user matches authenticated user
  e.record.set('user', auth.id)

  // No beta do Studio Freela, a emissão e sincronização de orçamentos está liberada
  // para todas as contas ativas (inclusive economy), mantendo consistência com a interface.

  e.next()
}, 'quotes')

onRecordUpdateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Preserve and enforce authenticated user as owner
  e.record.set('user', auth.id)

  e.next()
}, 'quotes')
