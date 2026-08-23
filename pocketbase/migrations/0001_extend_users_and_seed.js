migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('phone')) {
      users.fields.add(new TextField({ name: 'phone' }))
    }
    if (!users.fields.getByName('profession')) {
      users.fields.add(new TextField({ name: 'profession' }))
    }
    if (!users.fields.getByName('address')) {
      users.fields.add(new TextField({ name: 'address' }))
    }
    if (!users.fields.getByName('plan_tier')) {
      users.fields.add(
        new SelectField({
          name: 'plan_tier',
          values: ['economy', 'intermediate', 'advanced', 'premium'],
          maxSelect: 1,
        }),
      )
    }

    app.save(users)

    // Seed default admin/demo user
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'emerbog@gmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('emerbog@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Felipe Santos')
      record.set('phone', '(11) 98765-4321')
      record.set('profession', 'Designer & Desenvolvedor Freelancer')
      record.set('address', 'Av. Paulista, 1000 - São Paulo, SP')
      record.set('plan_tier', 'intermediate')
      app.save(record)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'emerbog@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
