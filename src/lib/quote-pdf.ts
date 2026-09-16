import { Quote, Client, UserProfile } from '@/types'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/formatters'
import { toast } from 'sonner'

export function generateQuotePdfFilename(quote: Quote, client?: Client): string {
  const cleanNumber = (quote.number || 'ORC-000000').replace(/[^a-zA-Z0-9_-]/g, '_')
  const clientName = (client?.name || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25)
  const eventName = (quote.eventName || 'Evento').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25)
  return `Studio-Freela_${cleanNumber}_${clientName}_${eventName}.pdf`
}

/**
 * Utilitário de escape de texto para streams PDF padrão (WinAnsiEncoding)
 */
function pdfEscapeText(text: string): string {
  if (!text) return ''
  // Normaliza acentos para compatibilidade com fontes Helvetica padrão de PDFs do ITI / GOV.BR
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
 * Constrói um arquivo PDF binário real (formato PDF-1.4 compatível com assinadores ITI / GOV.BR)
 * com layout formal de 2 páginas:
 * Página 1: Cabeçalho, Partes, Escopo de Serviços, Equipamentos e Cronograma
 * Página 2: Resumo Financeiro, Condições Gerais, e ÁREAS RESERVADAS GOV.BR (4cm livres)
 */
export function buildQuoteBinaryPdfBlob(
  quote: Quote,
  client?: Client,
  user?: UserProfile | null,
): Blob {
  const emissionDate = quote.date
    ? formatShortDate(quote.date)
    : formatShortDate(new Date().toISOString())
  const validDays = quote.validityDays || 15
  const validUntilDate = new Date(quote.date ? new Date(quote.date) : new Date())
  validUntilDate.setDate(validUntilDate.getDate() + validDays)
  const validUntilStr = formatShortDate(validUntilDate.toISOString())

  const items = quote.items || []
  const equipments = quote.equipments || []
  const schedule = quote.paymentSchedule || []

  const servicesSubtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  )
  const equipmentsSubtotal = equipments.reduce((acc, eq) => {
    if (eq.includedInService) return acc
    return acc + (Number(eq.quantity) || 0) * (Number(eq.unitPrice) || 0)
  }, 0)

  let expensesSubtotal = 0
  if (quote.logistics?.meal?.type === 'contracted')
    expensesSubtotal += Number(quote.logistics.meal.chargedAmount) || 0
  if (quote.logistics?.transport?.type === 'contracted')
    expensesSubtotal += Number(quote.logistics.transport.chargedAmount) || 0
  if (quote.logistics?.lodging?.type === 'contracted')
    expensesSubtotal += Number(quote.logistics.lodging.chargedAmount) || 0

  const discounts = quote.priceSummary?.discounts || 0
  const grandTotal =
    quote.total || servicesSubtotal + equipmentsSubtotal + expensesSubtotal - discounts

  // -------------------------------------------------------------
  // PÁGINA 1: OPERAÇÕES DE STREAM
  // -------------------------------------------------------------
  const streamPage1: string[] = [
    'q',
    // Barra de destaque do topo
    '0.47 0.21 0.04 rg', // tom bronze Studio Freela
    '40 802 515 4 re f',

    // Cabeçalho
    'BT',
    '/F2 16 Tf',
    '0.47 0.21 0.04 rg',
    '40 780 Td',
    `(${pdfEscapeText(user?.name || 'STUDIO FREELA - SERVICOS PROFISSIONAIS')}) Tj`,
    'ET',

    'BT',
    '/F1 9 Tf',
    '0.35 0.35 0.35 rg',
    '40 766 Td',
    `(${pdfEscapeText(user?.profession || 'Prestacao de Servicos Especializados')} | ${pdfEscapeText(user?.email || '')} ${pdfEscapeText(user?.phone ? ' | ' + user.phone : '')}) Tj`,
    'ET',

    // Caixa de identificação da proposta (canto superior direito)
    'BT',
    '/F2 12 Tf',
    '0.70 0.33 0.04 rg',
    '400 780 Td',
    `(${pdfEscapeText(quote.number || 'ORC-000000')}) Tj`,
    'ET',

    'BT',
    '/F1 8.5 Tf',
    '0.3 0.3 0.3 rg',
    '400 766 Td',
    `(${pdfEscapeText(`Emissao: ${emissionDate} | Validade: ${validUntilStr} (${validDays}d)`)}) Tj`,
    'ET',

    // Linha divisória
    '0.85 0.85 0.85 RG',
    '1 w',
    '40 754 m 555 754 l S',

    // 1. PARTES ENVOLVIDAS
    '0.96 0.95 0.94 rg',
    '40 682 515 62 re f',
    '0.85 0.80 0.75 RG',
    '40 682 515 62 re S',

    'BT',
    '/F2 9 Tf',
    '0.60 0.20 0.07 rg',
    '50 730 Td',
    '(CONTRATADO / PRESTADOR:) Tj',
    'ET',
    'BT',
    '/F1 8.5 Tf',
    '0.15 0.15 0.15 rg',
    '50 716 Td',
    `(${pdfEscapeText(user?.name || 'Profissional Studio Freela')}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '50 702 Td',
    `(${pdfEscapeText(user?.profession || 'Prestador Autonomo')} - ${pdfEscapeText(user?.email || '')}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.60 0.20 0.07 rg',
    '310 730 Td',
    '(CONTRATANTE / CLIENTE:) Tj',
    'ET',
    'BT',
    '/F1 8.5 Tf',
    '0.15 0.15 0.15 rg',
    '310 716 Td',
    `(${pdfEscapeText(client?.name || 'Cliente')} ${pdfEscapeText(client?.tradeName ? '(' + client.tradeName + ')' : '')}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '310 702 Td',
    `(${pdfEscapeText(`Doc: ${client?.document || 'N/I'} | Tel: ${client?.phone || 'N/I'}`)}) Tj`,
    'ET',

    // 2. CRONOGRAMA E EVENTO
    'BT',
    '/F2 10 Tf',
    '0.47 0.21 0.04 rg',
    '40 662 Td',
    '(1. DADOS DO PROJETO & CRONOGRAMA) Tj',
    'ET',

    '0.98 0.98 0.98 rg',
    '40 606 515 48 re f',
    '0.88 0.88 0.88 RG',
    '40 606 515 48 re S',

    'BT',
    '/F2 9 Tf',
    '0.15 0.15 0.15 rg',
    '50 638 Td',
    `(${pdfEscapeText(`Projeto/Evento: ${quote.eventName || 'Servico Comercial Sob Demanda'}`)}) Tj`,
    'ET',
    'BT',
    '/F1 8.5 Tf',
    '0.3 0.3 0.3 rg',
    '50 624 Td',
    `(${pdfEscapeText(`Inicio: ${quote.eventStartDate ? formatShortDate(quote.eventStartDate) : emissionDate} as ${quote.eventStartTime || '09:00'} | Termino: ${quote.eventEndDate ? formatShortDate(quote.eventEndDate) : emissionDate} as ${quote.eventEndTime || '18:00'}`)}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '50 612 Td',
    `(${pdfEscapeText(`Local: ${quote.eventLocation || 'A definir / Conforme alinhamento'}`)}) Tj`,
    'ET',

    // 3. ESCOPO DOS SERVIÇOS
    'BT',
    '/F2 10 Tf',
    '0.47 0.21 0.04 rg',
    '40 586 Td',
    '(2. ESCOPO DOS SERVICOS CONTRATADOS) Tj',
    'ET',

    // Cabeçalho da tabela de serviços
    '0.92 0.92 0.92 rg',
    '40 564 515 16 re f',
    'BT',
    '/F2 8 Tf',
    '0.2 0.2 0.2 rg',
    '46 568 Td',
    '(ITEM / DESCRICAO DO SERVICO) Tj',
    '330 568 Td',
    '(UN.) Tj',
    '370 568 Td',
    '(QTD) Tj',
    '430 568 Td',
    '(UNITARIO) Tj',
    '490 568 Td',
    '(TOTAL) Tj',
    'ET',
  ]

  // Linhas da tabela de serviços na página 1
  let currentY = 548
  const maxItems = Math.min(items.length, 10)
  for (let i = 0; i < maxItems; i++) {
    const it = items[i]
    const itemTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
    streamPage1.push(
      '0.97 0.97 0.97 RG',
      `40 ${currentY - 4} m 555 ${currentY - 4} l S`,
      'BT',
      '/F1 8 Tf',
      '0.15 0.15 0.15 rg',
      `46 ${currentY} Td`,
      `(${pdfEscapeText(it.description.slice(0, 50))}) Tj`,
      `330 ${currentY} Td`,
      `(${pdfEscapeText(it.unit || 'sv')}) Tj`,
      `375 ${currentY} Td`,
      `(${it.quantity}) Tj`,
      `425 ${currentY} Td`,
      `(${pdfEscapeText(formatCurrency(it.unitPrice))}) Tj`,
      `490 ${currentY} Td`,
      `(${pdfEscapeText(formatCurrency(itemTotal))}) Tj`,
      'ET',
    )
    currentY -= 16
  }

  // Rodapé da Página 1 com instrução de continuidade
  streamPage1.push(
    '0.85 0.85 0.85 RG',
    '40 45 m 555 45 l S',
    'BT',
    '/F1 7.5 Tf',
    '0.5 0.5 0.5 rg',
    '40 34 Td',
    `(${pdfEscapeText(`Studio Freela • Proposta ${quote.number || 'ORC'} • Pagina 1 de 2 • Continua na pagina 2 para resumo e assinatura GOV.BR`)}) Tj`,
    'ET',
    'Q',
  )

  // -------------------------------------------------------------
  // PÁGINA 2: CONDICOES, TOTAIS E ÁREAS LIVRES GOV.BR
  // -------------------------------------------------------------
  const streamPage2: string[] = [
    'q',
    // Barra superior
    '0.47 0.21 0.04 rg',
    '40 802 515 4 re f',

    'BT',
    '/F2 11 Tf',
    '0.47 0.21 0.04 rg',
    '40 782 Td',
    `(${pdfEscapeText(`PROPOSTA COMERCIAL ${quote.number || 'ORC'} - CONDICOES FINANCEIRAS & ASSINATURA`)}) Tj`,
    'ET',

    // 4. RESUMO FINANCEIRO E CALENDÁRIO
    'BT',
    '/F2 9.5 Tf',
    '0.2 0.2 0.2 rg',
    '40 760 Td',
    '(3. CALENDARIO DE PAGAMENTO & TOTAIS) Tj',
    'ET',

    // Tabela do calendário
    '0.94 0.94 0.94 rg',
    '40 738 310 16 re f',
    'BT',
    '/F2 8 Tf',
    '0.2 0.2 0.2 rg',
    '46 742 Td',
    '(PARCELA) Tj',
    '180 742 Td',
    '(VENCIMENTO) Tj',
    '255 742 Td',
    '(MEIO) Tj',
    '300 742 Td',
    '(VALOR) Tj',
    'ET',
  ]

  let schedY = 722
  for (let s = 0; s < Math.min(schedule.length, 4); s++) {
    const sc = schedule[s]
    streamPage2.push(
      '0.96 0.96 0.96 RG',
      `40 ${schedY - 3} m 350 ${schedY - 3} l S`,
      'BT',
      '/F1 8 Tf',
      '0.2 0.2 0.2 rg',
      `46 ${schedY} Td`,
      `(${pdfEscapeText(sc.description.slice(0, 24))}) Tj`,
      `180 ${schedY} Td`,
      `(${pdfEscapeText(formatShortDate(sc.dueDate))}) Tj`,
      `255 ${schedY} Td`,
      `(${pdfEscapeText(sc.method)}) Tj`,
      `295 ${schedY} Td`,
      `(${pdfEscapeText(formatCurrency(sc.value))}) Tj`,
      'ET',
    )
    schedY -= 15
  }

  // Caixa de Total Geral (lado direito)
  streamPage2.push(
    '0.98 0.96 0.93 rg',
    '365 675 190 79 re f',
    '0.88 0.75 0.60 RG',
    '365 675 190 79 re S',

    'BT',
    '/F1 8 Tf',
    '0.4 0.4 0.4 rg',
    '375 738 Td',
    `(${pdfEscapeText(`Servicos: ${formatCurrency(servicesSubtotal)}`)}) Tj`,
    '375 724 Td',
    `(${pdfEscapeText(`Equipamentos: ${formatCurrency(equipmentsSubtotal)}`)}) Tj`,
    '375 710 Td',
    `(${pdfEscapeText(`Despesas/Logistica: ${formatCurrency(expensesSubtotal)}`)}) Tj`,
    'ET',

    '0.80 0.50 0.30 RG',
    '375 700 m 545 700 l S',

    'BT',
    '/F2 11 Tf',
    '0.47 0.21 0.04 rg',
    '375 684 Td',
    `(${pdfEscapeText(`TOTAL: ${formatCurrency(grandTotal)}`)}) Tj`,
    'ET',

    // Observações legais sobre pré-contrato e assinatura GOV.BR
    '0.96 0.96 0.96 rg',
    '40 605 515 54 re f',
    '0.85 0.85 0.85 RG',
    '40 605 515 54 re S',

    'BT',
    '/F2 8.5 Tf',
    '0.3 0.3 0.3 rg',
    '48 644 Td',
    '(DISPOSICOES GERAIS & INSTRUCOES DE ASSINATURA ELETRONICA:) Tj',
    'ET',
    'BT',
    '/F1 7.5 Tf',
    '0.35 0.35 0.35 rg',
    '48 630 Td',
    '(1. Documento preparado para assinatura eletronica oficial via GOV.BR nos termos da Lei 14.063/2020.) Tj',
    '48 618 Td',
    '(2. Apos conferir os dados, acesse assinador.iti.br com sua conta prata ou ouro e posicione o carimbo na area abaixo.) Tj',
    '48 607 Td',
    '(3. A autenticidade podera ser verificada publicamente a qualquer momento em validar.iti.gov.br.) Tj',
    'ET',

    // =========================================================================
    // SEÇÃO DE ASSINATURAS ELETRÔNICAS GOV.BR
    // REQUISITO CRÍTICO: 2 áreas em branco com altura mínima aproximada de 4 cm (113 pt)
    // cada, SEM textos ou linhas atravessando a região de carimbo.
    // =========================================================================
    'BT',
    '/F2 10 Tf',
    '0.47 0.21 0.04 rg',
    '40 584 Td',
    '(ASSINATURAS ELETRONICAS) Tj',
    'ET',

    // --- ÁREA 1: CONTRATANTE (CLIENTE) ---
    // Altura: 115 pt (~4.05 cm). Caixa com borda discreta, interior completamente livre.
    '0.75 0.75 0.75 RG',
    '0.8 w',
    '40 445 515 125 re S',

    'BT',
    '/F2 8.5 Tf',
    '0.25 0.25 0.25 rg',
    '48 554 Td',
    '([ Area livre para assinatura eletronica do CONTRATANTE via GOV.BR ]) Tj',
    'ET',

    // Rótulos informativos na base da área
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '48 472 Td',
    `(${pdfEscapeText(`Nome/Razao social: ${client?.name || 'Cliente'}`)}) Tj`,
    '48 460 Td',
    `(${pdfEscapeText(`CPF/CNPJ: ${client?.document || '_________________________'}`)}) Tj`,
    '48 448 Td',
    '(Data: _____ / _____ / _________) Tj',
    'ET',

    // --- ÁREA 2: CONTRATADO (PRESTADOR) ---
    // Altura: 115 pt (~4.05 cm). Caixa com borda discreta, interior completamente livre.
    '0.75 0.75 0.75 RG',
    '0.8 w',
    '40 300 515 125 re S',

    'BT',
    '/F2 8.5 Tf',
    '0.25 0.25 0.25 rg',
    '48 409 Td',
    '([ Area livre para assinatura eletronica do CONTRATADO via GOV.BR ]) Tj',
    'ET',

    // Rótulos informativos na base da área
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '48 327 Td',
    `(${pdfEscapeText(`Nome/Razao social: ${user?.name || 'Studio Freela'}`)}) Tj`,
    '48 315 Td',
    `(${pdfEscapeText(`CPF/CNPJ: ${user?.cpfCnpj || user?.phone || '_________________________'}`)}) Tj`,
    '48 303 Td',
    '(Data: _____ / _____ / _________) Tj',
    'ET',

    // Nota final obrigatória conforme especificação
    'BT',
    '/F1 7 Tf',
    '0.45 0.45 0.45 rg',
    '40 270 Td',
    '(Documento preparado para assinatura eletronica. Apos conferir os dados, faca o download do PDF e utilize) Tj',
    '40 260 Td',
    '(o servico oficial de Assinatura Eletronica GOV.BR. A autenticidade do arquivo assinado podera ser verificada no VALIDAR.) Tj',
    'ET',

    // Rodapé da Página 2
    '0.85 0.85 0.85 RG',
    '40 45 m 555 45 l S',
    'BT',
    '/F1 7.5 Tf',
    '0.5 0.5 0.5 rg',
    '40 34 Td',
    `(${pdfEscapeText(`Studio Freela (studiofreela.com) • Proposta Comercial #${quote.number || 'ORC'} • Pagina 2 de 2 • Preparado para GOV.BR`)}) Tj`,
    'ET',
    'Q',
  )

  // Montagem do PDF em sintaxe canônica PDF-1.4
  const page1Content = streamPage1.join('\n')
  const page2Content = streamPage2.join('\n')

  const objects: string[] = []
  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  // Obj 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n')
  // Obj 3: Page 1
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>\nendobj\n',
  )
  // Obj 4: Page 2
  objects.push(
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>\nendobj\n',
  )
  // Obj 5: Font Regular
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n')
  // Obj 6: Font Bold
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n')
  // Obj 7: Stream Page 1
  objects.push(
    `7 0 obj\n<< /Length ${page1Content.length} >>\nstream\n${page1Content}\nendstream\nendobj\n`,
  )
  // Obj 8: Stream Page 2
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
 * Baixa diretamente o arquivo PDF real binário
 */
export function downloadQuoteBinaryPdf(quote: Quote, client?: Client, user?: UserProfile | null) {
  try {
    const blob = buildQuoteBinaryPdfBlob(quote, client, user)
    const filename = generateQuotePdfFilename(quote, client)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    toast.success('PDF do orçamento gerado e baixado com sucesso!')
  } catch (err: any) {
    console.error('Erro ao gerar PDF binário:', err)
    toast.error('Erro ao gerar arquivo PDF.')
  }
}

/**
 * Baixa o PDF e orienta para assinatura no GOV.BR
 */
export function downloadQuoteForGovBr(quote: Quote, client?: Client, user?: UserProfile | null) {
  downloadQuoteBinaryPdf(quote, client, user)
  toast.info('PDF pronto para assinatura!', {
    description:
      'Arquivo baixado com áreas de 4cm livres. Faça upload no Assinador GOV.BR (assinador.iti.br) com sua conta prata/ouro.',
    duration: 8000,
  })
}

/**
 * Abre o Assinador oficial GOV.BR em nova aba
 */
export function openGovBrSigner() {
  window.open('https://assinador.iti.br/', '_blank', 'noopener,noreferrer')
}

/**
 * Compartilha o arquivo PDF binário real nativamente via navigator.share({ files })
 * ou faz download automático quando indisponível.
 */
export async function shareQuotePdfFile(quote: Quote, client?: Client, user?: UserProfile | null) {
  const filename = generateQuotePdfFilename(quote, client)
  const blob = buildQuoteBinaryPdfBlob(quote, client, user)
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: `Orçamento ${quote.number} - Studio Freela`,
        text: `Segue proposta comercial #${quote.number} preparada para assinatura digital.`,
      })
      toast.success('Arquivo PDF compartilhado com sucesso!')
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.warn('Falha no compartilhamento nativo de arquivo:', err)
    }
  }

  // Fallback: download direto do arquivo
  downloadQuoteBinaryPdf(quote, client, user)
  toast.info(
    'Compartilhamento de arquivo indisponível neste navegador. O PDF foi baixado diretamente.',
  )
}

/**
 * Mantém compatibilidade com exportQuoteToPdf e shareQuotePdf existentes
 */
export function exportQuoteToPdf(
  quote: Quote,
  client?: Client,
  user?: UserProfile | null,
  action: 'view' | 'download' = 'download',
) {
  if (action === 'download') {
    downloadQuoteBinaryPdf(quote, client, user)
  } else {
    const blob = buildQuoteBinaryPdfBlob(quote, client, user)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }
}

export async function shareQuotePdf(quote: Quote, client?: Client, user?: UserProfile | null) {
  return shareQuotePdfFile(quote, client, user)
}
