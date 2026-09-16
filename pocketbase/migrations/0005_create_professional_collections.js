migrate(
  (app) => {
    // 1. professional_profiles
    const profProfiles = new Collection({
      name: 'professional_profiles',
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
        { name: 'commercial_name', type: 'text', required: false },
        { name: 'city', type: 'text', required: false },
        { name: 'state', type: 'text', required: false },
        { name: 'professional_phone', type: 'text', required: false },
        { name: 'professional_email', type: 'email', required: false },
        { name: 'hide_residential_address', type: 'bool', required: false },
        { name: 'social_links', type: 'json', required: false },
        { name: 'professional_title', type: 'text', required: false },
        { name: 'headline', type: 'text', required: false },
        { name: 'bio', type: 'text', required: false },
        { name: 'years_experience', type: 'number', required: false, min: 0 },
        { name: 'travel_availability', type: 'bool', required: false },
        {
          name: 'work_mode',
          type: 'select',
          required: false,
          values: ['presencial', 'remoto', 'hibrido'],
          maxSelect: 1,
        },
        { name: 'languages', type: 'json', required: false },
        { name: 'served_regions', type: 'text', required: false },
        { name: 'resume_blocks_config', type: 'json', required: false },
        { name: 'show_updated_at_in_cv', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_prof_profiles_user ON professional_profiles (user)'],
    })
    app.save(profProfiles)

    // 2. professional_experiences
    const profExperiences = new Collection({
      name: 'professional_experiences',
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
        { name: 'company_client', type: 'text', required: true },
        { name: 'role', type: 'text', required: true },
        { name: 'start_date', type: 'text', required: false },
        { name: 'end_date', type: 'text', required: false },
        { name: 'current', type: 'bool', required: false },
        { name: 'location_or_mode', type: 'text', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'results_projects', type: 'text', required: false },
        { name: 'show_in_cv', type: 'bool', required: false },
        { name: 'show_in_public', type: 'bool', required: false },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_prof_exp_user ON professional_experiences (user)'],
    })
    app.save(profExperiences)

    // 3. professional_education
    const profEducation = new Collection({
      name: 'professional_education',
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
        { name: 'institution', type: 'text', required: true },
        { name: 'course_name', type: 'text', required: true },
        { name: 'period_or_year', type: 'text', required: false },
        { name: 'certificate_url', type: 'text', required: false },
        {
          name: 'type',
          type: 'select',
          required: false,
          values: ['graduacao', 'pos_graduacao', 'curso_livre', 'certificacao'],
          maxSelect: 1,
        },
        { name: 'show_in_cv', type: 'bool', required: false },
        { name: 'show_in_public', type: 'bool', required: false },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_prof_edu_user ON professional_education (user)'],
    })
    app.save(profEducation)

    // 4. professional_services
    const profServices = new Collection({
      name: 'professional_services',
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
        { name: 'short_description', type: 'text', required: false },
        {
          name: 'category',
          type: 'select',
          required: false,
          values: [
            'audiovisual',
            'fotografia',
            'video',
            'design',
            'producao',
            'sonorizacao',
            'iluminacao',
            'cenografia',
            'tecnologia',
            'traducao',
            'suporte_tecnico',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'billing_unit',
          type: 'select',
          required: false,
          values: ['hora', 'diaria', 'servico', 'projeto', 'outro'],
          maxSelect: 1,
        },
        { name: 'starting_price', type: 'number', required: false, min: 0 },
        { name: 'price_range', type: 'text', required: false },
        { name: 'is_available', type: 'bool', required: false },
        { name: 'show_in_cv', type: 'bool', required: false },
        { name: 'show_in_public', type: 'bool', required: false },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_prof_srv_user ON professional_services (user)'],
    })
    app.save(profServices)

    // 5. professional_equipment
    const profEquipment = new Collection({
      name: 'professional_equipment',
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
        {
          name: 'category',
          type: 'select',
          required: false,
          values: [
            'cameras',
            'lentes',
            'iluminacao',
            'audio',
            'sonorizacao',
            'paineis_led',
            'projetores',
            'computadores',
            'estruturas',
            'cenografia',
            'moveis_acessorios',
            'cabos_perifericos',
            'outros',
          ],
          maxSelect: 1,
        },
        { name: 'brand', type: 'text', required: false },
        { name: 'model', type: 'text', required: false },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'technical_description', type: 'text', required: false },
        {
          name: 'condition',
          type: 'select',
          required: false,
          values: ['novo', 'excelente', 'bom', 'marcas_uso'],
          maxSelect: 1,
        },
        { name: 'hourly_rate', type: 'number', required: false, min: 0 },
        { name: 'daily_rate', type: 'number', required: false, min: 0 },
        { name: 'event_rate', type: 'number', required: false, min: 0 },
        { name: 'deposit_or_commercial_note', type: 'text', required: false },
        { name: 'approximate_location', type: 'text', required: false },
        { name: 'needs_operator', type: 'bool', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['disponivel', 'reservado', 'manutencao', 'indisponivel'],
          maxSelect: 1,
        },
        { name: 'show_in_public', type: 'bool', required: false },
        { name: 'show_in_cv', type: 'bool', required: false },
        { name: 'offer_in_quotes', type: 'bool', required: false },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_prof_eq_user ON professional_equipment (user)'],
    })
    app.save(profEquipment)

    // 6. professional_pages (scaffolded empty collection for Phase 3 public page)
    const profPages = new Collection({
      name: 'professional_pages',
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
        { name: 'slug', type: 'text', required: false },
        { name: 'theme', type: 'text', required: false },
        { name: 'custom_bio', type: 'text', required: false },
        { name: 'is_published', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_prof_pages_user ON professional_pages (user)'],
    })
    app.save(profPages)
  },
  (app) => {
    const collections = [
      'professional_pages',
      'professional_equipment',
      'professional_services',
      'professional_education',
      'professional_experiences',
      'professional_profiles',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
