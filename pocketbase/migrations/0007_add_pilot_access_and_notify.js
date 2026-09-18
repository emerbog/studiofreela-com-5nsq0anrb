migrate(
  (app) => {
    // 1. Add pilot_access field to users collection
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('pilot_access')) {
      users.fields.add(new BoolField({ name: 'pilot_access' }))
      app.save(users)
    }

    // 2. Identify pilot users from environment (PILOT_EMAILS) or confirmed invitees
    const envPilotEmails = ($os.getenv('PILOT_EMAILS') || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    // Known confirmed pilot guest user: Anderson de Sousa (zokrinho@hotmail.com)
    const targetPilotEmails = ['zokrinho@hotmail.com']
    for (let i = 0; i < envPilotEmails.length; i++) {
      if (targetPilotEmails.indexOf(envPilotEmails[i]) === -1) {
        targetPilotEmails.push(envPilotEmails[i])
      }
    }

    const notificationsCol = app.findCollectionByNameOrId('notifications')

    for (let i = 0; i < targetPilotEmails.length; i++) {
      const email = targetPilotEmails[i]
      // Never activate admin account as pilot guest
      if (email === 'emerbog@gmail.com') continue

      let userRecord = null
      try {
        userRecord = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {
        // User does not exist yet; will be activated if registered later
        continue
      }

      if (userRecord) {
        userRecord.set('pilot_access', true)
        app.save(userRecord)

        // Create welcome in-app notification if not already sent
        const firstName = (userRecord.getString('name') || 'Convidado').trim().split(' ')[0]
        const notificationTitle = 'Acesso Completo ao Piloto Liberado!'
        const notificationMessage =
          'Olá, ' +
          firstName +
          '! Você foi selecionado para o piloto do Studio Freela, o sistema de gestão para freelancers. Sua conta tem ACESSO COMPLETO e GRATUITO a todos os recursos durante o teste: agenda, clientes, orçamentos com proposta em PDF, financeiro, contratos, currículo profissional e equipamentos para locação. Acesse em https://studiofreela.goskip.app com o e-mail em que recebeu este convite. Qualquer dúvida ou sugestão, basta responder — queremos saber tudo o que você achar. Bem-vindo(a)!'

        let alreadyNotified = false
        try {
          const existing = app.findRecordsByFilter(
            'notifications',
            "user = '" + userRecord.id + "' && title ~ 'Piloto'",
            '-created',
            1,
            0,
          )
          if (existing && existing.length > 0) {
            alreadyNotified = true
          }
        } catch (_) {}

        if (!alreadyNotified) {
          try {
            const notif = new Record(notificationsCol)
            notif.set('user', userRecord.id)
            notif.set('title', notificationTitle)
            notif.set('message', notificationMessage)
            notif.set('type', 'system')
            notif.set('read', false)
            notif.set('link', '/dashboard')
            app.save(notif)
          } catch (notifErr) {
            console.log('Falha ao salvar notificação do piloto:', notifErr)
          }
        }
      }
    }
  },
  (app) => {
    // Revert: set pilot_access = false and remove notification
    try {
      const users = app.findRecordsByFilter('_pb_users_auth_', 'pilot_access = true', '', 100, 0)
      for (let i = 0; i < users.length; i++) {
        users[i].set('pilot_access', false)
        app.save(users[i])
      }
    } catch (_) {}
  },
)
