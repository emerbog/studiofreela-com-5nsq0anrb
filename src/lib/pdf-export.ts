import { ContractFormData } from '@/types'
import { formatCurrency, formatDate } from './formatters'

function formatDocDate(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return '____/____/________'
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDateStr)) {
      const [y, m, d] = isoOrDateStr.split('-')
      return `${d}/${m}/${y}`
    }
    return formatDate(isoOrDateStr)
  } catch {
    return isoOrDateStr
  }
}

/**
 * Gera um nome seguro e descritivo de arquivo PDF baseado no nome do contratante
 * Ex: "Contrato-Prestacao-Servicos-EMPRESA-ABC.pdf"
 */
export function generateContractPdfFilename(clientName?: string, contractNumber?: string): string {
  const sanitize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
      .replace(/[^a-zA-Z0-9-_]/g, '-') // substitui caracteres inválidos por '-'
      .replace(/-+/g, '-') // colapsa hifens seguidos
      .replace(/^-|-$/g, '') // remove hifens nas pontas
      .toUpperCase()

  const safeClient = clientName ? sanitize(clientName) : 'CLIENTE'
  const safeNumber = contractNumber ? sanitize(contractNumber) : ''

  if (safeNumber) {
    return `Contrato-Prestacao-Servicos-${safeClient}-${safeNumber}.pdf`
  }
  return `Contrato-Prestacao-Servicos-${safeClient}.pdf`
}

/**
 * Escapa strings para uso seguro em HTML
 */
