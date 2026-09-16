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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Trash2, Loader2, Building2, User, MapPin, Users, Info } from 'lucide-react'
import { Client, ClientType, ClientAdditionalContact, ClientAddress } from '@/types'
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
  const [activeTab, setActiveTab] = useState('identificacao')

  // Form fields
  const [clientType, setClientType] = useState<ClientType>('PF')
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [document, setDocument] = useState('')

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [address, setAddress] = useState<ClientAddress>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })

  const [additionalContacts, setAdditionalContacts] = useState<ClientAdditionalContact[]>([])

  const [notes, setNotes] = useState('')
  const [preferences, setPreferences] = useState('')

  useEffect(() => {
    if (clientToEdit) {
      setClientType(clientToEdit.clientType || 'PF')
      setName(clientToEdit.name || '')
      setTradeName(clientToEdit.tradeName || '')
      setDocument(clientToEdit.document || '')
      setPhone(clientToEdit.phone || '')
      setEmail(clientToEdit.email || '')
      setAddress(
        clientToEdit.addressData || {
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
      )
      setAdditionalContacts(clientToEdit.additionalContacts || [])
      setNotes(clientToEdit.notes || '')
      setPreferences(clientToEdit.preferences || '')
    } else {
      setClientType('PF')
      setName('')
      setTradeName('')
      setDocument('')
      setPhone('')
      setEmail('')
      setAddress({
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      })
      setAdditionalContacts([])
      setNotes('')
      setPreferences('')
      setActiveTab('identificacao')
    }
  }, [clientToEdit, open])

  // ViaCEP address autofill
  const handleCepBlur = async () => {
    const cleanCep = (address.cep || '').replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setAddress((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }))
          toast.success('Endereço preenchido via CEP!')
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const handleAddContact = () => {
    setAdditionalContacts((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: '',
        role: '',
        phone: '',
        email: '',
      },
    ])
  }

  const handleRemoveContact = (id: string) => {
    setAdditionalContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const handleContactChange = (id: string, field: keyof ClientAdditionalContact, val: string) => {
    setAdditionalContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: val } : c)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações obrigatórias
    if (!name.trim()) {
      toast.error('Informe o nome ou razão social do cliente.')
      setActiveTab('identificacao')
      return
    }

    if (!phone.trim()) {
      toast.error('Informe o telefone ou WhatsApp principal.')
      setActiveTab('contato')
      return
    }

    if (!isValidPhone(phone)) {
      toast.error('O telefone informado é inválido. Formato: (99) 99999-9999')
      setActiveTab('contato')
      return
    }

    if (email && !isValidEmail(email)) {
      toast.error('O formato do e-mail é inválido.')
      setActiveTab('contato')
      return
    }

    if (document && !isValidCpfCnpj(document)) {
      toast.error('O CPF ou CNPJ informado é inválido.')
      setActiveTab('identificacao')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Omit<Client, 'id' | 'createdAt'> = {
        name: name.trim(),
        tradeName: tradeName.trim() || undefined,
        clientType,
        document: document.trim(),
        phone: phone.trim(),
        email: email.trim(),
        addressData: address,
        additionalContacts: additionalContacts.filter((c) => c.name.trim()),
        notes: notes.trim(),
        preferences: preferences.trim() || undefined,
      }

      if (clientToEdit) {
        const ok = await updateClient(clientToEdit.id, payload)
        if (ok) {
          setOpen(false)
          onSuccess?.()
        }
      } else {
        const created = await addClient(payload)
        if (created) {
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
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle className="text-heading font-serif text-xl">
            {clientToEdit ? 'Editar Cadastro do Cliente' : 'Cadastro Completo de Cliente'}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Apenas Nome e Telefone são obrigatórios. Todos os demais dados (CNPJ/CPF, endereço,
            outros contatos) podem ser completados agora ou posteriormente.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-10 w-full mb-3 text-xs">
              <TabsTrigger value="identificacao" className="text-xs py-1.5">
                Identificação
              </TabsTrigger>
              <TabsTrigger value="contato" className="text-xs py-1.5">
                Contato
              </TabsTrigger>
              <TabsTrigger value="endereco" className="text-xs py-1.5">
                Endereço
              </TabsTrigger>
              <TabsTrigger value="outros" className="text-xs py-1.5">
                Mais dados
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: IDENTIFICACAO */}
            <TabsContent value="identificacao" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tipo de Pessoa</Label>
                <RadioGroup
                  value={clientType}
                  onValueChange={(v) => setClientType(v as ClientType)}
                  className="flex items-center gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PF" id="type-pf" />
                    <Label htmlFor="type-pf" className="text-xs cursor-pointer font-normal">
                      Pessoa Física (PF)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PJ" id="type-pj" />
                    <Label htmlFor="type-pj" className="text-xs cursor-pointer font-normal">
                      Pessoa Jurídica (PJ)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-name" className="text-xs font-medium">
                  {clientType === 'PJ' ? 'Razão Social / Nome da Empresa *' : 'Nome do Cliente *'}
                </Label>
                <Input
                  id="client-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    clientType === 'PJ'
                      ? 'Ex: EBR Eventos & Produções Ltda'
                      : 'Ex: Mariana Carvalho'
                  }
                  className="text-sm h-10"
                />
              </div>

              {clientType === 'PJ' && (
                <div className="space-y-1.5">
                  <Label htmlFor="client-trade" className="text-xs font-medium">
                    Nome Fantasia
                  </Label>
                  <Input
                    id="client-trade"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: EBR Eventos"
                    className="text-sm h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="client-document" className="text-xs font-medium">
                  {clientType === 'PJ' ? 'CNPJ' : 'CPF'}
                </Label>
                <Input
                  id="client-document"
                  value={document}
                  onChange={(e) => setDocument(maskCpfCnpj(e.target.value))}
                  placeholder={clientType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                  className="text-sm h-10 font-mono"
                />
              </div>
            </TabsContent>

            {/* TAB 2: CONTATO PRINCIPAL */}
            <TabsContent value="contato" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-phone" className="text-xs font-medium">
                  Telefone / WhatsApp Principal *
                </Label>
                <Input
                  id="client-phone"
                  required
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="text-sm h-10 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-email" className="text-xs font-medium">
                  E-mail de Contato
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@cliente.com"
                  className="text-sm h-10"
                />
              </div>

              {/* Lista repetível de outros contatos */}
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Outros Contatos / Responsáveis</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Assessores, noivos, diretores ou produtores vinculados
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddContact}
                    className="text-xs h-7 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {additionalContacts.map((contact, index) => (
                    <div
                      key={contact.id || index}
                      className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-2 text-xs relative"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[11px] text-muted-foreground uppercase">
                          Contato #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveContact(contact.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Nome do contato"
                          value={contact.name}
                          onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          placeholder="Cargo / Função (ex: Noiva, Cerimonial)"
                          value={contact.role || ''}
                          onChange={(e) => handleContactChange(contact.id, 'role', e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Telefone / WhatsApp"
                          value={contact.phone || ''}
                          onChange={(e) =>
                            handleContactChange(contact.id, 'phone', maskPhone(e.target.value))
                          }
                          className="h-8 text-xs bg-background font-mono"
                        />
                        <Input
                          type="email"
                          placeholder="E-mail"
                          value={contact.email || ''}
                          onChange={(e) => handleContactChange(contact.id, 'email', e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: ENDEREÇO */}
            <TabsContent value="endereco" className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="cep" className="text-xs font-medium">
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={address.cep || ''}
                    onBlur={handleCepBlur}
                    onChange={(e) =>
                      setAddress({ ...address, cep: e.target.value.replace(/\D/g, '').slice(0, 8) })
                    }
                    className="text-xs h-9 font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="street" className="text-xs font-medium">
                    Logradouro / Rua
                  </Label>
                  <Input
                    id="street"
                    placeholder="Av. Paulista"
                    value={address.street || ''}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="number" className="text-xs font-medium">
                    Número
                  </Label>
                  <Input
                    id="number"
                    placeholder="1000"
                    value={address.number || ''}
                    onChange={(e) => setAddress({ ...address, number: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="complement" className="text-xs font-medium">
                    Complemento
                  </Label>
                  <Input
                    id="complement"
                    placeholder="Apto 42, Bloco B"
                    value={address.complement || ''}
                    onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="neighborhood" className="text-xs font-medium">
                    Bairro
                  </Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bela Vista"
                    value={address.neighborhood || ''}
                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="city" className="text-xs font-medium">
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    placeholder="São Paulo"
                    value={address.city || ''}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="state" className="text-xs font-medium">
                    UF
                  </Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    maxLength={2}
                    value={address.state || ''}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value.toUpperCase() })
                    }
                    className="text-xs h-9 uppercase font-mono"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: OBSERVAÇÕES & PREFERÊNCIAS */}
            <TabsContent value="outros" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-pref" className="text-xs font-medium">
                  Preferências & Histórico do Cliente
                </Label>
                <Textarea
                  id="client-pref"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="Ex: Prefere atendimento via WhatsApp, pontualidade rigorosa, estilo fotográfico minimalista..."
                  className="resize-none text-xs min-h-[80px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-notes" className="text-xs font-medium">
                  Anotações Internas
                </Label>
                <Textarea
                  id="client-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações visíveis apenas para você e sua equipe..."
                  className="resize-none text-xs min-h-[90px]"
                />
              </div>
            </TabsContent>
          </Tabs>

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
