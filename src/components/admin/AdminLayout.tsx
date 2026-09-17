import React from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAdmin } from '@/hooks/use-admin'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  LifeBuoy,
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Shield,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const AdminLayout: React.FC = () => {
  const { role, hasAccess, isLoading, error, refreshData } = useAdmin()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <h2 className="text-xl font-semibold tracking-tight text-white font-serif">
            Studio Freela Admin
          </h2>
          <p className="text-sm text-slate-400">
            Validando permissões de acesso administrativo no servidor...
          </p>
        </div>
      </div>
    )
  }

  if (!hasAccess || role === 'freelancer') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 font-serif">Acesso Restrito</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Seu usuário ({user?.email}) não possui privilégios de equipe ou administrador do Studio
            Freela. Esta tentativa foi registrada para auditoria.
          </p>
          {error && (
            <p className="text-xs bg-rose-950/40 text-rose-300 p-2.5 rounded-lg border border-rose-900/50 mb-6 font-mono">
              {error}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Studio
            </Button>
            <Button
              variant="destructive"
              onClick={logout}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Navigation items filtered by role
  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'financeiro', 'suporte', 'analista'],
    },
    {
      title: 'Usuários',
      path: '/admin/usuarios',
      icon: Users,
      allowedRoles: ['admin', 'suporte'],
    },
    {
      title: 'Assinaturas',
      path: '/admin/assinaturas',
      icon: CreditCard,
      allowedRoles: ['admin', 'financeiro'],
    },
    {
      title: 'Pagamentos',
      path: '/admin/pagamentos',
      icon: DollarSign,
      allowedRoles: ['admin', 'financeiro'],
    },
    {
      title: 'Uso da Plataforma',
      path: '/admin/uso',
      icon: Activity,
      allowedRoles: ['admin', 'analista'],
    },
    {
      title: 'Suporte & Chamados',
      path: '/admin/suporte',
      icon: LifeBuoy,
      allowedRoles: ['admin', 'suporte'],
    },
    {
      title: 'Auditoria de Ações',
      path: '/admin/auditoria',
      icon: ShieldAlert,
      allowedRoles: ['admin'],
    },
  ].filter((item) => role && item.allowedRoles.includes(role))

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: {
      label: 'Administrador Geral',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    financeiro: {
      label: 'Financeiro',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    suporte: { label: 'Suporte ao Usuário', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
    analista: {
      label: 'Analista de Dados',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    },
    freelancer: {
      label: 'Freelancer',
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    },
  }

  const roleInfo = roleLabels[role || 'admin']

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg font-serif">
                SF
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  Studio Freela
                  <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Admin
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Painel de Governança e Operações
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 px-2 sm:px-3 text-xs"
              title="Atualizar dados do banco"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:mr-1.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`}
              />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            <Badge variant="outline" className={`hidden sm:inline-flex text-xs ${roleInfo.color}`}>
              <Shield className="w-3 h-3 mr-1" />
              {roleInfo.label}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-xs h-9"
            >
              <Link to="/dashboard">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">App Freelancer</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sair"
              className="text-slate-400 hover:text-rose-400 hover:bg-slate-900 h-9 w-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/60 p-4 space-y-6">
          <div className="px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || user?.email}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Módulos Administrativos
            </p>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </div>

          <div className="mt-auto p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Segurança no Servidor
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Regras e ações administrativas validadas via pb_hooks e RLS no banco de dados.
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 lg:hidden flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-slate-950 border-r border-slate-800 h-full p-4 flex flex-col space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-serif font-bold text-white text-base">Menu Admin</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
                <div className="mt-2">
                  <Badge variant="outline" className={`text-[10px] ${roleInfo.color}`}>
                    {roleInfo.label}
                  </Badge>
                </div>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start border-slate-800 bg-slate-900 text-slate-200"
                >
                  <Link to="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao App Freelancer
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-start text-rose-400 hover:bg-rose-950/20 hover:text-rose-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Encerrar Sessão
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
