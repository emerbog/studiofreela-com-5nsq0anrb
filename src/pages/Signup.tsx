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
import { User, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
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
  const { signup } = useAuth()
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
                disabled={isSubmitting}
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
    </div>
  )
}
