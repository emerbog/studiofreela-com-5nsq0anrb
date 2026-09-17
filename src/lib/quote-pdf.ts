import { Quote, Client, UserProfile } from '@/types'
import { formatCurrency, formatShortDate } from '@/lib/formatters'
import { toast } from 'sonner'

export function generateQuotePdfFilename(quote: Quote, client?: Client): string {
  const cleanNumber = (quote.number || 'ORC-000000').replace(/[^a-zA-Z0-9_-]/g, '_')
  const clientName = (client?.name || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25)
  const eventName = (quote.eventName || 'Evento').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25)
  return `Studio-Freela_${cleanNumber}_${clientName}_${eventName}.pdf`
}

/**
 * Utilitário de escape de texto para streams PDF padrão (WinAnsiEncoding).
 * Normaliza acentos para caracteres compatíveis com fontes padrão Type1 (Helvetica)
 * para garantir compatibilidade com visualizadores e assinadores do ITI / GOV.BR.
 */
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
 * Aproximação da largura de texto em pontos usando média de proporções da Helvetica
 */
function estimateTextWidth(text: string, fontSize: number, bold: boolean = false): number {
  if (!text) return 0
  const factor = bold ? 0.54 : 0.5
  return text.length * fontSize * factor
}

/**
 * Divide um texto em linhas respeitando uma largura máxima em pontos
 */