function escapeHtml(str?: string | number | null): string {
  if (str === undefined || str === null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Gera um documento HTML completo e estilizado para renderização ou impressão/PDF
 */
export function generateContractFullHtml(
  data: ContractFormData,
  contractNumber: string = 'CTR-NOVO',
  contractDate: string = new Date().toISOString(),
  contractStatus: string = 'Rascunho',
): string {
  const number = escapeHtml(contractNumber)
  const dateFormatted = escapeHtml(formatDocDate(contractDate))

  // Renderizar entregáveis
  const deliverablesHtml =
    data.deliverables && data.deliverables.length > 0
      ? data.deliverables
          .map(
            (d, idx) => `
          <tr>
            <td style="text-align: center; font-weight: 600; padding: 6px 10px; border: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: 'Times New Roman', Georgia, serif; font-size: 13px;">${escapeHtml(d.description || '____________________')}</td>
            <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 12px;">${escapeHtml(formatDocDate(d.date))}</td>
          </tr>
        `,
          )
          .join('')
      : `
        <tr>
          <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1;">1</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">____________________</td>
          <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1;">____/____/______</td>
        </tr>
        <tr>
          <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1;">2</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">____________________</td>
          <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1;">____/____/______</td>
        </tr>
      `

  // Renderizar parcelas
  const paymentScheduleHtml =
    data.paymentSchedule && data.paymentSchedule.length > 0
      ? data.paymentSchedule
          .map(
            (p, idx) => `
          <tr>
            <td style="text-align: center; font-weight: 600; padding: 6px 10px; border: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="text-align: right; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: 'Times New Roman', Georgia, serif; font-size: 13px; font-weight: 600;">R$ ${escapeHtml(typeof p.amount === 'number' ? formatCurrency(p.amount) : p.amount || '_______')}</td>
            <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 12px;">${escapeHtml(formatDocDate(p.date))}</td>
          </tr>
        `,
          )
          .join('')
      : `
        <tr>
          <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1;">1</td>
          <td style="text-align: right; padding: 6px 10px; border: 1px solid #cbd5e1;">R$ _______</td>
          <td style="text-align: center; padding: 6px 10px; border: 1px solid #cbd5e1;">____/____/______</td>
        </tr>
      `

  const totalValueDisplay =
    typeof data.totalValue === 'number'
      ? formatCurrency(data.totalValue)
      : data.totalValue || '____________________________'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Contrato de Prestação de Serviços - ${escapeHtml(data.clientName || 'Documento')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: 'Times New Roman', Georgia, serif;
        font-size: 10pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11.5pt;
      line-height: 1.55;
      color: #0f172a;
      background-color: #ffffff;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .contract-container {
      max-width: 100%;
      margin: 0 auto;
    }

    /* Cabeçalho */
    .header {
      text-align: center;
      padding-bottom: 14px;
      margin-bottom: 18px;
      border-bottom: 2px solid #0f172a;
    }

    .header-badge {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 4px;
    }

    .header-title {
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #0f172a;
      margin: 4px 0;
    }

    .header-meta {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      color: #64748b;
    }

    .header-meta strong {
      color: #0f172a;
    }

    /* Seções de Partes (Contratante / Contratado) */
    .parties-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    .parties-title {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }

    .grid-row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 3px;
    }

    .grid-col-50 {
      flex: 0 0 50%;
      max-width: 50%;
      margin-bottom: 3px;
    }

    .grid-col-100 {
      flex: 0 0 100%;
      max-width: 100%;
      margin-bottom: 3px;
    }

    .field-label {
      font-weight: 600;
      color: #334155;
    }

    .field-value {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 10.5pt;
      color: #0f172a;
    }

    /* Cláusulas */
    .clause {
      margin-top: 14px;
      margin-bottom: 14px;
      text-align: justify;
      page-break-inside: avoid;
    }

    .clause-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .clause-content {
      margin-bottom: 6px;
    }

    .highlight-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      margin: 6px 0;
      white-space: pre-line;
      font-size: 10.5pt;
      color: #1e293b;
    }

    .highlight-value {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 6px 10px;
      margin: 6px 0;
      font-size: 12pt;
      font-weight: bold;
      color: #0f172a;
    }

    /* Tabelas */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    table.data-table th {
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 600;
      color: #334155;
    }

    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
    }

    .list-style {
      padding-left: 20px;
      margin: 6px 0;
    }

    .list-style li {
      margin-bottom: 4px;
    }

    .indent-p {
      padding-left: 14px;
      margin-bottom: 3px;
    }

    .divider {
      border: none;
      border-top: 1px solid #cbd5e1;
      margin: 14px 0;
    }

    /* Assinaturas */
    .signatures-section {
      margin-top: 24px;
      page-break-inside: avoid;
    }

    .signatures-title {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 16px;
    }

    .meta-loc-date {
      display: flex;
      justify-content: space-between;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9.5pt;
      margin-bottom: 24px;
    }

    .sig-grid {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 26px;
    }

    .sig-block {
      flex: 1;
      text-align: center;
    }

    .sig-line {
      border-top: 1px solid #0f172a;
      padding-top: 6px;
    }

    .sig-line-light {
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
    }

    .sig-role {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 2px;
    }

    .sig-name {
      font-size: 10.5pt;
      color: #0f172a;
    }

    .sig-doc {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      color: #64748b;
    }

    .disclaimer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 7.5pt;
      color: #94a3b8;
      line-height: 1.4;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="contract-container">
    <!-- Cabeçalho -->
    <div class="header">
      <div class="header-badge">Instrumento Jurídico Particular</div>
      <h1 class="header-title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
      <div class="header-meta">
        Registro Interno: <strong>${number}</strong> &nbsp;|&nbsp; Data de Emissão: <strong>${dateFormatted}</strong> &nbsp;|&nbsp; Status: <strong>${escapeHtml(contractStatus)}</strong>
      </div>
    </div>

    <p style="font-weight: bold; margin-bottom: 10px;">Pelo presente instrumento particular, as partes abaixo identificadas:</p>

    <!-- CONTRATANTE -->
    <div class="parties-box">
      <div class="parties-title">CONTRATANTE</div>
      <div class="grid-row">
        <div class="grid-col-50">
          <span class="field-label">Nome/Razão Social:</span>
          <span class="field-value">${escapeHtml(data.clientName || '_______________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">CPF/CNPJ:</span>
          <span class="field-value">${escapeHtml(data.clientDoc || '_______________________________________________________')}</span>
        </div>
        <div class="grid-col-100">
          <span class="field-label">Endereço:</span>
          <span class="field-value">${escapeHtml(data.clientAddress || '_______________________________________________________')}</span>
        </div>
        <div class="grid-col-100">
          <span class="field-label">Representante Legal (se PJ):</span>
          <span class="field-value">${escapeHtml(data.clientLegalRep || '___________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">E-mail:</span>
          <span class="field-value">${escapeHtml(data.clientEmail || '_________________________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">Telefone:</span>
          <span class="field-value">${escapeHtml(data.clientPhone || '_______________________________________________________')}</span>
        </div>
      </div>
    </div>

    <!-- CONTRATADO -->
    <div class="parties-box">
      <div class="parties-title">CONTRATADO</div>
      <div class="grid-row">
        <div class="grid-col-50">
          <span class="field-label">Nome:</span>
          <span class="field-value">${escapeHtml(data.contractorName || '__________________________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">CPF:</span>
          <span class="field-value">${escapeHtml(data.contractorCpf || '___________________________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">RG:</span>
          <span class="field-value">${escapeHtml(data.contractorRg || '____________________________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">Profissão:</span>
          <span class="field-value">${escapeHtml(data.contractorProfession || '______________________________________________________')}</span>
        </div>
        <div class="grid-col-100">
          <span class="field-label">Endereço:</span>
          <span class="field-value">${escapeHtml(data.contractorAddress || '_______________________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">E-mail:</span>
          <span class="field-value">${escapeHtml(data.contractorEmail || '_________________________________________________________')}</span>
        </div>
        <div class="grid-col-50">
          <span class="field-label">Telefone:</span>
          <span class="field-value">${escapeHtml(data.contractorPhone || '_______________________________________________________')}</span>
        </div>
      </div>
    </div>

    <p style="margin: 10px 0;">Resolvem celebrar o presente <strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong>, que se regerá pelas cláusulas e condições a seguir.</p>

    <hr class="divider" />

    <!-- CLÁUSULA 1ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 1ª – DO OBJETO</h2>
      <p class="clause-content">O CONTRATADO compromete-se a prestar ao CONTRATANTE os seguintes serviços:</p>
      <div class="highlight-box">${escapeHtml(data.serviceScope || '____________________________________________________________________\n____________________________________________________________________')}</div>
      <p class="clause-content">Ficam excluídas do escopo deste contrato quaisquer atividades não descritas acima, salvo mediante ajuste formal entre as partes.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 2ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 2ª – DO PRAZO</h2>
      <p class="clause-content"><strong>Data de início dos serviços:</strong> ${escapeHtml(formatDocDate(data.startDate))}</p>
      <p class="clause-content"><strong>Data prevista para conclusão:</strong> ${escapeHtml(formatDocDate(data.endDate))}</p>
      <p class="clause-content">A prorrogação do prazo deverá ocorrer mediante acordo entre as partes, preferencialmente por escrito.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 3ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 3ª – DAS ENTREGAS</h2>
      <p class="clause-content">O CONTRATADO deverá entregar:</p>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 15%; text-align: center;">Entregável</th>
            <th style="text-align: left;">Descrição</th>
            <th style="width: 25%; text-align: center;">Data</th>
          </tr>
        </thead>
        <tbody>
          ${deliverablesHtml}
        </tbody>
      </table>
      <p class="clause-content">O CONTRATANTE terá prazo de <strong>${escapeHtml(data.acceptanceDays || '______')} dias úteis</strong> para aceitar ou solicitar ajustes razoáveis após cada entrega.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 4ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 4ª – DO VALOR</h2>
      <p class="clause-content">Pelos serviços contratados, o CONTRATANTE pagará ao CONTRATADO o valor total de:</p>
      <div class="highlight-value">R$ ${escapeHtml(totalValueDisplay)}</div>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9pt; margin-top: 6px;">
        <p style="font-family: 'Times New Roman', Georgia, serif; font-size: 10.5pt; font-weight: bold; margin-bottom: 2px;">Forma de cobrança:</p>
        <div style="padding-left: 10px;">
          <p>(${data.billingType === 'fixed' ? 'X' : ' '}) Valor fixo pelo projeto</p>
          <p>(${data.billingType === 'monthly' ? 'X' : ' '}) Valor mensal</p>
          <p>(${data.billingType === 'hourly' ? 'X' : ' '}) Valor por hora</p>
          <p>(${data.billingType === 'other' ? 'X' : ' '}) Outro: ${escapeHtml(data.billingTypeOther || '___________________________________________')}</p>
        </div>
      </div>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 5ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 5ª – DA FORMA DE PAGAMENTO</h2>
      <p class="clause-content">O pagamento será realizado por:</p>
      <div style="display: flex; flex-wrap: wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9pt; margin: 4px 0 8px 10px;">
        <span style="width: 30%;">(${data.paymentMethod === 'pix' ? 'X' : ' '}) PIX</span>
        <span style="width: 35%;">(${data.paymentMethod === 'bank_transfer' ? 'X' : ' '}) Transferência</span>
        <span style="width: 35%;">(${data.paymentMethod === 'ted' ? 'X' : ' '}) TED</span>
        <span style="width: 30%;">(${data.paymentMethod === 'boleto' ? 'X' : ' '}) Boleto</span>
        <span style="width: 70%;">(${data.paymentMethod === 'other' ? 'X' : ' '}) Outro: ${escapeHtml(data.paymentMethodOther || '_______________________')}</span>
      </div>

      <div class="parties-box" style="margin-top: 6px;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 8pt; margin-bottom: 4px; color: #475569;">Dados para pagamento:</div>
        <div class="grid-row">
          <div class="grid-col-50"><span class="field-label">Banco:</span> <span class="field-value">${escapeHtml(data.bankName || '__________________________')}</span></div>
          <div class="grid-col-50"><span class="field-label">Agência:</span> <span class="field-value">${escapeHtml(data.bankAgency || '________________________')}</span></div>
          <div class="grid-col-50"><span class="field-label">Conta:</span> <span class="field-value">${escapeHtml(data.bankAccount || '__________________________')}</span></div>
          <div class="grid-col-50"><span class="field-label">Chave PIX:</span> <span class="field-value">${escapeHtml(data.pixKey || '______________________')}</span></div>
        </div>
      </div>

      <p class="clause-content" style="margin-top: 8px;">Cronograma de pagamento:</p>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 20%; text-align: center;">Parcela</th>
            <th style="text-align: right;">Valor</th>
            <th style="width: 25%; text-align: center;">Data</th>
          </tr>
        </thead>
        <tbody>
          ${paymentScheduleHtml}
        </tbody>
      </table>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 6ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 6ª – DO ATRASO NO PAGAMENTO</h2>
      <p class="clause-content">Em caso de atraso no pagamento, incidirão:</p>
      <ul class="list-style">
        <li>Multa de <strong>${escapeHtml(data.lateFinePercent ?? '_____')}%</strong> sobre o valor devido;</li>
        <li>Juros de <strong>${escapeHtml(data.lateInterestMonthlyPercent ?? '_____')}%</strong> ao mês;</li>
        <li>Correção monetária conforme índice legal aplicável.</li>
      </ul>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 7ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 7ª – DAS OBRIGAÇÕES DO CONTRATADO</h2>
      <p class="clause-content">O CONTRATADO obriga-se a:</p>
      <p class="indent-p">a) Executar os serviços com diligência e qualidade;</p>
      <p class="indent-p">b) Cumprir os prazos acordados;</p>
      <p class="indent-p">c) Informar eventuais impedimentos à execução dos serviços;</p>
      <p class="indent-p">d) Manter sigilo sobre informações confidenciais recebidas.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 8ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 8ª – DAS OBRIGAÇÕES DO CONTRATANTE</h2>
      <p class="clause-content">O CONTRATANTE obriga-se a:</p>
      <p class="indent-p">a) Fornecer informações necessárias à execução dos serviços;</p>
      <p class="indent-p">b) Efetuar os pagamentos nos prazos acordados;</p>
      <p class="indent-p">c) Aprovar ou solicitar ajustes nas entregas em prazo razoável;</p>
      <p class="indent-p">d) Disponibilizar acessos e materiais necessários para a execução do objeto contratual.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 9ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 9ª – DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO</h2>
      <p class="clause-content">O presente contrato possui natureza exclusivamente civil e comercial, não gerando vínculo empregatício, societário ou previdenciário entre as partes.</p>
      <p class="clause-content">O CONTRATADO exercerá suas atividades com autonomia técnica e administrativa.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 10ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 10ª – DA CONFIDENCIALIDADE</h2>
      <p class="clause-content">As partes comprometem-se a manter absoluto sigilo sobre todas as informações técnicas, comerciais, financeiras, estratégicas ou de qualquer natureza obtidas em razão deste contrato.</p>
      <p class="clause-content">As informações confidenciais não poderão ser divulgadas a terceiros sem autorização expressa da parte proprietária.</p>
      <p class="clause-content">A obrigação de confidencialidade permanecerá válida por <strong>5 (cinco) anos</strong> após o término deste contrato.</p>
      <p class="clause-content">Em caso de descumprimento, a parte infratora responderá pelas perdas e danos causados.</p>
      <p class="clause-content" style="font-weight: bold; margin-top: 4px;">Multa por violação de confidencialidade:</p>
      <p class="indent-p">
        <strong>${
          data.confidentialityPenaltyType === 'fixed'
            ? `R$ ${escapeHtml(typeof data.confidentialityPenaltyValue === 'number' ? formatCurrency(data.confidentialityPenaltyValue) : data.confidentialityPenaltyValue || '___________________________')}`
            : 'R$ ___________________________'
        }</strong>
      </p>
      <p class="indent-p" style="font-family: sans-serif; font-size: 8.5pt; color: #64748b;">ou</p>
      <p class="indent-p">
        <strong>${
          data.confidentialityPenaltyType === 'percent'
            ? `${escapeHtml(data.confidentialityPenaltyValue || '_______')} % do valor total do contrato.`
            : '_______ % do valor total do contrato.'
        }</strong>
      </p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 11ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 11ª – DA PROTEÇÃO DE DADOS (LGPD)</h2>
      <p class="clause-content">As partes comprometem-se a cumprir integralmente a Lei nº 13.709/2018 (LGPD).</p>
      <p class="clause-content">Caso o CONTRATADO tenha acesso a dados pessoais, compromete-se a:</p>
      <p class="indent-p">a) Utilizá-los exclusivamente para execução dos serviços;</p>
      <p class="indent-p">b) Adotar medidas de segurança adequadas;</p>
      <p class="indent-p">c) Não compartilhar dados sem autorização;</p>
      <p class="indent-p">d) Comunicar incidentes de segurança em prazo razoável;</p>
      <p class="indent-p">e) Excluir ou devolver os dados ao término da prestação dos serviços, quando aplicável.</p>
      <div style="margin-top: 6px;">
        <p><strong>Controlador dos Dados:</strong> <span style="font-family: sans-serif; font-size: 9pt;">${escapeHtml(data.dataController || '__________________________')}</span></p>
        <p><strong>Operador dos Dados:</strong> <span style="font-family: sans-serif; font-size: 9pt;">${escapeHtml(data.dataOperator || '_____________________________')}</span></p>
      </div>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 12ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 12ª – DA PROPRIEDADE INTELECTUAL</h2>
      <p class="clause-content">Após a quitação integral dos valores previstos neste contrato, os direitos patrimoniais relacionados aos materiais desenvolvidos no âmbito deste projeto passarão ao CONTRATANTE.</p>
      <p class="clause-content">Descrição dos materiais abrangidos:</p>
      <div class="highlight-box">${escapeHtml(data.intellectualPropertyMaterials || '_______________________________________________________________\n_______________________________________________________________')}</div>
      <p class="clause-content">O CONTRATADO poderá mencionar o projeto em seu portfólio profissional, salvo manifestação expressa em contrário do CONTRATANTE.</p>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9pt; padding-left: 10px;">
        <p>(${data.portfolioPermission === 'allowed' ? 'X' : ' '}) Permitido</p>
        <p>(${data.portfolioPermission === 'not_allowed' ? 'X' : ' '}) Não permitido</p>
      </div>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 13ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 13ª – DAS ALTERAÇÕES DE ESCOPO</h2>
      <p class="clause-content">Solicitações que impliquem alteração substancial do escopo originalmente contratado deverão ser objeto de orçamento complementar e aprovação formal entre as partes.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 14ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 14ª – DA RESCISÃO</h2>
      <p class="clause-content">O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de <strong>${escapeHtml(data.noticePeriodDays || '______')} dias</strong>.</p>
      <p class="clause-content">Em caso de rescisão:</p>
      <ul class="list-style">
        <li>O CONTRATADO receberá proporcionalmente pelos serviços executados até a data da rescisão;</li>
        <li>Permanecem válidas as cláusulas de confidencialidade, propriedade intelectual e proteção de dados.</li>
      </ul>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 15ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 15ª – DAS PENALIDADES</h2>
      <p class="clause-content">O inadimplemento de quaisquer obrigações previstas neste contrato poderá sujeitar a parte infratora ao pagamento de multa correspondente a:</p>
      <p class="indent-p" style="font-size: 11pt; font-weight: bold; margin: 4px 0;">${escapeHtml(data.generalPenaltyPercent || '_______')} % do valor total do contrato.</p>
      <p class="clause-content">Sem prejuízo da reparação integral dos danos comprovadamente causados.</p>
    </div>

    <hr class="divider" />

    <!-- CLÁUSULA 16ª -->
    <div class="clause">
      <h2 class="clause-title">CLÁUSULA 16ª – DO FORO</h2>
      <p class="clause-content">Fica eleito o foro da Comarca de:</p>
      <p class="indent-p" style="font-weight: bold; font-size: 11.5pt; text-decoration: underline; margin: 4px 0;">${escapeHtml(data.forumCity || '____________________________________________')}</p>
      <p class="clause-content">para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
    </div>

    <hr class="divider" style="margin-top: 20px; border-top: 2px solid #cbd5e1;" />

    <!-- ASSINATURAS -->
    <div class="signatures-section">
      <h2 class="signatures-title">ASSINATURAS</h2>
      <div class="meta-loc-date">
        <p><strong>Local:</strong> <span style="font-family: 'Times New Roman', Georgia, serif; font-size: 11pt;">${escapeHtml(data.signatureLocation || '______________________________________')}</span></p>
        <p><strong>Data:</strong> <span style="font-family: 'Times New Roman', Georgia, serif; font-size: 11pt;">${escapeHtml(formatDocDate(data.signatureDate))}</span></p>
      </div>

      <!-- Assinaturas Principais -->
      <div class="sig-grid">
        <div class="sig-block">
          <div class="sig-line">
            <div class="sig-role">CONTRATANTE</div>
            <div class="sig-name">${escapeHtml(data.clientName || '______________________________________')}</div>
            ${data.clientDoc ? `<div class="sig-doc">Doc: ${escapeHtml(data.clientDoc)}</div>` : ''}
          </div>
        </div>

        <div class="sig-block">
          <div class="sig-line">
            <div class="sig-role">CONTRATADO</div>
            <div class="sig-name">${escapeHtml(data.contractorName || '______________________________________')}</div>
            ${data.contractorCpf ? `<div class="sig-doc">CPF: ${escapeHtml(data.contractorCpf)}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Testemunhas -->
      <div class="sig-grid" style="margin-top: 15px;">
        <div class="sig-block">
          <div class="sig-line-light">
            <div class="sig-role" style="font-size: 7.5pt;">TESTEMUNHA 1</div>
            <div class="sig-name" style="font-size: 9.5pt;">${escapeHtml(data.witness1Name || 'Nome: ______________________________________')}</div>
            <div class="sig-doc">CPF: ${escapeHtml(data.witness1Cpf || '_______________________________________')}</div>
          </div>
        </div>

        <div class="sig-block">
          <div class="sig-line-light">
            <div class="sig-role" style="font-size: 7.5pt;">TESTEMUNHA 2</div>
            <div class="sig-name" style="font-size: 9.5pt;">${escapeHtml(data.witness2Name || 'Nome: ______________________________________')}</div>
            <div class="sig-doc">CPF: ${escapeHtml(data.witness2Cpf || '_______________________________________')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rodapé Legal -->
    <div class="disclaimer">
      Observação: este é um modelo contratual de uso geral. Dependendo do serviço (desenvolvimento de software, marketing, consultoria, design, engenharia, saúde etc.), pode ser recomendável a revisão por advogado para adequação ao caso específico.
    </div>
  </div>
</body>
</html>`
}

/**
 * Dispara o diálogo de exportação nativo ou download de PDF do contrato
 * Utiliza iframe isolado com o documento formatado exclusivamente para impressão/PDF de alta fidelidade
 */
export function exportContractToPdf(
  data: ContractFormData,
  contractNumber: string = 'CTR-NOVO',
  contractDate: string = new Date().toISOString(),
  contractStatus: string = 'Rascunho',
): Promise<{ success: boolean; filename: string }> {
  return new Promise((resolve, reject) => {
    try {
      const filename = generateContractPdfFilename(data.clientName, contractNumber)
      const htmlContent = generateContractFullHtml(
        data,
        contractNumber,
        contractDate,
        contractStatus,
      )

      // Criar iframe oculto temporário para impressão isolada e perfeita sem conflitos do DOM do app
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.visibility = 'hidden'

      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc || !iframe.contentWindow) {
        document.body.removeChild(iframe)
        // Fallback para window.print() direto se iframe falhar
        const originalTitle = document.title
        document.title = filename.replace(/\.pdf$/i, '')
        window.print()
        document.title = originalTitle
        resolve({ success: true, filename })
        return
      }

      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      // Define título para que o diálogo de "Salvar como PDF" do navegador já venha com o nome correto
      const originalTitle = document.title
      const pdfBaseName = filename.replace(/\.pdf$/i, '')
      document.title = pdfBaseName

      // Esperar estilos e fontes renderizarem no iframe
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus()
            iframe.contentWindow.print()
          } else {
            window.print()
          }

          // Restaurar título original
          setTimeout(() => {
            document.title = originalTitle
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            resolve({ success: true, filename })
          }, 1000)
        } catch (err) {
          document.title = originalTitle
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
          reject(err)
        }
      }, 400)
    } catch (error) {
      reject(error)
    }
  })
}
