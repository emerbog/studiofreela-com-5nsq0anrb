import { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventFormDialog } from '@/components/EventFormDialog'
import { MapPin, Clock } from 'lucide-react'
import { formatShortDate } from '@/lib/formatters'

export default function Agenda() {
  const { events, clients } = useAppData()
  const [date, setDate] = useState<Date | undefined>(new Date())

  const selectedDateEvents = events.filter((e) => {
    if (!date) return false
    const eventDate = new Date(e.date)
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    )
  })

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-auto shrink-0 flex flex-col gap-6">
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-elegant">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
        </div>
        <EventFormDialog defaultDate={date} />
      </div>

      <div className="flex-1 w-full space-y-6">
        <div className="flex flex-col gap-2 pb-4 border-b border-border/50">
          <h2 className="text-heading text-2xl font-semibold">
            {date
              ? new Intl.DateTimeFormat('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }).format(date)
              : 'Selecione uma data'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {selectedDateEvents.length} evento(s) programado(s) para este dia.
          </p>
        </div>

        <div className="space-y-4">
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => {
              const client = clients.find((c) => c.id === event.clientId)
              return (
                <Card key={event.id} className="elegant-card overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="bg-secondary/50 p-6 flex flex-col justify-center sm:w-48 border-r border-border/50">
                      <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                        <Clock className="w-4 h-4 opacity-70" />
                        {event.time}
                      </div>
                      <Badge
                        variant={event.status === 'Confirmado' ? 'default' : 'secondary'}
                        className="w-fit mt-3"
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <CardContent className="p-6 flex-1">
                      <h3 className="font-serif text-xl font-semibold mb-1">{event.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Para: <span className="font-medium text-foreground">{client?.name}</span>
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl border-border">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <CalendarDays className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum evento</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
                Você não possui nenhum compromisso agendado para esta data.
              </p>
              <EventFormDialog defaultDate={date} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Needed local import for empty state
import { CalendarDays } from 'lucide-react'
