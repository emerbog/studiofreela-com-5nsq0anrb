import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { User, Mail, Lock, Loader2, ArrowLeft, AlertCircle, Info, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { isValidEmail } from '@/lib/validators'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [copiedRedirect, setCopiedRedirect] = useState(false)
  const { signup, loginWithGoogle, isGoogleAuthAvailable, googleConfigDetails } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Informe seu nome completo.')
      return
    }
    if (!email.trim()) {
      toast.error('Informe seu e-mail.')
      return
    }
    if (!name.trim()) {
      toast.error('Informe seu nome completo.')
      return
    }
    if (!isValidEmail(email)) {
      toast.error('Informe um endereço de e-mail válido.')
      return
    }
    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (!agreedToTerms) {
      toast.error('É obrigatório concordar com os Termos de Uso e Política de Privacidade.')
      return
    }

    setIsSubmitting(true)
    const result = await signup({ name, email, password, passwordConfirm })
    setIsSubmitting(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleGoogleSignup = async () => {
    if (!isGoogleAuthAvailable) {
      setShowConfigModal(true)
      return
    }

    setIsGoogleSubmitting(true)
    const result = await loginWithGoogle()
    setIsGoogleSubmitting(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleCopyRedirect = () => {
    if (googleConfigDetails.redirectUri) {
      navigator.clipboard.writeText(googleConfigDetails.redirectUri)
      setCopiedRedirect(true)
      toast.success('URI copiada para a área de transferência!')
      setTimeout(() => setCopiedRedirect(false), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-primary/20">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Início
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Branding header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <svg
              width="44"
              height="44"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="4"
                width="92"
                height="92"
                rx="22"
                stroke="#2b2b2b"
                strokeWidth="6"
                fill="none"
              />
              <rect
                x="14"
                y="14"
                width="72"
                height="72"
                rx="14"
                stroke="#b07d4f"
                strokeWidth="2"
                fill="none"
              />
              <text
                x="50"
                y="62"
                textAnchor="middle"
                fill="#2b2b2b"
                fontFamily="Cinzel, 'Playfair Display', serif"
                fontSize="40"
                fontWeight="700"
              >
                SF
              </text>
            </svg>
            <span className="text-2xl font-serif font-bold tracking-tight text-foreground">
              Studio Freela
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Crie sua conta e profissionalize sua gestão autônoma hoje mesmo
          </p>
        </div>

        <Card className="border-border/70 shadow-lg bg-card">
          <CardHeader className="space-y-1 pb-4">
            <h1 className="text-xl font-serif font-semibold text-foreground">Criar nova conta</h1>
            <CardDescription className="text-xs">
              Comece no plano gratuito, sem necessidade de cartão de crédito
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2.5 h-10 border-border/80 hover:bg-muted/50 transition-colors"
                onClick={handleGoogleSignup}
                disabled={isGoogleSubmitting || isSubmitting}
              >
                {isGoogleSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Cadastrar com Google</span>
                {!isGoogleAuthAvailable && (
                  <span className="ml-1 text-[10px] text-amber-700 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-normal">
                    Configuração
                  </span>
                )}
              </Button>

              {!isGoogleAuthAvailable && (
                <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/50 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    Chaves do Google Cloud pendentes.{' '}
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(true)}
                      className="text-primary hover:underline font-medium inline-block"
                    >
                      Como habilitar
                    </button>{' '}
                    ou crie com seus dados abaixo.
                  </span>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou com seus dados</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-9 text-sm"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 text-sm"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Senha (mínimo 8 caracteres)
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-9 text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordConfirm" className="text-xs font-medium">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="pl-9 text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Termos e LGPD */}
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <Label
                  htmlFor="terms"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer font-normal"
                >
                  Declaro que li e concordo com os{' '}
                  <Link
                    to="/termos"
                    target="_blank"
                    className="text-primary hover:underline font-medium"
                  >
                    Termos de Uso
                  </Link>{' '}
                  e com a{' '}
                  <Link
                    to="/privacidade"
                    target="_blank"
                    className="text-primary hover:underline font-medium"
                  >
                    Política de Privacidade (LGPD)
                  </Link>{' '}
                  do Studio Freela.
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full font-medium h-10 mt-3 shadow-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...
                  </>
                ) : (
                  'Criar Conta Gratuita'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-border/40 pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Modal explicativo com as instruções e URI de redirecionamento exata */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-serif">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              Configuração do Google OAuth
            </DialogTitle>
            <DialogDescription className="text-xs">
              O backend PocketBase requer que o Client ID e Client Secret sejam registrados para
              habilitar o cadastro e login com o Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs text-foreground/90 py-2">
            <p className="leading-relaxed">
              Enquanto as credenciais do Google Cloud Console não forem adicionadas aos secrets do
              projeto, o cadastro gratuito diretamente pelo formulário está totalmente funcional.
            </p>

            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border/70">
              <span className="font-semibold text-foreground block">
                Passo 1: Criar credencial no Google Cloud Console
              </span>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Acesse{' '}
                  <strong>Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong>.
                </li>
                <li>
                  Crie um <strong>OAuth 2.0 Client ID</strong> do tipo <em>Web application</em>.
                </li>
                <li>
                  Em <strong>Authorized redirect URIs</strong>, adicione exatamente a URL abaixo:
                </li>
              </ol>

              <div className="mt-2">
                <div className="flex items-center gap-1.5 bg-background p-2 rounded border border-border/80 font-mono text-[11px] break-all select-all">
                  <span className="flex-1 text-foreground">
                    {googleConfigDetails.redirectUri ||
                      'https://gestao-freelance-elegante-8ed44.shrd00.internal.goskip.dev/api/oauth2-redirect'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={handleCopyRedirect}
                    title="Copiar URI"
                  >
                    {copiedRedirect ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-3 bg-muted/30 rounded-lg border border-border/70">
              <span className="font-semibold text-foreground block">
                Passo 2: Registrar as variáveis no projeto
              </span>
              <p className="text-muted-foreground">
                Defina as seguintes variáveis com os valores gerados pelo Google:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground font-mono text-[11px] mt-1">
                <li>
                  <strong>GOOGLE_CLIENT_ID</strong>
                </li>
                <li>
                  <strong>GOOGLE_CLIENT_SECRET</strong>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfigModal(false)}
            >
              Fechar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowConfigModal(false)
                const nameInput = document.getElementById('name')
                nameInput?.focus()
              }}
            >
              Criar Conta com E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
