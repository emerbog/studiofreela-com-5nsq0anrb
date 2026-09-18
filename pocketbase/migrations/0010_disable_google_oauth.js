migrate(
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      if (users.oauth2) {
        if (Array.isArray(users.oauth2.providers)) {
          users.oauth2.providers = users.oauth2.providers.filter((p) => p && p.name !== 'google')
        }
        // If no providers remain, turn off oauth2
        if (!users.oauth2.providers || users.oauth2.providers.length === 0) {
          users.oauth2.enabled = false
        }
        app.save(users)
        console.log('[migration 0010] Google OAuth provider explicitly removed/disabled.')
      }
    } catch (err) {
      console.log('[migration 0010] Notice when disabling Google OAuth:', err)
    }
  },
  () => {
    // Revert is a no-op since Google OAuth is permanently discontinued
  },
)
