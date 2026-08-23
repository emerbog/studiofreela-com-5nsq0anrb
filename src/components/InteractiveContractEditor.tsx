import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppData } from '@/hooks/use-app-data'
import { Contract, ContractFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Trash2,
  FileText,
  User,
  FileSignature,
  DollarSign,
  Shield,
  Sparkles,
  Building,
} from 'lucide-react'
import { toast } from 'sonner'

export type InteractiveContractValues = z.infer<typeof interactiveContractSchema>

const deliverableSchema = z.object({
  description: z.string().min(1, 'Informe a descrição da entrega'),
  date: z.string().min(1, 'Informe a data de entrega'),
})

const paymentInstallmentSchema = z.object({
  amount: z.number().min(0, 'Valor inválido'),
  date: z.string().min(1, 'Informe a data de vencimento'),
})

export const interactiveContractSchema = z.object({
  clientId: z.string().min(1, 'Selecione ou identifique o cliente'),
  quoteId: z.string().optional(),
  status: z.enum(['Rascunho', 'Enviado', 'Assinado']),

  // Contratante
  clientName: z.string().min(2, 'Informe o Nome ou Razão Social do Contratante'),
  clientDoc: z.string().min(3, 'Informe o CPF ou CNPJ do Contratante'),
  clientAddress: z.string().min(3, 'Informe o endereço do Contratante'),
  clientLegalRep: z.string().optional(),
  clientEmail: z.string().min(3, 'Informe o e-mail do Contratante'),
  clientPhone: z.string().min(3, 'Informe o telefone do Contratante'),

  // Contratado
  contractorName: z.string().min(2, 'Informe o Nome do Contratado'),
  contractorCpf: z.string().min(3, 'Informe o CPF do Contratado'),
  contractorRg: z.string().min(2, 'Informe o RG do Contratado'),
  contractorAddress: z.string().min(3, 'Informe o endereço do Contratado'),
  contractorProfession: z.string().min(2, 'Informe a profissão'),
  contractorEmail: z.string().min(3, 'Informe o e-mail do Contratado'),
  contractorPhone: z.string().min(3, 'Informe o telefone do Contratado'),

  // Cláusula 1 - Objeto
  serviceScope: z.string().min(5, 'Descreva detalhadamente o escopo dos serviços'),

  // Cláusula 2 - Prazo
  startDate: z.string().min(1, 'Informe a data de início'),
  endDate: z.string().min(1, 'Informe a data prevista de conclusão'),

  // Cláusula 3 - Entregas
  deliverables: z.array(deliverableSchema).min(1, 'Adicione pelo menos 1 entrega'),
  acceptanceDays: z.number().min(1, 'Informe o prazo de aceite (dias)'),

  // Cláusula 4 - Valor e Forma de Cobrança
  totalValue: z.number().min(1, 'Informe o valor total do contrato'),
  billingType: z.enum(['fixed', 'monthly', 'hourly', 'other']),
  billingTypeOther: z.string().optional(),

  // Cláusula 5 - Forma de Pagamento e Dados Bancários
  paymentMethod: z.enum(['pix', 'bank_transfer', 'ted', 'boleto', 'other']),
  paymentMethodOther: z.string().optional(),
  bankName: z.string().optional(),
  bankAgency: z.string().optional(),
  bankAccount: z.string().optional(),
  pixKey: z.string().optional(),
  paymentSchedule: z
    .array(paymentInstallmentSchema)
    .min(1, 'Adicione pelo menos 1 parcela no cronograma'),

  // Cláusula 6 - Atraso no Pagamento
  lateFinePercent: z.number().min(0, 'Informe a porcentagem de multa'),
  lateInterestMonthlyPercent: z.number().min(0, 'Informe a taxa mensal de juros'),

  // Cláusula 10 - Confidencialidade
  confidentialityPenaltyType: z.enum(['fixed', 'percent']),
  confidentialityPenaltyValue: z.union([z.number(), z.string()]),

  // Cláusula 11 - LGPD
  dataController: z.string().min(2, 'Informe o Controlador dos dados'),
  dataOperator: z.string().min(2, 'Informe o Operador dos dados'),

  // Cláusula 12 - Propriedade Intelectual
  intellectualPropertyMaterials: z.string().min(3, 'Descreva os materiais abrangidos'),
  portfolioPermission: z.enum(['allowed', 'not_allowed']),

  // Cláusula 14 - Rescisão
  noticePeriodDays: z.number().min(1, 'Informe os dias de aviso prévio'),

  // Cláusula 15 - Penalidades gerais
  generalPenaltyPercent: z.number().min(0, 'Informe a % da multa geral'),

  // Cláusula 16 - Foro
  forumCity: z.string().min(2, 'Informe a Comarca do Foro'),

  // Assinaturas
  signatureLocation: z.string().min(2, 'Informe a cidade/local da assinatura'),
  signatureDate: z.string().min(1, 'Informe a data da assinatura'),
  witness1Name: z.string().optional(),
  witness1Cpf: z.string().optional(),
  witness2Name: z.string().optional(),
  witness2Cpf: z.string().optional(),
})

