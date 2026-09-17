// Endpoint for explicit client-side action logging (e.g. PDF generated, resume generated)
// Also logs admin audit actions (e.g. CSV exported)

routerAdd(
  'POST',
  '/backend/v1/usage/log-event',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { error: 'Autenticação necessária' })
    }

    const userId = auth.id
    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    const eventType = body.eventType || ''
    const details = body.details || {}
    const resourceId = body.resourceId || ''

    if (!eventType) {
      return e.json(400, { error: 'eventType é obrigatório' })
    }

    const reqInfo = e.requestInfo() || {}
    const remoteIP = reqInfo.remoteIP || ''
    const userAgent = (reqInfo.headers || {})['user-agent'] || ''

    // If this is an admin audit action, check if user is admin and write to admin_audit_logs
    if (eventType === 'csv_export_users' || eventType === 'admin_page_view') {
      try {
        const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
        const audit = new Record(auditCol)
        audit.set('admin_user', userId)
        audit.set('admin_email', auth.getString('email'))
        audit.set('action', eventType)
        audit.set('target_type', 'system')
        audit.set('details', details)
        audit.set('ip_address', remoteIP)
        audit.set('user_agent', userAgent)
        $app.save(audit)
      } catch (_) {}
    }

    try {
      const usageCol = $app.findCollectionByNameOrId('usage_events')
      const usage = new Record(usageCol)
      usage.set('user', userId)
      usage.set('event_type', eventType)
      usage.set('resource_id', resourceId)
      usage.set('details', details)
      usage.set('ip_address', remoteIP)
      usage.set('user_agent', userAgent)
      $app.save(usage)
    } catch (err) {
      return e.json(500, { error: 'Falha ao registrar evento' })
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
