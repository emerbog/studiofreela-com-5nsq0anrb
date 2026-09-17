// Hook to block authentication if user is marked as is_blocked
// Also records last_login_at and records a usage_event ('login')

onRecordAuthRequest((e) => {
  const record = e.record
  if (!record) {
    e.next()
    return
  }

  const isBlocked = record.getBool('is_blocked')
  if (isBlocked) {
    const reason =
      record.getString('blocked_reason') ||
      'Conta temporariamente bloqueada por motivos de segurança.'
    throw new ForbiddenError('Acesso bloqueado: ' + reason)
  }

  // Update last_login_at
  try {
    record.set('last_login_at', new Date().toISOString())
    $app.save(record)
  } catch (err) {
    // Ignore error updating timestamp
  }

  // Record usage event for login
  try {
    const usageCol = $app.findCollectionByNameOrId('usage_events')
    const usage = new Record(usageCol)
    usage.set('user', record.id)
    usage.set('event_type', 'login')
    const reqInfo = e.requestInfo()
    if (reqInfo) {
      const headers = reqInfo.headers || {}
      usage.set('ip_address', reqInfo.remoteIP || '')
      usage.set('user_agent', headers['user-agent'] || '')
    }
    $app.save(usage)
  } catch (_) {}

  e.next()
}, 'users')
