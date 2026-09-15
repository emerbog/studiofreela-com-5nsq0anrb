import { useState, useEffect } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Loader2 } from 'lucide-react'
import { Client } from '@/types'
import {
  isValidEmail,
  isValidCpfCnpj,
  isValidPhone,
  maskCpfCnpj,
  maskPhone,
} from '@/lib/validators'
import { toast } from 'sonner'

interface ClientFormSheetProps {
  triggerAsChild?: React.ReactNode
  clientToEdit?: Client | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function ClientFormSheet({
  triggerAsChild,
  clientToEdit,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: ClientFormSheetProps) {
  const { addClient, updateClient } = useAppData()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    notes: '',
  })

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        email: clientToEdit.email || '',
        phone: clientToEdit.phone || '',
        document: clientToEdit.document || '',
        notes: clientToEdit.notes || '',
      })
    } else {
      setFormData({ name: '', email: '', phone: '', document: '', notes: '' })
    }
  }, [clientToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.name.trim()) {
      toast.error('Informe o nome ou razão social do cliente.')
      return
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error('O formato do e-mail é inválido.')
      return
    }

    if (formData.document && !isValidCpfCnpj(formData.document)) {
      toast.error('O CPF ou CNPJ informado é inválido (dígitos verificadores incorretos).')
      return
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      toast.error('O telefone informado é inválido (deve conter DDD + número).')
      return
    }

    setIsSubmitting(true)
    try {
      if (clientToEdit) {
        const ok = await updateClient(clientToEdit.id, formData)
        if (ok) {
          setOpen(false)
          onSuccess?.()
        }
      } else {
        const created = await addClient(formData)
        if (created) {
          setFormData({ name: '', email: '', phone: '', document: '', notes: '' })
          setOpen(false)
          onSuccess?.()
        }
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
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-heading font-serif text-xl">
            {clientToEdit ? 'Editar Cliente' : 'Adicionar Cliente'}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {clientToEdit
              ? 'Atualize os dados cadastrais do cliente.'
              : 'Insira os detalhes do cliente. Os dados serão usados na emissão de contratos e orçamentos.'}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label htmlFor="client-name" className="text-xs font-medium">
              Nome / Razão Social *
            </Label>
            <Input
              id="client-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Studio Alpha Ltda"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-email" className="text-xs font-medium">
              E-mail de Contato
            </Label>
            <Input
              id="client-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@empresa.com"
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-phone" className="text-xs font-medium">
                Telefone / WhatsApp
              </Label>
              <Input
                id="client-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-document" className="text-xs font-medium">
                CPF ou CNPJ
              </Label>
              <Input
                id="client-document"
                value={formData.document}
                onChange={(e) =>
                  setFormData({ ...formData, document: maskCpfCnpj(e.target.value) })
                }
                placeholder="00.000.000/0001-00"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-notes" className="text-xs font-medium">
              Anotações & Contexto
            </Label>
            <Textarea
              id="client-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais, histórico ou preferências do cliente..."
              className="resize-none text-sm min-h-[90px]"
            />
          </div>

          <SheetFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
            <SheetClose asChild>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : clientToEdit ? (
                'Salvar Alterações'
              ) : (
                'Cadastrar Cliente'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
export default ClientFormSheet
