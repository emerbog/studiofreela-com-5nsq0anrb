import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { StudioFreelaLogo } from '@/components/StudioFreelaLogo'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.warn('404: Rota não encontrada:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 font-sans text-center selection:bg-primary/20">
      <div className="mb-8">
        <StudioFreelaLogo size={52} showTagline={true} />
      </div>

      <div className="max-w-md space-y-5 p-8 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm shadow-xl">
        <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent font-mono text-xs font-semibold tracking-wider uppercase border border-accent/30">
          Erro 404 • Não Encontrado
        </div>

        <div className="text-7xl font-serif font-bold text-primary tracking-tight">404</div>

        <h1 className="text-2xl font-serif font-bold text-foreground">Página não encontrada</h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          O endereço que você tentou acessar{' '}
          <code className="text-xs font-mono bg-muted/80 border border-border/60 px-1.5 py-0.5 rounded text-foreground break-all">
            {location.pathname}
          </code>{' '}
          não existe, foi movido ou está temporariamente indisponível.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-border/50">
          <Button asChild className="w-full sm:w-auto gap-2 shadow-sm font-medium">
            <Link to="/dashboard">
              <Home className="w-4 h-4" /> Ir para o Painel
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto gap-2 text-xs">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" /> Página Inicial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
