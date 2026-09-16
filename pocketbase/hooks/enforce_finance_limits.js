// Server-side owner and security enforcement for Finances in Studio Freela

onRecordCreateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Always force record owner to authenticated user
  e.record.set('user', auth.id)

  e.next()
}, 'finances')

onRecordUpdateRequest((e) => {
  const auth = e.auth
  if (!auth) {
    throw new BadRequestError('Operação requer autenticação.')
  }

  // Never allow transferring record to another user
  const originalUser = e.record.original().getString('user')
  if (originalUser && originalUser !== auth.id) {
    throw new ForbiddenError('Acesso negado: registro pertence a outro usuário.')
  }

  e.record.set('user', auth.id)

  e.next()
}, 'finances')
