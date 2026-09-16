import { Quote, Client, UserProfile } from '@/types'
import { formatCurrency, formatDate, formatShortDate } from '@/lib/formatters'
import { toast } from 'sonner'

export function generateQuotePdfFilename(quote: Quote): string {
  const cleanNumber = (quote.number || 'ORC').replace(/[^a-zA-Z0-9_-]/g, '_')
  const clientName = (quote.eventName || 'Proposta').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
  return `${cleanNumber}_${clientName}.pdf`
}

export function generateQuoteFullHtml(
  quote: Quote,
  client?: Client,
  user?: UserProfile | null,
): string {
  const emissionDate = quote.date ? formatDate(quote.date) : formatDate(new Date().toISOString())
  const validDays = quote.validityDays || 15

  // Calculate validity expiration date
  const validUntilDate = new Date(quote.date ? new Date(quote.date) : new Date())
  validUntilDate.setDate(validUntilDate.getDate() + validDays)
  const validUntilStr = formatDate(validUntilDate.toISOString())

  const items = quote.items || []
  const equipments = quote.equipments || []
  const overtime = quote.overtimeRule
  const logistics = quote.logistics
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
  if (logistics?.meal?.type === 'contracted')
    expensesSubtotal += Number(logistics.meal.chargedAmount) || 0
  if (logistics?.transport?.type === 'contracted')
    expensesSubtotal += Number(logistics.transport.chargedAmount) || 0
  if (logistics?.lodging?.type === 'contracted')
    expensesSubtotal += Number(logistics.lodging.chargedAmount) || 0

  const discounts = quote.priceSummary?.discounts || 0
  const grandTotal =
    quote.total || servicesSubtotal + equipmentsSubtotal + expensesSubtotal - discounts

  // Responsibility translations
  const mealRespText =
    logistics?.meal?.type === 'contractor'
      ? 'Fornecida / Paga diretamente pelo Contratante no local'
      : logistics?.meal?.type === 'contracted'
        ? `Cobrada no orçamento (${formatCurrency(logistics.meal.chargedAmount || 0)})`
        : 'Não se aplica'

  const transportRespText =
    logistics?.transport?.type === 'contractor'
      ? `Responsabilidade direta do Contratante (${logistics.transport.notes || 'transporte local ou aéreo fornecido'})`
      : logistics?.transport?.type === 'contracted'
        ? `Cobrado no orçamento (${formatCurrency(logistics.transport.chargedAmount || 0)})`
        : 'Não se aplica'

  const lodgingRespText =
    logistics?.lodging?.type === 'contractor'
      ? `Reserva e pagamento direto pelo Contratante (${logistics.lodging.nightsCount || 1} diária(s))`
      : logistics?.lodging?.type === 'contracted'
        ? `Cobrada no orçamento (${formatCurrency(logistics.lodging.chargedAmount || 0)})`
        : 'Não necessária'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta Comercial / Pré-Contrato - ${quote.number}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1c1917;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #b45309;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18pt;
      font-weight: 700;
      color: #78350f;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 8.5pt;
      color: #78716c;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .quote-badge {
      text-align: right;
    }
    .doc-type {
      font-size: 10pt;
      font-weight: 700;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-number {
      font-size: 13pt;
      font-weight: 700;
      color: #1c1917;
      margin-top: 2px;
    }
    .doc-meta {
      font-size: 8.5pt;
      color: #78716c;
      margin-top: 2px;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #fdfaf7;
      border: 1px solid #fed7aa;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .party-title {
      font-weight: 700;
      color: #9a3412;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      border-bottom: 1px dashed #fdba74;
      padding-bottom: 2px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #78350f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 14px 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .event-box {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 9pt;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 12px;
    }
    th {
      background: #f5f5f4;
      color: #44403c;
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
      border-bottom: 1px solid #d6d3d1;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f0f0ef;
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin: 10px 0 16px 0;
    }
    .totals-box {
      width: 280px;
      background: #fdfaf7;
      border: 1px solid #fed7aa;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 9pt;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: #57534e;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #b45309;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 11.5pt;
      font-weight: 700;
      color: #78350f;
    }
    .cond-box {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 8.5pt;
      line-height: 1.4;
      color: #44403c;
      margin-bottom: 14px;
    }
    .cond-item {
      margin-bottom: 4px;
    }
    .signature-area {
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 36px;
    }
    .signature-line {
      border-top: 1px solid #78716c;
      padding-top: 4px;
      text-align: center;
      font-size: 8.5pt;
      color: #44403c;
    }
    .footer-note {
      text-align: center;
      font-size: 7.5pt;
      color: #a8a29e;
      margin-top: 20px;
      border-top: 1px solid #e7e5e4;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div>
      <h1 class="brand-title">${user?.name || 'Studio Freela'}</h1>
      <div class="brand-sub">${user?.profession || 'Prestação de Serviços Especializados'}</div>
      <div style="font-size: 8.5pt; color: #57534e; margin-top: 4px;">
        ${user?.email ? `${user.email}` : ''} 
        ${user?.phone ? `• ${user.phone}` : ''}
      </div>
    </div>
    <div class="quote-badge">
      <div class="doc-type">Proposta Comercial / Pré-Contrato</div>
      <div class="doc-number">${quote.number}</div>
      <div class="doc-meta">Emissão: ${emissionDate}</div>
      <div class="doc-meta" style="color: #b45309; font-weight: 600;">Validade: ${validUntilStr} (${validDays} dias)</div>
    </div>
  </div>

  <!-- PARTES ENVOLVIDAS -->
  <div class="parties-grid">
    <div>
      <div class="party-title">Contratado (Prestador)</div>
      <strong>${user?.name || 'Profissional Studio Freela'}</strong><br>
      ${user?.profession ? `Especialidade: ${user.profession}<br>` : ''}
      ${user?.phone ? `WhatsApp: ${user.phone}<br>` : ''}
      ${user?.email ? `E-mail: ${user.email}<br>` : ''}
      ${user?.address ? `Endereço: ${user.address}` : ''}
    </div>
    <div>
      <div class="party-title">Contratante (Cliente)</div>
      <strong>${client?.name || 'Cliente'}</strong> ${client?.tradeName ? `(${client.tradeName})` : ''}<br>
      ${client?.document ? `CPF/CNPJ: ${client.document}<br>` : ''}
      ${client?.phone ? `Telefone: ${client.phone}<br>` : ''}
      ${client?.email ? `E-mail: ${client.email}<br>` : ''}
      ${client?.addressData?.street ? `Endereço: ${client.addressData.street}, ${client.addressData.number || 'S/N'} - ${client.addressData.city || ''}/${client.addressData.state || ''}` : ''}
    </div>
  </div>

  <!-- DADOS DO EVENTO / CRONOGRAMA -->
  <div class="section-title">1. Dados do Evento & Cronograma de Execução</div>
  <div class="event-box">
    <div>
      <strong>Evento:</strong> ${quote.eventName || 'Serviço sob demanda'}<br>
      <strong>Local:</strong> ${quote.eventLocation || 'A definir / Conforme alinhamento'}<br>
      ${quote.notes ? `<strong>Observações:</strong> ${quote.notes}` : ''}
    </div>
    <div>
      <strong>Início:</strong> ${quote.eventStartDate ? formatShortDate(quote.eventStartDate) : emissionDate} às ${quote.eventStartTime || '09:00'}<br>
      <strong>Término:</strong> ${quote.eventEndDate ? formatShortDate(quote.eventEndDate) : quote.eventStartDate ? formatShortDate(quote.eventStartDate) : emissionDate} às ${quote.eventEndTime || '18:00'}<br>
      <span style="display:inline-block; margin-top: 4px; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: 600; font-size: 7.5pt;">
        PRÉ-RESERVA DA DATA
      </span>
    </div>
  </div>

  <!-- SERVIÇOS -->
  <div class="section-title">2. Escopo dos Serviços Contratados</div>
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Descrição do Item / Atividade</th>
        <th class="text-center" style="width: 15%;">Unidade</th>
        <th class="text-center" style="width: 10%;">Qtd</th>
        <th class="text-right" style="width: 12%;">Valor Un.</th>
        <th class="text-right" style="width: 13%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (it) => `
        <tr>
          <td><strong>${it.description}</strong></td>
          <td class="text-center">${it.unit || 'serviço'}</td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-right">${formatCurrency(it.unitPrice)}</td>
          <td class="text-right"><strong>${formatCurrency(it.quantity * it.unitPrice)}</strong></td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <!-- EQUIPAMENTOS -->
  ${
    equipments.length > 0
      ? `
    <div class="section-title">3. Equipamentos e Infraestrutura Fornecidos</div>
    <table>
      <thead>
        <tr>
          <th style="width: 60%;">Equipamento / Especificação</th>
          <th class="text-center" style="width: 10%;">Qtd</th>
          <th class="text-center" style="width: 15%;">Condição</th>
          <th class="text-right" style="width: 15%;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${equipments
          .map(
            (eq) => `
          <tr>
            <td>${eq.description}</td>
            <td class="text-center">${eq.quantity}</td>
            <td class="text-center">${eq.includedInService ? '<span style="color:#15803d; font-weight:600;">Incluso</span>' : 'Locação'}</td>
            <td class="text-right">${eq.includedInService ? 'R$ 0,00' : formatCurrency(eq.unitPrice * eq.quantity)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `
      : ''
  }

  <!-- HORA EXTRA E LOGÍSTICA -->
  <div class="section-title">${equipments.length > 0 ? '4' : '3'}. Condições de Hora Extra & Logística</div>
  <div class="cond-box">
    ${
      overtime?.enabled
        ? `
      <div class="cond-item">
        <strong>Hora Extra Adicional:</strong> Fica convencionado o valor de <strong>${formatCurrency(overtime.hourlyRate)} por hora adicional</strong> excedente ao cronograma previsto, com tolerância inicial de <strong>${overtime.graceMinutes || 0} minutos</strong> gratuitos. ${overtime.notes || ''} <em>(Obs: cobrada em acerto posterior caso incorrida).</em>
      </div>
    `
        : '<div class="cond-item"><strong>Hora Extra:</strong> Não prevista / Conforme novo alinhamento entre as partes.</div>'
    }
    <div class="cond-item">
      <strong>Alimentação / Refeição:</strong> ${mealRespText}
    </div>
    <div class="cond-item">
      <strong>Transporte / Deslocamento:</strong> ${transportRespText}
    </div>
    <div class="cond-item">
      <strong>Hospedagem:</strong> ${lodgingRespText}
    </div>
  </div>

  <!-- TOTAIS -->
  <div class="totals-area">
    <div class="totals-box">
      <div class="totals-row">
        <span>Subtotal Serviços:</span>
        <span>${formatCurrency(servicesSubtotal)}</span>
      </div>
      ${
        equipmentsSubtotal > 0
          ? `
        <div class="totals-row">
          <span>Subtotal Equipamentos:</span>
          <span>${formatCurrency(equipmentsSubtotal)}</span>
        </div>
      `
          : ''
      }
      ${
        expensesSubtotal > 0
          ? `
        <div class="totals-row">
          <span>Despesas de Logística:</span>
          <span>${formatCurrency(expensesSubtotal)}</span>
        </div>
      `
          : ''
      }
      ${
        discounts > 0
          ? `
        <div class="totals-row" style="color: #15803d;">
          <span>Desconto Comercial:</span>
          <span>- ${formatCurrency(discounts)}</span>
        </div>
      `
          : ''
      }
      <div class="grand-total-row">
        <span>TOTAL GERAL:</span>
        <span>${formatCurrency(grandTotal)}</span>
      </div>
    </div>
  </div>

  <!-- CALENDÁRIO DE PAGAMENTO -->
  <div class="section-title">${equipments.length > 0 ? '5' : '4'}. Calendário e Forma de Pagamento</div>
  <table>
    <thead>
      <tr>
        <th style="width: 45%;">Descrição da Parcela</th>
        <th class="text-center" style="width: 25%;">Vencimento</th>
        <th class="text-center" style="width: 15%;">Meio</th>
        <th class="text-right" style="width: 15%;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${schedule
        .map(
          (sc) => `
        <tr>
          <td><strong>${sc.description}</strong></td>
          <td class="text-center">${formatDate(sc.dueDate)}</td>
          <td class="text-center">${sc.method}</td>
          <td class="text-right"><strong>${formatCurrency(sc.value)}</strong></td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>

  <!-- CLÁUSULAS RESUMIDAS DE PRÉ-CONTRATO -->
  <div class="section-title">${equipments.length > 0 ? '6' : '5'}. Disposições Gerais & Validade da Pré-Reserva</div>
  <div class="cond-box" style="font-size: 8pt; line-height: 1.35;">
    <p style="margin: 0 0 4px 0;"><strong>1. Validade da Pré-reserva:</strong> A data do evento permanecerá pré-reservada pelo prazo de validade desta proposta (${validDays} dias a contar da emissão). A confirmação definitiva da agenda ocorre mediante pagamento do sinal acordado ou assinatura deste instrumento.</p>
    <p style="margin: 0 0 4px 0;"><strong>2. Alterações de Escopo:</strong> Qualquer serviço, diária ou hora adicional solicitada além do estipulado será objeto de aditivo e cobrada conforme valores vigentes.</p>
    <p style="margin: 0 0 4px 0;"><strong>3. Cancelamento:</strong> Em caso de desistência imotivada pelo Contratante após a confirmação, o sinal poderá ser retido para cobertura de custos operacionais e reserva de data.</p>
    <p style="margin: 0;"><strong>4. Eficácia:</strong> Este documento constitui Proposta Comercial com força de Pré-contrato vinculante quando rubricado ou confirmado formalmente entre as partes.</p>
  </div>

  <!-- ÁREA DE ACEITE E ASSINATURA -->
  <div class="signature-area">
    <div style="font-size: 8.5pt; text-align: center; color: #57534e; margin-bottom: 8px;">
      De acordo com os termos, datas, escopo e valores apresentados nesta Proposta Comercial:
    </div>

    <div class="signature-grid">
      <div>
        <div class="signature-line">
          <strong>${user?.name || 'CONTRATADO (PRESTADOR)'}</strong><br>
          ${user?.profession || 'Prestador de Serviços'}
        </div>
      </div>
      <div>
        <div class="signature-line">
          <strong>${client?.name || 'CONTRATANTE'}</strong><br>
          CPF/CNPJ: ${client?.document || '________________________'}<br>
          Data: ____/____/________
        </div>
      </div>
    </div>
  </div>

  <div class="footer-note">
    Documento gerado eletronicamente por <strong>Studio Freela</strong> (studiofreela.com) • Proposta Comercial #${quote.number}
  </div>

</body>
</html>`
}

export function exportQuoteToPdf(
  quote: Quote,
  client?: Client,
  user?: UserProfile | null,
  action: 'view' | 'download' = 'download',
) {
  const html = generateQuoteFullHtml(quote, client, user)
  const filename = generateQuotePdfFilename(quote)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error(
      'O navegador bloqueou a abertura de nova janela. Permita popups para visualizar o PDF.',
    )
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  if (action === 'download') {
    printWindow.onload = () => {
      printWindow.document.title = filename
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 300)
    }
  } else {
    printWindow.onload = () => {
      printWindow.document.title = filename
      printWindow.focus()
    }
  }
}

export async function shareQuotePdf(quote: Quote, client?: Client, user?: UserProfile | null) {
  const title = `Proposta Comercial ${quote.number} - ${quote.eventName || 'Studio Freela'}`
  const text = `Segue a Proposta Comercial ${quote.number} para ${client?.name || 'o cliente'}, no valor de ${formatCurrency(quote.total)}.`

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: window.location.href,
      })
      toast.success('Proposta compartilhada com sucesso!')
      return
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        // Fallback to PDF export
        exportQuoteToPdf(quote, client, user, 'download')
      }
    }
  } else {
    // Fallback: copy share message or open print window
    try {
      await navigator.clipboard.writeText(
        `${title}\n${text}\nValor: ${formatCurrency(quote.total)}`,
      )
      toast.success('Resumo da proposta copiado para a área de transferência!')
      exportQuoteToPdf(quote, client, user, 'download')
    } catch (_) {
      exportQuoteToPdf(quote, client, user, 'download')
    }
  }
}
