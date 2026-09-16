import pb from '@/lib/pocketbase/client'
import {
  ProfessionalProfileData,
  ProfessionalExperience,
  ProfessionalEducation,
  ProfessionalService,
  ProfessionalEquipment,
  ResumeBlockConfig,
} from '@/types'

export const DEFAULT_RESUME_BLOCKS: ResumeBlockConfig[] = [
  {
    id: 'b1',
    key: 'summary',
    title: 'Resumo Profissional',
    visibleInCv: true,
    visibleInPublic: true,
    order: 1,
  },
  {
    id: 'b2',
    key: 'services',
    title: 'Serviços Prestados',
    visibleInCv: true,
    visibleInPublic: true,
    order: 2,
  },
  {
    id: 'b3',
    key: 'experiences',
    title: 'Experiência Profissional',
    visibleInCv: true,
    visibleInPublic: true,
    order: 3,
  },
  {
    id: 'b4',
    key: 'education',
    title: 'Formação & Cursos',
    visibleInCv: true,
    visibleInPublic: true,
    order: 4,
  },
  {
    id: 'b5',
    key: 'equipment',
    title: 'Equipamentos para Locação',
    visibleInCv: true,
    visibleInPublic: true,
    order: 5,
  },
  {
    id: 'b6',
    key: 'languages',
    title: 'Idiomas & Regiões',
    visibleInCv: true,
    visibleInPublic: true,
    order: 6,
  },
  {
    id: 'b7',
    key: 'contacts',
    title: 'Contatos & Canais Oficiais',
    visibleInCv: true,
    visibleInPublic: true,
    order: 7,
  },
  {
    id: 'b8',
    key: 'commercial_notes',
    title: 'Observações Comerciais',
    visibleInCv: false,
    visibleInPublic: false,
    order: 8,
  },
]

