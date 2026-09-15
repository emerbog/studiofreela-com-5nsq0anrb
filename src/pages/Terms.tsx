import React from 'react'
import { Link } from 'react-router-dom'
import { StudioFreelaLogo } from '@/components/StudioFreelaLogo'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <StudioFreelaLogo size={34} />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#b07d4f] font-medium uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Legal & Contratual
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-heading">
            Termos de Uso do Studio Freela
          </h1>
          <p className="text-xs text-muted-foreground">
            Última atualização: 15 de janeiro de 2025 • Vigência a partir da publicação
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              1. Identificação do Controlador
            </h2>
            <p>
              Estes Termos de Uso regulam o acesso e a utilização dos serviços oferecidos pela
              plataforma <strong className="text-foreground">Studio Freela</strong>, disponível
              através do domínio{' '}
              <a href="https://studiofreela.com" className="text-foreground underline">
                studiofreela.com
              </a>
              . Para fins de contato e suporte, o canal oficial é{' '}
              <a href="mailto:suporte@studiofreela.com" className="text-foreground underline">
                suporte@studiofreela.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              2. Objeto e Funcionalidades
            </h2>
            <p>
              O Studio Freela é um software de gestão voltado para freelancers e prestadores de
              serviços autônomos. A plataforma disponibiliza:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cadastro e organização de clientes e contatos comerciais;</li>
              <li>Agenda e compromissos operacionais;</li>
              <li>Gestão de contas a receber e liquidação de títulos;</li>
              <li>Geração e emissão de orçamentos e propostas comerciais;</li>
              <li>
                Gerador interativo de contratos de prestação de serviços com modelos juridicamente
                estruturados.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              3. Cadastro e Segurança de Acesso
            </h2>
            <p>
              Para utilizar o Studio Freela, o usuário deve criar uma conta com informações
              verídicas, fornecendo nome completo, e-mail válido e senha segura. O usuário é o único
              responsável pela guarda e confidencialidade de suas credenciais de acesso, bem como
              por quaisquer atividades realizadas sob sua conta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              4. Planos, Assinaturas e Limites
            </h2>
            <p>O Studio Freela disponibiliza níveis de plano (Economy, Intermediate e Advanced):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Economy:</strong> destinado a iniciantes, com
                limite de até 10 clientes e 20 eventos;
              </li>
              <li>
                <strong className="text-foreground">Intermediate:</strong> clientes e eventos
                ilimitados e emissão formal de orçamentos em PDF;
              </li>
              <li>
                <strong className="text-foreground">Advanced:</strong> acesso irrestrito a todos os
                módulos, incluindo o gerador interativo de contratos com validade jurídica.
              </li>
            </ul>
            <p>
              A tentativa de contornar os limites técnicos estabelecidos no servidor constitui
              infração grave sujeita ao cancelamento da conta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              5. Responsabilidade pelos Modelos de Contratos
            </h2>
            <p>
              Os modelos de minutas e contratos gerados pelo Studio Freela servem como base
              estrutural informativa e operacional. Embora elaborados com base nas melhores práticas
              do Código Civil Brasileiro, recomendamos que contratos de alto valor ou especificidade
              jurídica complexa sejam revisados por profissional de advocacia habilitado.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              6. Cancelamento e Exclusão
            </h2>
            <p>
              O usuário pode solicitar o cancelamento e a exclusão completa de sua conta a qualquer
              momento diretamente no painel do usuário (seção Perfil / LGPD) ou através do e-mail{' '}
              <a href="mailto:suporte@studiofreela.com" className="text-foreground underline">
                suporte@studiofreela.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">7. Foro de Eleição</h2>
            <p>
              Estes Termos de Uso são regidos pela legislação da República Federativa do Brasil.
              Fica eleito o foro da comarca de domicílio do usuário para dirimir eventuais
              controvérsias oriundas deste instrumento.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Studio Freela (studiofreela.com). Todos os direitos reservados.
      </footer>
    </div>
  )
}
