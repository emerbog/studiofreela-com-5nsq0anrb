// Manage support tickets response & status updates by admin
// Enforces server-side authorization check!

routerAdd(
  'POST',
  '/backend/v1/studio-admin/support-action',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { error: 'Autenticação necessária' })
    }

    const userEmail = (auth.getString('email') || '').toLowerCase().trim()
    const userId = auth.id

    const adminEmailsEnv = $os.getenv('ADMIN_EMAILS') || ''
    const adminEmailsList = adminEmailsEnv
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    let role = ''
    if (userEmail === 'emerbog@gmail.com' || adminEmailsList.indexOf(userEmail) !== -1) {
      role = 'admin'
    } else {
      try {
        const roleRec = $app.findFirstRecordByData('admin_roles', 'user', userId)
        if (roleRec) {
          role = roleRec.getString('role')
        }
      } catch (_) {}
    }

    if (!role || role === 'freelancer') {
      return e.json(403, { error: 'Acesso negado. Apenas suporte e administradores.' })
    }

    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    const ticketId = body.ticketId || ''
    const action = body.action || ''
    const replyMessage = body.message || ''
    const newStatus = body.status || ''

    if (!ticketId) {
      return e.json(400, { error: 'ID do ticket não informado' })
    }

    let ticket = null
    try {
      ticket = $app.findFirstRecordByData('support_tickets', 'id', ticketId)
    } catch (_) {
      return e.json(404, { error: 'Ticket não encontrado' })
    }

    if (action === 'reply') {
      if (!replyMessage) {
        return e.json(400, { error: 'Mensagem de resposta vazia' })
      }
      const currentResponses = ticket.get('responses') || []
      currentResponses.push({
        sender_id: userId,
        sender_email: userEmail,
        sender_type: 'admin',
        message: replyMessage,
        created_at: new Date().toISOString(),
      })
      ticket.set('responses', currentResponses)
      if (newStatus) {
        ticket.set('status', newStatus)
      } else {
        ticket.set('status', 'em_atendimento')
      }
      ticket.set('assigned_admin', userId)
      $app.save(ticket)

      // Notify user
      try {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(notifCol)
        notif.set('user', ticket.getString('user'))
        notif.set('title', 'Nova resposta no suporte')
        notif.set(
          'message',
          'A equipe Studio Freela respondeu ao seu chamado: "' + ticket.getString('subject') + '"',
        )
        notif.set('type', 'info')
        notif.set('read', false)
        $app.save(notif)
      } catch (_) {}

      return e.json(200, { success: true, message: 'Resposta enviada com sucesso' })
    }

    if (action === 'update_status') {
      if (!newStatus) {
        return e.json(400, { error: 'Novo status obrigatório' })
      }
      ticket.set('status', newStatus)
      $app.save(ticket)
      return e.json(200, { success: true, message: 'Status do chamado atualizado' })
    }

    return e.json(400, { error: 'Ação não reconhecida' })
  },
  $apis.requireAuth(),
)
