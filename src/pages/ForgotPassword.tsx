import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    const result = await forgotPassword(email)
    setIsSubmitting(false)

    if (result.success) {
      setSubmitted(true)
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
          <Link to="/login">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Login
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
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
            Recuperação segura de acesso à sua conta no Studio Freela
          </p>
        </div>
        <Card className="border-border/70 shadow-lg bg-card">
          <CardHeader className="space-y-1 pb-4">
            <h1 className="text-xl font-serif font-semibold text-foreground">Recuperar Senha</h1>
            <CardDescription className="text-xs">
              Informe seu e-mail cadastrado para enviarmos o link de redefinição
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {submitted ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-semibold text-foreground text-base">
                  E-mail enviado!
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Verifique a sua caixa de entrada no endereço <strong>{email}</strong> e siga as
                  instruções para criar uma nova senha.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setSubmitted(false)}
                >
                  Tentar outro e-mail
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">
                    E-mail Cadastrado
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

                <Button
                  type="submit"
                  className="w-full font-medium h-10 mt-2 shadow-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col border-t border-border/40 pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Lembrou da senha?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Voltar para o login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
