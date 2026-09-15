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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 font-sans text-center">
      <div className="mb-8">
        <StudioFreelaLogo size={46} showTagline={false} />
      </div>

      <div className="max-w-md space-y-4">
        <div className="text-6xl font-serif font-bold text-primary tracking-tight">404</div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O endereço que você tentou acessar (
          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
            {location.pathname}
          </code>
          ) não existe ou foi movido.
        </p>

        <div className="pt-4 flex items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button className="gap-2 shadow-sm font-medium">
              <Home className="w-4 h-4" /> Ir para o Painel
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="gap-2 text-xs">
              <ArrowLeft className="w-4 h-4" /> Página Inicial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
