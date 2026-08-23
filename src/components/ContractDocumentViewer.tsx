import { Contract, ContractFormData } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  Download,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  FileCheck2,
  Share2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ContractDocumentViewerProps {
  contract?: Contract | null
  formData?: ContractFormData | null
  contractNumber?: string
  contractDate?: string
  status?: string
  onBack?: () => void
  showActions?: boolean
}

function formatDocDate(isoOrDateStr?: string) {
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

export function ContractDocumentViewer({
  contract,
  formData: propFormData,
  contractNumber,
  contractDate,
  status = 'Rascunho',
  onBack,
  showActions = true,
}: ContractDocumentViewerProps) {
  const [copied, setCopied] = useState(false)

  const data = propFormData || contract?.formData
  const number = contractNumber || contract?.number || 'CTR-NOVO'
  const date = contractDate || contract?.date || new Date().toISOString()
  const contractStatus = contract?.status || status

  const handlePrint = () => {
    window.print()
  }

  const handleCopyText = () => {
    if (!data) return

    const plainText = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, as partes abaixo identificadas:

CONTRATANTE
Nome/Razão Social: ${data.clientName || '_______________________________________________'}
CPF/CNPJ: ${data.clientDoc || '_______________________________________________________'}
Endereço: ${data.clientAddress || '_______________________________________________________'}
Representante Legal (se pessoa jurídica): ${data.clientLegalRep || '___________________________'}
E-mail: ${data.clientEmail || '_________________________________________________________'}
Telefone: ${data.clientPhone || '_______________________________________________________'}

CONTRATADO
Nome: ${data.contractorName || '__________________________________________________________'}
CPF: ${data.contractorCpf || '___________________________________________________________'}
RG: ${data.contractorRg || '____________________________________________________________'}
Endereço: ${data.contractorAddress || '_______________________________________________________'}
Profissão: ${data.contractorProfession || '______________________________________________________'}
E-mail: ${data.contractorEmail || '_________________________________________________________'}
Telefone: ${data.contractorPhone || '_______________________________________________________'}

Resolvem celebrar o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS, que se regerá pelas cláusulas e condições a seguir.

--------------------------------------------------

CLÁUSULA 1ª – DO OBJETO

O CONTRATADO compromete-se a prestar ao CONTRATANTE os seguintes serviços:

${data.serviceScope || '____________________________________________________________________'}

Ficam excluídas do escopo deste contrato quaisquer atividades não descritas acima, salvo mediante ajuste formal entre as partes.

--------------------------------------------------

CLÁUSULA 2ª – DO PRAZO

Data de início dos serviços: ${formatDocDate(data.startDate)}
Data prevista para conclusão: ${formatDocDate(data.endDate)}

A prorrogação do prazo deverá ocorrer mediante acordo entre as partes, preferencialmente por escrito.

--------------------------------------------------

CLÁUSULA 3ª – DAS ENTREGAS

O CONTRATADO deverá entregar:

${
  data.deliverables && data.deliverables.length > 0
    ? data.deliverables
        .map(
          (d, i) =>
            `| ${i + 1} | ${d.description || '____________________'} | ${formatDocDate(d.date)} |`,
        )
        .join('\n')
    : '| 1 | ____________________ | ____/____/______ |\n| 2 | ____________________ | ____/____/______ |'
}

O CONTRATANTE terá prazo de ${data.acceptanceDays || '______'} dias úteis para aceitar ou solicitar ajustes razoáveis após cada entrega.

--------------------------------------------------

CLÁUSULA 4ª – DO VALOR

Pelos serviços contratados, o CONTRATANTE pagará ao CONTRATADO o valor total de:

R$ ${typeof data.totalValue === 'number' ? formatCurrency(data.totalValue) : data.totalValue || '____________________________'}

Forma de cobrança:
(${data.billingType === 'fixed' ? 'X' : ' '}) Valor fixo pelo projeto
(${data.billingType === 'monthly' ? 'X' : ' '}) Valor mensal
(${data.billingType === 'hourly' ? 'X' : ' '}) Valor por hora
(${data.billingType === 'other' ? 'X' : ' '}) Outro: ${data.billingTypeOther || '___________________________________________'}

--------------------------------------------------

CLÁUSULA 5ª – DA FORMA DE PAGAMENTO

O pagamento será realizado por:
(${data.paymentMethod === 'pix' ? 'X' : ' '}) PIX
(${data.paymentMethod === 'bank_transfer' ? 'X' : ' '}) Transferência bancária
(${data.paymentMethod === 'ted' ? 'X' : ' '}) TED
(${data.paymentMethod === 'boleto' ? 'X' : ' '}) Boleto
(${data.paymentMethod === 'other' ? 'X' : ' '}) Outro: ${data.paymentMethodOther || '_______________________'}

Dados para pagamento:
Banco: ${data.bankName || '__________________________'}
Agência: ${data.bankAgency || '________________________'}
Conta: ${data.bankAccount || '__________________________'}
Chave PIX: ${data.pixKey || '______________________'}

Cronograma de pagamento:
${
  data.paymentSchedule && data.paymentSchedule.length > 0
    ? data.paymentSchedule
        .map(
          (p, i) =>
            `| ${i + 1} | R$ ${typeof p.amount === 'number' ? formatCurrency(p.amount) : p.amount || '_______'} | ${formatDocDate(p.date)} |`,
        )
        .join('\n')
    : '| 1 | R$ _______ | ____/____/______ |'
}

--------------------------------------------------

CLÁUSULA 6ª – DO ATRASO NO PAGAMENTO

Em caso de atraso no pagamento, incidirão:
- Multa de ${data.lateFinePercent ?? '_____'}% sobre o valor devido;
- Juros de ${data.lateInterestMonthlyPercent ?? '_____'}% ao mês;
- Correção monetária conforme índice legal aplicável.

--------------------------------------------------

CLÁUSULA 7ª – DAS OBRIGAÇÕES DO CONTRATADO

O CONTRATADO obriga-se a:
a) Executar os serviços com diligência e qualidade;
b) Cumprir os prazos acordados;
c) Informar eventuais impedimentos à execução dos serviços;
d) Manter sigilo sobre informações confidenciais recebidas.

