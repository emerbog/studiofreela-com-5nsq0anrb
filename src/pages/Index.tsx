import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatShortDate, formatDate } from '@/lib/formatters'
import {
  CalendarDays,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuoteFormSheet } from '@/components/QuoteFormSheet'

export default function Index() {
  const { clients, events, finances, quotes } = useAppData()

  const activeClientsCount = clients.length

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date() || e.status !== 'Concluído')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const nextEvent = upcomingEvents[0]

  const currentMonthReceivables = finances
    .filter((f) => f.status !== 'Pago')
    .reduce((sum, f) => sum + f.value, 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-heading font-semibold">Visão Geral</h1>
          <p className="text-muted-foreground mt-0.5">
            Bem-vindo ao Studio Freela. O ponto de partida para orçamentos, agenda e financeiro.
          </p>
        </div>

        {/* Principal botão de ação: Criar orçamento */}
        <QuoteFormSheet
          triggerAsChild={
            <Button className="gap-2 shadow-sm bg-primary text-primary-foreground font-semibold px-5 h-11">
              <Plus className="w-4 h-4" /> Criar Orçamento
            </Button>
          }
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Orçamentos
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {quotes.length}
            </div>
            <Link
              to="/orcamentos"
              className="text-xs text-primary hover:underline font-medium block mt-1"
            >
              Gerenciar propostas →
            </Link>
          </CardContent>
        </Card>

        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Próximo Evento
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <>
                <div className="text-xl sm:text-2xl font-serif font-semibold mb-0.5 truncate">
                  {nextEvent.title}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(nextEvent.date)} {nextEvent.time && `às ${nextEvent.time}`}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum evento agendado.</p>
            )}
          </CardContent>
        </Card>

        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-serif font-bold">{activeClientsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrados</p>
          </CardContent>
        </Card>

        <Card className="elegant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              A Receber
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-primary">
              {formatCurrency(currentMonthReceivables)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pendentes em aberto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Mini Agenda */}
        <Card className="elegant-card col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-heading text-xl">Próximos Eventos</CardTitle>
              <CardDescription>Sua agenda para os próximos dias.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/agenda">
                Ver todos <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {upcomingEvents.slice(0, 5).map((event) => {
              const client = clients.find((c) => c.id === event.clientId)
              return (
                <div key={event.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-secondary text-secondary-foreground border border-border/50">
                      <span className="text-xs font-semibold">
                        {new Date(event.date).getDate()}
                      </span>
                      <span className="text-[10px] uppercase">
                        {new Date(event.date).toLocaleString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{event.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {client?.name} • {event.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={event.status === 'Confirmado' ? 'default' : 'secondary'}
                    className="font-normal rounded-sm"
                  >
                    {event.status}
                  </Badge>
                </div>
              )
            })}
            {upcomingEvents.length === 0 && (
              <div className="text-center py-8 px-4 rounded-lg border border-dashed border-border/60 bg-muted/10">
                <CalendarIcon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Agenda livre</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhum compromisso ou evento agendado para os próximos dias.
                </p>
                <Button size="sm" variant="outline" asChild className="mt-3 text-xs gap-1.5">
                  <Link to="/agenda">Agendar compromisso</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card className="elegant-card col-span-1">
          <CardHeader>
            <CardTitle className="text-heading text-xl">Atividade Recente</CardTitle>
            <CardDescription>Últimas movimentações no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {finances.filter((f) => f.status === 'Pago').length === 0 && clients.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-lg border border-dashed border-border/60 bg-muted/10">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Sem atividades recentes</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seus clientes cadastrados e pagamentos confirmados serão listados aqui.
                </p>
                <Button size="sm" variant="outline" asChild className="mt-3 text-xs gap-1.5">
                  <Link to="/clientes">Cadastrar primeiro cliente</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {finances
                  .filter((f) => f.status === 'Pago')
                  .slice(0, 3)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-background bg-accent text-accent-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-medium text-sm text-primary">Pagamento Recebido</div>
                          <time className="text-xs text-muted-foreground">
                            {formatShortDate(f.dueDate)}
                          </time>
                        </div>
                        <div className="text-sm text-muted-foreground">{f.title}</div>
                      </div>
                    </div>
                  ))}
                {clients.slice(0, 2).map((c) => (
                  <div
                    key={c.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-background bg-secondary text-secondary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-medium text-sm text-primary">Novo Cliente</div>
                        <time className="text-xs text-muted-foreground">
                          {formatShortDate(c.createdAt)}
                        </time>
                      </div>
                      <div className="text-sm text-muted-foreground">{c.name} adicionado.</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
