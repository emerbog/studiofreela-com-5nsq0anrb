import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  UserProfile,
  ProfessionalProfileData,
  ProfessionalExperience,
  ProfessionalEducation,
  ProfessionalQualification,
  ProfessionalService,
  ProfessionalEquipment,
} from '@/types'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import {
  Printer,
  Download,
  Share2,
  MapPin,
  Mail,
  Phone,
  Eye,
  Award,
  Briefcase,
  Layers,
  Wrench,
  GraduationCap,
} from 'lucide-react'
import {
  downloadResumeBinaryPdf,
  openResumePdfInNewTab,
  shareResumePdfFile,
  ResumePdfTheme,
} from '@/lib/resume-pdf'

interface ResumePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  profile: ProfessionalProfileData | null
  experiences: ProfessionalExperience[]
  education: ProfessionalEducation[]
  services: ProfessionalService[]
  equipment: ProfessionalEquipment[]
  qualifications?: ProfessionalQualification[]
  theme: ResumePdfTheme
  onThemeChange: (t: ResumePdfTheme) => void
}

export function ResumePreviewModal({
  open,
  onOpenChange,
  user,
  profile,
  experiences,
  education,
  services,
  equipment,
  qualifications = [],
  theme,
  onThemeChange,
}: ResumePreviewModalProps) {
  const isBronze = theme === 'bronze'
  const displayName = profile?.commercial_name || user?.name || 'Profissional Autônomo'
  const title =
    profile?.professional_title || user?.profession || 'Prestador de Serviços Especializados'
  const phone = profile?.professional_phone || user?.phone
  const email = profile?.professional_email || user?.email
  const location = [profile?.city, profile?.state].filter(Boolean).join(' - ')

  const visibleQual = qualifications.filter((q) => q.show_in_cv !== false)
  const visibleExp = experiences.filter((e) => e.show_in_cv !== false)
  const visibleEdu = education.filter((e) => e.show_in_cv !== false)
  const visibleSrv = services.filter((s) => s.show_in_cv !== false)
  const visibleEq = equipment.filter((eq) => eq.show_in_cv !== false)

  const handleDownload = () => {
    downloadResumeBinaryPdf(
      user,
      profile,
      experiences,
      education,
      services,
      equipment,
      qualifications,
      {
        theme,
        showUpdatedAt: profile?.show_updated_at_in_cv ?? true,
      },
    )
  }

  const handlePrint = () => {
    openResumePdfInNewTab(
      user,
      profile,
      experiences,
      education,
      services,
      equipment,
      qualifications,
      {
        theme,
        showUpdatedAt: profile?.show_updated_at_in_cv ?? true,
      },
    )
  }

  const handleShare = () => {
    shareResumePdfFile(user, profile, experiences, education, services, equipment, qualifications, {
      theme,
      showUpdatedAt: profile?.show_updated_at_in_cv ?? true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
          <div>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Prévia da Apresentação Profissional
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Apresentação oficial de qualificações, áreas de atuação e serviços freelance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground mr-1">Estilo:</span>
            <Button
              type="button"
              variant={isBronze ? 'default' : 'outline'}
              size="sm"
              onClick={() => onThemeChange('bronze')}
              className={`text-xs h-7 px-2.5 ${
                isBronze ? 'bg-[#b07d4f] hover:bg-[#9a6b41] text-white' : ''
              }`}
            >
              Bronze Elegante
            </Button>
            <Button
              type="button"
              variant={!isBronze ? 'default' : 'outline'}
              size="sm"
              onClick={() => onThemeChange('bw')}
              className="text-xs h-7 px-2.5"
            >
              Econômico P&B
            </Button>
          </div>
        </DialogHeader>

        {/* Folha Estilizada simulando folha A4 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/40">
          <div
            className={`max-w-2xl mx-auto bg-background p-6 sm:p-8 rounded-lg shadow-md border ${
              isBronze ? 'border-[#b07d4f]/30' : 'border-border'
            } text-foreground space-y-6 text-sm`}
          >
            {/* Faixa superior */}
            <div
              className={`h-1.5 w-full rounded-full ${
                isBronze ? 'bg-[#b07d4f]' : 'bg-neutral-800'
              }`}
            />

            {/* 1. Nome e Apresentação Profissional */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/60">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                  Apresentação Profissional — Studio Freela
                </span>
                <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground">
                  {displayName}
                </h2>
                <p
                  className={`font-serif text-sm font-semibold ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  {title}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {location}
                    </span>
                  )}
                  {phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {phone}
                    </span>
                  )}
                  {email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {email}
                    </span>
                  )}
                </div>
              </div>

              {profile?.work_mode && (
                <Badge variant="outline" className="self-start text-xs uppercase">
                  {profile.work_mode}
                </Badge>
              )}
            </div>

            {/* Headline / Frase */}
            {profile?.headline && (
              <div
                className={`p-3 rounded-md text-xs italic ${
                  isBronze
                    ? 'bg-[#b07d4f]/10 text-foreground border border-[#b07d4f]/20'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                "{profile.headline}"
              </div>
            )}

            {/* Biografia / Resumo */}
            {profile?.bio && (
              <div className="space-y-1.5">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  Apresentação & Perfil
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* 2. Áreas de Atuação */}
            {(profile?.served_regions ||
              profile?.languages?.length ||
              profile?.years_experience) && (
              <div className="p-2.5 rounded border border-border/50 bg-muted/20 text-xs space-y-1">
                <span className="font-semibold text-foreground">
                  2. Áreas de Atuação & Disponibilidade:
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {[
                    profile?.years_experience
                      ? `${profile.years_experience} anos de experiência prática`
                      : '',
                    profile?.work_mode ? `Atendimento ${profile.work_mode}` : '',
                    profile?.travel_availability ? 'Disponível para viagens' : '',
                    profile?.served_regions ? `Regiões: ${profile.served_regions}` : '',
                    profile?.languages?.length ? `Idiomas: ${profile.languages.join(', ')}` : '',
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
              </div>
            )}

            {/* 3. Qualificações e Conhecimentos Específicos */}
            {visibleQual.length > 0 && (
              <div className="space-y-2">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  <Award className="w-3.5 h-3.5" /> 3. Qualificações e Conhecimentos Específicos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {visibleQual.map((qual, idx) => (
                    <div
                      key={qual.id || idx}
                      className="p-2.5 rounded border border-border/50 bg-muted/20 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{qual.name}</p>
                        {qual.level && (
                          <Badge variant="outline" className="text-[10px] capitalize py-0">
                            {qual.level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {[qual.category, qual.years_experience].filter(Boolean).join(' • ')}
                      </p>
                      {qual.practical_description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                          {qual.practical_description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Serviços Oferecidos */}
            {visibleSrv.length > 0 && (
              <div className="space-y-2">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  <Layers className="w-3.5 h-3.5" /> 4. Serviços Oferecidos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {visibleSrv.map((srv, idx) => (
                    <div
                      key={srv.id || idx}
                      className="p-2.5 rounded border border-border/50 bg-muted/20"
                    >
                      <p className="font-semibold text-foreground">{srv.name}</p>
                      {srv.short_description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {srv.short_description}
                        </p>
                      )}
                      {(srv.starting_price || srv.price_range) && (
                        <p
                          className={`text-[11px] font-medium mt-1 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                        >
                          {srv.starting_price
                            ? `A partir de ${formatCurrency(srv.starting_price)}`
                            : srv.price_range}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Últimas Empresas Onde Fiz Freelance */}
            {visibleExp.length > 0 && (
              <div className="space-y-2">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  <Briefcase className="w-3.5 h-3.5" /> 5. Últimas Empresas Onde Fiz Freelance
                </h3>
                <div className="space-y-2 text-xs">
                  {visibleExp.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="border-l-2 border-primary/40 pl-3 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {exp.role} • {exp.company_client}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {exp.period_or_year ||
                            (exp.current
                              ? `${exp.start_date || ''} - Atual`
                              : [exp.start_date, exp.end_date].filter(Boolean).join(' - '))}
                        </span>
                      </div>
                      {exp.service_type && (
                        <p
                          className={`text-[11px] font-medium ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                        >
                          Tipo de serviço: {exp.service_type}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Equipamentos Disponíveis */}
            {visibleEq.length > 0 && (
              <div className="space-y-2">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  <Wrench className="w-3.5 h-3.5" /> 6. Equipamentos Disponíveis para Locação
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {visibleEq.map((eq, idx) => (
                    <div
                      key={eq.id || idx}
                      className="p-2 rounded border border-border/50 bg-muted/20"
                    >
                      <p className="font-medium text-foreground">
                        {eq.name} ({eq.quantity} un.)
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[eq.brand, eq.model].filter(Boolean).join(' ')} •{' '}
                        {eq.condition || 'excelente'}
                      </p>
                      {eq.daily_rate ? (
                        <p
                          className={`text-[11px] font-medium mt-0.5 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                        >
                          Diária: {formatCurrency(eq.daily_rate)}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cursos & Certificações */}
            {visibleEdu.length > 0 && (
              <div className="space-y-2">
                <h3
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isBronze ? 'text-[#b07d4f]' : 'text-foreground'}`}
                >
                  <GraduationCap className="w-3.5 h-3.5" /> Cursos & Certificações
                </h3>
                <div className="space-y-1.5 text-xs">
                  {visibleEdu.map((edu, idx) => (
                    <div
                      key={edu.id || idx}
                      className="flex justify-between items-start border-b border-border/30 pb-1"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{edu.course_name}</p>
                        <p className="text-[11px] text-muted-foreground">{edu.institution}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {edu.period_or_year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Contatos & 8. Data de Atualização */}
            <div className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>7. Contatos Profissionais: {phone || email || 'Studio Freela'}</span>
              <span>
                {profile?.show_updated_at_in_cv !== false &&
                  `8. Atualizado em ${formatShortDate(new Date().toISOString())}`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/70 bg-card flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Fechar Prévia
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1 sm:flex-none text-xs gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-none text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              className="flex-1 sm:flex-none text-xs gap-1.5 bg-primary font-medium"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Apresentação Profissional
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
