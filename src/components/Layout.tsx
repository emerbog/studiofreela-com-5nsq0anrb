import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Plus,
  FileText,
  FileSignature,
  Lock,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { ClientFormSheet } from './ClientFormSheet'
import { EventFormDialog } from './EventFormDialog'
import { QuoteFormSheet } from './QuoteFormSheet'
import { useAppData } from '@/hooks/use-app-data'
import { useAuth } from '@/hooks/use-auth'
import { getAvatarUrl } from '@/services/userService'
import { cn } from '@/lib/utils'
import { PlanTier } from '@/types'

type NavItem = {
  title: string
  url: string
  icon: any
  minTier: PlanTier
}

// 1. Dashboard, 2. Orçamentos, 3. Agenda, 4. Clientes, 5. Financeiro, 6. Contratos, 7. Meu Perfil
// Liberado para beta (minTier: economy)
const navItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, minTier: 'economy' },
  { title: 'Orçamentos', url: '/orcamentos', icon: FileText, minTier: 'economy' },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays, minTier: 'economy' },
  { title: 'Clientes', url: '/clientes', icon: Users, minTier: 'economy' },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign, minTier: 'economy' },
  { title: 'Contratos', url: '/contratos', icon: FileSignature, minTier: 'economy' },
  { title: 'Meu Perfil', url: '/profile', icon: UserIcon, minTier: 'economy' },
]

const tierPriority: Record<PlanTier, number> = {
  economy: 1,
  intermediate: 2,
  advanced: 3,
  premium: 3,
}

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentTier, setCurrentTier } = useAppData()
  const { user, logout } = useAuth()

  const currentTitle =
    navItems.find((item) => item.url === location.pathname)?.title || 'Studio Freela'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const avatarUrl = getAvatarUrl(user)
  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'SF'

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <svg
                width="34"
                height="34"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
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
              <div className="flex flex-col">
                <span className="text-base font-serif font-bold text-sidebar-foreground tracking-tight leading-none">
                  Studio Freela
                </span>
                <span className="text-[9px] text-[#b07d4f] uppercase tracking-wider font-medium mt-1">
                  Gestão Sob Medida
                </span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="mt-3">
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isLocked = tierPriority[currentTier] < tierPriority[item.minTier]
                    const isActive = location.pathname === item.url
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link
                            to={item.url}
                            className={cn(
                              'gap-3 px-3.5 py-5 text-sm group flex justify-between items-center w-full transition-colors',
                              isLocked && 'text-muted-foreground/70',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4" />
                              <span className="font-medium">{item.title}</span>
                            </div>
                            {isLocked && <Lock className="w-3.5 h-3.5 opacity-50" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <div className="p-3 bg-sidebar-accent/50 rounded-lg border border-sidebar-border/50 text-xs text-sidebar-foreground/80 space-y-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>Studio Freela</span>
                    <span className="capitalize text-primary font-semibold text-[11px] bg-primary/10 px-2 py-0.5 rounded">
                      Acesso Beta
                    </span>
                  </div>
                  <p className="text-[11px] text-sidebar-foreground/60 leading-relaxed">
                    Fluxo completo de orçamentos, agenda e financeiro liberado no período beta.
                  </p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent p-2 rounded-lg transition-colors w-full">
                  <Avatar className="w-9 h-9 border border-sidebar-border shrink-0">
                    <AvatarImage src={avatarUrl} alt={user?.name} className="object-cover" />
                    <AvatarFallback className="font-serif text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="font-medium text-sidebar-foreground text-sm truncate">
                      {user?.name || 'Freelancer'}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">
                      {user?.email || 'meu@email.com'}
                    </span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" side="top">
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  Conectado como{' '}
                  <strong className="text-foreground block truncate">
                    {user?.name || user?.email}
                  </strong>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Meu Perfil & Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair da Conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b bg-background/95 backdrop-blur z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-serif font-semibold tracking-tight text-foreground">
                {currentTitle}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Criar novo item"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <QuoteFormSheet
                    triggerAsChild={
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="font-semibold text-primary"
                      >
                        <FileText className="w-4 h-4 mr-2 text-primary" />
                        Novo Orçamento
                      </DropdownMenuItem>
                    }
                  />
                  <EventFormDialog
                    triggerAsChild={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Novo Evento
                      </DropdownMenuItem>
                    }
                  />
                  <ClientFormSheet
                    triggerAsChild={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Users className="w-4 h-4 mr-2" />
                        Novo Cliente
                      </DropdownMenuItem>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Menu do usuário"
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-muted/80 transition-colors focus:outline-none"
                  >
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarImage src={avatarUrl} alt={user?.name} className="object-cover" />
                      <AvatarFallback className="font-serif text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                    Logado como{' '}
                    <strong className="text-foreground block truncate">
                      {user?.name || user?.email}
                    </strong>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Landing Page
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 lg:p-10 animate-fade-in-up flex flex-col">
            <div className="max-w-6xl mx-auto w-full flex-1">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
