import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { AppDataProvider } from '@/hooks/use-app-data'

import { Layout } from '@/components/Layout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ForgotPassword from '@/pages/ForgotPassword'
import Terms from '@/pages/Terms'
import Privacy from '@/pages/Privacy'
import Index from '@/pages/Index'
import Agenda from '@/pages/Agenda'
import Clients from '@/pages/Clients'
import Financial from '@/pages/Financial'
import Quotes from '@/pages/Quotes'
import Contracts from '@/pages/Contracts'
import Profile from '@/pages/Profile'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" className="font-sans" />
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes (Redirect to /dashboard if already logged in) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />

            {/* Rotas legais públicas */}
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />

            {/* Rotas protegidas (Requer login com PocketBase) */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Index />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/financeiro" element={<Financial />} />
              <Route path="/orcamentos" element={<Quotes />} />
              <Route path="/contratos" element={<Contracts />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/configuracoes" element={<Navigate to="/profile" replace />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AppDataProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