--------------------------------------------------

CLÁUSULA 8ª – DAS OBRIGAÇÕES DO CONTRATANTE

O CONTRATANTE obriga-se a:
a) Fornecer informações necessárias à execução dos serviços;
b) Efetuar os pagamentos nos prazos acordados;
c) Aprovar ou solicitar ajustes nas entregas em prazo razoável;
d) Disponibilizar acessos e materiais necessários para a execução do objeto contratual.

--------------------------------------------------

CLÁUSULA 9ª – DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO

O presente contrato possui natureza exclusivamente civil e comercial, não gerando vínculo empregatício, societário ou previdenciário entre as partes.

O CONTRATADO exercerá suas atividades com autonomia técnica e administrativa.

--------------------------------------------------

CLÁUSULA 10ª – DA CONFIDENCIALIDADE

As partes comprometem-se a manter absoluto sigilo sobre todas as informações técnicas, comerciais, financeiras, estratégicas ou de qualquer natureza obtidas em razão deste contrato.

As informações confidenciais não poderão ser divulgadas a terceiros sem autorização expressa da parte proprietária.

A obrigação de confidencialidade permanecerá válida por 5 (cinco) anos após o término deste contrato.

Em caso de descumprimento, a parte infratora responderá pelas perdas e danos causados.

Multa por violação de confidencialidade:
${
  data.confidentialityPenaltyType === 'fixed'
    ? `R$ ${typeof data.confidentialityPenaltyValue === 'number' ? formatCurrency(data.confidentialityPenaltyValue) : data.confidentialityPenaltyValue || '___________________________'}`
    : 'R$ ___________________________'
}
ou
${
  data.confidentialityPenaltyType === 'percent'
    ? `${data.confidentialityPenaltyValue || '_______'} % do valor total do contrato.`
    : '_______ % do valor total do contrato.'
}

