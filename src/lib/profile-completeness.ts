import {
  UserProfile,
  ProfessionalProfileData,
  ProfessionalExperience,
  ProfessionalEducation,
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
): { percentage: number; completedCount: number; totalCount: number; missingList: string[] } {
  const checks: { label: string; done: boolean }[] = [
    { label: 'Nome e identificação básica', done: !!user?.name },
    { label: 'Foto de perfil ou logo', done: !!user?.avatar },
    {
      label: 'Profissão ou título profissional',
      done: !!(profile?.professional_title || user?.profession),
    },
    { label: 'Telefone ou WhatsApp', done: !!(profile?.professional_phone || user?.phone) },
    { label: 'Cidade e estado de atendimento', done: !!(profile?.city && profile?.state) },
    { label: 'Frase de destaque profissional', done: !!profile?.headline },
    { label: 'Biografia / Resumo profissional', done: !!profile?.bio },
    { label: 'Pelo menos 1 experiência profissional', done: experiences.length > 0 },
    { label: 'Pelo menos 1 formação ou curso', done: education.length > 0 },
    { label: 'Pelo menos 1 serviço ou especialidade', done: services.length > 0 },
    {
      label: 'Equipamento ou links profissionais',
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
