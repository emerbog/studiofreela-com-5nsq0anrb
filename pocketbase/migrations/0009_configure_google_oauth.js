migrate(
  (app) => {
    const clientId = $secrets.get('GOOGLE_CLIENT_ID') || $os.getenv('GOOGLE_CLIENT_ID') || ''
    const clientSecret =
      $secrets.get('GOOGLE_CLIENT_SECRET') || $os.getenv('GOOGLE_CLIENT_SECRET') || ''

    if (!clientId || !clientSecret) {
      console.log(
        '[migration 0009] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set in environment. Skipping OAuth provider activation.',
      )
      return
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const currentProviders = users.oauth2?.providers || []

    const filtered = []
    for (let i = 0; i < currentProviders.length; i++) {
      if (currentProviders[i].name !== 'google') {
        filtered.push(currentProviders[i])
      }
    }

    filtered.push({
      name: 'google',
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      authURL: '',
      tokenURL: '',
      userInfoURL: '',
      displayName: 'Google',
      pkce: null,
      extra: null,
    })

    users.oauth2 = users.oauth2 || {}
    users.oauth2.enabled = true
    users.oauth2.providers = filtered
    app.save(users)
    console.log('[migration 0009] Google OAuth2 provider configured successfully.')
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      if (users.oauth2 && users.oauth2.providers) {
        users.oauth2.providers = users.oauth2.providers.filter((p) => p.name !== 'google')
        app.save(users)
      }
    } catch (_) {}
  },
)
