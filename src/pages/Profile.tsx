import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { getAvatarUrl } from '@/services/userService'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Camera,
  Save,
  KeyRound,
  ShieldCheck,
  Sparkles,
  LogOut,
  Loader2,
  Download,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from 'sonner'
import { appDataService } from '@/services/appDataService'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Profile fields state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profession, setProfession] = useState('')
  const [address, setAddress] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string>('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password fields state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // LGPD Privacy & Data Management state
  const [isExporting, setIsExporting] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setProfession(user.profession || '')
      setAddress(user.address || '')
      setPreviewAvatar(getAvatarUrl(user))
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem de perfil deve ter no máximo 5MB.')
      return
    }

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewAvatar(localUrl)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('O nome não pode ficar em branco.')
      return
    }

    setIsUpdatingProfile(true)

    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('phone', phone)
        formData.append('profession', profession)
        formData.append('address', address)
        formData.append('avatar', selectedFile)

        await updateProfile(formData)
        setSelectedFile(null)
      } else {
        await updateProfile({
          name,
          phone,
          profession,
          address,
        })
      }
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!oldPassword || !newPassword || !passwordConfirm) {
      toast.error('Preencha todos os campos para alterar a senha.')
      return
    }

    if (newPassword.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (newPassword !== passwordConfirm) {
      toast.error('A confirmação da nova senha não confere.')
      return
    }

    setIsChangingPassword(true)
    const res = await changePassword(oldPassword, newPassword, passwordConfirm)
    setIsChangingPassword(false)

    if (res.success) {
      setOldPassword('')
      setNewPassword('')
      setPasswordConfirm('')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const planLabels: Record<string, string> = {
    economy: 'Plano Economy (Free)',
    intermediate: 'Plano Intermediate',
    advanced: 'Plano Advanced',
    premium: 'Plano Advanced',
  }

  const handleExportData = async () => {
    if (!user?.id) return
    setIsExporting(true)
    try {
      const data = await appDataService.exportUserData(user.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `studiofreela-meus-dados-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Arquivo JSON de dados exportado com sucesso!', {
        description: 'Seus dados foram reunidos de acordo com o Art. 18 da LGPD.',
      })
    } catch (err: any) {
      toast.error('Erro ao exportar dados', {
        description: err?.message || 'Falha na reunião de dados da conta.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return
    if (confirmDeleteText.trim() !== 'EXCLUIR') {
      toast.error('Digite exatamente a palavra EXCLUIR para confirmar.')
      return
    }

    setIsDeletingAccount(true)
    try {
      await appDataService.deleteAccount(user.id)
      toast.success('Sua conta e dados foram excluídos definitivamente.')
      logout()
      navigate('/')
    } catch (err: any) {
      toast.error('Erro ao excluir conta', {
        description: err?.message || 'Não foi possível completar a exclusão.',
      })
    } finally {
      setIsDeletingAccount(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-heading font-semibold font-serif">Meu Perfil</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie seus dados profissionais, informações de contato e segurança da conta.
          </p>
        </div>

        <Button
          variant="outline"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 self-start sm:self-auto gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </Button>
      </div>

      {/* Profile Overview Card with Avatar */}
      <Card className="border-border/70 shadow-sm bg-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-muted/80 via-primary/10 to-muted/80 border-b border-border/40" />
        <CardContent className="pt-0 relative pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-background shadow-md bg-muted">
                <AvatarImage src={previewAvatar} alt={name || 'Avatar'} className="object-cover" />
                <AvatarFallback className="text-xl font-serif font-bold">
                  {name ? name.substring(0, 2).toUpperCase() : 'FL'}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                title="Alterar foto de perfil"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-foreground">
                  {name || 'Usuário'}
                </h2>
                <Badge
                  variant="secondary"
                  className="w-fit mx-auto sm:mx-0 font-normal bg-primary/10 text-primary border-primary/20"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-primary" />
                  Studio Freela Beta
                </Badge>
              </div>{' '}
              <p className="text-sm text-muted-foreground">
                {profession || 'Profissional Autônomo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal & Professional Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-serif">
                Informações Pessoais & Profissionais
              </CardTitle>
              <CardDescription className="text-xs">
                Esses dados são usados automaticamente na emissão dos seus contratos e orçamentos.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name" className="text-xs font-medium">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="prof-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email" className="text-xs font-medium">
                      E-mail (Login)
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="prof-email"
                        value={email}
                        disabled
                        className="pl-9 text-sm bg-muted/40 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-phone" className="text-xs font-medium">
                      Telefone / WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="prof-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-profession" className="text-xs font-medium">
                      Profissão / Atuação
                    </Label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="prof-profession"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        placeholder="Ex: Fotógrafo, Designer, Desenvolvedor"
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-address" className="text-xs font-medium">
                    Endereço Comercial / Residencial
                  </Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="prof-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000, Apto 42 - São Paulo/SP"
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-border/40 pt-4">
              <Button
                type="submit"
                form="profile-form"
                disabled={isUpdatingProfile}
                className="gap-2 shadow-sm font-medium"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Security / Change Password */}
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-serif">Segurança & Senha</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Atualize sua senha de acesso periodicamente para maior segurança.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="old-pass" className="text-xs font-medium">
                    Senha Atual
                  </Label>
                  <Input
                    id="old-pass"
                    type="password"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="text-sm"
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-medium">
                    Nova Senha (mín. 8 caracteres)
                  </Label>
                  <Input
                    id="new-pass"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="text-sm"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs font-medium">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    className="text-sm"
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full mt-2 font-medium"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atualizando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Sessão Segura</p>
                  <p>Sua sessão está ativa e sincronizada com os servidores do Studio Freela.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção LGPD: Meus dados e Privacidade */}
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#b07d4f]" />
                <CardTitle className="text-lg font-serif">Meus Dados (LGPD)</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Controlador: <strong>Studio Freela</strong> (contato:{' '}
                <a href="mailto:suporte@studiofreela.com" className="underline">
                  suporte@studiofreela.com
                </a>
                ). Você tem o direito de portabilidade e esquecimento a qualquer momento.
              </p>

              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full justify-start gap-2 text-xs h-9"
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-primary" />
                  )}
                  Exportar Meus Dados (JSON)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full justify-start gap-2 text-xs h-9 text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Solicitar Exclusão da Conta
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                <Link to="/privacidade" className="hover:underline text-primary">
                  Política de Privacidade
                </Link>
                <Link to="/termos" className="hover:underline text-primary">
                  Termos de Uso
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog confirmação dupla exclusão de conta */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Excluir Conta Definitivamente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-xs leading-relaxed">
              <p>
                Esta ação é <strong className="text-destructive">permanente e irreversível</strong>.
                Todos os seus dados pessoais, clientes cadastrados, contratos, orçamentos, títulos
                financeiros e eventos da agenda serão eliminados imediatamente do banco de dados do
                Studio Freela.
              </p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-foreground">
                <Label htmlFor="confirm-del-input" className="text-xs font-semibold block mb-1">
                  Digite "EXCLUIR" em maiúsculas para confirmar:
                </Label>
                <Input
                  id="confirm-del-input"
                  placeholder="EXCLUIR"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  className="bg-background text-sm"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteText('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmDeleteText.trim() !== 'EXCLUIR' || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...
                </>
              ) : (
                'Excluir Minha Conta Agora'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
