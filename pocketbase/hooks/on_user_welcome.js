// Hook: Automatic Welcome Email on new user registration (users collection)
// Features:
// - Professional Studio Freela visual identity (seriph heading, bronze #B08D57, sober palette)
// - Greeting with first name
// - Highlights: Agenda, Clientes, Orçamentos em PDF, Financeiro, Currículo e Equipamentos
// - Official sender / reply-to: Studio Freela <studiofreela@protonmail.com>
// - Flexible sending engines via Secrets:
//     1. Resend API (RESEND_API_KEY)
//     2. SendGrid API (SENDGRID_API_KEY)
//     3. Brevo API (BREVO_API_KEY)
//     4. Native PocketBase Mailer ($app.newMailClient())
// - Fallback: registers in-app notification and audit/pending log without breaking registration!

onRecordAfterCreateSuccess((e) => {
  const record = e.record
  if (!record) {
    e.next()
    return
  }

  const userId = record.id
  const userEmail = (record.getString('email') || '').trim()
  const rawName = (record.getString('name') || '').trim()
  const firstName = rawName ? rawName.split(' ')[0] : 'Freelancer'

  if (!userEmail) {
    e.next()
    return
  }

  // Auto-grant Pilot Access to all new users while pilot period is active
  // Configured via PILOT_AUTO_GRANT secret/env var (default: true)
  // To disable after the pilot phase: set PILOT_AUTO_GRANT=false in secrets/env
  const pilotAutoGrantEnv = ($os.getenv('PILOT_AUTO_GRANT') || '').trim().toLowerCase()
  const shouldAutoGrantPilot =
    pilotAutoGrantEnv === '' || pilotAutoGrantEnv === 'true' || pilotAutoGrantEnv === '1'

  if (shouldAutoGrantPilot && !record.getBool('pilot_access')) {
    try {
      record.set('pilot_access', true)
      $app.save(record)

      // Audit log of automatic pilot grant
      try {
        const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
        const logRec = new Record(auditCol)
        logRec.set('action', 'pilot_access_auto_granted')
        logRec.set('target_type', 'user')
        logRec.set('target_id', userId)
        logRec.set('admin_email', 'system@studiofreela.com')
        logRec.set('details', {
          user_email: userEmail,
          user_name: rawName,
          reason: 'Concessão automática de acesso ao piloto no cadastro',
        })
        $app.save(logRec)
      } catch (_) {}

      // In-app pilot welcome notification
      try {
        const notifCol = $app.findCollectionByNameOrId('notifications')
        const pilotNotif = new Record(notifCol)
        pilotNotif.set('user', userId)
        pilotNotif.set('title', 'Acesso Completo de Piloto Liberado!')
        pilotNotif.set(
          'message',
          'Olá, ' +
            firstName +
            '! Você recebeu o selo de Acesso de Piloto Studio Freela. Todos os módulos estão liberados sem limitações durante o período de piloto.',
        )
        pilotNotif.set('type', 'system')
        pilotNotif.set('read', false)
        pilotNotif.set('link', '/dashboard')
        $app.save(pilotNotif)
      } catch (_) {}
    } catch (pilotErr) {
      console.log('Falha ao conceder pilot_access automático:', pilotErr)
    }
  }

  // Get base site URL
  let siteUrl = $os.getenv('SITE_URL') || 'https://studiofreela.com'
  if (siteUrl.endsWith('/')) siteUrl = siteUrl.slice(0, -1)
  const appUrl = siteUrl + '/dashboard'

  // Sender configuration
  const fromName = 'Studio Freela'
  const fromEmail = $os.getenv('SMTP_FROM') || 'studiofreela@protonmail.com'
  const replyTo = 'studiofreela@protonmail.com'
  const subject = 'Bem-vindo ao Studio Freela — seu acesso completo está pronto'

  // HTML Email Template with Studio Freela sober & elegant identity
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
          
          <!-- Header Branding -->
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

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 36px 24px;">
              <h1 style="margin: 0 0 16px; font-family: Georgia, 'Playfair Display', serif; font-size: 22px; font-weight: 600; color: #ffffff; line-height: 1.3;">
                Olá, ${firstName}.
              </h1>
              
              <p style="margin: 0 0 18px; font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                Seu acesso ao <strong>Studio Freela</strong> está pronto. Criamos a plataforma pensando na rotina real de quem trabalha por conta própria: organização impecável, orçamentos que fecham negócios e controle financeiro sem ruído.
              </p>

              <!-- Feature Highlights Box -->
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

              <!-- Call to Action -->
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

          <!-- Support & Footer Note -->
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

  // Plain text fallback
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

  // 1. Try Resend API if RESEND_API_KEY is configured
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
          to: [userEmail],
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
        deliveryError = 'Resend status ' + res.statusCode + ': ' + (res.raw || '')
      }
    } catch (err) {
      deliveryError = 'Resend exception: ' + (err.message || String(err))
    }
  }

  // 2. Try SendGrid API if SENDGRID_API_KEY is configured
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
          personalizations: [
            {
              to: [{ email: userEmail, name: rawName || firstName }],
            },
          ],
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
        deliveryError = 'SendGrid status ' + res.statusCode + ': ' + (res.raw || '')
      }
    } catch (err) {
      deliveryError = 'SendGrid exception: ' + (err.message || String(err))
    }
  }

  // 3. Try Brevo API if BREVO_API_KEY is configured
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
          to: [{ email: userEmail, name: rawName || firstName }],
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
        deliveryError = 'Brevo status ' + res.statusCode + ': ' + (res.raw || '')
      }
    } catch (err) {
      deliveryError = 'Brevo exception: ' + (err.message || String(err))
    }
  }

  // 4. Try native PocketBase Mailer Client
  if (!emailSent) {
    try {
      const mailer = $app.newMailClient()
      const message = new MailerMessage({
        from: {
          address: fromEmail,
          name: fromName,
        },
        to: [{ address: userEmail }],
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

  // Log audit or pending status
  try {
    const auditCol = $app.findCollectionByNameOrId('admin_audit_logs')
    const logRec = new Record(auditCol)
    logRec.set('action', emailSent ? 'welcome_email_sent' : 'welcome_email_pending')
    logRec.set('target_type', 'user')
    logRec.set('target_id', userId)
    logRec.set('admin_email', 'system@studiofreela.com')
    logRec.set('details', {
      user_email: userEmail,
      user_name: rawName,
      delivered: emailSent,
      method: deliveryMethod,
      error: deliveryError || null,
      disclosed_email: 'studiofreela@protonmail.com',
    })
    $app.save(logRec)
  } catch (_) {}

  // In-app welcome notification (always created as instant welcome)
  try {
    const notificationsCol = $app.findCollectionByNameOrId('notifications')
    const notif = new Record(notificationsCol)
    notif.set('user', userId)
    notif.set('title', 'Bem-vindo ao Studio Freela!')
    notif.set(
      'message',
      'Olá, ' +
        firstName +
        '! Seu ambiente de trabalho está pronto. Comece cadastrando seus primeiros clientes e emitindo orçamentos. Se precisar de suporte, escreva para studiofreela@protonmail.com.',
    )
    notif.set('type', 'system')
    notif.set('read', false)
    notif.set('link', '/dashboard')
    $app.save(notif)
  } catch (_) {}

  e.next()
}, 'users')
