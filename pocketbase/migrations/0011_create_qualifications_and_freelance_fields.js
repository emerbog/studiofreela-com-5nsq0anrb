migrate(
  (app) => {
    // 1. Criar collection professional_qualifications se não existir
    try {
      app.findCollectionByNameOrId('professional_qualifications')
    } catch (_) {
      const qualifications = new Collection({
        name: 'professional_qualifications',
        type: 'base',
        listRule: "@request.auth.id != '' && user = @request.auth.id",
        viewRule: "@request.auth.id != '' && user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && user = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
        fields: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'category', type: 'text', required: false },
          {
            name: 'level',
            type: 'select',
            required: false,
            values: ['basico', 'intermediario', 'avancado', 'especialista'],
            maxSelect: 1,
          },
          { name: 'years_experience', type: 'text', required: false },
          { name: 'practical_description', type: 'text', required: false },
          { name: 'certificate_url', type: 'text', required: false },
          { name: 'external_link', type: 'text', required: false },
          { name: 'show_in_public', type: 'bool', required: false },
          { name: 'show_in_cv', type: 'bool', required: false },
          { name: 'order', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_prof_qual_user ON professional_qualifications (user)'],
      })
      app.save(qualifications)
    }

    // 2. Adicionar campos de apoio para experiências freelance se não existirem
    try {
      const expCol = app.findCollectionByNameOrId('professional_experiences')
      let changed = false

      if (!expCol.fields.getByName('service_type')) {
        expCol.fields.add(new TextField({ name: 'service_type' }))
        changed = true
      }
      if (!expCol.fields.getByName('period_or_year')) {
        expCol.fields.add(new TextField({ name: 'period_or_year' }))
        changed = true
      }
      if (!expCol.fields.getByName('city_state')) {
        expCol.fields.add(new TextField({ name: 'city_state' }))
        changed = true
      }

      if (changed) {
        app.save(expCol)
      }
    } catch (err) {
      console.log('Aviso ao atualizar professional_experiences:', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('professional_qualifications')
      app.delete(col)
    } catch (_) {}
  },
)
