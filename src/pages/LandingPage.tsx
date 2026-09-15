import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  Users,
  DollarSign,
  FileText,
  FileSignature,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { StudioFreelaLogo } from '@/components/StudioFreelaLogo'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md transition-all">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <StudioFreelaLogo size={38} />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos & Preços
            </a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">
              Por que escolher
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild className="rounded-full px-5 shadow-sm">
                <Link to="/dashboard">
                  Acessar Painel <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-sm font-medium hover:bg-muted/60">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="rounded-full px-5 shadow-sm">
                  <Link to="/signup">Começar Grátis</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/40 text-xs font-medium text-muted-foreground mb-8 backdrop-blur-sm shadow-xs animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>A plataforma definitiva para profissionais autônomos de alto nível</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-foreground leading-[1.12] max-w-4xl mx-auto mb-6">
            Studio Freela: gestão com a sobriedade que seu trabalho merece.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Centralize sua agenda de eventos, controle seus clientes, faturamento, propostas
            comerciais e gere contratos jurídicos completos em segundos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            >
              Começar Grátis Agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-medium border-border/80 hover:bg-muted/50"
              onClick={() => {
                const el = document.getElementById('funcionalidades')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Conhecer Recursos
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Sem cartão no plano gratuito
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Setup em 2 minutos
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" /> Modelos jurídicos inclusos
            </div>
          </div>

          {/* Product Preview Card Mockup */}
          <div className="mt-16 md:mt-20 relative mx-auto max-w-5xl rounded-2xl border border-border/80 bg-card p-3 sm:p-5 shadow-2xl backdrop-blur">
            <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20">
              <div className="h-10 bg-muted/60 border-b border-border/40 px-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                <div className="mx-auto text-xs font-mono text-muted-foreground/80 bg-background/60 px-4 py-0.5 rounded-md border border-border/40">
                  studiofreela.com/dashboard
                </div>
              </div>
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-xl bg-background border border-border/60 shadow-xs">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    A Receber este Mês
                  </span>
                  <div className="text-2xl font-bold text-foreground mt-1">R$ 14.850,00</div>
                  <span className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3" /> Fluxo sob controle e atualizado
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/60 shadow-xs">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Próximo Evento
                  </span>
                  <div className="text-xl font-bold text-foreground mt-1">
                    Cobertura Fotográfica
                  </div>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    Studio Alpha • 19:00
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/60 shadow-xs">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Contratos Ativos
                  </span>
                  <div className="text-2xl font-bold text-foreground mt-1">12 Contratos</div>
                  <span className="text-xs text-primary font-medium mt-2 block">
                    Alinhados às diretrizes da LGPD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-24 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-3 font-normal px-3 py-1">
              Recursos Essenciais
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Tudo o que seu negócio autônomo precisa, sem ruídos.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg font-light">
              Projetado com foco em clareza, praticidade e elegância visual para você economizar
              horas de administração.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-border/60 bg-card hover:border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-serif">Agenda de Eventos</CardTitle>
                <CardDescription className="text-sm">
                  Organize gravações, reuniões, ensaios e entregas com datas, locais, valores e
                  status em tempo real.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed pt-2">
                • Visualização cronológica intuitiva
                <br />• Vínculo direto com clientes cadastrados
                <br />• Geração automática de títulos financeiros
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/60 bg-card hover:border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-serif">Cadastro de Clientes</CardTitle>
                <CardDescription className="text-sm">
                  Base de contatos completa com CPF/CNPJ, endereços, canais de contato e histórico
                  de interações.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed pt-2">
                • Dados jurídicos e de contato completos
                <br />• Notas personalizadas por cliente
                <br />• Histórico financeiro e de orçamentos
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/60 bg-card hover:border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-serif">Contas a Receber</CardTitle>
                <CardDescription className="text-sm">
                  Acompanhe títulos pendentes, pagamentos quitados e atrasos sem complicação de
                  planilhas.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed pt-2">
                • Controle de fluxo de recebíveis
                <br />• Status Pago, Pendente e Atrasado
                <br />• Totalizadores automáticos de faturamento
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border/60 bg-card hover:border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-serif">Emissão de Orçamentos</CardTitle>
                <CardDescription className="text-sm">
                  Elabore propostas profissionais detalhadas com itens, quantitativos e valores
                  unitários.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed pt-2">
                • Numeração sequencial automática
                <br />• Visualização e impressão formatada
                <br />• Conversão direta em contrato
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-border/60 bg-card hover:border-border transition-all hover:shadow-md md:col-span-2 lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Destaque Jurídico
                  </Badge>
                </div>
                <CardTitle className="text-xl font-serif">
                  Contratos Profissionais & Cláusulas Jurídicas
                </CardTitle>
                <CardDescription className="text-sm">
                  Gerador inteligente com 16 cláusulas customizáveis: LGPD, propriedade intelectual,
                  cronograma de entregas, parcelamento, foro e penalidades.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>• Exportação e impressão em PDF de alta qualidade</div>
                <div>• Campos para testemunhas e dados bancários/PIX</div>
                <div>• Editor interativo e visualizador em tempo real</div>
                <div>• Proteção contratual sólida para o prestador</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-3 font-normal px-3 py-1">
              Planos & Preços
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Escolha o plano ideal para a sua fase.
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg font-light">
              Transparência total, sem cobranças surpresas e você pode trocar de plano a qualquer
              momento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Economy */}
            <Card className="border-border/70 flex flex-col justify-between hover:border-border transition-all">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl font-serif">Plano Economy</CardTitle>
                    <Badge variant="outline">Free</Badge>
                  </div>
                  <CardDescription>
                    Para quem está iniciando sua jornada como autônomo.
                  </CardDescription>
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-serif font-bold">R$ 0</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Grátis para sempre
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    O que está incluso:
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Agenda de eventos (até 20 eventos/mês)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cadastro de clientes (até 10 clientes)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Contas a receber básico</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Suporte por e-mail</span>
                    </li>
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-6">
                <Button
                  variant="outline"
                  className="w-full rounded-full h-11"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                >
                  Começar com Economy
                </Button>
              </CardFooter>
            </Card>

            {/* Plan 2: Intermediate (Featured) */}
            <Card className="border-primary shadow-lg relative flex flex-col justify-between bg-card hover:shadow-xl transition-all md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground uppercase text-[10px] tracking-widest px-3 py-1 font-semibold shadow-xs">
                  Mais Popular
                </Badge>
              </div>

              <div>
                <CardHeader className="pt-8">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl font-serif">Plano Intermediate</CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Recomendado
                    </Badge>
                  </div>
                  <CardDescription>
                    Para autônomos consolidados com fluxo constante de clientes.
                  </CardDescription>
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-serif font-bold text-primary">R$ 29,90</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Cobrança mensal simplificada
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Tudo do Economy mais:
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        Agenda de eventos <strong>ilimitada</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        Base de clientes <strong>ilimitada</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Emissão de orçamentos completos</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Controle financeiro avançado</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Suporte prioritário via WhatsApp</span>
                    </li>
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-6">
                <Button
                  className="w-full rounded-full h-11 shadow-sm"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                >
                  Assinar Intermediate
                </Button>
              </CardFooter>
            </Card>

            {/* Plan 3: Advanced */}
            <Card className="border-border/70 flex flex-col justify-between hover:border-border transition-all">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl font-serif">Plano Advanced</CardTitle>
                    <Badge variant="outline">Completo</Badge>
                  </div>
                  <CardDescription>
                    Para profissionais e agências que exigem segurança jurídica total.
                  </CardDescription>
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-serif font-bold">R$ 49,90</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Acesso a todas as ferramentas
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Tudo do Intermediate mais:
                  </div>
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Contratos personalizados avançados</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Exportação e impressão direta em PDF</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Modelos jurídicos prontos (LGPD, confidencialidade)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Editor interativo de cláusulas</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Suporte VIP 24/7 com gerente de conta</span>
                    </li>
                  </ul>
                </CardContent>
              </div>

              <CardFooter className="pt-6">
                <Button
                  variant="outline"
                  className="w-full rounded-full h-11"
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                >
                  Assinar Advanced
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Banner Section */}
      <section id="beneficios" className="py-20 bg-muted/30 border-t border-border/40">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold mb-1">Segurança e Privacidade</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Seus dados comerciais e de clientes com isolamento rigoroso por conta, autenticação
                moderna e comunicação segura via HTTPS.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold mb-1">Economia de Tempo Real</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Automatize a geração de orçamentos, títulos e contratos em menos de 3 minutos.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold mb-1">Design Sóbrio & Refinado</h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Interface limpa desenvolvida para produtividade, sem excessos ou poluição visual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="py-20 bg-card border-t border-border/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-4">
            Pronto para profissionalizar sua rotina de trabalho?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-2xl mx-auto font-light">
            Crie sua conta agora mesmo e tenha controle total dos seus eventos, clientes e
            faturamento.
          </p>
          <Button
            size="lg"
            className="rounded-full px-10 h-13 text-base font-medium shadow-md"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
          >
            Começar Grátis Agora <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background py-12 text-sm text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-3">
              <Link to="/" className="inline-block">
                <StudioFreelaLogo size={34} showTagline={false} />
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Studio Freela — a plataforma com a sobriedade que seu trabalho autônomo merece.
              </p>
            </div>

            <div>
              <h4 className="font-serif font-semibold text-foreground text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#funcionalidades" className="hover:text-foreground transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#planos" className="hover:text-foreground transition-colors">
                    Planos & Preços
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Área do Cliente
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-semibold text-foreground text-sm mb-3">
                Funcionalidades
              </h4>
              <ul className="space-y-2 text-xs">
                <li>Agenda de Eventos</li>
                <li>Gestão de Clientes</li>
                <li>Contas a Receber</li>
                <li>Orçamentos & Contratos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-semibold text-foreground text-sm mb-3">
                Legal & Suporte
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/termos" className="hover:text-foreground transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade" className="hover:text-foreground transition-colors">
                    Política de Privacidade & Cookies
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade#lgpd" className="hover:text-foreground transition-colors">
                    Direitos do Titular (LGPD)
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:suporte@studiofreela.com"
                    className="hover:text-foreground transition-colors"
                  >
                    suporte@studiofreela.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>
              © {new Date().getFullYear()} Studio Freela (studiofreela.com). Todos os direitos
              reservados.
            </p>
            <div className="flex items-center gap-6">
              <span>Gestão freelance com a sobriedade que seu trabalho merece.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