export const professionalCenterService = {
  // 1. Profile Data
  async getProfile(): Promise<ProfessionalProfileData | null> {
    const userId = pb.authStore.record?.id
    if (!userId) return null

    try {
      const records = await pb.collection('professional_profiles').getFullList({
        filter: `user = "${userId}"`,
        limit: 1,
      })
      if (records.length === 0) return null
      const r = records[0]
      return {
        id: r.id,
        user: r.user,
        commercial_name: r.commercial_name,
        city: r.city,
        state: r.state,
        professional_phone: r.professional_phone,
        professional_email: r.professional_email,
        hide_residential_address: r.hide_residential_address,
        social_links: r.social_links || {},
        professional_title: r.professional_title,
        headline: r.headline,
        bio: r.bio,
        years_experience: r.years_experience,
        travel_availability: r.travel_availability,
        work_mode: r.work_mode,
        languages: r.languages || [],
        served_regions: r.served_regions,
        resume_blocks_config: r.resume_blocks_config || DEFAULT_RESUME_BLOCKS,
        show_updated_at_in_cv: r.show_updated_at_in_cv,
        created: r.created,
        updated: r.updated,
      }
    } catch (err) {
      console.warn('Erro ao carregar professional_profiles:', err)
      return null
    }
  },

  async upsertProfile(data: Partial<ProfessionalProfileData>): Promise<ProfessionalProfileData> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado.')

    const existing = await this.getProfile()
    const payload = {
      user: userId,
      commercial_name: data.commercial_name ?? '',
      city: data.city ?? '',
      state: data.state ?? '',
      professional_phone: data.professional_phone ?? '',
      professional_email: data.professional_email ?? '',
      hide_residential_address: !!data.hide_residential_address,
      social_links: data.social_links ?? {},
      professional_title: data.professional_title ?? '',
      headline: data.headline ?? '',
      bio: data.bio ?? '',
      years_experience: data.years_experience ?? 0,
      travel_availability: !!data.travel_availability,
      work_mode: data.work_mode ?? 'hibrido',
      languages: data.languages ?? [],
      served_regions: data.served_regions ?? '',
      resume_blocks_config: data.resume_blocks_config ?? DEFAULT_RESUME_BLOCKS,
      show_updated_at_in_cv:
        data.show_updated_at_in_cv !== undefined ? !!data.show_updated_at_in_cv : true,
    }

    if (existing?.id) {
      const record = await pb.collection('professional_profiles').update(existing.id, payload)
      return {
        id: record.id,
        user: record.user,
        commercial_name: record.commercial_name,
        city: record.city,
        state: record.state,
        professional_phone: record.professional_phone,
        professional_email: record.professional_email,
        hide_residential_address: record.hide_residential_address,
        social_links: record.social_links,
        professional_title: record.professional_title,
        headline: record.headline,
        bio: record.bio,
        years_experience: record.years_experience,
        travel_availability: record.travel_availability,
        work_mode: record.work_mode,
        languages: record.languages,
        served_regions: record.served_regions,
        resume_blocks_config: record.resume_blocks_config,
        show_updated_at_in_cv: record.show_updated_at_in_cv,
        created: record.created,
        updated: record.updated,
      }
    } else {
      const record = await pb.collection('professional_profiles').create(payload)
      return {
        id: record.id,
        user: record.user,
        commercial_name: record.commercial_name,
        city: record.city,
        state: record.state,
        professional_phone: record.professional_phone,
        professional_email: record.professional_email,
        hide_residential_address: record.hide_residential_address,
        social_links: record.social_links,
        professional_title: record.professional_title,
        headline: record.headline,
        bio: record.bio,
        years_experience: record.years_experience,
        travel_availability: record.travel_availability,
        work_mode: record.work_mode,
        languages: record.languages,
        served_regions: record.served_regions,
        resume_blocks_config: record.resume_blocks_config,
        show_updated_at_in_cv: record.show_updated_at_in_cv,
        created: record.created,
        updated: record.updated,
      }
    }
  },

  // 2. Experiences CRUD
  async getExperiences(): Promise<ProfessionalExperience[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []

    try {
      const records = await pb.collection('professional_experiences').getFullList({
        filter: `user = "${userId}"`,
        sort: 'order,created',
      })
      return records.map((r) => ({
        id: r.id,
        user: r.user,
        company_client: r.company_client,
        role: r.role,
        start_date: r.start_date,
        end_date: r.end_date,
        current: !!r.current,
        location_or_mode: r.location_or_mode,
        description: r.description,
        results_projects: r.results_projects,
        show_in_cv: r.show_in_cv !== false,
        show_in_public: r.show_in_public !== false,
        order: r.order || 0,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao carregar professional_experiences:', err)
      return []
    }
  },

  async createExperience(
    data: Omit<ProfessionalExperience, 'id'>,
  ): Promise<ProfessionalExperience> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado.')

    const payload = {
      user: userId,
      company_client: data.company_client,
      role: data.role,
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      current: !!data.current,
      location_or_mode: data.location_or_mode || '',
      description: data.description || '',
      results_projects: data.results_projects || '',
      show_in_cv: data.show_in_cv !== false,
      show_in_public: data.show_in_public !== false,
      order: data.order || 0,
    }
    const r = await pb.collection('professional_experiences').create(payload)
    return {
      id: r.id,
      user: r.user,
      company_client: r.company_client,
      role: r.role,
      start_date: r.start_date,
      end_date: r.end_date,
      current: r.current,
      location_or_mode: r.location_or_mode,
      description: r.description,
      results_projects: r.results_projects,
      show_in_cv: r.show_in_cv,
      show_in_public: r.show_in_public,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async updateExperience(
    id: string,
    data: Partial<ProfessionalExperience>,
  ): Promise<ProfessionalExperience> {
    const r = await pb.collection('professional_experiences').update(id, data)
    return {
      id: r.id,
      user: r.user,
      company_client: r.company_client,
      role: r.role,
      start_date: r.start_date,
      end_date: r.end_date,
      current: r.current,
      location_or_mode: r.location_or_mode,
      description: r.description,
      results_projects: r.results_projects,
      show_in_cv: r.show_in_cv,
      show_in_public: r.show_in_public,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async deleteExperience(id: string): Promise<boolean> {
    await pb.collection('professional_experiences').delete(id)
    return true
  },

  // 3. Education CRUD
  async getEducation(): Promise<ProfessionalEducation[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []

    try {
      const records = await pb.collection('professional_education').getFullList({
        filter: `user = "${userId}"`,
        sort: 'order,created',
      })
      return records.map((r) => ({
        id: r.id,
        user: r.user,
        institution: r.institution,
        course_name: r.course_name,
        period_or_year: r.period_or_year,
        certificate_url: r.certificate_url,
        type: r.type || 'curso_livre',
        show_in_cv: r.show_in_cv !== false,
        show_in_public: r.show_in_public !== false,
        order: r.order || 0,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao carregar professional_education:', err)
      return []
    }
  },

  async createEducation(data: Omit<ProfessionalEducation, 'id'>): Promise<ProfessionalEducation> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado.')

    const payload = {
      user: userId,
      institution: data.institution,
      course_name: data.course_name,
      period_or_year: data.period_or_year || '',
      certificate_url: data.certificate_url || '',
      type: data.type || 'curso_livre',
      show_in_cv: data.show_in_cv !== false,
      show_in_public: data.show_in_public !== false,
      order: data.order || 0,
    }
    const r = await pb.collection('professional_education').create(payload)
    return {
      id: r.id,
      user: r.user,
      institution: r.institution,
      course_name: r.course_name,
      period_or_year: r.period_or_year,
      certificate_url: r.certificate_url,
      type: r.type,
      show_in_cv: r.show_in_cv,
      show_in_public: r.show_in_public,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async updateEducation(
    id: string,
    data: Partial<ProfessionalEducation>,
  ): Promise<ProfessionalEducation> {
    const r = await pb.collection('professional_education').update(id, data)
    return {
      id: r.id,
      user: r.user,
      institution: r.institution,
      course_name: r.course_name,
      period_or_year: r.period_or_year,
      certificate_url: r.certificate_url,
      type: r.type,
      show_in_cv: r.show_in_cv,
      show_in_public: r.show_in_public,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async deleteEducation(id: string): Promise<boolean> {
    await pb.collection('professional_education').delete(id)
    return true
  },

  // 4. Services CRUD
  async getServices(): Promise<ProfessionalService[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []

    try {
      const records = await pb.collection('professional_services').getFullList({
        filter: `user = "${userId}"`,
        sort: 'order,created',
      })
      return records.map((r) => ({
        id: r.id,
        user: r.user,
        name: r.name,
        short_description: r.short_description,
        category: r.category,
        billing_unit: r.billing_unit,
        starting_price: r.starting_price,
        price_range: r.price_range,
        is_available: r.is_available !== false,
        show_in_cv: r.show_in_cv !== false,
        show_in_public: r.show_in_public !== false,
        order: r.order || 0,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao carregar professional_services:', err)
      return []
    }
  },

  async createService(data: Omit<ProfessionalService, 'id'>): Promise<ProfessionalService> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado.')

    const payload = {
      user: userId,
      name: data.name,
      short_description: data.short_description || '',
      category: data.category || 'outro',
      billing_unit: data.billing_unit || 'servico',
      starting_price: data.starting_price !== undefined ? data.starting_price : 0,
      price_range: data.price_range || '',
      is_available: data.is_available !== false,
      show_in_cv: data.show_in_cv !== false,
      show_in_public: data.show_in_public !== false,
      order: data.order || 0,
    }
    const r = await pb.collection('professional_services').create(payload)
    return {
      id: r.id,
      user: r.user,
      name: r.name,
      short_description: r.short_description,
      category: r.category,
      billing_unit: r.billing_unit,
      starting_price: r.starting_price,
      price_range: r.price_range,
      is_available: r.is_available,
      show_in_cv: r.show_in_cv,
      show_in_public: r.show_in_public,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async updateService(
    id: string,
    data: Partial<ProfessionalService>,
  ): Promise<ProfessionalService> {
    const r = await pb.collection('professional_services').update(id, data)
    return {
      id: r.id,
      user: r.user,
      name: r.name,
      short_description: r.short_description,
      category: r.category,
      billing_unit: r.billing_unit,
      starting_price: r.starting_price,
      price_range: r.price_range,
      is_available: r.is_available,
      show_in_cv: r.show_in_cv,
      show_in_public: r.show_in_public,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async deleteService(id: string): Promise<boolean> {
    await pb.collection('professional_services').delete(id)
    return true
  },

  // 5. Equipment CRUD
  async getEquipment(): Promise<ProfessionalEquipment[]> {
    const userId = pb.authStore.record?.id
    if (!userId) return []

    try {
      const records = await pb.collection('professional_equipment').getFullList({
        filter: `user = "${userId}"`,
        sort: 'order,created',
      })
      return records.map((r) => ({
        id: r.id,
        user: r.user,
        name: r.name,
        category: r.category,
        brand: r.brand,
        model: r.model,
        quantity: r.quantity || 1,
        technical_description: r.technical_description,
        condition: r.condition,
        hourly_rate: r.hourly_rate,
        daily_rate: r.daily_rate,
        event_rate: r.event_rate,
        deposit_or_commercial_note: r.deposit_or_commercial_note,
        approximate_location: r.approximate_location,
        needs_operator: !!r.needs_operator,
        status: r.status || 'disponivel',
        show_in_public: r.show_in_public !== false,
        show_in_cv: r.show_in_cv !== false,
        offer_in_quotes: r.offer_in_quotes !== false,
        order: r.order || 0,
        created: r.created,
        updated: r.updated,
      }))
    } catch (err) {
      console.warn('Erro ao carregar professional_equipment:', err)
      return []
    }
  },

  async createEquipment(data: Omit<ProfessionalEquipment, 'id'>): Promise<ProfessionalEquipment> {
    const userId = pb.authStore.record?.id
    if (!userId) throw new Error('Usuário não autenticado.')

    const payload = {
      user: userId,
      name: data.name,
      category: data.category || 'outros',
      brand: data.brand || '',
      model: data.model || '',
      quantity: Number(data.quantity) || 1,
      technical_description: data.technical_description || '',
      condition: data.condition || 'excelente',
      hourly_rate: data.hourly_rate !== undefined ? Number(data.hourly_rate) : 0,
      daily_rate: data.daily_rate !== undefined ? Number(data.daily_rate) : 0,
      event_rate: data.event_rate !== undefined ? Number(data.event_rate) : 0,
      deposit_or_commercial_note: data.deposit_or_commercial_note || '',
      approximate_location: data.approximate_location || '',
      needs_operator: !!data.needs_operator,
      status: data.status || 'disponivel',
      show_in_public: data.show_in_public !== false,
      show_in_cv: data.show_in_cv !== false,
      offer_in_quotes: data.offer_in_quotes !== false,
      order: data.order || 0,
    }
    const r = await pb.collection('professional_equipment').create(payload)
    return {
      id: r.id,
      user: r.user,
      name: r.name,
      category: r.category,
      brand: r.brand,
      model: r.model,
      quantity: r.quantity,
      technical_description: r.technical_description,
      condition: r.condition,
      hourly_rate: r.hourly_rate,
      daily_rate: r.daily_rate,
      event_rate: r.event_rate,
      deposit_or_commercial_note: r.deposit_or_commercial_note,
      approximate_location: r.approximate_location,
      needs_operator: r.needs_operator,
      status: r.status,
      show_in_public: r.show_in_public,
      show_in_cv: r.show_in_cv,
      offer_in_quotes: r.offer_in_quotes,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async updateEquipment(
    id: string,
    data: Partial<ProfessionalEquipment>,
  ): Promise<ProfessionalEquipment> {
    const r = await pb.collection('professional_equipment').update(id, data)
    return {
      id: r.id,
      user: r.user,
      name: r.name,
      category: r.category,
      brand: r.brand,
      model: r.model,
      quantity: r.quantity,
      technical_description: r.technical_description,
      condition: r.condition,
      hourly_rate: r.hourly_rate,
      daily_rate: r.daily_rate,
      event_rate: r.event_rate,
      deposit_or_commercial_note: r.deposit_or_commercial_note,
      approximate_location: r.approximate_location,
      needs_operator: r.needs_operator,
      status: r.status,
      show_in_public: r.show_in_public,
      show_in_cv: r.show_in_cv,
      offer_in_quotes: r.offer_in_quotes,
      order: r.order,
      created: r.created,
      updated: r.updated,
    }
  },

  async deleteEquipment(id: string): Promise<boolean> {
    await pb.collection('professional_equipment').delete(id)
    return true
  },
}
