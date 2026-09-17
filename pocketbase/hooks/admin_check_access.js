// Admin authorization check endpoint
// Checks whether current authenticated user has an active admin/staff role
// Either via ADMIN_EMAILS secret, emerbog@gmail.com default, or admin_roles record

routerAdd(
  'GET',
  '/backend/v1/studio-admin/check-access',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { error: 'Não autenticado' })
    }

    const userEmail = (auth.getString('email') || '').toLowerCase().trim()
    const userId = auth.id

    const adminEmailsEnv = $os.getenv('ADMIN_EMAILS') || ''
    const adminEmailsList = adminEmailsEnv
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    // Default hardcoded admin
    const isDefaultAdmin = userEmail === 'emerbog@gmail.com'
    const isEnvAdmin = adminEmailsList.indexOf(userEmail) !== -1

    let assignedRole = null
    let roleRecord = null
    try {
      roleRecord = $app.findFirstRecordByData('admin_roles', 'user', userId)
      if (roleRecord) {
        assignedRole = roleRecord.getString('role')
      }
    } catch (_) {}

    // If email is in admin list but role not registered yet, auto-register as admin
    if ((isDefaultAdmin || isEnvAdmin) && (!roleRecord || assignedRole !== 'admin')) {
      try {
        const col = $app.findCollectionByNameOrId('admin_roles')
        if (roleRecord) {
          roleRecord.set('role', 'admin')
          $app.save(roleRecord)
        } else {
          const newRec = new Record(col)
          newRec.set('user', userId)
          newRec.set('role', 'admin')
          newRec.set('notes', 'Auto-atribuído via ADMIN_EMAILS / padrão')
          $app.save(newRec)
        }
        assignedRole = 'admin'
      } catch (saveErr) {
        assignedRole = 'admin'
      }
    }

    const hasAccess = !!assignedRole && assignedRole !== 'freelancer'

    if (!hasAccess) {
      return e.json(403, {
        hasAccess: false,
        role: 'freelancer',
        error: 'Acesso restrito ao painel administrativo.',
      })
    }

    return e.json(200, {
      hasAccess: true,
      role: assignedRole,
      email: userEmail,
      userId: userId,
    })
  },
  $apis.requireAuth(),
)
