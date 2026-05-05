import { Link, Outlet, useLocation } from 'react-router-dom'
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
import { LayoutDashboard, CalendarDays, Users, DollarSign, Settings, Plus } from 'lucide-react'
import { ClientFormSheet } from './ClientFormSheet'
import { EventFormDialog } from './EventFormDialog'

const navItems = [
  { title: 'Início', url: '/', icon: LayoutDashboard },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays },
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Financeiro', url: '/financeiro', icon: DollarSign },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

export function Layout() {
  const location = useLocation()

  const currentTitle = navItems.find((item) => item.url === location.pathname)?.title || 'Elegante'

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <h2 className="text-xl font-serif italic text-sidebar-primary tracking-tight">
              Elegante.
            </h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="mt-4">
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        tooltip={item.title}
                      >
                        <Link to={item.url} className="gap-3 px-4 py-6 text-[15px]">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-sidebar-accent p-2 rounded-md transition-colors">
                  <Avatar className="w-8 h-8 border border-sidebar-border">
                    <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
                    <AvatarFallback>FL</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-sidebar-foreground">Felipe</span>
                    <span className="text-xs text-sidebar-foreground/60">Freelancer</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Perfil</DropdownMenuItem>
                <DropdownMenuItem>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b bg-background/95 backdrop-blur z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-serif font-semibold tracking-tight">{currentTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    <Plus className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 lg:p-10 animate-fade-in-up">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
