import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, ArrowLeft, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsSubmitting(true)
    const result = await login(email, password)
    setIsSubmitting(false)

    if (result.success) {
      navigate(from, { replace: true })
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true)
    const result = await loginWithGoogle()
    setIsGoogleSubmitting(false)

    if (result.success) {
      navigate(from, { replace: true })
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
            Acesse seu painel e gerencie seus trabalhos com sobriedade
          </p>
        </div>

        <Card className="border-border/70 shadow-lg bg-card">
          <CardHeader className="space-y-1 pb-4">
            <h1 className="text-xl font-serif font-semibold text-foreground">
              Entrar na sua conta
            </h1>
            <CardDescription className="text-xs">Insira seus dados para autenticar</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2.5 h-10 border-border/80 hover:bg-muted/50"
              onClick={handleGoogleLogin}
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
              <span>Entrar com Google</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou com e-mail</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Senha
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Esqueci a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 text-sm"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-medium h-10 mt-2 shadow-sm"
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-border/40 pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Ainda não tem uma conta?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Cadastre-se gratuitamente
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