interface InteractiveContractEditorProps {
  initialContract?: Contract | null
  initialQuoteId?: string
  initialClientId?: string
  onGenerateSuccess: (savedContract: Contract, previewData: ContractFormData) => void
  onCancel?: () => void
}

export function InteractiveContractEditor({
  initialContract,
  initialQuoteId,
  initialClientId,
  onGenerateSuccess,
  onCancel,
}: InteractiveContractEditorProps) {
  const { clients, quotes, addContract } = useAppData()

  const defaultValues: InteractiveContractValues = {
    clientId: initialContract?.clientId || initialClientId || clients[0]?.id || '',
    quoteId: initialContract?.quoteId || initialQuoteId || 'none',
    status: initialContract?.status || 'Rascunho',

    // Contratante
    clientName: initialContract?.formData?.clientName || '',
    clientDoc: initialContract?.formData?.clientDoc || '',
    clientAddress: initialContract?.formData?.clientAddress || '',
    clientLegalRep: initialContract?.formData?.clientLegalRep || '',
    clientEmail: initialContract?.formData?.clientEmail || '',
    clientPhone: initialContract?.formData?.clientPhone || '',

    // Contratado
    contractorName: initialContract?.formData?.contractorName || 'Felipe Freelancer',
    contractorCpf: initialContract?.formData?.contractorCpf || '123.456.789-00',
    contractorRg: initialContract?.formData?.contractorRg || '12.345.678-9 SSP/SP',
    contractorAddress:
      initialContract?.formData?.contractorAddress || 'Rua Augusta, 500 - São Paulo/SP',
    contractorProfession:
      initialContract?.formData?.contractorProfession || 'Prestador de Serviços / Desenvolvedor',
    contractorEmail: initialContract?.formData?.contractorEmail || 'felipe@freelance.com',
    contractorPhone: initialContract?.formData?.contractorPhone || '(11) 98765-4321',

    // Cláusula 1 - Objeto
    serviceScope:
      initialContract?.formData?.serviceScope ||
      'Prestação de serviços profissionais de design, desenvolvimento e implantação de soluções digitais conforme especificações acordadas entre as partes.',

    // Cláusula 2 - Prazo
    startDate: initialContract?.formData?.startDate || new Date().toISOString().slice(0, 10),
    endDate:
      initialContract?.formData?.endDate ||
      new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),

    // Cláusula 3 - Entregas
    deliverables:
      initialContract?.formData?.deliverables && initialContract.formData.deliverables.length > 0
        ? initialContract.formData.deliverables.map((d) => ({
            description: d.description,
            date: d.date,
          }))
        : [
            {
              description: 'Etapa 1: Planejamento, arquitetura e layout inicial',
              date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
            },
            {
              description: 'Etapa 2: Desenvolvimento da interface e funcionalidades principais',
              date: new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10),
            },
            {
              description: 'Etapa 3: Integrações, relatórios e refinamentos',
              date: new Date(Date.now() + 86400000 * 22).toISOString().slice(0, 10),
            },
            {
              description: 'Etapa 4: Homologação final, testes e entrega dos arquivos finais',
              date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
            },
          ],
    acceptanceDays: Number(initialContract?.formData?.acceptanceDays) || 5,

    // Cláusula 4 - Valor e Forma de Cobrança
    totalValue: Number(initialContract?.formData?.totalValue) || 3500,
    billingType: initialContract?.formData?.billingType || 'fixed',
    billingTypeOther: initialContract?.formData?.billingTypeOther || '',

    // Cláusula 5 - Forma de Pagamento e Dados Bancários
    paymentMethod: initialContract?.formData?.paymentMethod || 'pix',
    paymentMethodOther: initialContract?.formData?.paymentMethodOther || '',
    bankName: initialContract?.formData?.bankName || 'Nubank (260)',
    bankAgency: initialContract?.formData?.bankAgency || '0001',
    bankAccount: initialContract?.formData?.bankAccount || '1234567-8',
    pixKey: initialContract?.formData?.pixKey || 'felipe@freelance.com',
    paymentSchedule:
      initialContract?.formData?.paymentSchedule &&
      initialContract.formData.paymentSchedule.length > 0
        ? initialContract.formData.paymentSchedule.map((p) => ({
            amount: Number(p.amount) || 0,
            date: p.date,
          }))
        : [
            { amount: 1750, date: new Date().toISOString().slice(0, 10) },
            {
              amount: 1750,
              date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
            },
          ],

    // Cláusula 6 - Atraso no Pagamento
    lateFinePercent: Number(initialContract?.formData?.lateFinePercent) || 2,
    lateInterestMonthlyPercent: Number(initialContract?.formData?.lateInterestMonthlyPercent) || 1,

    // Cláusula 10 - Confidencialidade
    confidentialityPenaltyType: initialContract?.formData?.confidentialityPenaltyType || 'percent',
    confidentialityPenaltyValue: initialContract?.formData?.confidentialityPenaltyValue ?? 20,

    // Cláusula 11 - LGPD
    dataController: initialContract?.formData?.dataController || '',
    dataOperator: initialContract?.formData?.dataOperator || 'Felipe Freelancer',

    // Cláusula 12 - Propriedade Intelectual
    intellectualPropertyMaterials:
      initialContract?.formData?.intellectualPropertyMaterials ||
      'Todo o código-fonte, layout visual, documentação técnica, arquivos editáveis e materiais digitais desenvolvidos especificamente no escopo deste contrato.',
    portfolioPermission: initialContract?.formData?.portfolioPermission || 'allowed',

    // Cláusula 14 - Rescisão
    noticePeriodDays: Number(initialContract?.formData?.noticePeriodDays) || 15,

    // Cláusula 15 - Penalidades gerais
    generalPenaltyPercent: Number(initialContract?.formData?.generalPenaltyPercent) || 10,

    // Cláusula 16 - Foro
    forumCity: initialContract?.formData?.forumCity || 'São Paulo/SP',

    // Assinaturas
    signatureLocation: initialContract?.formData?.signatureLocation || 'São Paulo/SP',
    signatureDate:
      initialContract?.formData?.signatureDate || new Date().toISOString().slice(0, 10),
    witness1Name: initialContract?.formData?.witness1Name || 'Mariana Souza',
    witness1Cpf: initialContract?.formData?.witness1Cpf || '111.222.333-44',
    witness2Name: initialContract?.formData?.witness2Name || 'Roberto Lima',
    witness2Cpf: initialContract?.formData?.witness2Cpf || '555.666.777-88',
  }

  const form = useForm<InteractiveContractValues>({
    resolver: zodResolver(interactiveContractSchema),
    defaultValues,
  })

  // Watch selected client to auto-fill if empty
  const selectedClientId = form.watch('clientId')
  const selectedQuoteId = form.watch('quoteId')
  const billingTypeWatch = form.watch('billingType')
  const paymentMethodWatch = form.watch('paymentMethod')
  const confidentialityPenaltyTypeWatch = form.watch('confidentialityPenaltyType')

  useEffect(() => {
    if (selectedClientId && !initialContract) {
      const client = clients.find((c) => c.id === selectedClientId)
      if (client) {
        if (!form.getValues('clientName')) form.setValue('clientName', client.name)
        if (!form.getValues('clientDoc')) form.setValue('clientDoc', client.document || '')
        if (!form.getValues('clientEmail')) form.setValue('clientEmail', client.email || '')
        if (!form.getValues('clientPhone')) form.setValue('clientPhone', client.phone || '')
        if (!form.getValues('clientAddress'))
          form.setValue('clientAddress', 'Endereço Comercial / Matriz')
        if (!form.getValues('dataController')) form.setValue('dataController', client.name)
      }
    }
  }, [selectedClientId, clients, form, initialContract])

  // Watch quote selection to auto-populate scope & total value
  useEffect(() => {
    if (selectedQuoteId && selectedQuoteId !== 'none' && !initialContract) {
      const quote = quotes.find((q) => q.id === selectedQuoteId)
      if (quote) {
        if (quote.clientId) form.setValue('clientId', quote.clientId)
        form.setValue('totalValue', quote.total)

        const itemsDescription = quote.items
          .map((item, idx) => `${idx + 1}. ${item.description} (Qtd: ${item.quantity})`)
          .join('\n')

        form.setValue(
          'serviceScope',
          `Serviços conforme Orçamento nº ${quote.number}:\n\n${itemsDescription}`,
        )

        // Adjust payment schedule to match total
        const half = Math.round(quote.total / 2)
        form.setValue('paymentSchedule', [
          { amount: half, date: new Date().toISOString().slice(0, 10) },
          {
            amount: quote.total - half,
            date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          },
        ])
      }
    }
  }, [selectedQuoteId, quotes, form, initialContract])

  // Field Arrays for dynamic tables
  const {
    fields: deliverableFields,
    append: appendDeliverable,
    remove: removeDeliverable,
  } = useFieldArray({
    control: form.control,
    name: 'deliverables',
  })

  const {
    fields: scheduleFields,
    append: appendSchedule,
    remove: removeSchedule,
  } = useFieldArray({
    control: form.control,
    name: 'paymentSchedule',
  })

  const handlePreFillAutoSchedule = (installmentsCount: number) => {
    const total = Number(form.getValues('totalValue')) || 0
    const perInst = Math.round((total / installmentsCount) * 100) / 100
    const newSchedule = Array.from({ length: installmentsCount }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i * 30)
      return {
        amount: i === installmentsCount - 1 ? total - perInst * (installmentsCount - 1) : perInst,
        date: d.toISOString().slice(0, 10),
      }
    })
    form.setValue('paymentSchedule', newSchedule)
    toast.success(`Cronograma recalculado em ${installmentsCount} parcelas!`)
  }

  const onSubmit = (values: InteractiveContractValues) => {
    const formData: ContractFormData = {
      clientName: values.clientName,
      clientDoc: values.clientDoc,
      clientAddress: values.clientAddress,
      clientLegalRep: values.clientLegalRep,
      clientEmail: values.clientEmail,
      clientPhone: values.clientPhone,

      contractorName: values.contractorName,
      contractorCpf: values.contractorCpf,
      contractorRg: values.contractorRg,
      contractorAddress: values.contractorAddress,
      contractorProfession: values.contractorProfession,
      contractorEmail: values.contractorEmail,
      contractorPhone: values.contractorPhone,

      serviceScope: values.serviceScope,
      startDate: values.startDate,
      endDate: values.endDate,

      deliverables: values.deliverables,
      acceptanceDays: values.acceptanceDays,

      totalValue: values.totalValue,
      billingType: values.billingType,
      billingTypeOther: values.billingTypeOther,

      paymentMethod: values.paymentMethod,
      paymentMethodOther: values.paymentMethodOther,
      bankName: values.bankName,
      bankAgency: values.bankAgency,
      bankAccount: values.bankAccount,
      pixKey: values.pixKey,
      paymentSchedule: values.paymentSchedule,

      lateFinePercent: values.lateFinePercent,
      lateInterestMonthlyPercent: values.lateInterestMonthlyPercent,

      confidentialityPenaltyType: values.confidentialityPenaltyType,
      confidentialityPenaltyValue: values.confidentialityPenaltyValue,

      dataController: values.dataController,
      dataOperator: values.dataOperator,

      intellectualPropertyMaterials: values.intellectualPropertyMaterials,
      portfolioPermission: values.portfolioPermission,

      noticePeriodDays: values.noticePeriodDays,
      generalPenaltyPercent: values.generalPenaltyPercent,

      forumCity: values.forumCity,

      signatureLocation: values.signatureLocation,
      signatureDate: values.signatureDate,
      witness1Name: values.witness1Name,
      witness1Cpf: values.witness1Cpf,
      witness2Name: values.witness2Name,
      witness2Cpf: values.witness2Cpf,
    }

    const createdContract: Contract = {
      id: initialContract?.id || Math.random().toString(36).substring(2, 9),
      clientId: values.clientId,
      quoteId: values.quoteId === 'none' ? undefined : values.quoteId,
      number: initialContract?.number || `CTR-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      content: values.serviceScope,
      formData,
      status: values.status,
    }

    if (!initialContract) {
      addContract({
        clientId: createdContract.clientId,
        quoteId: createdContract.quoteId,
        date: createdContract.date,
        content: createdContract.content,
        formData: createdContract.formData,
        status: createdContract.status,
      })
    }

    toast.success('Contrato gerado com sucesso! Exibindo visualização formatada.')
    onGenerateSuccess(createdContract, formData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-fade-in pb-12">
        {/* Top bar info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-card to-secondary/30 rounded-xl border border-border/70 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Plano Advanced • Gerador Jurídico Freelancer
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-heading">
              {initialContract
                ? `Editar Contrato ${initialContract.number}`
                : 'Preenchimento Interativo do Contrato'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Preencha todos os campos do modelo de Prestação de Serviços. O contrato completo será
              gerado com precisão e elegância.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" size="default" className="shadow-md gap-2">
              <FileSignature className="w-4 h-4" /> Gerar Contrato Formatado
            </Button>
          </div>
        </div>

        {/* Bloco 0: Vínculos e Status */}
        <Card className="elegant-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-4 h-4 text-accent" /> Vínculo e Status do Documento
            </CardTitle>
            <CardDescription>
              Vincule a um cliente cadastrado ou a um orçamento para preenchimento ágil.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente Cadastrado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.document ? `(${c.document})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quoteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular Orçamento (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um orçamento..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum orçamento</SelectItem>
                      {quotes.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.number} (Total: R$ {q.total})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Importa escopo e valores automaticamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Contrato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Enviado">Enviado</SelectItem>
                      <SelectItem value="Assinado">Assinado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Bloco 1: Partes Identificadas (Contratante e Contratado) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CONTRATANTE */}
          <Card className="elegant-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> CONTRATANTE (Cliente / Tomador)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome / Razão Social *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Studio Criativo Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF / CNPJ *</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0001-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientLegalRep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representante Legal (se PJ)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="clientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Paulista, 1000, Cj 50 - São Paulo/SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@cliente.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98888-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* CONTRATADO */}
          <Card className="elegant-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <User className="w-4 h-4 text-accent" /> CONTRATADO (Freelancer / Prestador)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <FormField
                control={form.control}
                name="contractorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Felipe Freelancer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractorCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractorRg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG *</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000-0 SSP/SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractorProfession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Desenvolvedor Fullstack" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98765-4321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contractorAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua Augusta, 500, Apto 42 - São Paulo/SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="felipe@freelance.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* CLÁUSULA 1ª & 2ª: Objeto e Prazo */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-lg">Cláusulas 1ª e 2ª – Objeto e Prazos</CardTitle>
            <CardDescription>
              Defina detalhadamente os serviços prestados e datas de vigência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="serviceScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-sm">
                    Cláusula 1ª: Descrição dos Serviços Prestados *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o escopo completo das atividades acordadas..."
                      rows={4}
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    "Ficam excluídas do escopo deste contrato quaisquer atividades não descritas
                    acima, salvo mediante ajuste formal entre as partes."
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-border/50">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início dos Serviços *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista para Conclusão *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* CLÁUSULA 3ª: Tabela Dinâmica de Entregas e Aceite */}
        <Card className="elegant-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Cláusula 3ª – Das Entregas</CardTitle>
              <CardDescription>
                Tabela interativa de marcos/entregáveis do projeto. Adicione e remova conforme o
                escopo.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendDeliverable({
                  description: '',
                  date: new Date().toISOString().slice(0, 10),
                })
              }
              className="gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Adicionar Entregável
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {deliverableFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/60"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <FormField
                      control={form.control}
                      name={`deliverables.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              placeholder={`Descrição do Entregável ${index + 1}`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <FormField
                      control={form.control}
                      name={`deliverables.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {deliverableFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/50 max-w-sm">
              <FormField
                control={form.control}
                name="acceptanceDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de Aceite / Ajustes (em dias úteis) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Prazo que o Contratante tem para aceitar ou solicitar revisões.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* CLÁUSULA 4ª & 5ª: Valores, Cobrança e Forma de Pagamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CLÁUSULA 4ª: DO VALOR */}
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Cláusula 4ª – Do Valor e
                Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total dos Serviços (R$) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-medium">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 text-base font-semibold"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold text-sm">Forma de Cobrança *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="fixed" id="bt-fixed" />
                          <Label htmlFor="bt-fixed" className="font-normal cursor-pointer">
                            Valor fixo pelo projeto
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="monthly" id="bt-monthly" />
                          <Label htmlFor="bt-monthly" className="font-normal cursor-pointer">
                            Valor mensal
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="hourly" id="bt-hourly" />
                          <Label htmlFor="bt-hourly" className="font-normal cursor-pointer">
                            Valor por hora
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="other" id="bt-other" />
                          <Label htmlFor="bt-other" className="font-normal cursor-pointer">
                            Outro
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {billingTypeWatch === 'other' && (
                <FormField
                  control={form.control}
                  name="billingTypeOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especifique a Forma de Cobrança *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Por sprint quinzenal + bônus" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* CLÁUSULA 5ª: DA FORMA DE PAGAMENTO */}
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" /> Cláusula 5ª – Método e Dados Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold text-sm">Método de Pagamento *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pix" id="pm-pix" />
                          <Label htmlFor="pm-pix" className="font-normal cursor-pointer">
                            PIX
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bank_transfer" id="pm-transfer" />
                          <Label htmlFor="pm-transfer" className="font-normal cursor-pointer">
                            Transferência
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ted" id="pm-ted" />
                          <Label htmlFor="pm-ted" className="font-normal cursor-pointer">
                            TED
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="boleto" id="pm-boleto" />
                          <Label htmlFor="pm-boleto" className="font-normal cursor-pointer">
                            Boleto
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 col-span-2">
                          <RadioGroupItem value="other" id="pm-other" />
                          <Label htmlFor="pm-other" className="font-normal cursor-pointer">
                            Outro
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMethodWatch === 'other' && (
                <FormField
                  control={form.control}
                  name="paymentMethodOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especifique o Método *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cartão de Crédito em 3x" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="p-4 bg-muted/40 rounded-lg border border-border/60 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dados para Recebimento
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Nubank / Itaú" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankAgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="0001" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Conta Corrente</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567-8" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pixKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Chave PIX</FormLabel>
                        <FormControl>
                          <Input placeholder="chave@email.com ou CPF" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cronograma de Pagamento (Tabela Dinâmica) */}
        <Card className="elegant-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Cronograma de Pagamento (Parcelas)</CardTitle>
              <CardDescription>
                Distribua as parcelas do valor total contratado com suas respectivas datas de
                vencimento.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handlePreFillAutoSchedule(2)}
                className="text-xs"
              >
                2x (50% / 50%)
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handlePreFillAutoSchedule(3)}
                className="text-xs"
              >
                3x Iguais
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSchedule({
                    amount: 0,
                    date: new Date().toISOString().slice(0, 10),
                  })
                }
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nova Parcela
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {scheduleFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/60"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}ª
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <FormField
                      control={form.control}
                      name={`paymentSchedule.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">
                                R$
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Valor da parcela"
                                className="pl-9"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <FormField
                      control={form.control}
                      name={`paymentSchedule.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {scheduleFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSchedule(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CLÁUSULAS 6ª a 11ª: Penalidades, LGPD e Obrigações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cláusula 6: Atraso */}
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle className="text-base font-serif">
                Cláusula 6ª – Atraso no Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lateFinePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multa por Atraso (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Ex: 2% sobre o valor devido
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lateInterestMonthlyPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Juros ao Mês (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Ex: 1% ao mês</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cláusula 10: Confidencialidade */}
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle className="text-base font-serif">
                Cláusula 10ª – Confidencialidade (Multa)
              </CardTitle>
              <CardDescription>Válida por 5 anos após o término.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="confidentialityPenaltyType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Tipo de Multa por Violação</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percent" id="conf-pct" />
                          <Label htmlFor="conf-pct" className="cursor-pointer font-normal">
                            % do Valor do Contrato
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="conf-fix" />
                          <Label htmlFor="conf-fix" className="cursor-pointer font-normal">
                            Valor Fixo (R$)
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confidentialityPenaltyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {confidentialityPenaltyTypeWatch === 'fixed'
                        ? 'Valor da Multa (R$) *'
                        : 'Porcentagem da Multa (%) *'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(
                            Number.isNaN(Number(val)) || val === '' ? val : Number(val),
                          )
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Cláusula 11: LGPD */}
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle className="text-base font-serif">
                Cláusula 11ª – Proteção de Dados (LGPD)
              </CardTitle>
              <CardDescription>
                Identificação dos agentes de tratamento segundo a Lei 13.709/2018.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="dataController"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Controlador dos Dados *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Nome da Empresa Contratante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataOperator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operador dos Dados *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Nome do Freelancer / Contratado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Cláusula 12: Propriedade Intelectual & Portfólio */}
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle className="text-base font-serif">
                Cláusula 12ª – Propriedade Intelectual & Portfólio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="intellectualPropertyMaterials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição dos materiais abrangidos *</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioPermission"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Menção ao projeto no portfólio profissional *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="allowed" id="pf-yes" />
                          <Label htmlFor="pf-yes" className="cursor-pointer font-normal">
                            (X) Permitido
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="not_allowed" id="pf-no" />
                          <Label htmlFor="pf-no" className="cursor-pointer font-normal">
                            ( ) Não permitido
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* CLÁUSULAS 14ª, 15ª & 16ª: Rescisão, Penalidades Gerais e Foro */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Cláusulas 14ª, 15ª e 16ª – Rescisão, Penalidades e Foro
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="noticePeriodDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aviso Prévio de Rescisão (Dias) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Ex: 15 ou 30 dias</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="generalPenaltyPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Multa por Inadimplemento Geral (%) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    % do valor total do contrato
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="forumCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comarca do Foro Eleito *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Comarca de São Paulo/SP" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Cidade e estado de foro</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Assinaturas e Testemunhas */}
        <Card className="elegant-card">
          <CardHeader>
            <CardTitle className="text-lg">Fechamento, Local e Testemunhas</CardTitle>
            <CardDescription>
              Informações para o encerramento do instrumento e firmas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="signatureLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local da Assinatura *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo - SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signatureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Assinatura *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Testemunha 1 */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Testemunha 1 (Opcional)
                </p>
                <FormField
                  control={form.control}
                  name="witness1Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome da Testemunha 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="witness1Cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Testemunha 2 */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Testemunha 2 (Opcional)
                </p>
                <FormField
                  control={form.control}
                  name="witness2Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nome da Testemunha 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="witness2Cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Envio Inferior */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/70">
          {onCancel && (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="lg" className="px-8 shadow-md gap-2">
            <FileSignature className="w-5 h-5" /> Gerar Contrato
          </Button>
        </div>
      </form>
    </Form>
  )
}
