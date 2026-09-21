import {
  UserProfile,
  ProfessionalProfileData,
  ProfessionalExperience,
  ProfessionalEducation,
  ProfessionalQualification,
  ProfessionalService,
  ProfessionalEquipment,
} from '@/types'

export function calculateProfileCompleteness(
  user: UserProfile | null,
  profile: ProfessionalProfileData | null,
  experiences: ProfessionalExperience[],
  education: ProfessionalEducation[],
  services: ProfessionalService[],
  equipment: ProfessionalEquipment[],
  qualifications: ProfessionalQualification[] = [],
): { percentage: number; completedCount: number; totalCount: number; missingList: string[] } {
  const checks: { label: string; done: boolean }[] = [
    { label: 'Nome e apresentação profissional', done: !!(profile?.commercial_name || user?.name) },
    { label: 'Foto de perfil ou logotipo', done: !!user?.avatar },
    {
      label: 'Título profissional e áreas de atuação',
      done: !!(profile?.professional_title || user?.profession),
    },
    {
      label: 'Telefone / WhatsApp profissional',
      done: !!(profile?.professional_phone || user?.phone),
    },
    { label: 'Cidade e estado de atendimento', done: !!(profile?.city && profile?.state) },
    { label: 'Descrição curta / apresentação', done: !!profile?.bio || !!profile?.headline },
    {
      label: 'Pelo menos 1 qualificação ou conhecimento específico',
      done: qualifications.length > 0,
    },
    {
      label: 'Pelo menos 1 empresa onde fez freelance',
      done: experiences.length > 0,
    },
    { label: 'Pelo menos 1 serviço oferecido', done: services.length > 0 },
    {
      label: 'Equipamentos disponíveis ou contatos oficiais',
      done:
        equipment.length > 0 ||
        !!profile?.social_links?.website ||
        !!profile?.social_links?.instagram,
    },
  ]

  const completed = checks.filter((c) => c.done)
  const missing = checks.filter((c) => !c.done).map((c) => c.label)
  const percentage = Math.round((completed.length / checks.length) * 100)

  return {
    percentage,
    completedCount: completed.length,
    totalCount: checks.length,
    missingList: missing,
  }
}
