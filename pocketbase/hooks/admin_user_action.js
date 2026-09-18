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

    if (action === 'send_welcome_email') {
      if (role !== 'admin' && role !== 'suporte') {
        return e.json(403, {
          error: 'Seu papel não tem permissão para enviar e-mails de boas-vindas.',
        })
      }

      const rawName = (targetUser.getString('name') || '').trim()
      const firstName = rawName ? rawName.split(' ')[0] : 'Freelancer'

      let siteUrl = $os.getenv('SITE_URL') || 'https://studiofreela.com'
      if (siteUrl.endsWith('/')) siteUrl = siteUrl.slice(0, -1)
      const appUrl = siteUrl + '/dashboard'

      const fromName = 'Studio Freela'
      const fromEmail = $os.getenv('SMTP_FROM') || 'studiofreela@protonmail.com'
      const replyTo = 'studiofreela@protonmail.com'
      const subject = 'Bem-vindo ao Studio Freela — seu acesso completo está pronto'

      const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #161b22; border-radius: 12px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 32px 36px 24px; text-align: center; border-bottom: 1px solid #21262d;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding-right: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid #B08D57; background: #1c2128; display: inline-block; text-align: center; line-height: 36px; color: #B08D57; font-weight: bold; font-family: Georgia, serif; font-size: 16px;">SF</div>
                  </td>
                  <td style="text-align: left;">
                    <span style="font-family: Georgia, 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #f0f6fc; letter-spacing: -0.5px;">Studio Freela</span>
                    <span style="display: block; font-size: 10px; color: #B08D57; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Gestão Freelance</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 24px;">
              <h1 style="margin: 0 0 16px; font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #ffffff; line-height: 1.3;">
                Olá, ${firstName}.
              </h1>
              <p style="margin: 0 0 18px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                Seu acesso ao <strong>Studio Freela</strong> está pronto. Criamos a plataforma pensando na rotina real de quem trabalha por conta própria: organização impecável, orçamentos que fecham negócios e controle financeiro sem ruído.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; border-radius: 8px; border: 1px solid #30363d; margin: 24px 0 28px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #B08D57; font-weight: 700;">
                      O que você já pode começar a fazer hoje:
                    </p>
                    <ul style="margin: 0; padding-left: 18px; color: #e2e8f0; font-size: 13px; line-height: 1.8;">
                      <li><strong style="color: #ffffff;">Agenda & Eventos:</strong> organize seus compromissos e pré-reservas em calendário intuitivo;</li>
                      <li><strong style="color: #ffffff;">Clientes & Contatos:</strong> histórico unificado de clientes, telefones e preferências;</li>
                      <li><strong style="color: #ffffff;">Propostas em PDF:</strong> emita orçamentos elegantes prontos para assinar via GOV.BR;</li>
                      <li><strong style="color: #ffffff;">Controle Financeiro:</strong> acompanhe entradas previstas, pendentes e recebidas;</li>
                      <li><strong style="color: #ffffff;">Contratos & Currículo:</strong> modelos estruturados de contrato e página profissional com link compartilhável.</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #B08D57; color: #0d1117; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 6px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(176,141,87,0.35);">
                      Acessar Meu Painel
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5;">
                Link direto: <a href="${appUrl}" style="color: #B08D57; text-decoration: underline;">${appUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 36px 32px; background-color: #0f141c; border-top: 1px solid #21262d; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #94a3b8;">
                Precisa de ajuda ou tem alguma dúvida? Responda diretamente este e-mail ou escreva para:
              </p>
              <p style="margin: 0 0 16px; font-size: 13px;">
                <a href="mailto:${replyTo}" style="color: #B08D57; font-weight: 600; text-decoration: none;">
                  ${replyTo}
                </a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                Studio Freela • Gestão freelance com a sobriedade que seu trabalho merece.<br>
                Este é um e-mail transacional de boas-vindas referente ao seu cadastro.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

      const textBody =
        `Olá, ${firstName}!\n\n` +
        `Seu acesso ao Studio Freela está pronto.\n\n` +
        `O que você já consegue fazer no seu painel:\n` +
        `- Agenda & Eventos: organize datas e pré-reservas;\n` +
        `- Clientes: contatos e histórico centralizados;\n` +
        `- Orçamentos em PDF: propostas prontas para validação;\n` +
        `- Financeiro: receitas previstas e recebidas;\n` +
        `- Contratos e Currículo Profissional com link próprio.\n\n` +
        `Acesse agora: ${appUrl}\n\n` +
        `Se precisar de qualquer ajuda, basta responder a este e-mail ou escrever para ${replyTo}.\n\n` +
        `Studio Freela • studiofreela.com`

      let emailSent = false
      let deliveryMethod = 'none'
      let deliveryError = ''

      // 1. Resend
      const resendApiKey = $os.getenv('RESEND_API_KEY') || ''
      if (!emailSent && resendApiKey) {
        try {
          const res = $http.send({
            url: 'https://api.resend.com/emails',
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + resendApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromName + ' <' + fromEmail + '>',
              to: [targetEmail],
              reply_to: replyTo,
              subject: subject,
              html: htmlBody,
              text: textBody,
            }),
            timeout: 15,
          })
          if (res.statusCode >= 200 && res.statusCode < 300) {
            emailSent = true
            deliveryMethod = 'resend'
          } else {
            deliveryError = 'Resend HTTP ' + res.statusCode
          }
        } catch (err) {
          deliveryError = 'Resend err: ' + (err.message || String(err))
        }
      }

      // 2. SendGrid
      const sendgridApiKey = $os.getenv('SENDGRID_API_KEY') || ''
      if (!emailSent && sendgridApiKey) {
        try {
          const res = $http.send({
            url: 'https://api.sendgrid.com/v3/mail/send',
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + sendgridApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: targetEmail, name: rawName || firstName }] }],
              from: { email: fromEmail, name: fromName },
              reply_to: { email: replyTo, name: fromName },
              subject: subject,
              content: [
                { type: 'text/plain', value: textBody },
                { type: 'text/html', value: htmlBody },
              ],
            }),
            timeout: 15,
          })
          if (res.statusCode >= 200 && res.statusCode < 300) {
            emailSent = true
            deliveryMethod = 'sendgrid'
          } else {
            deliveryError = 'SendGrid HTTP ' + res.statusCode
          }
        } catch (err) {
          deliveryError = 'SendGrid err: ' + (err.message || String(err))
        }
      }

      // 3. Brevo
      const brevoApiKey = $os.getenv('BREVO_API_KEY') || ''
      if (!emailSent && brevoApiKey) {
        try {
          const res = $http.send({
            url: 'https://api.brevo.com/v3/smtp/email',
            method: 'POST',
            headers: {
              'api-key': brevoApiKey,
              'Content-Type': 'application/json',
              accept: 'application/json',
            },
            body: JSON.stringify({
              sender: { name: fromName, email: fromEmail },
              to: [{ email: targetEmail, name: rawName || firstName }],
              replyTo: { name: fromName, email: replyTo },
              subject: subject,
              htmlContent: htmlBody,
              textContent: textBody,
            }),
            timeout: 15,
          })
          if (res.statusCode >= 200 && res.statusCode < 300) {
            emailSent = true
            deliveryMethod = 'brevo'
          } else {
            deliveryError = 'Brevo HTTP ' + res.statusCode
          }
        } catch (err) {
          deliveryError = 'Brevo err: ' + (err.message || String(err))
        }
      }

      // 4. PocketBase Mailer Client
      if (!emailSent) {
        try {
          const mailer = $app.newMailClient()
          const message = new MailerMessage({
            from: { address: fromEmail, name: fromName },
            to: [{ address: targetEmail }],
            subject: subject,
            html: htmlBody,
          })
          mailer.send(message)
          emailSent = true
          deliveryMethod = 'pb_mailer'
        } catch (err) {
          if (!deliveryError) {
            deliveryError = 'PB Mailer: ' + (err.message || String(err))
          }
        }
      }

      logAudit(emailSent ? 'welcome_email_sent_manual' : 'welcome_email_pending_manual', {
        target_email: targetEmail,
        target_name: rawName,
        delivered: emailSent,
        method: deliveryMethod,
        error: deliveryError || null,
        disclosed_email: 'studiofreela@protonmail.com',
      })

      return e.json(200, {
        success: true,
        delivered: emailSent,
        method: deliveryMethod,
        message: emailSent
          ? 'E-mail de boas-vindas enviado com sucesso para ' +
            targetEmail +
            ' (via ' +
            deliveryMethod +
            ').'
          : 'Intenção de boas-vindas registrada. E-mail pendente de configuração SMTP/SendGrid no backend.',
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
