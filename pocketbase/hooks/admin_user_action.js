// Admin server-side actions: block/unblock, reset password, change role, revoke sessions, delete account
// Enforces server-side authorization check!

routerAdd(
  'POST',
  '/backend/v1/studio-admin/user-action',
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

    // Must have role and role must NOT be freelancer
    if (!role || role === 'freelancer') {
      return e.json(403, { error: 'Acesso negado. Apenas administradores e equipe autorizada.' })
    }

    let body = {}
    try {
      body = e.requestInfo().body || {}
    } catch (_) {
      body = {}
    }

    const action = body.action || ''
    const targetUserId = body.userId || ''
    const details = body.details || {}

    if (!targetUserId || !action) {
      return e.json(400, { error: 'Parâmetros "action" e "userId" são obrigatórios.' })
    }

    let targetUser = null
    try {
      targetUser = $app.findCollectionByNameOrId('_pb_users_auth_')
      targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
    } catch (_) {
      return e.json(404, { error: 'Usuário não encontrado.' })
    }

    const targetEmail = targetUser.getString('email')

    // Prevent blocking or revoking the primary root admin
    if (targetEmail === 'emerbog@gmail.com' && (action === 'block' || action === 'delete')) {
      return e.json(400, {
        error: 'Não é permitido bloquear ou excluir o administrador principal.',
      })
    }

    const reqInfo = e.requestInfo() || {}
    const remoteIP = reqInfo.remoteIP || ''
    const userAgent = (reqInfo.headers || {})['user-agent'] || ''

    // Function to write audit log inline
    const logAudit = (act, dtls) => {
      try {
        const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
        const logRec = new Record(auditCol)
        logRec.set('admin_user', userId)
        logRec.set('admin_email', userEmail)
        logRec.set('action', act)
        logRec.set('target_type', 'user')
        logRec.set('target_id', targetUserId)
        logRec.set('details', dtls)
        logRec.set('ip_address', remoteIP)
        logRec.set('user_agent', userAgent)
        $app.save(logRec)
      } catch (auditErr) {}
    }

    if (action === 'block') {
      if (role !== 'admin' && role !== 'suporte') {
        return e.json(403, { error: 'Seu papel não tem permissão para bloquear usuários.' })
      }
      const reason = details.reason || 'Bloqueado por ação administrativa'
      targetUser.set('is_blocked', true)
      targetUser.set('blocked_reason', reason)
      $app.save(targetUser)
      logAudit('user_blocked', { reason: reason, target_email: targetEmail })
      return e.json(200, { success: true, message: 'Usuário bloqueado com sucesso.' })
    }

    if (action === 'unblock') {
      if (role !== 'admin' && role !== 'suporte') {
        return e.json(403, { error: 'Seu papel não tem permissão para desbloquear usuários.' })
      }
      targetUser.set('is_blocked', false)
      targetUser.set('blocked_reason', '')
      $app.save(targetUser)
      logAudit('user_unblocked', { target_email: targetEmail })
      return e.json(200, { success: true, message: 'Usuário desbloqueado com sucesso.' })
    }

    if (action === 'revoke_sessions') {
      if (role !== 'admin' && role !== 'suporte') {
        return e.json(403, { error: 'Seu papel não tem permissão para encerrar sessões.' })
      }
      // Changing tokenKey invalidates all active JWT tokens for this user!
      targetUser.refreshTokenKey()
      $app.save(targetUser)
      logAudit('user_sessions_revoked', { target_email: targetEmail })
      return e.json(200, {
        success: true,
        message: 'Todas as sessões ativas do usuário foram encerradas.',
      })
    }

    if (action === 'send_password_reset') {
      if (role !== 'admin' && role !== 'suporte') {
        return e.json(403, { error: 'Seu papel não tem permissão para reset de senha.' })
      }
      try {
        $app
          .newMailClient()
          .send(
            $app.settings().meta.senderAddress,
            targetEmail,
            'Recuperação de Acesso - Studio Freela',
            'Olá,\n\nUma solicitação de recuperação de senha foi iniciada pela administração do Studio Freela. Utilize a função "Esqueci minha senha" para criar uma nova senha.',
          )
      } catch (_) {}
      logAudit('password_reset_requested', { target_email: targetEmail })
      return e.json(200, {
        success: true,
        message: 'Solicitação de recuperação registrada para ' + targetEmail,
      })
    }

    if (action === 'change_role') {
      if (role !== 'admin') {
        return e.json(403, { error: 'Apenas Administradores podem alterar papéis de acesso.' })
      }
      const newRole = details.newRole || 'freelancer'
      const validRoles = ['admin', 'financeiro', 'suporte', 'analista', 'freelancer']
      if (validRoles.indexOf(newRole) === -1) {
        return e.json(400, { error: 'Papel inválido informado.' })
      }

      const adminRolesCol = $app.findCollectionByNameOrId('admin_roles')
      let roleRec = null
      try {
        roleRec = $app.findFirstRecordByData('admin_roles', 'user', targetUserId)
      } catch (_) {}

      if (roleRec) {
        const oldRole = roleRec.getString('role')
        roleRec.set('role', newRole)
        roleRec.set('notes', details.notes || 'Atualizado via painel administrativo')
        $app.save(roleRec)
        logAudit('role_changed', {
          target_email: targetEmail,
          old_role: oldRole,
          new_role: newRole,
        })
      } else {
        const newRec = new Record(adminRolesCol)
        newRec.set('user', targetUserId)
        newRec.set('role', newRole)
        newRec.set('notes', details.notes || 'Atribuído via painel administrativo')
        $app.save(newRec)
        logAudit('role_assigned', { target_email: targetEmail, new_role: newRole })
      }

      return e.json(200, { success: true, message: 'Papel atualizado para ' + newRole })
    }

    if (action === 'change_plan') {
      if (role !== 'admin' && role !== 'financeiro') {
        return e.json(403, { error: 'Apenas Administradores e Financeiro podem alterar planos.' })
      }
      const newPlan = details.newPlan || 'economy'
      const validPlans = ['economy', 'intermediate', 'advanced', 'premium']
      if (validPlans.indexOf(newPlan) === -1) {
        return e.json(400, { error: 'Plano inválido informado.' })
      }

      const oldPlan = targetUser.getString('plan_tier')
      targetUser.set('plan_tier', newPlan)
      $app.save(targetUser)

      logAudit('plan_changed', { target_email: targetEmail, old_plan: oldPlan, new_plan: newPlan })
      return e.json(200, { success: true, message: 'Plano atualizado para ' + newPlan })
    }

    if (action === 'toggle_pilot_access') {
      if (role !== 'admin' && role !== 'suporte') {
        return e.json(403, {
          error: 'Apenas Administradores e Suporte podem gerenciar acesso ao piloto.',
        })
      }
      const newPilotAccess = !!details.pilotAccess
      targetUser.set('pilot_access', newPilotAccess)
      $app.save(targetUser)

      logAudit('pilot_access_changed', {
        target_email: targetEmail,
        pilot_access: newPilotAccess,
      })
      return e.json(200, {
        success: true,
        message: newPilotAccess
          ? 'Acesso completo ao piloto ativado com sucesso.'
          : 'Acesso ao piloto desativado com sucesso.',
      })
    }

    if (action === 'delete_account') {
      if (role !== 'admin') {
        return e.json(403, {
          error: 'Apenas Administradores podem excluir contas de usuários (LGPD).',
        })
      }
      logAudit('account_deleted', { target_email: targetEmail, target_id: targetUserId })
      $app.delete(targetUser)
      return e.json(200, {
        success: true,
        message: 'Conta e dados do usuário excluídos conforme LGPD.',
      })
    }

    return e.json(400, { error: 'Ação desconhecida: ' + action })
  },
  $apis.requireAuth(),
)
