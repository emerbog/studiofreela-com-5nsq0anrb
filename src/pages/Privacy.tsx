import React from 'react'
import { Link } from 'react-router-dom'
import { StudioFreelaLogo } from '@/components/StudioFreelaLogo'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShieldCheck, Lock, Cookie } from 'lucide-react'

export default function Privacy() {
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
            <ShieldCheck className="w-3.5 h-3.5" /> Privacidade & LGPD (Lei 13.709/2018)
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-heading">
            Política de Privacidade e Cookies
          </h1>
          <p className="text-xs text-muted-foreground">
            Última atualização: 15 de janeiro de 2025 • Studio Freela (studiofreela.com)
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              1. Controlador dos Dados
            </h2>
            <p>
              O controlador dos seus dados pessoais é a plataforma{' '}
              <strong className="text-foreground">Studio Freela</strong>, com operações hospedadas
              em ambiente seguro e canal de encarregado pelo tratamento de dados (DPO) através de:
            </p>
            <p className="bg-muted/40 p-3 rounded-lg border border-border/60 text-xs font-mono text-foreground">
              Encarregado / Canal LGPD: studiofreela@protonmail.com
              <br />
              Site Oficial: https://studiofreela.com
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              2. Dados Pessoais Coletados
            </h2>
            <p>
              Para a prestação adequada dos serviços de gestão freelance, coletamos as seguintes
              categorias:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Dados de Cadastro:</strong> Nome completo,
                endereço de e-mail, telefone, CPF ou CNPJ e senha com hash criptográfico
                unidirecional.
              </li>
              <li>
                <strong className="text-foreground">
                  Dados Operacionais inseridos pelo Usuário:
                </strong>{' '}
                Nomes de clientes cadastrados, valores de projetos, eventos de agenda, orçamentos e
                cláusulas contratuais.
              </li>
              <li>
                <strong className="text-foreground">Dados de Navegação e Conexão:</strong> Endereço
                IP, registros de data/hora de login, identificadores de sessão e logs técnicos
                operacionais estritamente para segurança da aplicação.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              3. Finalidades e Bases Legais (LGPD Art. 7º)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-foreground">Execução de Contrato (Art. 7º, V):</strong>{' '}
                autenticação do usuário, persistência de registros de clientes, eventos, propostas e
                emissão de contratos.
              </li>
              <li>
                <strong className="text-foreground">
                  Cumprimento de Obrigação Legal (Art. 7º, II):
                </strong>{' '}
                guarda de logs de conexão conforme determinado pelo Marco Civil da Internet (Lei nº
                12.965/2014).
              </li>
              <li>
                <strong className="text-foreground">Legítimo Interesse (Art. 7º, IX):</strong>{' '}
                melhoria de usabilidade, prevenção a fraudes e segurança das contas.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              4. Compartilhamento de Dados
            </h2>
            <p>
              O Studio Freela <strong>não vende, aluga ou comercializa</strong> dados pessoais ou
              comerciais com corretores ou terceiros para fins publicitários. O compartilhamento
              ocorre exclusivamente com:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Provedores de infraestrutura em nuvem e banco de dados seguros com certificações
                internacionais de conformidade;
              </li>
              <li>
                Provedores de pagamento para processamento de assinaturas (quando contratado);
              </li>
              <li>
                Autoridades judiciais ou administrativas mediante ordem judicial expressa e
                fundamentada.
              </li>
            </ul>
          </section>

          <section id="lgpd" className="space-y-2 pt-2 border-t border-border/40">
            <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#b07d4f]" /> 5. Direitos do Titular (LGPD Art. 18)
            </h2>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você possui o
              direito de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar seus dados pessoais e seu histórico cadastrado;</li>
              <li>
                Corrigir dados incompletos, inexatos ou desatualizados via formulário do perfil;
              </li>
              <li>
                <strong className="text-foreground">Portabilidade e Exportação:</strong> exportar
                todos os seus dados operacionais (clientes, eventos, contratos e recebíveis) em
                formato JSON legível por máquina através do painel de controle;
              </li>
              <li>
                <strong className="text-foreground">Exclusão e Esquecimento:</strong> solicitar e
                executar a eliminação definitiva da sua conta e de todos os registros associados
                diretamente em seu perfil.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground flex items-center gap-2">
              <Cookie className="w-4 h-4 text-[#b07d4f]" /> 6. Política de Cookies
            </h2>
            <p>
              Utilizamos exclusivamente{' '}
              <strong className="text-foreground">
                cookies e tokens de sessão estritamente necessários
              </strong>{' '}
              para manter sua autenticação ativa e segura durante a navegação no aplicativo. Não
              utilizamos cookies invasivos de rastreamento de terceiros para publicidade
              comportamental.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              7. Retenção e Segurança
            </h2>
            <p>
              Seus dados são retidos enquanto durar o vínculo contratual de prestação de serviços.
              Caso opte pela exclusão de sua conta, realizamos a deleção de todas as tabelas
              operacionais em cascata, retendo apenas o estritamente exigido por prazo legal (Marco
              Civil da Internet e Código Civil).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-semibold text-foreground">
              8. Canal de Contato
            </h2>
            <p>
              Dúvidas, solicitações ou exercícios de direitos do titular podem ser encaminhados ao
              e-mail{' '}
              <a href="mailto:studiofreela@protonmail.com" className="text-foreground underline">
                studiofreela@protonmail.com
              </a>
              .
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
