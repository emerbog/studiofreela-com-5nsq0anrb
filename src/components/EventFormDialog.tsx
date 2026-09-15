import { useState, useEffect } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { AppEvent } from '@/types'
import { toast } from 'sonner'

interface EventFormDialogProps {
  triggerAsChild?: React.ReactNode
  defaultDate?: Date
  eventToEdit?: AppEvent | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function EventFormDialog({
  triggerAsChild,
  defaultDate,
  eventToEdit,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: EventFormDialogProps) {
  const { clients, addEvent, updateEvent } = useAppData()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    date: defaultDate ? defaultDate.toISOString().split('T')[0] : '',
    time: '',
    location: '',
    value: '',
    status: 'Confirmado' as 'Confirmado' | 'Pendente' | 'Concluído',
  })

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title || '',
        clientId: eventToEdit.clientId || '',
        date: eventToEdit.date ? eventToEdit.date.slice(0, 10) : '',
        time: eventToEdit.time || '',
        location: eventToEdit.location || '',
        value: eventToEdit.value ? String(eventToEdit.value) : '',
        status: eventToEdit.status || 'Confirmado',
      })
    } else {
      setFormData({
        title: '',
        clientId: '',
        date: defaultDate ? defaultDate.toISOString().split('T')[0] : '',
        time: '',
        location: '',
        value: '',
        status: 'Confirmado',
      })
    }
  }, [eventToEdit, defaultDate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Informe o título do compromisso/evento.')
      return
    }

    if (!formData.clientId) {
      toast.error('Selecione o cliente responsável.')
      return
    }

    if (!formData.date) {
      toast.error('Selecione uma data válida.')
      return
    }

    const val = Number(formData.value)
    if (isNaN(val) || val < 0) {
      toast.error('O valor financeiro deve ser um número positivo.')
      return
    }

    setIsSubmitting(true)
    try {
      if (eventToEdit) {
        const ok = await updateEvent(eventToEdit.id, {
          title: formData.title,
          clientId: formData.clientId,
          date: new Date(`${formData.date}T12:00:00`).toISOString(),
          time: formData.time,
          location: formData.location,
          value: val,
          status: formData.status,
        })
        if (ok) {
          setOpen(false)
          onSuccess?.()
        }
      } else {
        const created = await addEvent({
          title: formData.title,
          clientId: formData.clientId,
          date: new Date(`${formData.date}T12:00:00`).toISOString(),
          time: formData.time,
          location: formData.location,
          value: val,
          status: formData.status,
        })
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
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerAsChild ? (
        <DialogTrigger asChild>{triggerAsChild}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Novo Evento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-heading font-serif text-xl">
            {eventToEdit ? 'Editar Evento' : 'Agendar Novo Evento'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {eventToEdit
              ? 'Atualize os dados do evento na sua agenda.'
              : 'Preencha os detalhes. Um título em Contas a Receber é gerado automaticamente.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs font-medium">
              Título do Evento *
            </Label>
            <Input
              id="event-title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Cobertura Fotográfica Lançamento"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-client" className="text-xs font-medium">
              Cliente *
            </Label>
            <Select
              required
              value={formData.clientId}
              onValueChange={(v) => setFormData({ ...formData, clientId: v })}
            >
              <SelectTrigger id="event-client">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-date" className="text-xs font-medium">
                Data *
              </Label>
              <Input
                id="event-date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time" className="text-xs font-medium">
                Horário
              </Label>
              <Input
                id="event-time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-location" className="text-xs font-medium">
                Localização / Plataforma
              </Label>
              <Input
                id="event-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Av. Paulista, 1000 / Google Meet"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-value" className="text-xs font-medium">
                Valor Cobrado (R$)
              </Label>
              <Input
                id="event-value"
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0,00"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-status" className="text-xs font-medium">
              Status do Compromisso
            </Label>
            <Select
              value={formData.status}
              onValueChange={(v: any) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger id="event-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : eventToEdit ? (
                'Salvar Alterações'
              ) : (
                'Agendar Evento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default EventFormDialog