--------------------------------------------------

CLÁUSULA 11ª – DA PROTEÇÃO DE DADOS (LGPD)

As partes comprometem-se a cumprir integralmente a Lei nº 13.709/2018 (LGPD).

Caso o CONTRATADO tenha acesso a dados pessoais, compromete-se a:
a) Utilizá-los exclusivamente para execução dos serviços;
b) Adotar medidas de segurança adequadas;
c) Não compartilhar dados sem autorização;
d) Comunicar incidentes de segurança em prazo razoável;
e) Excluir ou devolver os dados ao término da prestação dos serviços, quando aplicável.

Controlador dos Dados: ${data.dataController || '__________________________'}
Operador dos Dados: ${data.dataOperator || '_____________________________'}

--------------------------------------------------

CLÁUSULA 12ª – DA PROPRIEDADE INTELECTUAL

Após a quitação integral dos valores previstos neste contrato, os direitos patrimoniais relacionados aos materiais desenvolvidos no âmbito deste projeto passarão ao CONTRATANTE.

Descrição dos materiais abrangidos:
${data.intellectualPropertyMaterials || '_______________________________________________________________'}

O CONTRATADO poderá mencionar o projeto em seu portfólio profissional, salvo manifestação expressa em contrário do CONTRATANTE.
(${data.portfolioPermission === 'allowed' ? 'X' : ' '}) Permitido
(${data.portfolioPermission === 'not_allowed' ? 'X' : ' '}) Não permitido

--------------------------------------------------

CLÁUSULA 13ª – DAS ALTERAÇÕES DE ESCOPO

Solicitações que impliquem alteração substancial do escopo originalmente contratado deverão ser objeto de orçamento complementar e aprovação formal entre as partes.

--------------------------------------------------

CLÁUSULA 14ª – DA RESCISÃO

O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de ${data.noticePeriodDays || '______'} dias.

Em caso de rescisão:
- O CONTRATADO receberá proporcionalmente pelos serviços executados até a data da rescisão;
- Permanecem válidas as cláusulas de confidencialidade, propriedade intelectual e proteção de dados.

--------------------------------------------------

CLÁUSULA 15ª – DAS PENALIDADES

O inadimplemento de quaisquer obrigações previstas neste contrato poderá sujeitar a parte infratora ao pagamento de multa correspondente a:
${data.generalPenaltyPercent || '_______'} % do valor total do contrato.
Sem prejuízo da reparação integral dos danos comprovadamente causados.

--------------------------------------------------

CLÁUSULA 16ª – DO FORO

Fica eleito o foro da Comarca de:
${data.forumCity || '____________________________________________'}
para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.

--------------------------------------------------

ASSINATURAS

Local: ${data.signatureLocation || '______________________________________'}
Data: ${formatDocDate(data.signatureDate)}

CONTRATANTE
Nome: ${data.clientName || '______________________________________'}
Assinatura: _________________________________

CONTRATADO
Nome: ${data.contractorName || '______________________________________'}
Assinatura: _________________________________

TESTEMUNHA 1
Nome: ${data.witness1Name || '______________________________________'}
CPF: ${data.witness1Cpf || '_______________________________________'}
Assinatura: _________________________________

TESTEMUNHA 2
Nome: ${data.witness2Name || '______________________________________'}
CPF: ${data.witness2Cpf || '_______________________________________'}
Assinatura: _________________________________

