import {
  UserProfile,
  ProfessionalProfileData,
  ProfessionalExperience,
  ProfessionalEducation,
  ProfessionalService,
  ProfessionalEquipment,
  ResumeBlockConfig,
} from '@/types'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { toast } from 'sonner'

export type ResumePdfTheme = 'bronze' | 'bw'

export interface ResumePdfOptions {
  theme?: ResumePdfTheme
  showUpdatedAt?: boolean
  selectedBlocks?: ResumeBlockConfig[]
}

export function generateResumePdfFilename(
  user?: UserProfile | null,
  profProfile?: ProfessionalProfileData | null,
): string {
  const name = profProfile?.commercial_name || user?.name || 'Profissional'
  const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
  const dateStr = new Date().toISOString().split('T')[0]
  return `Curriculo_${cleanName}_StudioFreela_${dateStr}.pdf`
}

function pdfEscapeText(text: string): string {
  if (!text) return ''
  const asciiText = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
  return asciiText
}

/**
 * Constrói o PDF binário canônico PDF-1.4 de 2 páginas de currículo profissional
 */
export function buildResumeBinaryPdfBlob(
  user: UserProfile | null,
  profile: ProfessionalProfileData | null,
  experiences: ProfessionalExperience[],
  education: ProfessionalEducation[],
  services: ProfessionalService[],
  equipment: ProfessionalEquipment[],
  options: ResumePdfOptions = {},
): Blob {
  const isBronze = options.theme !== 'bw'
  const showDate = options.showUpdatedAt ?? profile?.show_updated_at_in_cv ?? true

  const primaryColorRg = isBronze ? '0.47 0.21 0.04' : '0.15 0.15 0.15'
  const accentColorRg = isBronze ? '0.70 0.33 0.04' : '0.30 0.30 0.30'
  const boxBgRg = isBronze ? '0.98 0.96 0.93' : '0.96 0.96 0.96'
  const boxBorderRg = isBronze ? '0.88 0.78 0.68' : '0.80 0.80 0.80'

  const displayName = profile?.commercial_name || user?.name || 'Profissional Autônomo'
  const title = profile?.professional_title || user?.profession || 'Especialista Freelancer'
  const headline = profile?.headline || ''
  const bio = profile?.bio || ''
  const phone = profile?.professional_phone || user?.phone || ''
  const email = profile?.professional_email || user?.email || ''
  const city = profile?.city || ''
  const state = profile?.state || ''
  const locationStr = [city, state].filter(Boolean).join(' - ') || 'Brasil'
  const regions = profile?.served_regions ? `Regiões: ${profile.served_regions}` : ''
  const workModeStr =
    profile?.work_mode === 'presencial'
      ? 'Presencial'
      : profile?.work_mode === 'remoto'
        ? 'Remoto'
        : profile?.work_mode === 'hibrido'
          ? 'Híbrido'
          : ''
  const yearsExp =
    profile?.years_experience !== undefined && profile.years_experience > 0
      ? `${profile.years_experience} anos de exp.`
      : ''
  const travelStr = profile?.travel_availability ? 'Disponível p/ viagens' : ''
  const languagesList = Array.isArray(profile?.languages) ? profile.languages.join(', ') : ''

  const visibleExp = experiences.filter((e) => e.show_in_cv !== false)
  const visibleEdu = education.filter((e) => e.show_in_cv !== false)
  const visibleSrv = services.filter((s) => s.show_in_cv !== false)
  const visibleEq = equipment.filter((eq) => eq.show_in_cv !== false)

  const updatedDateStr = formatShortDate(new Date().toISOString())

  // -------------------------------------------------------------
  // PÁGINA 1: Identificação, Resumo, Serviços e Experiências
  // -------------------------------------------------------------
  const streamPage1: string[] = [
    'q',
    // Barra superior
    `${primaryColorRg} rg`,
    '40 804 515 4 re f',

    // Nome
    'BT',
    '/F2 16 Tf',
    `${primaryColorRg} rg`,
    '40 782 Td',
    `(${pdfEscapeText(displayName.toUpperCase())}) Tj`,
    'ET',

    // Título profissional
    'BT',
    '/F2 10 Tf',
    `${accentColorRg} rg`,
    '40 768 Td',
    `(${pdfEscapeText(title)}) Tj`,
    'ET',

    // Contatos e localização (uma linha limpa)
    'BT',
    '/F1 8.5 Tf',
    '0.3 0.3 0.3 rg',
    '40 754 Td',
    `(${pdfEscapeText([locationStr, email, phone].filter(Boolean).join(' | '))}) Tj`,
    'ET',

    // Linha divisória
    '0.85 0.85 0.85 RG',
    '1 w',
    '40 744 m 555 744 l S',
  ]

  let curY = 730

  // Headline / Frase de destaque se houver
  if (headline) {
    streamPage1.push(
      `${boxBgRg} rg`,
      `40 ${curY - 18} 515 22 re f`,
      `${boxBorderRg} RG`,
      `40 ${curY - 18} 515 22 re S`,
      'BT',
      '/F2 8.5 Tf',
      `${accentColorRg} rg`,
      `48 ${curY - 6} Td`,
      `(${pdfEscapeText(`"${headline}"`)}) Tj`,
      'ET',
    )
    curY -= 28
  }

  // 1. Resumo Profissional / Biografia
  if (bio) {
    streamPage1.push(
      'BT',
      '/F2 9.5 Tf',
      `${primaryColorRg} rg`,
      `40 ${curY} Td`,
      '(RESUMO PROFISSIONAL) Tj',
      'ET',
    )
    curY -= 12

    // Quebra bio em fatias curtas
    const bioLines: string[] = []
    const words = bio.split(' ')
    let currentLine = ''
    for (const w of words) {
      if ((currentLine + ' ' + w).length > 95) {
        bioLines.push(currentLine.trim())
        currentLine = w
      } else {
        currentLine += (currentLine ? ' ' : '') + w
      }
      if (bioLines.length >= 3) break
    }
    if (currentLine && bioLines.length < 3) bioLines.push(currentLine.trim())

    for (const line of bioLines) {
      streamPage1.push(
        'BT',
        '/F1 8 Tf',
        '0.2 0.2 0.2 rg',
        `40 ${curY} Td`,
        `(${pdfEscapeText(line)}) Tj`,
        'ET',
      )
      curY -= 11
    }
    curY -= 6
  }

  // Tags informativas: anos de exp, modalidade, viagens, idiomas
  const metaTags = [
    yearsExp,
    workModeStr,
    travelStr,
    regions,
    languagesList ? `Idiomas: ${languagesList}` : '',
  ]
    .filter(Boolean)
    .join('  •  ')

  if (metaTags) {
    streamPage1.push(
      'BT',
      '/F1 7.5 Tf',
      '0.4 0.4 0.4 rg',
      `40 ${curY} Td`,
      `(${pdfEscapeText(metaTags)}) Tj`,
      'ET',
    )
    curY -= 16
  }

  // 2. Serviços e Especialidades
  if (visibleSrv.length > 0) {
    streamPage1.push(
      'BT',
      '/F2 9.5 Tf',
      `${primaryColorRg} rg`,
      `40 ${curY} Td`,
      '(SERVICOS & ESPECIALIDADES) Tj',
      'ET',
    )
    curY -= 12

    // Tabela resumida de serviços
    const maxServices = Math.min(visibleSrv.length, 5)
    for (let i = 0; i < maxServices; i++) {
      const s = visibleSrv[i]
      const priceText =
        s.starting_price && s.starting_price > 0
          ? `A partir de ${formatCurrency(s.starting_price)}`
          : s.price_range
            ? s.price_range
            : 'Sob consulta'
      const unitText = s.billing_unit ? `/${s.billing_unit}` : ''

      streamPage1.push(
        '0.95 0.95 0.95 RG',
        `40 ${curY - 3} m 555 ${curY - 3} l S`,
        'BT',
        '/F2 8 Tf',
        '0.15 0.15 0.15 rg',
        `44 ${curY} Td`,
        `(${pdfEscapeText(s.name.slice(0, 40))}) Tj`,
        '/F1 7.5 Tf',
        '0.45 0.45 0.45 rg',
        `240 ${curY} Td`,
        `(${pdfEscapeText((s.short_description || s.category || '').slice(0, 45))}) Tj`,
        '/F2 7.5 Tf',
        `${accentColorRg} rg`,
        `450 ${curY} Td`,
        `(${pdfEscapeText(`${priceText} ${unitText}`)}) Tj`,
        'ET',
      )
      curY -= 14
    }
    curY -= 8
  }

  // 3. Experiência Profissional
  if (visibleExp.length > 0) {
    streamPage1.push(
      'BT',
      '/F2 9.5 Tf',
      `${primaryColorRg} rg`,
      `40 ${curY} Td`,
      '(EXPERIENCIA PROFISSIONAL) Tj',
      'ET',
    )
    curY -= 14

    const maxExp = Math.min(visibleExp.length, 4)
    for (let i = 0; i < maxExp; i++) {
      const exp = visibleExp[i]
      const period = exp.current
        ? `${exp.start_date || ''} - Atual`
        : [exp.start_date, exp.end_date].filter(Boolean).join(' - ')

      streamPage1.push(
        'BT',
        '/F2 8.5 Tf',
        '0.15 0.15 0.15 rg',
        `40 ${curY} Td`,
        `(${pdfEscapeText(`${exp.role} • ${exp.company_client}`)}) Tj`,
        '/F1 7.5 Tf',
        '0.45 0.45 0.45 rg',
        `430 ${curY} Td`,
        `(${pdfEscapeText(period || exp.location_or_mode || '')}) Tj`,
        'ET',
      )
      curY -= 11

      if (exp.description) {
        streamPage1.push(
          'BT',
          '/F1 7.5 Tf',
          '0.3 0.3 0.3 rg',
          `48 ${curY} Td`,
          `(${pdfEscapeText(exp.description.slice(0, 110))}) Tj`,
          'ET',
        )
        curY -= 10
      }
      if (exp.results_projects) {
        streamPage1.push(
          'BT',
          '/F1 7 Tf',
          `${accentColorRg} rg`,
          `48 ${curY} Td`,
          `(${pdfEscapeText(`Destaque: ${exp.results_projects.slice(0, 100)}`)}) Tj`,
          'ET',
        )
        curY -= 10
      }
      curY -= 4
    }
  }

  // Rodapé da Página 1
  streamPage1.push(
    '0.85 0.85 0.85 RG',
    '40 45 m 555 45 l S',
    'BT',
    '/F1 7.5 Tf',
    '0.5 0.5 0.5 rg',
    '40 34 Td',
    `(${pdfEscapeText(`Studio Freela • Curriculo Profissional • ${displayName} • Pagina 1 de 2 • Continua na pagina 2`)}) Tj`,
    'ET',
    'Q',
  )

  // -------------------------------------------------------------
  // PÁGINA 2: Formação, Equipamentos para Locação, Links e Observações
  // -------------------------------------------------------------
  const streamPage2: string[] = [
    'q',
    `${primaryColorRg} rg`,
    '40 804 515 4 re f',

    'BT',
    '/F2 12 Tf',
    `${primaryColorRg} rg`,
    '40 782 Td',
    `(${pdfEscapeText(`${displayName.toUpperCase()} - FORMAÇÃO, EQUIPAMENTOS & CONTATOS`)}) Tj`,
    'ET',

    '0.85 0.85 0.85 RG',
    '1 w',
    '40 770 m 555 770 l S',
  ]

  let curY2 = 752

  // 4. Formação Acadêmica, Cursos & Certificações
  if (visibleEdu.length > 0) {
    streamPage2.push(
      'BT',
      '/F2 9.5 Tf',
      `${primaryColorRg} rg`,
      `40 ${curY2} Td`,
      '(FORMACAO ACADEMICA & CERTIFICACOES) Tj',
      'ET',
    )
    curY2 -= 14

    const maxEdu = Math.min(visibleEdu.length, 5)
    for (let i = 0; i < maxEdu; i++) {
      const ed = visibleEdu[i]
      streamPage2.push(
        'BT',
        '/F2 8.5 Tf',
        '0.15 0.15 0.15 rg',
        `40 ${curY2} Td`,
        `(${pdfEscapeText(`${ed.course_name} • ${ed.institution}`)}) Tj`,
        '/F1 7.5 Tf',
        '0.45 0.45 0.45 rg',
        `440 ${curY2} Td`,
        `(${pdfEscapeText(ed.period_or_year || '')}) Tj`,
        'ET',
      )
      curY2 -= 11

      if (ed.certificate_url) {
        streamPage2.push(
          'BT',
          '/F1 7 Tf',
          `${accentColorRg} rg`,
          `48 ${curY2} Td`,
          `(${pdfEscapeText(`Certificado/Link: ${ed.certificate_url.slice(0, 90)}`)}) Tj`,
          'ET',
        )
        curY2 -= 9
      }
      curY2 -= 3
    }
    curY2 -= 8
  }

  // 5. Equipamentos Disponíveis para Locação
  if (visibleEq.length > 0) {
    streamPage2.push(
      'BT',
      '/F2 9.5 Tf',
      `${primaryColorRg} rg`,
      `40 ${curY2} Td`,
      '(EQUIPAMENTOS PROPRIOS DISPONIVEIS PARA LOCACAO) Tj',
      'ET',
    )
    curY2 -= 14

    // Cabeçalho da tabela de equipamentos
    streamPage2.push(
      `${boxBgRg} rg`,
      `40 ${curY2 - 3} 515 14 re f`,
      'BT',
      '/F2 7.5 Tf',
      '0.2 0.2 0.2 rg',
      `46 ${curY2} Td`,
      '(ITEM / MODELO) Tj',
      `250 ${curY2} Td`,
      '(QTD / ESTADO) Tj',
      `360 ${curY2} Td`,
      '(OPERADOR) Tj',
      `460 ${curY2} Td`,
      '(DIARIA / EVENTO) Tj',
      'ET',
    )
    curY2 -= 15

    const maxEq = Math.min(visibleEq.length, 6)
    for (let i = 0; i < maxEq; i++) {
      const eq = visibleEq[i]
      const nameAndBrand = [eq.name, eq.brand, eq.model].filter(Boolean).join(' ')
      const rates: string[] = []
      if (eq.daily_rate && eq.daily_rate > 0) rates.push(`${formatCurrency(eq.daily_rate)}/d`)
      else if (eq.event_rate && eq.event_rate > 0) rates.push(`${formatCurrency(eq.event_rate)}/ev`)
      else rates.push('A combinar')

      const opStr = eq.needs_operator ? 'Exige tec.' : 'Disp. avulso'

      streamPage2.push(
        '0.95 0.95 0.95 RG',
        `40 ${curY2 - 3} m 555 ${curY2 - 3} l S`,
        'BT',
        '/F2 8 Tf',
        '0.15 0.15 0.15 rg',
        `46 ${curY2} Td`,
        `(${pdfEscapeText(nameAndBrand.slice(0, 38))}) Tj`,
        '/F1 7.5 Tf',
        '0.35 0.35 0.35 rg',
        `250 ${curY2} Td`,
        `(${pdfEscapeText(`${eq.quantity} un. (${eq.condition || 'bom'})`)}) Tj`,
        `360 ${curY2} Td`,
        `(${pdfEscapeText(opStr)}) Tj`,
        '/F2 7.5 Tf',
        `${accentColorRg} rg`,
        `460 ${curY2} Td`,
        `(${pdfEscapeText(rates.join(' | '))}) Tj`,
        'ET',
      )
      curY2 -= 14
    }
    curY2 -= 10
  }

  // 6. Canais Profissionais e Links
  const social = profile?.social_links || {}
  const linksList = [
    social.website ? `Site: ${social.website}` : '',
    social.instagram ? `Instagram: @${social.instagram.replace('@', '')}` : '',
    social.linkedin ? `LinkedIn: ${social.linkedin}` : '',
    social.youtube ? `YouTube: ${social.youtube}` : '',
    social.other ? `Outro: ${social.other}` : '',
  ].filter(Boolean)

  streamPage2.push(
    'BT',
    '/F2 9.5 Tf',
    `${primaryColorRg} rg`,
    `40 ${curY2} Td`,
    '(CANAIS DE CONTATO & LINKS PROFISSIONAIS) Tj',
    'ET',
  )
  curY2 -= 14

  streamPage2.push(
    `${boxBgRg} rg`,
    `40 ${curY2 - 28} 515 36 re f`,
    `${boxBorderRg} RG`,
    `40 ${curY2 - 28} 515 36 re S`,
    'BT',
    '/F1 8 Tf',
    '0.2 0.2 0.2 rg',
    `48 ${curY2 - 4} Td`,
    `(${pdfEscapeText(`E-mail: ${email || 'Sob demanda'}   |   WhatsApp: ${phone || 'Sob demanda'}`)}) Tj`,
    'ET',
  )

  if (linksList.length > 0) {
    streamPage2.push(
      'BT',
      '/F1 7.5 Tf',
      `${accentColorRg} rg`,
      `48 ${curY2 - 18} Td`,
      `(${pdfEscapeText(linksList.slice(0, 3).join('   •   '))}) Tj`,
      'ET',
    )
  }
  curY2 -= 46

  // 7. Observações Comerciais & Privacidade
  streamPage2.push(
    '0.97 0.97 0.97 rg',
    `40 ${curY2 - 24} 515 30 re f`,
    '0.90 0.90 0.90 RG',
    `40 ${curY2 - 24} 515 30 re S`,
    'BT',
    '/F2 7.5 Tf',
    '0.3 0.3 0.3 rg',
    `48 ${curY2 - 8} Td`,
    '(CONDICOES COMERCIAIS & NOTA DE PRIVACIDADE) Tj',
    'ET',
    'BT',
    '/F1 7 Tf',
    '0.4 0.4 0.4 rg',
    `48 ${curY2 - 18} Td`,
    '(Valores e condicoes informados sujeitos a confirmacao em proposta formal. Documento emitido sem exposicao de dados sigilosos.) Tj',
    'ET',
  )

  // Data de atualização no rodapé
  const footerDate = showDate ? ` • Atualizado em ${updatedDateStr}` : ''

  // Rodapé da Página 2
  streamPage2.push(
    '0.85 0.85 0.85 RG',
    '40 45 m 555 45 l S',
    'BT',
    '/F1 7.5 Tf',
    '0.5 0.5 0.5 rg',
    '40 34 Td',
    `(${pdfEscapeText(`Studio Freela (studiofreela.com) • Curriculo Profissional • Pagina 2 de 2${footerDate}`)}) Tj`,
    'ET',
    'Q',
  )

  // Montagem final do arquivo PDF binário
  const page1Content = streamPage1.join('\n')
  const page2Content = streamPage2.join('\n')

  const objects: string[] = []
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n')
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>\nendobj\n',
  )
  objects.push(
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>\nendobj\n',
  )
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n')
  objects.push(
    `7 0 obj\n<< /Length ${page1Content.length} >>\nstream\n${page1Content}\nendstream\nendobj\n`,
  )
  objects.push(
    `8 0 obj\n<< /Length ${page2Content.length} >>\nstream\n${page2Content}\nendstream\nendobj\n`,
  )

  let pdfString = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets: number[] = []

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdfString.length)
    pdfString += objects[i]
  }

  const xrefOffset = pdfString.length
  pdfString += 'xref\n'
  pdfString += `0 ${objects.length + 1}\n`
  pdfString += '0000000000 65535 f \n'
  for (let i = 0; i < offsets.length; i++) {
    pdfString += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`
  }

  pdfString += 'trailer\n'
  pdfString += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdfString += 'startxref\n'
  pdfString += `${xrefOffset}\n`
  pdfString += '%%EOF\n'

  const binaryLen = pdfString.length
  const bytes = new Uint8Array(binaryLen)
  for (let i = 0; i < binaryLen; i++) {
    bytes[i] = pdfString.charCodeAt(i) & 0xff
  }

  return new Blob([bytes], { type: 'application/pdf' })
}

/**
 * Baixa diretamente o arquivo PDF de currículo
 */
export function downloadResumeBinaryPdf(
  user: UserProfile | null,
  profile: ProfessionalProfileData | null,
  experiences: ProfessionalExperience[],
  education: ProfessionalEducation[],
  services: ProfessionalService[],
  equipment: ProfessionalEquipment[],
  options: ResumePdfOptions = {},
) {
  try {
    const blob = buildResumeBinaryPdfBlob(
      user,
      profile,
      experiences,
      education,
      services,
      equipment,
      options,
    )
    const filename = generateResumePdfFilename(user, profile)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast.success('Currículo em PDF baixado com sucesso!')

    // Instrument usage event
    import('@/services/adminService')
      .then(({ adminService }) => {
        adminService.logUsageEvent('resume_generated', { user_id: user?.id })
      })
      .catch(() => {})
  } catch (err: any) {
    console.error('Erro ao gerar PDF do currículo:', err)
    toast.error('Erro ao gerar arquivo PDF do currículo.')
  }
}

/**
 * Abre o PDF em nova aba para visualização e impressão
 */
export function openResumePdfInNewTab(
  user: UserProfile | null,
  profile: ProfessionalProfileData | null,
  experiences: ProfessionalExperience[],
  education: ProfessionalEducation[],
  services: ProfessionalService[],
  equipment: ProfessionalEquipment[],
  options: ResumePdfOptions = {},
) {
  try {
    const blob = buildResumeBinaryPdfBlob(
      user,
      profile,
      experiences,
      education,
      services,
      equipment,
      options,
    )
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (err: any) {
    console.error('Erro ao abrir PDF:', err)
    toast.error('Erro ao abrir visualização do PDF.')
  }
}

/**
 * Compartilha o arquivo PDF no celular ou realiza download com fallback
 */
export async function shareResumePdfFile(
  user: UserProfile | null,
  profile: ProfessionalProfileData | null,
  experiences: ProfessionalExperience[],
  education: ProfessionalEducation[],
  services: ProfessionalService[],
  equipment: ProfessionalEquipment[],
  options: ResumePdfOptions = {},
) {
  const filename = generateResumePdfFilename(user, profile)
  const blob = buildResumeBinaryPdfBlob(
    user,
    profile,
    experiences,
    education,
    services,
    equipment,
    options,
  )
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: `Currículo Profissional - ${profile?.commercial_name || user?.name || 'Studio Freela'}`,
        text: `Apresento meu currículo profissional e portfólio de serviços.`,
      })
      toast.success('Currículo compartilhado com sucesso!')
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.warn('Falha no compartilhamento nativo:', err)
    }
  }

  // Fallback: download direto
  downloadResumeBinaryPdf(user, profile, experiences, education, services, equipment, options)
  toast.info(
    'Compartilhamento nativo de arquivo indisponível neste navegador. O PDF foi baixado diretamente.',
  )
}
