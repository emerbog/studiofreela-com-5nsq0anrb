import React, { useState, useMemo } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Client } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { maskPhone, isValidPhone } from '@/lib/validators'
import {
  Check,
  ChevronsUpDown,
  Plus,
  User,
  Phone,
  AlertCircle,
  Loader2,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClientSelectorProps {
  value: string // client ID
  onChange: (clientId: string) => void
  onEditClient?: (client: Client) => void
  disabled?: boolean
  className?: string
  showEditButton?: boolean
}

// Clean phone digits for duplicate lookup
function cleanPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function ClientSelector({
  value,
  onChange,
  onEditClient,
  disabled,
  className,
  showEditButton = true,
}: ClientSelectorProps) {
  const { clients, addClient } = useAppData()
  const [openPopover, setOpenPopover] = useState(false)
  const [search, setSearch] = useState('')
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)

  // Quick create fields
  const [quickName, setQuickName] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === value)
  }, [clients, value])

  // Filter clients by search query (name, tradeName, phone)
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    const qDigits = cleanPhoneDigits(search)
    return clients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q)
      const matchTrade = c.tradeName?.toLowerCase().includes(q)
      const matchEmail = c.email?.toLowerCase().includes(q)
      const matchPhone = c.phone?.toLowerCase().includes(q)
      const matchDigits = qDigits ? cleanPhoneDigits(c.phone || '').includes(qDigits) : false
      return matchName || matchTrade || matchEmail || matchPhone || matchDigits
    })
  }, [clients, search])

  // Duplicate phone detection in quick create
  const duplicateClientByPhone = useMemo(() => {
    const digits = cleanPhoneDigits(quickPhone)
    if (digits.length < 10) return null
    return clients.find((c) => cleanPhoneDigits(c.phone || '') === digits)
  }, [clients, quickPhone])

  const handleOpenQuickCreate = () => {
    setOpenPopover(false)
    setQuickName(search.trim())
    setQuickPhone('')
    setIsQuickCreateOpen(true)
  }

  const handleUseExistingDuplicate = (dup: Client) => {
    onChange(dup.id)
    setIsQuickCreateOpen(false)
    setQuickName('')
    setQuickPhone('')
    toast.info(`Cliente "${dup.name}" selecionado a partir do telefone existente!`)
  }

  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quickName.trim()) {
      toast.error('Informe o nome da empresa ou da pessoa.')
      return
    }

    if (!quickPhone.trim()) {
      toast.error('Informe o telefone ou WhatsApp com DDD.')
      return
    }

    if (!isValidPhone(quickPhone)) {
      toast.error('Telefone inválido. Formato: (99) 99999-9999 com DDD.')
      return
    }

    // If duplicate exists, alert user or suggest selecting
    if (duplicateClientByPhone) {
      toast.warning('Este número já pertence a outro cliente cadastrado.', {
        description: `Encontrado: ${duplicateClientByPhone.name}. Toque para usá-lo ou informe outro telefone.`,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const created = await addClient({
        name: quickName.trim(),
        phone: quickPhone.trim(),
        email: '',
        document: '',
        notes: 'Cadastrado via cadastro rápido',
        clientType: 'PF',
      })

      if (created) {
        onChange(created.id)
        setIsQuickCreateOpen(false)
        setQuickName('')
        setQuickPhone('')
        setSearch('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              disabled={disabled}
              className="w-full justify-between font-normal text-left h-11 border-border/80"
            >
              <div className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                {selectedClient ? (
                  <div className="truncate">
                    <span className="font-medium text-foreground">{selectedClient.name}</span>
                    {selectedClient.phone && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {selectedClient.phone}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Pesquisar ou selecionar cliente...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[420px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar por nome, empresa ou telefone..."
                value={search}
                onValueChange={setSearch}
                className="h-10 text-sm"
              />
              <CommandList className="max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenQuickCreate}
                    className="w-full justify-start text-primary font-medium text-xs h-8 gap-1.5 hover:bg-primary/10"
                  >
                    <Plus className="w-4 h-4" />
                    {search.trim() ? (
                      <span className="truncate">
                        Cadastrar novo cliente: "<strong>{search.trim()}</strong>"
                      </span>
                    ) : (
                      'Cadastrar novo cliente rápido'
                    )}
                  </Button>
                </div>

                {filteredClients.length === 0 ? (
                  <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                    Nenhum cliente encontrado. Use o botão acima para cadastrar em 2 cliques.
                  </CommandEmpty>
                ) : (
                  <CommandGroup heading="Clientes Cadastrados">
                    {filteredClients.map((client) => {
                      const isSelected = client.id === value
                      return (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => {
                            onChange(client.id)
                            setOpenPopover(false)
                            setSearch('')
                          }}
                          className="flex items-center justify-between py-2 px-3 cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0 flex-1 pr-2">
                            <span className="font-medium text-sm text-foreground truncate">
                              {client.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                              {client.phone && <span>{client.phone}</span>}
                              {client.tradeName && <span>• {client.tradeName}</span>}
                              {client.email && <span>• {client.email}</span>}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {showEditButton && selectedClient && onEditClient && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEditClient(selectedClient)}
            className="h-11 px-3 text-xs shrink-0 text-muted-foreground hover:text-foreground gap-1"
            title="Editar cadastro completo do cliente"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar completo</span>
          </Button>
        )}
      </div>

      {/* Quick create modal */}
      <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
        <DialogContent className="max-w-[420px] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-heading">
              Cadastro Rápido de Cliente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha apenas o nome e telefone. Nenhum dado do seu formulário atual será perdido e
              você poderá complementar CPF/CNPJ e endereço mais tarde.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-client-name" className="text-xs font-medium">
                Nome da Empresa ou Cliente *
              </Label>
              <Input
                id="quick-client-name"
                required
                autoFocus
                placeholder="Ex: Cerimonial Sol & Arte ou Marina Souza"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quick-client-phone" className="text-xs font-medium">
                Telefone / WhatsApp (com DDD) *
              </Label>
              <Input
                id="quick-client-phone"
                required
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={quickPhone}
                onChange={(e) => setQuickPhone(maskPhone(e.target.value))}
                className="text-sm h-10 font-mono"
              />
            </div>

            {duplicateClientByPhone && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>Telefone já cadastrado no Studio Freela</span>
                </div>
                <p className="text-muted-foreground">
                  Já existe um cliente com este número:{' '}
                  <strong className="text-foreground">{duplicateClientByPhone.name}</strong>.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseExistingDuplicate(duplicateClientByPhone)}
                  className="w-full text-xs h-8 bg-background border-amber-500/40 text-amber-900 dark:text-amber-100 font-medium"
                >
                  Usar {duplicateClientByPhone.name} neste formulário
                </Button>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsQuickCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !!duplicateClientByPhone}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar e Selecionar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default ClientSelector
