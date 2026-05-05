import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppDataProvider } from '@/hooks/use-app-data'

import { Layout } from '@/components/Layout'
import Index from '@/pages/Index'
import Agenda from '@/pages/Agenda'
import Clients from '@/pages/Clients'
import Financial from '@/pages/Financial'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" className="font-sans" />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/financeiro" element={<Financial />} />
            {/* Placeholder for Configurações to avoid 404 when clicking the link */}
            <Route
              path="/configuracoes"
              element={
                <div className="p-8 text-center text-muted-foreground">
                  Página de configurações em construção.
                </div>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppDataProvider>
  </BrowserRouter>
)

export default App
