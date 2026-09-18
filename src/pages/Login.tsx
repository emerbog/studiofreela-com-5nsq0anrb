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
  const { login } = useAuth()
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
                disabled={isSubmitting}
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
