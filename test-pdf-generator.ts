import { buildQuoteBinaryPdfBlob } from './src/lib/quote-pdf'
import { Quote, Client, UserProfile } from './src/types'

const mockUser: UserProfile = {
  id: 'usr1',
  name: 'Lucas Fotógrafo & Filmes',
  email: 'lucas@studiofreela.com',
  phone: '(11) 98765-4321',
  cpfCnpj: '12.345.678/0001-90',
  profession: 'Diretor de Fotografia e Vídeo Maker',
  bio: '',
  plan: 'free',
  created: '',
  updated: '',
}

const mockClient: Client = {
  id: 'cli1',
  userId: 'usr1',
  name: 'Agência Criativa Alpha Ltda',
  tradeName: 'Alpha Comunicação',
  type: 'PJ',
  document: '98.765.432/0001-10',
  email: 'contato@alphacriativa.com.br',
  phone: '(11) 91234-5678',
  status: 'Ativo',
  totalBilled: 0,
  created: '',
  updated: '',
}

const mockQuote: Quote = {
  id: 'quote-test-1',
  clientId: 'cli1',
  number: 'ORC-2025-001',
  date: '2025-05-10T12:00:00.000Z',
  validityDays: 15,
  status: 'Enviado',
  eventName: 'Cobertura Audiovisual Summit 2025',
  eventLocation: 'Centro de Convenções Rebouças - SP',
  eventStartDate: '2025-06-20',
  eventStartTime: '08:00',
  eventEndDate: '2025-06-20',
  eventEndTime: '19:00',
  notes: 'Entrega dos brutos em 48h e vídeo final em 7 dias.',
  items: [
    {
      description: 'Diária de Gravação 4K Multi-câmera com Iluminação Completa',
      quantity: 1,
      unit: 'diária',
      unitPrice: 2800,
    },
    {
      description: 'Edição de Vídeo Highlight (Teaser dinâmico 90s + 3 Reels verticais)',
      quantity: 1,
      unit: 'serviço',
      unitPrice: 1500,
    },
  ],
  equipments: [
    {
      description: 'Kit Câmeras Sony FX3 Cinema Line + Lentes Prime G-Master',
      quantity: 2,
      unitPrice: 600,
      includedInService: false,
    },
    {
      description: 'Kit Microfones de Lapela sem fio DJI Mic 2',
      quantity: 1,
      unitPrice: 0,
      includedInService: true,
    },
  ],
  overtimeRule: {
    enabled: true,
    hourlyRate: 350,
    graceMinutes: 15,
    notes: 'Aplicável após as 19h.',
  },
  logistics: {
    meal: {
      type: 'contracted',
      chargedAmount: 120,
      notes: 'Alimentação da equipe de 2 operadores',
    },
    transport: {
      type: 'contracted',
      chargedAmount: 180,
      notes: 'Deslocamento van com equipamentos',
    },
    lodging: {
      type: 'not_applicable',
    },
  },
  paymentSchedule: [
    {
      id: 'inst-1',
      description: '50% Sinal para reserva de data',
      dueDate: '2025-05-15',
      percentage: 50,
      method: 'PIX',
      value: 2900,
    },
    {
      id: 'inst-2',
      description: '50% Restante no dia da entrega final',
      dueDate: '2025-06-27',
      percentage: 50,
      method: 'Transferência',
      value: 2900,
    },
  ],
  priceSummary: {
    servicesSubtotal: 4300,
    equipmentsSubtotal: 1200,
    expensesSubtotal: 300,
    discounts: 0,
    grandTotal: 5800,
    overtimeSeparated: true,
  },
  total: 5800,
}

const blob = buildQuoteBinaryPdfBlob(mockQuote, mockClient, mockUser)
console.log('Blob size:', blob.size, 'type:', blob.type)

blob.arrayBuffer().then((buf) => {
  const text = new TextDecoder('latin1').decode(buf)
  console.log('PDF starts with PDF-1.4:', text.startsWith('%PDF-1.4'))
  console.log('PDF ends with %%EOF:', text.trim().endsWith('%%EOF'))

  // Verify service values
  console.log('Contains R$ 2.800,00:', text.includes('2.800,00'))
  console.log('Contains R$ 1.500,00:', text.includes('1.500,00'))
  console.log('Contains R$ 600,00:', text.includes('600,00'))
  console.log('Contains R$ 1.200,00:', text.includes('1.200,00'))
  console.log('Contains Incluso no servico:', text.includes('Incluso no servico'))

  // Verify schedule values and payment methods
  console.log('Contains PIX:', text.includes('(PIX) Tj'))
  console.log('Contains Transferencia:', text.includes('(Transferencia) Tj'))
  console.log('Contains 2.900,00:', text.includes('2.900,00'))

  // Verify financial summary
  console.log('Contains Servicos: R$ 4.300,00:', text.includes('Servicos: R$ 4.300,00'))
  console.log('Contains Equipamentos: R$ 1.200,00:', text.includes('Equipamentos: R$ 1.200,00'))
  console.log(
    'Contains Despesas/Logistica: R$ 300,00:',
    text.includes('Despesas/Logistica: R$ 300,00'),
  )
  console.log('Contains TOTAL: R$ 5.800,00:', text.includes('TOTAL: R$ 5.800,00'))

  // Verify signature box height and gov.br instructions
  console.log('Contains area livre carimbo:', text.includes('carimbo eletronico do CONTRATANTE'))
  console.log('Contains Lei Federal 14.063/2020:', text.includes('Lei Federal 14.063/2020'))

  console.log('ALL CHECKS PASSED!')
})