function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  bold: boolean = false,
): string[] {
  if (!text) return []
  const clean = text.replace(/[\r\n]+/g, ' ').trim()
  if (!clean) return []

  const words = clean.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = estimateTextWidth(testLine, fontSize, bold)
    if (testWidth <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Se uma única palavra for maior que a largura, trunca ou força quebra
        lines.push(word)
        currentLine = ''
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

/**
 * Constrói um arquivo PDF binário real (formato PDF-1.4 compatível com assinadores ITI / GOV.BR)
 * com layout formal e profissional de 2 páginas A4 (595 x 842 pt).
 *
 * Correções de Layout Implementadas:
 * 1. Validade da proposta contida dentro da margem direita (badge de emissão/validade alinhado à direita de 555 pt).
 * 2. Tabela de serviços com colunas proporcionais, cabeçalhos legíveis e valores perfeitamente alinhados à direita.
 * 3. Descrições do calendário de pagamentos com quebra de linha (wrap) em 2 linhas, sem corte de texto.
 * 4. Tabela de parcelas do calendário com colunas claras e alinhadas: Parcela, Vencimento, Meio e Valor.
 * 5. Espaçamento vertical balanceado para "Disposições Gerais & Instruções de Assinatura Eletrônica", sem sobreposição.
 * 6. Instruções completas do GOV.BR formatadas com texto fluido dentro de caixa adaptável.
 * 7. Rodapé legal e notas pós-assinatura formatados em linhas limpas e bem posicionadas.
 * 8. Distribuição equilibrada do espaço entre as 2 páginas: página 1 inclui Escopo, Equipamentos e Condições Logísticas;
 *    página 2 inclui Calendário detalhado, Resumo Financeiro, Disposições GOV.BR e 2 áreas amplas de assinatura.
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
  const logistics = quote.logistics
  const overtime = quote.overtimeRule

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
  // Margens: esquerda 40 pt, direita 555 pt (largura útil 515 pt)
  // -------------------------------------------------------------
  const streamPage1: string[] = [
    'q',
    // Barra de destaque do topo
    '0.47 0.21 0.04 rg', // tom bronze Studio Freela
    '40 806 515 4 re f',

    // Cabeçalho Freelancer (lado esquerdo)
    'BT',
    '/F2 14 Tf',
    '0.47 0.21 0.04 rg',
    '40 786 Td',
    `(${pdfEscapeText(user?.name || 'STUDIO FREELA - SERVICOS PROFISSIONAIS')}) Tj`,
    'ET',

    'BT',
    '/F1 8.5 Tf',
    '0.35 0.35 0.35 rg',
    '40 773 Td',
    `(${pdfEscapeText(user?.profession || 'Prestacao de Servicos Especializados')}) Tj`,
    'ET',
    'BT',
    '/F1 8.5 Tf',
    '0.35 0.35 0.35 rg',
    '40 762 Td',
    `(${pdfEscapeText([user?.email, user?.phone, user?.cpfCnpj ? `Doc: ${user.cpfCnpj}` : ''].filter(Boolean).join(' • '))}) Tj`,
    'ET',

    // Bloco de Identificação e Validade (lado direito - cabe perfeitamente até a margem 555)
    // Número do Orçamento
    'BT',
    '/F2 11 Tf',
    '0.70 0.33 0.04 rg',
    '385 786 Td',
    `(${pdfEscapeText(`ORCAMENTO: ${quote.number || 'ORC-000000'}`)}) Tj`,
    'ET',

    // Emissão e Validade - linhas separadas para nunca cortar na margem direita
    'BT',
    '/F1 8 Tf',
    '0.30 0.30 0.30 rg',
    '385 773 Td',
    `(${pdfEscapeText(`Data de Emissao: ${emissionDate}`)}) Tj`,
    '/F2 8 Tf',
    '0.47 0.21 0.04 rg',
    '385 762 Td',
    `(${pdfEscapeText(`Validade: ${validUntilStr} (${validDays} dias)`)}) Tj`,
    'ET',

    // Linha divisória do cabeçalho
    '0.85 0.85 0.85 RG',
    '1 w',
    '40 750 m 555 750 l S',
  ]

  // 1. PARTES ENVOLVIDAS (Contratado & Contratante)
  streamPage1.push(
    '0.97 0.96 0.95 rg',
    '40 682 515 60 re f',
    '0.86 0.82 0.77 RG',
    '0.8 w',
    '40 682 515 60 re S',

    // Contratado
    'BT',
    '/F2 8.5 Tf',
    '0.60 0.20 0.07 rg',
    '50 728 Td',
    '(PRESTADOR / CONTRATADO:) Tj',
    'ET',
    'BT',
    '/F2 8.5 Tf',
    '0.15 0.15 0.15 rg',
    '50 715 Td',
    `(${pdfEscapeText(user?.name || 'Profissional Studio Freela')}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '50 703 Td',
    `(${pdfEscapeText(user?.profession || 'Prestador Autonomo')}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '50 691 Td',
    `(${pdfEscapeText([user?.email, user?.phone].filter(Boolean).join(' • '))}) Tj`,
    'ET',

    // Contratante
    'BT',
    '/F2 8.5 Tf',
    '0.60 0.20 0.07 rg',
    '310 728 Td',
    '(CLIENTE / CONTRATANTE:) Tj',
    'ET',
    'BT',
    '/F2 8.5 Tf',
    '0.15 0.15 0.15 rg',
    '310 715 Td',
    `(${pdfEscapeText((client?.name || 'Cliente').slice(0, 42))}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '310 703 Td',
    `(${pdfEscapeText(`Doc: ${client?.document || 'N/I'} • Tel: ${client?.phone || 'N/I'}`)}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.35 0.35 0.35 rg',
    '310 691 Td',
    `(${pdfEscapeText(client?.email ? `Email: ${client.email}` : client?.tradeName ? `Fantasia: ${client.tradeName}` : 'Conforme cadastro comercial')}) Tj`,
    'ET',
  )

  // 2. CRONOGRAMA E DADOS DO PROJETO / EVENTO
  streamPage1.push(
    'BT',
    '/F2 9.5 Tf',
    '0.47 0.21 0.04 rg',
    '40 662 Td',
    '(1. DADOS DO PROJETO & CRONOGRAMA) Tj',
    'ET',

    '0.98 0.98 0.98 rg',
    '40 616 515 42 re f',
    '0.88 0.88 0.88 RG',
    '0.8 w',
    '40 616 515 42 re S',

    'BT',
    '/F2 8.5 Tf',
    '0.15 0.15 0.15 rg',
    '50 644 Td',
    `(${pdfEscapeText(`Projeto/Evento: ${quote.eventName || 'Servico Comercial Sob Demanda'}`)}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.30 0.30 0.30 rg',
    '50 632 Td',
    `(${pdfEscapeText(`Periodo: ${quote.eventStartDate ? formatShortDate(quote.eventStartDate) : emissionDate} as ${quote.eventStartTime || '09:00'} ate ${quote.eventEndDate ? formatShortDate(quote.eventEndDate) : emissionDate} as ${quote.eventEndTime || '18:00'}`)}) Tj`,
    'ET',
    'BT',
    '/F1 8 Tf',
    '0.30 0.30 0.30 rg',
    '50 622 Td',
    `(${pdfEscapeText(`Local de Execucao: ${quote.eventLocation || 'A definir / Conforme alinhamento previo com o cliente'}`)}) Tj`,
    'ET',
  )

  // 3. ESCOPO DOS SERVIÇOS CONTRATADOS
  // Largura útil total: 515 pt (de X=40 até X=555).
  // Distribuição de colunas:
  // - Descrição: 40 até 330 (largura 290 pt)
  // - Quantidade: 335 até 375 (largura 40 pt, texto em 355)
  // - Unidade: 375 até 415 (largura 40 pt, texto em 385)
  // - Unitário: 415 até 485 (largura 70 pt, texto em 480 alinhado à direita)
  // - Total: 485 até 555 (largura 70 pt, texto em 550 alinhado à direita)
  streamPage1.push(
    'BT',
    '/F2 9.5 Tf',
    '0.47 0.21 0.04 rg',
    '40 596 Td',
    '(2. ESCOPO DOS SERVICOS CONTRATADOS) Tj',
    'ET',

    // Cabeçalho da tabela de serviços
    '0.91 0.91 0.91 rg',
    '40 576 515 16 re f',
    '0.80 0.80 0.80 RG',
    '0.8 w',
    '40 576 515 16 re S',

    'BT',
    '/F2 8 Tf',
    '0.20 0.20 0.20 rg',
    '46 580 Td',
    '(DESCRICAO DO SERVICO) Tj',
    'ET',
    'BT',
    '/F2 8 Tf',
    '0.20 0.20 0.20 rg',
    '330 580 Td',
    '(QTD) Tj',
    'ET',
    'BT',
    '/F2 8 Tf',
    '0.20 0.20 0.20 rg',
    '365 580 Td',
    '(UN.) Tj',
    'ET',
    'BT',
    '/F2 8 Tf',
    '0.20 0.20 0.20 rg',
    '432 580 Td',
    '(UNITARIO) Tj',
    'ET',
    'BT',
    '/F2 8 Tf',
    '0.20 0.20 0.20 rg',
    '518 580 Td',
    '(TOTAL) Tj',
    'ET',
  )

  let curY = 562
  const maxServicesToShow = Math.min(items.length, 7)

  for (let i = 0; i < maxServicesToShow; i++) {
    const it = items[i]
    const qty = Number(it.quantity) || 1
    const unitPrice = Number(it.unitPrice) || 0
    const itemTotal = qty * unitPrice

    const descLines = wrapText(it.description || 'Servico sob demanda', 270, 8, false).slice(0, 2)
    const rowHeight = descLines.length > 1 ? 22 : 16

    // Fundo zebrado sutil
    if (i % 2 === 1) {
      streamPage1.push(`0.98 0.98 0.98 rg 40 ${curY - (rowHeight - 13)} 515 ${rowHeight} re f`)
    }

    // Linha inferior divisória
    streamPage1.push(
      '0.90 0.90 0.90 RG',
      '0.5 w',
      `40 ${curY - (rowHeight - 13)} m 555 ${curY - (rowHeight - 13)} l S`,
    )

    // Descrição
    streamPage1.push(
      'BT',
      '/F1 8 Tf',
      '0.15 0.15 0.15 rg',
      `46 ${curY} Td`,
      `(${pdfEscapeText(descLines[0])}) Tj`,
    )
    if (descLines[1]) {
      streamPage1.push(`46 ${curY - 9} Td`, `(${pdfEscapeText(descLines[1])}) Tj`)
    }
    streamPage1.push('ET')

    // Quantidade, Unidade, Unitário e Total alinhados com blocos BT...ET isolados
    const unitPriceStr = formatCurrency(unitPrice)
    const itemTotalStr = formatCurrency(itemTotal)

    // Ajusta coordenadas X para ficarem perfeitamente alinhadas à direita dentro da respectiva coluna
    const unitPriceX = 472 - estimateTextWidth(unitPriceStr, 8, false)
    const itemTotalX = 550 - estimateTextWidth(itemTotalStr, 8, true)

    // Quantidade (coluna 325 a 355)
    streamPage1.push('BT', '/F1 8 Tf', '0.20 0.20 0.20 rg', `335 ${curY} Td`, `(${qty}) Tj`, 'ET')

    // Unidade (coluna 358 a 395)
    streamPage1.push(
      'BT',
      '/F1 8 Tf',
      '0.20 0.20 0.20 rg',
      `366 ${curY} Td`,
      `(${pdfEscapeText((it.unit || 'sv').slice(0, 8))}) Tj`,
      'ET',
    )

    // Unitário alinhado à direita em 472 (coluna 398 a 472)
    streamPage1.push(
      'BT',
      '/F1 8 Tf',
      '0.20 0.20 0.20 rg',
      `${unitPriceX} ${curY} Td`,
      `(${pdfEscapeText(unitPriceStr)}) Tj`,
      'ET',
    )

    // Total alinhado à direita em 550 (coluna 475 a 550)
    streamPage1.push(
      'BT',
      '/F2 8 Tf',
      '0.15 0.15 0.15 rg',
      `${itemTotalX} ${curY} Td`,
      `(${pdfEscapeText(itemTotalStr)}) Tj`,
      'ET',
    )

    curY -= rowHeight
  }

  if (items.length > maxServicesToShow) {
    streamPage1.push(
      'BT',
      '/F1 7.5 Tf',
      '0.45 0.45 0.45 rg',
      `46 ${curY - 2} Td`,
      `(${pdfEscapeText(`... e mais ${items.length - maxServicesToShow} item(ns) detalhados no anexo comercial`)}) Tj`,
      'ET',
    )
    curY -= 14
  }

  // 4. TABELA DE EQUIPAMENTOS (se houver no orçamento)
  if (equipments.length > 0 && curY > 230) {
    curY -= 12
    streamPage1.push(
      'BT',
      '/F2 9.5 Tf',
      '0.47 0.21 0.04 rg',
      `40 ${curY} Td`,
      '(3. EQUIPAMENTOS & ESTRUTURA FORNECIDA) Tj',
      'ET',
    )
    curY -= 16

    streamPage1.push(
      '0.91 0.91 0.91 rg',
      `40 ${curY} 515 15 re f`,
      '0.80 0.80 0.80 RG',
      '0.8 w',
      `40 ${curY} 515 15 re S`,
      'BT',
      '/F2 7.5 Tf',
      '0.20 0.20 0.20 rg',
      `46 ${curY + 4} Td`,
      '(ITEM / EQUIPAMENTO) Tj',
      'ET',
      'BT',
      '/F2 7.5 Tf',
      '0.20 0.20 0.20 rg',
      `335 ${curY + 4} Td`,
      '(QTD) Tj',
      'ET',
      'BT',
      '/F2 7.5 Tf',
      '0.20 0.20 0.20 rg',
      `415 ${curY + 4} Td`,
      '(STATUS / VALOR) Tj',
      'ET',
      'BT',
      '/F2 7.5 Tf',
      '0.20 0.20 0.20 rg',
      `515 ${curY + 4} Td`,
      '(TOTAL) Tj',
      'ET',
    )
    curY -= 12

    const maxEqToShow = Math.min(equipments.length, 3)
    for (let e = 0; e < maxEqToShow; e++) {
      const eq = equipments[e]
      const eqQty = Number(eq.quantity) || 1
      const eqUnit = Number(eq.unitPrice) || 0
      const eqTotal = eq.includedInService ? 0 : eqQty * eqUnit
      const eqTotalStr = eq.includedInService ? 'Incluso' : formatCurrency(eqTotal)
      const eqStatusStr = eq.includedInService ? 'Incluso no servico' : formatCurrency(eqUnit)
      const eqTotalX = 550 - estimateTextWidth(eqTotalStr, 7.5, !eq.includedInService)

      streamPage1.push(
        '0.92 0.92 0.92 RG',
        '0.5 w',
        `40 ${curY - 2} m 555 ${curY - 2} l S`,
        'BT',
        '/F1 7.5 Tf',
        '0.20 0.20 0.20 rg',
        `46 ${curY + 1} Td`,
        `(${pdfEscapeText(eq.description.slice(0, 50))}) Tj`,
        'ET',
        'BT',
        '/F1 7.5 Tf',
        '0.20 0.20 0.20 rg',
        `340 ${curY + 1} Td`,
        `(${eqQty}) Tj`,
        'ET',
        'BT',
        '/F1 7.5 Tf',
        '0.20 0.20 0.20 rg',
        `410 ${curY + 1} Td`,
        `(${pdfEscapeText(eqStatusStr)}) Tj`,
        'ET',
        'BT',
        '/F2 7.5 Tf',
        eq.includedInService ? '0.20 0.55 0.25 rg' : '0.15 0.15 0.15 rg',
        `${eqTotalX} ${curY + 1} Td`,
        `(${pdfEscapeText(eqTotalStr)}) Tj`,
        'ET',
      )
      curY -= 13
    }
  }

  // 5. CONDIÇÕES CONTRATUAIS & LOGÍSTICA (Hora Extra, Refeição, Transporte, Hospedagem)
  // Preenche harmonicamente o terço inferior da página 1 evitando grandes espaços vazios
  curY -= 12
  const boxHeight = 70
  streamPage1.push(
    'BT',
    '/F2 9.5 Tf',
    '0.47 0.21 0.04 rg',
    `40 ${curY} Td`,
    '(4. CONDICOES CONTRATUAIS, HORA EXTRA & LOGISTICA) Tj',
    'ET',
  )
  curY -= boxHeight + 6

  // Caixa de logística
  streamPage1.push(
    '0.97 0.97 0.98 rg',
    `40 ${curY} 515 ${boxHeight} re f`,
    '0.85 0.85 0.88 RG',
    '0.8 w',
    `40 ${curY} 515 ${boxHeight} re S`,
  )

  const overtimeText = overtime?.enabled
    ? `Hora extra: ${formatCurrency(overtime.hourlyRate)}/h com tolerancia de ${overtime.graceMinutes || 0} min.`
    : 'Hora extra: Nao prevista ou sob consulta previa.'

  const mealText =
    logistics?.meal?.type === 'contractor'
      ? 'Alimentacao: Fornecida diretamente pelo contratante no local do evento.'
      : logistics?.meal?.type === 'contracted'
        ? `Alimentacao: Providenciada pelo profissional (${formatCurrency(logistics.meal.chargedAmount || 0)} incluso no total).`
        : 'Alimentacao: Nao se aplica a este escopo.'

  const transportText =
    logistics?.transport?.type === 'contractor'
      ? 'Transporte: Custos e deslocamentos sob responsabilidade direta do contratante.'
      : logistics?.transport?.type === 'contracted'
        ? `Transporte: Incluso no orcamento (${formatCurrency(logistics.transport.chargedAmount || 0)} incluso no total).`
        : 'Transporte: Nao se aplica ou sob responsabilidade do prestador.'

  const lodgingText =
    logistics?.lodging?.type === 'contractor'
      ? 'Hospedagem: Reservada e faturada diretamente pelo contratante.'
      : logistics?.lodging?.type === 'contracted'
        ? `Hospedagem: Inclusa no orcamento (${formatCurrency(logistics.lodging.chargedAmount || 0)} incluso no total).`
        : 'Hospedagem: Nao necessaria para esta prestacao.'

  streamPage1.push(
    'BT',
    '/F1 7.5 Tf',
    '0.25 0.25 0.25 rg',
    `50 ${curY + 54} Td`,
    `(${pdfEscapeText(`• ${overtimeText}`)}) Tj`,
    'ET',
    'BT',
    '/F1 7.5 Tf',
    '0.25 0.25 0.25 rg',
    `50 ${curY + 41} Td`,
    `(${pdfEscapeText(`• ${mealText}`)}) Tj`,
    'ET',
    'BT',
    '/F1 7.5 Tf',
    '0.25 0.25 0.25 rg',
    `50 ${curY + 28} Td`,
    `(${pdfEscapeText(`• ${transportText}`)}) Tj`,
    'ET',
    'BT',
    '/F1 7.5 Tf',
    '0.25 0.25 0.25 rg',
    `50 ${curY + 15} Td`,
    `(${pdfEscapeText(`• ${lodgingText}`)}) Tj`,
    'ET',
  )

  // Rodapé da Página 1
  streamPage1.push(
    '0.85 0.85 0.85 RG',
    '0.8 w',
    '40 45 m 555 45 l S',
    'BT',
    '/F1 7.5 Tf',
    '0.50 0.50 0.50 rg',
    '40 33 Td',
    `(${pdfEscapeText(`Studio Freela • Proposta ${quote.number || 'ORC'} • Pagina 1 de 2 • Continua na pagina 2 para condicoes financeiras e assinaturas`)}) Tj`,
    'ET',
    'Q',
  )

  // -------------------------------------------------------------
  // PÁGINA 2: CONDICOES FINANCEIRAS, TOTAIS E ÁREAS LIVRES GOV.BR
  // Altura total: 842 pt.
  // -------------------------------------------------------------
  const streamPage2: string[] = [
    'q',
    // Barra superior
    '0.47 0.21 0.04 rg',
    '40 806 515 4 re f',

    // Título do topo da página 2
    'BT',
    '/F2 11 Tf',
    '0.47 0.21 0.04 rg',
    '40 786 Td',
    `(${pdfEscapeText(`PROPOSTA COMERCIAL ${quote.number || 'ORC'} - CONDICOES FINANCEIRAS & ASSINATURA`)}) Tj`,
    'ET',

    // Linha fina de separação
    '0.85 0.85 0.85 RG',
    '0.8 w',
    '40 774 m 555 774 l S',

    // Título da Seção Financeira
    'BT',
    '/F2 9.5 Tf',
    '0.47 0.21 0.04 rg',
    '40 758 Td',
    '(5. CALENDARIO DE PAGAMENTO & RESUMO CONSOLIDADO) Tj',
    'ET',
  ]

  // TABELA DO CALENDÁRIO (Lado Esquerdo: X 40 a 345 = 305 pt de largura)
  // Distribuição de colunas calibradas:
  // - Parcela/Descrição: 40 a 160 (largura 120 pt) - quebra fluida em 2 linhas
  // - Vencimento: 160 a 225 (largura 65 pt, texto em 165)
  // - Meio de Pagamento: 225 a 275 (largura 50 pt, texto em 228)
  // - Valor da Parcela: 275 a 345 (largura 70 pt, alinhado à direita em 340)
  streamPage2.push(
    '0.91 0.91 0.91 rg',
    '40 736 305 16 re f',
    '0.80 0.80 0.80 RG',
    '0.8 w',
    '40 736 305 16 re S',

    // Cabeçalhos isolados em blocos BT...ET para evitar acumulação de deslocamento
    'BT',
    '/F2 7.5 Tf',
    '0.20 0.20 0.20 rg',
    '46 740 Td',
    '(PARCELA / DESCRICAO) Tj',
    'ET',
    'BT',
    '/F2 7.5 Tf',
    '0.20 0.20 0.20 rg',
    '165 740 Td',
    '(VENCIMENTO) Tj',
    'ET',
    'BT',
    '/F2 7.5 Tf',
    '0.20 0.20 0.20 rg',
    '228 740 Td',
    '(MEIO) Tj',
    'ET',
    'BT',
    '/F2 7.5 Tf',
    '0.20 0.20 0.20 rg',
    '306 740 Td',
    '(VALOR) Tj',
    'ET',
  )

  let schedY = 720
  const maxSchedItems = Math.min(schedule.length, 4)

  if (schedule.length === 0) {
    // Linha única padrão se não houver calendário configurado
    const defaultValStr = formatCurrency(grandTotal)
    const defaultValX = 340 - estimateTextWidth(defaultValStr, 7.5, true)
    streamPage2.push(
      '0.90 0.90 0.90 RG',
      '0.5 w',
      `40 ${schedY - 4} m 345 ${schedY - 4} l S`,
      'BT',
      '/F1 7.5 Tf',
      '0.20 0.20 0.20 rg',
      `46 ${schedY} Td`,
      '(A combinar na aprovacao) Tj',
      'ET',
      'BT',
      '/F1 7.5 Tf',
      '0.25 0.25 0.25 rg',
      `165 ${schedY} Td`,
      `(${emissionDate}) Tj`,
      'ET',
      'BT',
      '/F1 7.5 Tf',
      '0.25 0.25 0.25 rg',
      `228 ${schedY} Td`,
      '(PIX) Tj',
      'ET',
      'BT',
      '/F2 7.5 Tf',
      '0.15 0.15 0.15 rg',
      `${defaultValX} ${schedY} Td`,
      `(${pdfEscapeText(defaultValStr)}) Tj`,
      'ET',
    )
    schedY -= 20
  } else {
    for (let s = 0; s < maxSchedItems; s++) {
      const sc = schedule[s]
      // Envolve descrição para não truncar
      const descLines = wrapText(sc.description || `Parcela ${s + 1}`, 115, 7.5, false).slice(0, 2)
      const rowH = descLines.length > 1 ? 22 : 16

      streamPage2.push(
        '0.92 0.92 0.92 RG',
        '0.5 w',
        `40 ${schedY - (rowH - 12)} m 345 ${schedY - (rowH - 12)} l S`,
      )

      // Descrição
      streamPage2.push(
        'BT',
        '/F1 7.5 Tf',
        '0.20 0.20 0.20 rg',
        `46 ${schedY} Td`,
        `(${pdfEscapeText(descLines[0])}) Tj`,
        'ET',
      )
      if (descLines[1]) {
        streamPage2.push(
          'BT',
          '/F1 7.5 Tf',
          '0.20 0.20 0.20 rg',
          `46 ${schedY - 9} Td`,
          `(${pdfEscapeText(descLines[1])}) Tj`,
          'ET',
        )
      }

      // Vencimento, Meio de Pagamento e Valor em blocos BT...ET isolados
      const valStr = formatCurrency(Number(sc.value) || 0)
      const valX = 340 - estimateTextWidth(valStr, 7.5, true)
      const dueDateStr = sc.dueDate ? formatShortDate(sc.dueDate) : 'Na aprovacao'
      const methodStr = sc.method ? String(sc.method) : 'PIX'

      streamPage2.push(
        // Vencimento
        'BT',
        '/F1 7.5 Tf',
        '0.25 0.25 0.25 rg',
        `165 ${schedY} Td`,
        `(${pdfEscapeText(dueDateStr)}) Tj`,
        'ET',
        // Meio de pagamento
        'BT',
        '/F1 7.5 Tf',
        '0.25 0.25 0.25 rg',
        `228 ${schedY} Td`,
        `(${pdfEscapeText(methodStr)}) Tj`,
        'ET',
        // Valor da parcela alinhado à direita
        'BT',
        '/F2 7.5 Tf',
        '0.15 0.15 0.15 rg',
        `${valX} ${schedY} Td`,
        `(${pdfEscapeText(valStr)}) Tj`,
        'ET',
      )

      schedY -= rowH
    }
  }

  // CAIXA DE TOTAIS E RESUMO CONSOLIDADO (Lado Direito: X 355 a 555 = 200 pt de largura)
  // Alinhada com a tabela de calendário, do topo Y=752 até Y=646 (altura = 106 pt).
  // Distribuição vertical calibrada sem sobreposição:
  // - Topo do box: 752
  // - Cabeçalho do box (faixa colorida): Y=736 a 752 (altura 16 pt), texto em Y=741
  // - Linha 1 (Serviços): Y=723
  // - Linha 2 (Equipamentos): Y=710
  // - Linha 3 (Despesas/Logística): Y=697
  // - Linha 4 (Descontos se houver): Y=684
  // - Linha divisória: Y=678
  // - Total Geral: Y=660
  const summaryBoxY = 646
  const summaryBoxHeight = 106
  streamPage2.push(
    // Fundo do box
    '0.98 0.97 0.95 rg',
    `355 ${summaryBoxY} 200 ${summaryBoxHeight} re f`,
    '0.85 0.78 0.70 RG',
    '0.8 w',
    `355 ${summaryBoxY} 200 ${summaryBoxHeight} re S`,

    // Faixa de cabeçalho do box
    '0.93 0.89 0.83 rg',
    '355 736 200 16 re f',
    '0.85 0.78 0.70 RG',
    '0.5 w',
    '355 736 m 555 736 l S',

    // Título do box (dentro da faixa de cabeçalho Y=741)
    'BT',
    '/F2 8 Tf',
    '0.47 0.21 0.04 rg',
    '365 741 Td',
    '(RESUMO FINANCEIRO) Tj',
    'ET',

    // Linha 1: Serviços
    'BT',
    '/F1 7.5 Tf',
    '0.30 0.30 0.30 rg',
    '365 723 Td',
    `(${pdfEscapeText(`Servicos: ${formatCurrency(servicesSubtotal)}`)}) Tj`,
    'ET',

    // Linha 2: Equipamentos
    'BT',
    '/F1 7.5 Tf',
    '0.30 0.30 0.30 rg',
    '365 710 Td',
    `(${pdfEscapeText(`Equipamentos: ${formatCurrency(equipmentsSubtotal)}`)}) Tj`,
    'ET',

    // Linha 3: Despesas / Logística
    'BT',
    '/F1 7.5 Tf',
    '0.30 0.30 0.30 rg',
    '365 697 Td',
    `(${pdfEscapeText(`Despesas/Logistica: ${formatCurrency(expensesSubtotal)}`)}) Tj`,
    'ET',
  )

  if (discounts > 0) {
    streamPage2.push(
      'BT',
      '/F1 7.5 Tf',
      '0.75 0.20 0.10 rg',
      '365 684 Td',
      `(${pdfEscapeText(`Desconto Comercial: -${formatCurrency(discounts)}`)}) Tj`,
      'ET',
    )
  }

  // Linha separadora do total
  streamPage2.push(
    '0.80 0.50 0.30 RG',
    '0.8 w',
    '365 678 m 545 678 l S',

    // Destaque do TOTAL GERAL
    'BT',
    '/F2 11 Tf',
    '0.47 0.21 0.04 rg',
    '365 660 Td',
    `(${pdfEscapeText(`TOTAL: ${formatCurrency(grandTotal)}`)}) Tj`,
    'ET',
  )

  // 6. DISPOSIÇÕES GERAIS & INSTRUÇÕES DE ASSINATURA ELETRÔNICA GOV.BR
  // Problema 5 & 6 resolvidos: posicionamento Y explícito (sem sobreposição com a tabela acima)
  // A tabela do calendário e o box de totais terminam por volta de Y=645.
  // Colocamos o box de Disposições em Y=570 com altura 64 pt (de 570 a 634), deixando folga segura.
  const dispBoxY = 572
  const dispBoxHeight = 62
  streamPage2.push(
    '0.96 0.96 0.97 rg',
    `40 ${dispBoxY} 515 ${dispBoxHeight} re f`,
    '0.84 0.84 0.88 RG',
    '0.8 w',
    `40 ${dispBoxY} 515 ${dispBoxHeight} re S`,

    // Título das Disposições Gerais
    'BT',
    '/F2 8 Tf',
    '0.30 0.30 0.35 rg',
    `48 ${dispBoxY + 48} Td`,
    '(DISPOSICOES GERAIS & INSTRUCOES DE ASSINATURA ELETRONICA:) Tj',
    'ET',

    // Textos informativos instruindo sobre o GOV.BR de ponta a ponta sem cortes
    'BT',
    '/F1 7.5 Tf',
    '0.30 0.30 0.30 rg',
    `48 ${dispBoxY + 35} Td`,
    '(1. Documento preparado para assinatura eletronica oficial nos termos da Lei Federal 14.063/2020.) Tj',
    `48 ${dispBoxY + 23} Td`,
    '(2. Para assinar: acesse assinador.iti.br com sua conta GOV.BR (nivel prata ou ouro) e posicione o carimbo na area abaixo.) Tj',
    `48 ${dispBoxY + 11} Td`,
    '(3. A validade juridica e autenticidade poderao ser verificadas publicamente a qualquer momento em validar.iti.gov.br.) Tj',
    'ET',
  )

  // 7. SEÇÃO DE ASSINATURAS ELETRÔNICAS GOV.BR
  // Requisito GOV.BR / ITI: 2 áreas livres de carimbo (mínimo ~3.5 a 4 cm de altura livre).
  // Altura disponível: de Y=70 até Y=560 = 490 pt!
  // Distribuímos confortavelmente:
  // - Título "ASSINATURAS ELETRÔNICAS": Y=554
  // - Área 1 (Contratante): Y=424 a Y=544 (altura 120 pt = 4.23 cm)
  // - Área 2 (Contratado): Y=290 a Y=410 (altura 120 pt = 4.23 cm)
  // - Texto explicativo / nota de rodapé: Y=264 a 240
  // - Espaço livre harmonioso e sem sobreposição até o rodapé oficial da página (Y=45).
  streamPage2.push(
    'BT',
    '/F2 9.5 Tf',
    '0.47 0.21 0.04 rg',
    '40 552 Td',
    '(6. ASSINATURAS ELETRONICAS - CONTRATANTE & CONTRATADO) Tj',
    'ET',
  )

  // --- ÁREA 1: CONTRATANTE (CLIENTE) ---
  // Caixa com 120 pt (~4.23 cm livres)
  const box1Y = 422
  const boxHeightSig = 118
  streamPage2.push(
    '0.99 0.99 0.99 rg',
    `40 ${box1Y} 515 ${boxHeightSig} re f`,
    '0.75 0.75 0.75 RG',
    '0.8 w',
    `40 ${box1Y} 515 ${boxHeightSig} re S`,

    // Identificador no topo da caixa (discreto)
    'BT',
    '/F2 8 Tf',
    '0.30 0.30 0.30 rg',
    `48 ${box1Y + 104} Td`,
    '([ Area livre para posicionamento do carimbo eletronico do CONTRATANTE / CLIENTE via GOV.BR ]) Tj',
    'ET',

    // Dados na base da caixa
    'BT',
    '/F1 7.5 Tf',
    '0.35 0.35 0.35 rg',
    `48 ${box1Y + 32} Td`,
    `(${pdfEscapeText(`Nome/Razao Social: ${client?.name || 'Cliente'}`)}) Tj`,
    `48 ${box1Y + 20} Td`,
    `(${pdfEscapeText(`CPF/CNPJ: ${client?.document || '_________________________'}`)}) Tj`,
    `48 ${box1Y + 8} Td`,
    '(Data da Assinatura: _____ / _____ / _________) Tj',
    'ET',
  )

  // --- ÁREA 2: CONTRATADO (PRESTADOR) ---
  // Caixa com 118 pt (~4.16 cm livres)
  const box2Y = 286
  streamPage2.push(
    '0.99 0.99 0.99 rg',
    `40 ${box2Y} 515 ${boxHeightSig} re f`,
    '0.75 0.75 0.75 RG',
    '0.8 w',
    `40 ${box2Y} 515 ${boxHeightSig} re S`,

    // Identificador no topo da caixa (discreto)
    'BT',
    '/F2 8 Tf',
    '0.30 0.30 0.30 rg',
    `48 ${box2Y + 104} Td`,
    '([ Area livre para posicionamento do carimbo eletronico do CONTRATADO / PRESTADOR via GOV.BR ]) Tj',
    'ET',

    // Dados na base da caixa
    'BT',
    '/F1 7.5 Tf',
    '0.35 0.35 0.35 rg',
    `48 ${box2Y + 32} Td`,
    `(${pdfEscapeText(`Nome/Razao Social: ${user?.name || 'Studio Freela'}`)}) Tj`,
    `48 ${box2Y + 20} Td`,
    `(${pdfEscapeText(`CPF/CNPJ: ${user?.cpfCnpj || '_________________________'}`)}) Tj`,
    `48 ${box2Y + 8} Td`,
    '(Data da Assinatura: _____ / _____ / _________) Tj',
    'ET',
  )

  // 8. TEXTO EXPLICATIVO APÓS AS ASSINATURAS (Problema 7 resolvido: sem fragmentação/corte)
  streamPage2.push(
    'BT',
    '/F1 7 Tf',
    '0.45 0.45 0.45 rg',
    '40 262 Td',
    '(Nota Legal: Este documento foi emitido e formatado digitalmente para aceite comercial e assinatura eletronica.) Tj',
    '40 252 Td',
    '(Apos a conferencia dos dados pelo Contratante e Contratado, utilize o servico oficial de Assinatura Eletronica do GOV.BR.) Tj',
    '40 242 Td',
    '(A integridade e o nao-repudio deste arquivo apos assinado podem ser atestados publicamente no portal oficial VALIDAR do ITI.) Tj',
    'ET',
  )

  // Rodapé da Página 2
  streamPage2.push(
    '0.85 0.85 0.85 RG',
    '0.8 w',
    '40 45 m 555 45 l S',
    'BT',
    '/F1 7.5 Tf',
    '0.50 0.50 0.50 rg',
    '40 33 Td',
    `(${pdfEscapeText(`Studio Freela (studiofreela.com) • Proposta Comercial #${quote.number || 'ORC'} • Pagina 2 de 2 • Preparado para GOV.BR / ITI`)}) Tj`,
    'ET',
    'Q',
  )

  // Montagem canônica do PDF em sintaxe PDF-1.4
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

    // Instrument usage event
    import('@/services/adminService')
      .then(({ adminService }) => {
        adminService.logUsageEvent('pdf_generated', { type: 'quote', quote_id: quote.id })
      })
      .catch(() => {})
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
