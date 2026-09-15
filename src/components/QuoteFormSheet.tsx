import { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react'
import { QuoteItem } from '@/types'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'

export function QuoteFormSheet({
  triggerAsChild,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  triggerAsChild?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const { clients, addQuote, currentTier } = useAppData()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 },
  ])

  // Checagem de plano
  const isEconomy = currentTier === 'economy'

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const handleItemChange = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value }
        }
        return item
      }),
    )
  }

  const total = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isEconomy) {
      toast.error('Recurso do Plano Intermediate', {
        description:
          'Seu plano atual é o Economy. Faça upgrade para emitir orçamentos formais em PDF.',
      })
      return
    }

    if (!clientId) {
      toast.error('Selecione um cliente para o orçamento.')
      return
    }

    const hasInvalidItems = items.some(
      (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0,
    )
    if (hasInvalidItems) {
      toast.error('Preencha a descrição, quantidade e valor de todos os itens do orçamento.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await addQuote({
        clientId,
        date: new Date(`${date}T12:00:00`).toISOString(),
        items,
        total,
        status: 'Rascunho',
      })

      if (created) {
        setOpen(false)
        setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0 }])
        setClientId('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {triggerAsChild ? (
        <SheetTrigger asChild>{triggerAsChild}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Novo Orçamento
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-heading font-serif text-xl">Novo Orçamento</SheetTitle>
          <SheetDescription className="text-xs">
            Crie uma proposta comercial detalhada para enviar ao seu cliente.
          </SheetDescription>
        </SheetHeader>

        {isEconomy && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#b07d4f]" />
            <div>
              <strong>Plano Economy:</strong> orçamentos formais estão disponíveis a partir do plano{' '}
              <strong>Intermediate</strong>. Faça upgrade no seu perfil para emitir.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label htmlFor="quote-client" className="text-xs font-medium">
              Cliente *
            </Label>
            <Select required value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="quote-client">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhum cliente cadastrado ainda
                  </SelectItem>
                ) : (
                  clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quote-date" className="text-xs font-medium">
              Data de Emissão *
            </Label>
            <Input
              id="quote-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Itens e Serviços *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="text-xs h-7 gap-1 text-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Linha
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-2 items-center bg-muted/30 p-2.5 rounded-lg border border-border/40"
                >
                  <div className="flex-1">
                    <Input
                      placeholder={`Descrição do serviço ${index + 1}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="text-xs h-8 bg-background"
                      required
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)
                      }
                      className="text-xs h-8 bg-background"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor un."
                      value={item.unitPrice || ''}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      className="text-xs h-8 bg-background"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={items.length === 1}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-sm font-medium">Valor Total Previsto</span>
            <span className="text-xl font-serif font-bold text-foreground">
              {formatCurrency(total)}
            </span>
          </div>

          <SheetFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
            <SheetClose asChild>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting || isEconomy}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...
                </>
              ) : (
                'Salvar Orçamento'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
export default QuoteFormSheet
