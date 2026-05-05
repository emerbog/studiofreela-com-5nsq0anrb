import { useState } from 'react'
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
import { Plus } from 'lucide-react'

export function EventFormDialog({
  triggerAsChild,
  defaultDate,
}: {
  triggerAsChild?: React.ReactNode
  defaultDate?: Date
}) {
  const { clients, addEvent } = useAppData()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    date: defaultDate ? defaultDate.toISOString().split('T')[0] : '',
    time: '',
    location: '',
    value: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEvent({
      title: formData.title,
      clientId: formData.clientId,
      date: new Date(`${formData.date}T12:00:00`).toISOString(),
      time: formData.time,
      location: formData.location,
      value: Number(formData.value),
      status: 'Pendente',
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerAsChild || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Novo Evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-heading">Agendar Evento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do evento. Um título financeiro será gerado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Título do Evento</Label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Casamento Silva"
            />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              required
              value={formData.clientId}
              onValueChange={(v) => setFormData({ ...formData, clientId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Buffet X"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Agendar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
