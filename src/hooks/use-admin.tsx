import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { adminService } from '@/services/adminService'
import { AdminOverviewData, AdminRole } from '@/types'
import { useAuth } from '@/hooks/use-auth'

interface AdminContextType {
  role: AdminRole | null
  hasAccess: boolean
  isLoading: boolean
  error: string | null
  overviewData: AdminOverviewData | null
  refreshData: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const [role, setRole] = useState<AdminRole | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [overviewData, setOverviewData] = useState<AdminOverviewData | null>(null)

  const verifyAndLoad = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setHasAccess(false)
      setRole(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const accessRes = await adminService.checkAccess()
      if (!accessRes.hasAccess || accessRes.role === 'freelancer') {
        setHasAccess(false)
        setRole('freelancer')
        setIsLoading(false)
        return
      }

      setHasAccess(true)
      setRole(accessRes.role)

      // Load overview dataset
      const data = await adminService.getOverviewData()
      setOverviewData(data)
    } catch (err: any) {
      console.error('Falha ao autenticar admin:', err)
      setError(err?.message || 'Acesso negado ao painel administrativo.')
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    verifyAndLoad()
  }, [verifyAndLoad])

  return (
    <AdminContext.Provider
      value={{
        role,
        hasAccess,
        isLoading,
        error,
        overviewData,
        refreshData: verifyAndLoad,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin deve ser utilizado dentro de um AdminProvider')
  return ctx
}
