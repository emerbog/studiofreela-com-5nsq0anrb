import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAppData } from '@/hooks/use-app-data'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const contractSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  quoteId: z.string().optional(),
  status: z.enum(['Rascunho', 'Enviado', 'Assinado']),
  content: z.string().min(10, 'O conteúdo do contrato deve ter pelo menos 10 caracteres'),
})

type ContractFormValues = z.infer<typeof contractSchema>

const defaultContractContent = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

1. DAS PARTES
De um lado, [DADOS DO CONTRATANTE], doravante denominado CONTRATANTE.
De outro lado, Elegante Freelance, doravante denominado CONTRATADO.

2. DO OBJETO
O presente contrato tem como objeto a prestação de serviços de...

3. DO VALOR E FORMA DE PAGAMENTO
O valor total dos serviços acordados é de...

4. DAS OBRIGAÇÕES
O CONTRATADO obriga-se a...`

export function ContractFormSheet({ triggerAsChild }: { triggerAsChild: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { clients, quotes, addContract } = useAppData()

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      clientId: '',
      quoteId: 'none',
      status: 'Rascunho',
      content: defaultContractContent,
    },
  })

  const onSubmit = (data: ContractFormValues) => {
    addContract({
      clientId: data.clientId,
      quoteId: data.quoteId === 'none' ? undefined : data.quoteId,
      date: new Date().toISOString(),
      content: data.content,
      status: data.status,
    })
    setOpen(false)
    form.reset()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{triggerAsChild}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 flex flex-col">
        <div className="p-6 pb-0">
          <SheetHeader>
            <SheetTitle>Novo Contrato</SheetTitle>
            <SheetDescription>
              Gere um contrato formal a partir de um modelo ou orçamento.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 pt-6 flex-1 flex flex-col gap-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                    <FormLabel>Vincular Orçamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {quotes.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.number} ({q.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel>Termos e Condições (Escopo)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="flex-1 min-h-[350px] resize-none font-mono text-xs bg-muted/30"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-auto pt-6 border-t flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Gerar Contrato</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
