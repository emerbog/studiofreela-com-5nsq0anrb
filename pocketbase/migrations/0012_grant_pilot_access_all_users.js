migrate(
  (app) => {
    // 1. Garante que Anderson de Sousa (zokrinho@hotmail.com) e Emerson Bogsan (emerbog@gmail.com)
    //    tenham/mantenham o selo de piloto ativo
    const keyUsers = ['zokrinho@hotmail.com', 'emerbog@gmail.com']

    for (let i = 0; i < keyUsers.length; i++) {
      const email = keyUsers[i]
      try {
        const u = app.findAuthRecordByEmail('_pb_users_auth_', email)
        if (u && !u.getBool('pilot_access')) {
          u.set('pilot_access', true)
          app.save(u)
        }
      } catch (_) {}
    }

    // 2. O usuário pediu: "deixa todos que entrarem por enquanto como piloto"
    //    Também ativamos o selo para os usuários já cadastrados na base (ex: Eduardo Costa, André Dulcini)
    //    de forma idempotente e segura.
    try {
      const allUsers = app.findRecordsByFilter('_pb_users_auth_', '', '-created', 200, 0)
      for (let i = 0; i < allUsers.length; i++) {
        const usr = allUsers[i]
        if (!usr.getBool('pilot_access')) {
          usr.set('pilot_access', true)
          app.save(usr)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // Reverter não é estritamente necessário para dados idempotentes,
    // mas mantemos reversão segura desativando exceto os administradores
    try {
      const allUsers = app.findRecordsByFilter('_pb_users_auth_', 'pilot_access = true', '', 200, 0)
      for (let i = 0; i < allUsers.length; i++) {
        const usr = allUsers[i]
        const email = (usr.getString('email') || '').toLowerCase()
        if (email !== 'emerbog@gmail.com' && email !== 'zokrinho@hotmail.com') {
          usr.set('pilot_access', false)
          app.save(usr)
        }
      }
    } catch (_) {}
  },
)
