import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { UserProfile, PlanTier } from '@/types'
import { userService } from '@/services/userService'
import { toast } from 'sonner'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
  }) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
  updateProfile: (
    data: Partial<UserProfile> | FormData,
  ) => Promise<{ success: boolean; error?: string }>
  changePassword: (
    oldPassword: string,
    newPassword: string,
    passwordConfirm: string,
  ) => Promise<{ success: boolean; error?: string }>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mapAuthModelToUser = (model: any): UserProfile | null => {
  if (!model) return null
  return {
    id: model.id,
    email: model.email || '',
    name: model.name || '',
    avatar: model.avatar || '',
    phone: model.phone || '',
    profession: model.profession || '',
    address: model.address || '',
    plan_tier: (model.plan_tier as PlanTier) || 'economy',
    created: model.created,
    updated: model.updated,
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => mapAuthModelToUser(pb.authStore.model))
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsub = pb.authStore.onChange((tokenVal, model) => {
      setToken(tokenVal || null)
      setUser(mapAuthModelToUser(model))
    })

    if (pb.authStore.isValid && pb.authStore.model?.id) {
      userService
        .getCurrentProfile()
        .then((profile) => {
          if (profile) setUser(profile)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    return () => {
      unsub()
    }
  }, [])

  const refreshUser = async () => {
    if (pb.authStore.isValid && pb.authStore.model?.id) {
      const profile = await userService.getCurrentProfile()
      if (profile) setUser(profile)
    }
  }

  const login = async (email: string, pass: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), pass)
      const profile = mapAuthModelToUser(authData.record)
      setUser(profile)
      setToken(authData.token)
      toast.success('Login realizado com sucesso!', {
        description: `Bem-vindo de volta, ${profile?.name || 'usuário'}!`,
      })
      return { success: true }
    } catch (err: any) {
      const message = err?.response?.message || err?.message || 'E-mail ou senha inválidos.'
      toast.error('Erro ao entrar', { description: message })
      return { success: false, error: message }
    }
  }

  const signup = async (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
  }) => {
    try {
      // 1. Create user
      await pb.collection('users').create({
        email: data.email.trim(),
        name: data.name.trim(),
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        plan_tier: 'economy',
      })

      // 2. Log them in directly
      const authData = await pb
        .collection('users')
        .authWithPassword(data.email.trim(), data.password)
      const profile = mapAuthModelToUser(authData.record)
      setUser(profile)
      setToken(authData.token)

      toast.success('Conta criada com sucesso!', {
        description: 'Seja bem-vindo ao Studio Freela!',
      })
      return { success: true }
    } catch (err: any) {
      const message =
        err?.response?.message || err?.message || 'Erro ao criar conta. Verifique os dados.'
      toast.error('Erro no cadastro', { description: message })
      return { success: false, error: message }
    }
  }

  const loginWithGoogle = async () => {
    try {
      const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' })
      const profile = mapAuthModelToUser(authData.record)
      setUser(profile)
      setToken(authData.token)
      toast.success('Autenticação com Google concluída!')
      return { success: true }
    } catch (err: any) {
      const isMissingConfig =
        err?.status === 400 ||
        err?.message?.includes('provider') ||
        err?.message?.includes('OAuth') ||
        err?.response?.message?.includes('provider')
      const message = isMissingConfig
        ? 'O login com Google está aguardando as credenciais de produção (Client ID e Secret). Por gentileza, acesse com seu e-mail e senha cadastrados.'
        : err?.response?.message || err?.message || 'Falha ao autenticar com Google.'
      toast.error('Login com Google', { description: message })
      return { success: false, error: message }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
    toast.info('Você saiu da sua conta.')
  }

  const updateProfile = async (data: Partial<UserProfile> | FormData) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' }
    try {
      const updated = await userService.updateProfile(user.id, data)
      setUser(updated)
      toast.success('Perfil atualizado com sucesso!')
      return { success: true }
    } catch (err: any) {
      const message =
        err?.response?.message || err?.message || 'Não foi possível atualizar o perfil.'
      toast.error('Erro ao atualizar', { description: message })
      return { success: false, error: message }
    }
  }

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
    passwordConfirm: string,
  ) => {
    if (!user?.id) return { success: false, error: 'Usuário não autenticado' }
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm,
      })
      toast.success('Senha alterada com sucesso!')
      return { success: true }
    } catch (err: any) {
      const message =
        err?.response?.message || err?.message || 'Erro ao alterar senha. Verifique a senha atual.'
      toast.error('Erro ao alterar senha', { description: message })
      return { success: false, error: message }
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      await userService.requestPasswordReset(email.trim())
      toast.success('Instruções enviadas!', {
        description: 'Se o e-mail existir em nossa base, você receberá um link de recuperação.',
      })
      return { success: true }
    } catch (err: any) {
      const message = err?.response?.message || err?.message || 'Erro ao solicitar recuperação.'
      toast.error('Erro na recuperação', { description: message })
      return { success: false, error: message }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!pb.authStore.isValid,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