Observação: este é um modelo contratual de uso geral. Dependendo do serviço (desenvolvimento de software, marketing, consultoria, design, engenharia, saúde etc.), pode ser recomendável a revisão por advogado para adequação ao caso específico.`

    navigator.clipboard.writeText(plainText)
    setCopied(true)
    toast.success('Texto do contrato copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 2500)
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border">
        <p className="text-muted-foreground">
          Nenhum dado estruturado disponível para este contrato.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de ações */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border/60 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar à Edição
              </Button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base">{number}</span>
                <Badge
                  variant={contractStatus === 'Assinado' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {contractStatus}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Emitido em {formatDocDate(date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyText} className="gap-2">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'Copiado' : 'Copiar Texto'}
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} className="gap-2 shadow-sm">
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </Button>
          </div>
        </div>
      )}

      {/* Papel do Contrato Formatado com Padrão Jurídico Nobre */}
      <div className="contract-print-area bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xl p-8 sm:p-14 max-w-4xl mx-auto font-serif text-[13.5px] leading-relaxed select-text">
        {/* Cabeçalho do Documento */}
        <div className="text-center pb-8 border-b-2 border-slate-800 mb-8 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-slate-500 font-sans font-medium mb-1">
            <ShieldCheck className="w-4 h-4 text-accent" /> Instrumento Jurídico Particular
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 uppercase">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Registro Interno: <span className="font-semibold text-slate-800">{number}</span> | Data
            de Emissão: {formatDocDate(date)}
          </p>
        </div>

        {/* Preâmbulo */}
        <div className="space-y-6 text-justify">
          <p className="font-semibold text-slate-900">
            Pelo presente instrumento particular, as partes abaixo identificadas:
          </p>

          {/* CONTRATANTE */}
          <div className="bg-slate-50/80 p-5 rounded-lg border border-slate-200 space-y-1.5 font-sans text-xs">
            <h2 className="font-serif font-bold text-sm tracking-wide text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
              CONTRATANTE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <p>
                <strong className="text-slate-800">Nome/Razão Social:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.clientName || '_______________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">CPF/CNPJ:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.clientDoc || '_______________________________________________________'}
                </span>
              </p>
              <p className="sm:col-span-2">
                <strong className="text-slate-800">Endereço:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.clientAddress || '_______________________________________________________'}
                </span>
              </p>
              <p className="sm:col-span-2">
                <strong className="text-slate-800">
                  Representante Legal (se pessoa jurídica):
                </strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.clientLegalRep || '___________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">E-mail:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.clientEmail || '_________________________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">Telefone:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.clientPhone || '_______________________________________________________'}
                </span>
              </p>
            </div>
          </div>

          {/* CONTRATADO */}
          <div className="bg-slate-50/80 p-5 rounded-lg border border-slate-200 space-y-1.5 font-sans text-xs">
            <h2 className="font-serif font-bold text-sm tracking-wide text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2">
              CONTRATADO
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <p>
                <strong className="text-slate-800">Nome:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorName ||
                    '__________________________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">CPF:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorCpf ||
                    '___________________________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">RG:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorRg ||
                    '____________________________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">Profissão:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorProfession ||
                    '______________________________________________________'}
                </span>
              </p>
              <p className="sm:col-span-2">
                <strong className="text-slate-800">Endereço:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorAddress ||
                    '_______________________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">E-mail:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorEmail ||
                    '_________________________________________________________'}
                </span>
              </p>
              <p>
                <strong className="text-slate-800">Telefone:</strong>{' '}
                <span className="font-serif text-[13px] text-slate-900">
                  {data.contractorPhone ||
                    '_______________________________________________________'}
                </span>
              </p>
            </div>
          </div>

          <p>
            Resolvem celebrar o presente <strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</strong>, que se
            regerá pelas cláusulas e condições a seguir.
          </p>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 1ª – DO OBJETO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 1ª – DO OBJETO
            </h2>
            <p>O CONTRATADO compromete-se a prestar ao CONTRATANTE os seguintes serviços:</p>
            <div className="p-4 bg-slate-50 rounded border border-slate-200 whitespace-pre-line text-slate-800">
              {data.serviceScope ||
                '____________________________________________________________________\n____________________________________________________________________\n____________________________________________________________________'}
            </div>
            <p>
              Ficam excluídas do escopo deste contrato quaisquer atividades não descritas acima,
              salvo mediante ajuste formal entre as partes.
            </p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 2ª – DO PRAZO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 2ª – DO PRAZO
            </h2>
            <div className="space-y-1">
              <p>
                <strong>Data de início dos serviços:</strong> {formatDocDate(data.startDate)}
              </p>
              <p>
                <strong>Data prevista para conclusão:</strong> {formatDocDate(data.endDate)}
              </p>
            </div>
            <p>
              A prorrogação do prazo deverá ocorrer mediante acordo entre as partes,
              preferencialmente por escrito.
            </p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 3ª – DAS ENTREGAS */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 3ª – DAS ENTREGAS
            </h2>
            <p>O CONTRATADO deverá entregar:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs font-sans">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="border border-slate-300 px-3 py-2 text-center w-20">
                      Entregável
                    </th>
                    <th className="border border-slate-300 px-3 py-2 text-left">Descrição</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-36">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deliverables && data.deliverables.length > 0 ? (
                    data.deliverables.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-slate-200">
                        <td className="border border-slate-300 px-3 py-2 text-center font-semibold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 font-serif text-[13px]">
                          {item.description || '____________________'}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          {formatDocDate(item.date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 text-center">1</td>
                        <td className="border border-slate-300 px-3 py-2">____________________</td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          ____/____/______
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 text-center">2</td>
                        <td className="border border-slate-300 px-3 py-2">____________________</td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          ____/____/______
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <p>
              O CONTRATANTE terá prazo de{' '}
              <strong>{data.acceptanceDays || '______'} dias úteis</strong> para aceitar ou
              solicitar ajustes razoáveis após cada entrega.
            </p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 4ª – DO VALOR */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 4ª – DO VALOR
            </h2>
            <p>Pelos serviços contratados, o CONTRATANTE pagará ao CONTRATADO o valor total de:</p>
            <p className="text-base font-bold text-slate-900 bg-slate-50 p-3 rounded border border-slate-200">
              R${' '}
              {typeof data.totalValue === 'number'
                ? formatCurrency(data.totalValue)
                : data.totalValue || '____________________________'}
            </p>
            <div className="space-y-1.5 font-sans text-xs pt-1">
              <p className="font-semibold text-slate-800 font-serif text-[13.5px]">
                Forma de cobrança:
              </p>
              <div className="space-y-1 pl-2">
                <p>({data.billingType === 'fixed' ? 'X' : ' '}) Valor fixo pelo projeto</p>
                <p>({data.billingType === 'monthly' ? 'X' : ' '}) Valor mensal</p>
                <p>({data.billingType === 'hourly' ? 'X' : ' '}) Valor por hora</p>
                <p>
                  ({data.billingType === 'other' ? 'X' : ' '}) Outro:{' '}
                  <span className="font-serif text-[13px]">
                    {data.billingTypeOther || '___________________________________________'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 5ª – DA FORMA DE PAGAMENTO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 5ª – DA FORMA DE PAGAMENTO
            </h2>
            <p>O pagamento será realizado por:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 font-sans text-xs pl-2">
              <p>({data.paymentMethod === 'pix' ? 'X' : ' '}) PIX</p>
              <p>({data.paymentMethod === 'bank_transfer' ? 'X' : ' '}) Transferência bancária</p>
              <p>({data.paymentMethod === 'ted' ? 'X' : ' '}) TED</p>
              <p>({data.paymentMethod === 'boleto' ? 'X' : ' '}) Boleto</p>
              <p className="col-span-2">
                ({data.paymentMethod === 'other' ? 'X' : ' '}) Outro:{' '}
                <span className="font-serif text-[13px]">
                  {data.paymentMethodOther || '_______________________'}
                </span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded border border-slate-200 font-sans text-xs space-y-1 mt-3">
              <p className="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-2 font-sans">
                Dados para pagamento:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p>
                  <strong>Banco:</strong>{' '}
                  <span className="font-serif text-[13px]">
                    {data.bankName || '__________________________'}
                  </span>
                </p>
                <p>
                  <strong>Agência:</strong>{' '}
                  <span className="font-serif text-[13px]">
                    {data.bankAgency || '________________________'}
                  </span>
                </p>
                <p>
                  <strong>Conta:</strong>{' '}
                  <span className="font-serif text-[13px]">
                    {data.bankAccount || '__________________________'}
                  </span>
                </p>
                <p>
                  <strong>Chave PIX:</strong>{' '}
                  <span className="font-serif text-[13px]">
                    {data.pixKey || '______________________'}
                  </span>
                </p>
              </div>
            </div>

            <p className="pt-2">Cronograma de pagamento:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-xs font-sans">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="border border-slate-300 px-3 py-2 text-center w-24">Parcela</th>
                    <th className="border border-slate-300 px-3 py-2 text-right">Valor</th>
                    <th className="border border-slate-300 px-3 py-2 text-center w-36">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentSchedule && data.paymentSchedule.length > 0 ? (
                    data.paymentSchedule.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-slate-200">
                        <td className="border border-slate-300 px-3 py-2 text-center font-semibold">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-serif text-[13px]">
                          R${' '}
                          {typeof item.amount === 'number'
                            ? formatCurrency(item.amount)
                            : item.amount || '_______'}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center">
                          {formatDocDate(item.date)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 text-center">1</td>
                      <td className="border border-slate-300 px-3 py-2 text-right">R$ _______</td>
                      <td className="border border-slate-300 px-3 py-2 text-center">
                        ____/____/______
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 6ª – DO ATRASO NO PAGAMENTO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 6ª – DO ATRASO NO PAGAMENTO
            </h2>
            <p>Em caso de atraso no pagamento, incidirão:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Multa de <strong>{data.lateFinePercent ?? '_____'}%</strong> sobre o valor devido;
              </li>
              <li>
                Juros de <strong>{data.lateInterestMonthlyPercent ?? '_____'}%</strong> ao mês;
              </li>
              <li>Correção monetária conforme índice legal aplicável.</li>
            </ul>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 7ª – DAS OBRIGAÇÕES DO CONTRATADO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 7ª – DAS OBRIGAÇÕES DO CONTRATADO
            </h2>
            <p>O CONTRATADO obriga-se a:</p>
            <p className="pl-4">a) Executar os serviços com diligência e qualidade;</p>
            <p className="pl-4">b) Cumprir os prazos acordados;</p>
            <p className="pl-4">c) Informar eventuais impedimentos à execução dos serviços;</p>
            <p className="pl-4">d) Manter sigilo sobre informações confidenciais recebidas.</p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 8ª – DAS OBRIGAÇÕES DO CONTRATANTE */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 8ª – DAS OBRIGAÇÕES DO CONTRATANTE
            </h2>
            <p>O CONTRATANTE obriga-se a:</p>
            <p className="pl-4">a) Fornecer informações necessárias à execução dos serviços;</p>
            <p className="pl-4">b) Efetuar os pagamentos nos prazos acordados;</p>
            <p className="pl-4">c) Aprovar ou solicitar ajustes nas entregas em prazo razoável;</p>
            <p className="pl-4">
              d) Disponibilizar acessos e materiais necessários para a execução do objeto
              contratual.
            </p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 9ª – DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 9ª – DA INEXISTÊNCIA DE VÍNCULO EMPREGATÍCIO
            </h2>
            <p>
              O presente contrato possui natureza exclusivamente civil e comercial, não gerando
              vínculo empregatício, societário ou previdenciário entre as partes.
            </p>
            <p>O CONTRATADO exercerá suas atividades com autonomia técnica e administrativa.</p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 10ª – DA CONFIDENCIALIDADE */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 10ª – DA CONFIDENCIALIDADE
            </h2>
            <p>
              As partes comprometem-se a manter absoluto sigilo sobre todas as informações técnicas,
              comerciais, financeiras, estratégicas ou de qualquer natureza obtidas em razão deste
              contrato.
            </p>
            <p>
              As informações confidenciais não poderão ser divulgadas a terceiros sem autorização
              expressa da parte proprietária.
            </p>
            <p>
              A obrigação de confidencialidade permanecerá válida por{' '}
              <strong>5 (cinco) anos</strong> após o término deste contrato.
            </p>
            <p>
              Em caso de descumprimento, a parte infratora responderá pelas perdas e danos causados.
            </p>
            <p className="font-semibold pt-1">Multa por violação de confidencialidade:</p>
            <p className="pl-4">
              <strong>
                {data.confidentialityPenaltyType === 'fixed'
                  ? `R$ ${typeof data.confidentialityPenaltyValue === 'number' ? formatCurrency(data.confidentialityPenaltyValue) : data.confidentialityPenaltyValue || '___________________________'}`
                  : 'R$ ___________________________'}
              </strong>
            </p>
            <p className="pl-4 font-sans text-xs text-slate-500">ou</p>
            <p className="pl-4">
              <strong>
                {data.confidentialityPenaltyType === 'percent'
                  ? `${data.confidentialityPenaltyValue || '_______'} % do valor total do contrato.`
                  : '_______ % do valor total do contrato.'}
              </strong>
            </p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 11ª – DA PROTEÇÃO DE DADOS (LGPD) */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 11ª – DA PROTEÇÃO DE DADOS (LGPD)
            </h2>
            <p>As partes comprometem-se a cumprir integralmente a Lei nº 13.709/2018 (LGPD).</p>
            <p>Caso o CONTRATADO tenha acesso a dados pessoais, compromete-se a:</p>
            <p className="pl-4">a) Utilizá-los exclusivamente para execução dos serviços;</p>
            <p className="pl-4">b) Adotar medidas de segurança adequadas;</p>
            <p className="pl-4">c) Não compartilhar dados sem autorização;</p>
            <p className="pl-4">d) Comunicar incidentes de segurança em prazo razoável;</p>
            <p className="pl-4">
              e) Excluir ou devolver os dados ao término da prestação dos serviços, quando
              aplicável.
            </p>
            <div className="pt-2 space-y-1">
              <p>
                <strong>Controlador dos Dados:</strong>{' '}
                <span className="text-slate-900 font-sans text-xs">
                  {data.dataController || '__________________________'}
                </span>
              </p>
              <p>
                <strong>Operador dos Dados:</strong>{' '}
                <span className="text-slate-900 font-sans text-xs">
                  {data.dataOperator || '_____________________________'}
                </span>
              </p>
            </div>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 12ª – DA PROPRIEDADE INTELECTUAL */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 12ª – DA PROPRIEDADE INTELECTUAL
            </h2>
            <p>
              Após a quitação integral dos valores previstos neste contrato, os direitos
              patrimoniais relacionados aos materiais desenvolvidos no âmbito deste projeto passarão
              ao CONTRATANTE.
            </p>
            <p>Descrição dos materiais abrangidos:</p>
            <div className="p-4 bg-slate-50 rounded border border-slate-200 whitespace-pre-line text-slate-800">
              {data.intellectualPropertyMaterials ||
                '_______________________________________________________________\n_______________________________________________________________'}
            </div>
            <p>
              O CONTRATADO poderá mencionar o projeto em seu portfólio profissional, salvo
              manifestação expressa em contrário do CONTRATANTE.
            </p>
            <div className="space-y-1 pl-2 font-sans text-xs">
              <p>({data.portfolioPermission === 'allowed' ? 'X' : ' '}) Permitido</p>
              <p>({data.portfolioPermission === 'not_allowed' ? 'X' : ' '}) Não permitido</p>
            </div>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 13ª – DAS ALTERAÇÕES DE ESCOPO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 13ª – DAS ALTERAÇÕES DE ESCOPO
            </h2>
            <p>
              Solicitações que impliquem alteração substancial do escopo originalmente contratado
              deverão ser objeto de orçamento complementar e aprovação formal entre as partes.
            </p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 14ª – DA RESCISÃO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 14ª – DA RESCISÃO
            </h2>
            <p>
              O presente contrato poderá ser rescindido por qualquer das partes mediante aviso
              prévio de <strong>{data.noticePeriodDays || '______'} dias</strong>.
            </p>
            <p>Em caso de rescisão:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                O CONTRATADO receberá proporcionalmente pelos serviços executados até a data da
                rescisão;
              </li>
              <li>
                Permanecem válidas as cláusulas de confidencialidade, propriedade intelectual e
                proteção de dados.
              </li>
            </ul>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 15ª – DAS PENALIDADES */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 15ª – DAS PENALIDADES
            </h2>
            <p>
              O inadimplemento de quaisquer obrigações previstas neste contrato poderá sujeitar a
              parte infratora ao pagamento de multa correspondente a:
            </p>
            <p className="text-base font-bold text-slate-900 pl-4">
              {data.generalPenaltyPercent || '_______'} % do valor total do contrato.
            </p>
            <p>Sem prejuízo da reparação integral dos danos comprovadamente causados.</p>
          </div>

          <hr className="border-slate-300 my-6" />

          {/* CLÁUSULA 16ª – DO FORO */}
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 uppercase tracking-wide">
              CLÁUSULA 16ª – DO FORO
            </h2>
            <p>Fica eleito o foro da Comarca de:</p>
            <p className="font-bold text-slate-900 text-base pl-4 underline decoration-slate-400 underline-offset-4">
              {data.forumCity || '____________________________________________'}
            </p>
            <p>
              para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, com
              renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </div>

          <hr className="border-slate-300 my-8" />

          {/* ASSINATURAS */}
          <div className="space-y-8 pt-4">
            <h2 className="font-bold text-center text-slate-900 uppercase tracking-widest text-base">
              ASSINATURAS
            </h2>

            <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm font-sans">
              <p>
                <strong>Local:</strong>{' '}
                <span className="font-serif text-[13.5px]">
                  {data.signatureLocation || '______________________________________'}
                </span>
              </p>
              <p>
                <strong>Data:</strong>{' '}
                <span className="font-serif text-[13.5px]">
                  {formatDocDate(data.signatureDate)}
                </span>
              </p>
            </div>

            {/* Assinaturas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-6">
              <div className="text-center space-y-2">
                <div className="border-t border-slate-800 pt-3">
                  <p className="font-bold uppercase tracking-wider text-xs font-sans text-slate-800">
                    CONTRATANTE
                  </p>
                  <p className="font-serif text-[13px] text-slate-900">
                    {data.clientName || '______________________________________'}
                  </p>
                  {data.clientDoc && (
                    <p className="text-[11px] font-sans text-slate-500">Doc: {data.clientDoc}</p>
                  )}
                </div>
              </div>

              <div className="text-center space-y-2">
                <div className="border-t border-slate-800 pt-3">
                  <p className="font-bold uppercase tracking-wider text-xs font-sans text-slate-800">
                    CONTRATADO
                  </p>
                  <p className="font-serif text-[13px] text-slate-900">
                    {data.contractorName || '______________________________________'}
                  </p>
                  {data.contractorCpf && (
                    <p className="text-[11px] font-sans text-slate-500">
                      CPF: {data.contractorCpf}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Testemunhas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-8">
              <div className="text-center space-y-1">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold uppercase tracking-wider text-[11px] font-sans text-slate-700">
                    TESTEMUNHA 1
                  </p>
                  <p className="font-serif text-[12px]">
                    {data.witness1Name || 'Nome: ______________________________________'}
                  </p>
                  <p className="font-sans text-[11px] text-slate-500">
                    CPF: {data.witness1Cpf || '_______________________________________'}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold uppercase tracking-wider text-[11px] font-sans text-slate-700">
                    TESTEMUNHA 2
                  </p>
                  <p className="font-serif text-[12px]">
                    {data.witness2Name || 'Nome: ______________________________________'}
                  </p>
                  <p className="font-sans text-[11px] text-slate-500">
                    CPF: {data.witness2Cpf || '_______________________________________'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé e Nota de Responsabilidade */}
          <div className="mt-14 pt-6 border-t border-slate-200 text-center text-[11px] font-sans text-slate-400 leading-normal">
            <blockquote>
              Observação: este é um modelo contratual de uso geral. Dependendo do serviço
              (desenvolvimento de software, marketing, consultoria, design, engenharia, saúde etc.),
              pode ser recomendável a revisão por advogado para adequação ao caso específico.
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  )
}
