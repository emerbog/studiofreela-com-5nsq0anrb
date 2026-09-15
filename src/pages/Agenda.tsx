import React, { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MapPin,
  Clock,
  User,
  Plus,
  CalendarDays,
  MoreHorizontal,
  Edit2,
  Trash2,
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { EventFormDialog } from '@/components/EventFormDialog'
import { AppEvent } from '@/types'

export default function Agenda() {
  const { events, clients, deleteEvent } = useAppData()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<AppEvent | null>(null)

  const selectedDateStr = selectedDate?.toISOString().split('T')[0]

  const dayEvents = events.filter((e) => {
    if (!selectedDateStr) return true
    return e.date.startsWith(selectedDateStr)
  })

  // Dias com eventos para marcar no calendário
  const eventDays = events.map((e) => new Date(e.date))

  const handleEdit = (event: AppEvent) => {
    setEditingEvent(event)
    setIsEditOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      await deleteEvent(eventToDelete.id)
      setEventToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Edit dialog */}
      <EventFormDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setEditingEvent(null)
        }}
        eventToEdit={editingEvent}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Confirmar exclusão de evento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente remover o evento{' '}
              <strong className="text-foreground">{eventToDelete?.title}</strong> da sua agenda?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-heading">
            Agenda & Compromissos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planejamento operacional com títulos automáticos vinculados a receber.
          </p>
        </div>
        <EventFormDialog defaultDate={selectedDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="border border-border/60 shadow-xs lg:col-span-1">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{
                hasEvent: 'font-bold underline decoration-primary decoration-2 underline-offset-4',
              }}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <h2 className="font-serif font-semibold text-lg text-heading">
              {selectedDate ? formatDate(selectedDate) : 'Todos os Eventos'}
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>

          {dayEvents.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-border/80 bg-muted/10">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <CalendarDays className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhum compromisso para este dia
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione outro dia ou agende um novo evento para este dia.
              </p>
              <div className="mt-4">
                <EventFormDialog
                  defaultDate={selectedDate}
                  triggerAsChild={
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Agendar nesta data
                    </Button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((event) => {
                const client = clients.find((c) => c.id === event.clientId)
                return (
                  <Card
                    key={event.id}
                    className="border border-border/60 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              event.status === 'Confirmado'
                                ? 'default'
                                : event.status === 'Concluído'
                                  ? 'outline'
                                  : 'secondary'
                            }
                            className="text-[10px] font-sans"
                          >
                            {event.status}
                          </Badge>
                          <h3 className="font-serif font-semibold text-base text-foreground">
                            {event.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                          {client && (
                            <span className="flex items-center gap-1 text-foreground/80 font-medium">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {client.name}
                            </span>
                          )}
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {event.time}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 border-border/40">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">
                            Valor Previsto
                          </span>
                          <span className="font-serif font-bold text-foreground">
                            {formatCurrency(event.value)}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(event)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Editar Evento
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEventToDelete(event)}
                              className="gap-2 text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Evento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
