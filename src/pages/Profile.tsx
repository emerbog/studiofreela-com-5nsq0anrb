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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { getAvatarUrl } from '@/services/userService'
import { appDataService } from '@/services/appDataService'
import {
  professionalCenterService,
  DEFAULT_RESUME_BLOCKS,
} from '@/services/professionalCenterService'
import {
  UserProfile,
  ProfessionalProfileData,
  ProfessionalExperience,
  ProfessionalEducation,
  ProfessionalService,
  ProfessionalEquipment,
  ResumeBlockConfig,
  WorkMode,
  EquipmentCategory,
  EquipmentCondition,
  EquipmentStatus,
  ServiceCategory,
  ServiceBillingUnit,
} from '@/types'
import { calculateProfileCompleteness } from '@/lib/profile-completeness'
import { ResumePreviewModal } from '@/components/ResumePreviewModal'
import { downloadResumeBinaryPdf, shareResumePdfFile, ResumePdfTheme } from '@/lib/resume-pdf'
import { formatCurrency } from '@/lib/formatters'
import { SubscriptionPlanModal } from '@/components/SubscriptionPlanModal'
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
  FileText,
  Wrench,
  Globe,
  Share2,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  Crown,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<
    'personal' | 'resume' | 'services' | 'equipment' | 'public_page' | 'security'
  >('personal')

  // Completeness state
  const [profProfile, setProfProfile] = useState<ProfessionalProfileData | null>(null)
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([])
  const [education, setEducation] = useState<ProfessionalEducation[]>([])
  const [services, setServices] = useState<ProfessionalService[]>([])
  const [equipment, setEquipment] = useState<ProfessionalEquipment[]>([])
  const [isLoadingCenter, setIsLoadingCenter] = useState<boolean>(true)

  // User auth fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profession, setProfession] = useState('')
  const [address, setAddress] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string>('')
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)

  // Professional Data Extended fields
  const [commercialName, setCommercialName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [profPhone, setProfPhone] = useState('')
  const [profEmail, setProfEmail] = useState('')
  const [hideResidentialAddress, setHideResidentialAddress] = useState(true)
  const [instagram, setInstagram] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [youtube, setYoutube] = useState('')
  const [website, setWebsite] = useState('')
  const [otherLink, setOtherLink] = useState('')
  const [profTitle, setProfTitle] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExp, setYearsExp] = useState<number>(0)
  const [travelAvail, setTravelAvail] = useState(true)
  const [workMode, setWorkMode] = useState<WorkMode>('hibrido')
  const [languagesStr, setLanguagesStr] = useState('Português, Inglês')
  const [servedRegions, setServedRegions] = useState('')
  const [showUpdatedAtInCv, setShowUpdatedAtInCv] = useState(true)
  const [resumeBlocks, setResumeBlocks] = useState<ResumeBlockConfig[]>(DEFAULT_RESUME_BLOCKS)
  const [isSavingProfData, setIsSavingProfData] = useState(false)

  // Experience modal
  const [expDialogOpen, setExpDialogOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<ProfessionalExperience | null>(null)
  const [expCompany, setExpCompany] = useState('')
  const [expRole, setExpRole] = useState('')
  const [expStart, setExpStart] = useState('')
  const [expEnd, setExpEnd] = useState('')
  const [expCurrent, setExpCurrent] = useState(false)
  const [expLocation, setExpLocation] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expResults, setExpResults] = useState('')
  const [expShowCv, setExpShowCv] = useState(true)
  const [expShowPublic, setExpShowPublic] = useState(true)

  // Education modal
  const [eduDialogOpen, setEduDialogOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState<ProfessionalEducation | null>(null)
  const [eduInst, setEduInst] = useState('')
  const [eduCourse, setEduCourse] = useState('')
  const [eduPeriod, setEduPeriod] = useState('')
  const [eduCert, setEduCert] = useState('')
  const [eduType, setEduType] = useState<any>('curso_livre')
  const [eduShowCv, setEduShowCv] = useState(true)
  const [eduShowPublic, setEduShowPublic] = useState(true)

  // Service modal
  const [srvDialogOpen, setSrvDialogOpen] = useState(false)
  const [editingSrv, setEditingSrv] = useState<ProfessionalService | null>(null)
  const [srvName, setSrvName] = useState('')
  const [srvDesc, setSrvDesc] = useState('')
  const [srvCategory, setSrvCategory] = useState<ServiceCategory>('audiovisual')
  const [srvBillingUnit, setSrvBillingUnit] = useState<ServiceBillingUnit>('servico')
  const [srvStartPrice, setSrvStartPrice] = useState<string>('')
  const [srvPriceRange, setSrvPriceRange] = useState<string>('')
  const [srvIsAvailable, setSrvIsAvailable] = useState(true)
  const [srvShowCv, setSrvShowCv] = useState(true)
  const [srvShowPublic, setSrvShowPublic] = useState(true)

  // Equipment modal (with quick mobile creation)
  const [eqDialogOpen, setEqDialogOpen] = useState(false)
  const [editingEq, setEditingEq] = useState<ProfessionalEquipment | null>(null)
  const [eqName, setEqName] = useState('')
  const [eqCategory, setEqCategory] = useState<EquipmentCategory>('cameras')
  const [eqBrand, setEqBrand] = useState('')
  const [eqModel, setEqModel] = useState('')
  const [eqQty, setEqQty] = useState(1)
  const [eqDesc, setEqDesc] = useState('')
  const [eqCondition, setEqCondition] = useState<EquipmentCondition>('excelente')
  const [eqHourly, setEqHourly] = useState<string>('')
  const [eqDaily, setEqDaily] = useState<string>('')
  const [eqEvent, setEqEvent] = useState<string>('')
  const [eqDeposit, setEqDeposit] = useState('')
  const [eqLocation, setEqLocation] = useState('')
  const [eqNeedsOp, setEqNeedsOp] = useState(false)
  const [eqStatus, setEqStatus] = useState<EquipmentStatus>('disponivel')
  const [eqShowPublic, setEqShowPublic] = useState(true)
  const [eqShowCv, setEqShowCv] = useState(true)
  const [eqOfferInQuotes, setEqOfferInQuotes] = useState(true)

  // PDF Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [pdfTheme, setPdfTheme] = useState<ResumePdfTheme>('bronze')
  const [planModalOpen, setPlanModalOpen] = useState(false)

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

  // Load initial data
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

  const loadProfessionalCenter = async () => {
    setIsLoadingCenter(true)
    try {
      const [prof, exps, edus, srvs, eqs] = await Promise.all([
        professionalCenterService.getProfile(),
        professionalCenterService.getExperiences(),
        professionalCenterService.getEducation(),
        professionalCenterService.getServices(),
        professionalCenterService.getEquipment(),
      ])

      setProfProfile(prof)
      setExperiences(exps)
      setEducation(edus)
      setServices(srvs)
      setEquipment(eqs)

      if (prof) {
        setCommercialName(prof.commercial_name || '')
        setCity(prof.city || '')
        setState(prof.state || '')
        setProfPhone(prof.professional_phone || '')
        setProfEmail(prof.professional_email || '')
        setHideResidentialAddress(prof.hide_residential_address !== false)
        setInstagram(prof.social_links?.instagram || '')
        setLinkedin(prof.social_links?.linkedin || '')
        setYoutube(prof.social_links?.youtube || '')
        setWebsite(prof.social_links?.website || '')
        setOtherLink(prof.social_links?.other || '')
        setProfTitle(prof.professional_title || '')
        setHeadline(prof.headline || '')
        setBio(prof.bio || '')
        setYearsExp(prof.years_experience || 0)
        setTravelAvail(prof.travel_availability !== false)
        setWorkMode(prof.work_mode || 'hibrido')
        setLanguagesStr(
          Array.isArray(prof.languages) && prof.languages.length > 0
            ? prof.languages.join(', ')
            : 'Português',
        )
        setServedRegions(prof.served_regions || '')
        setShowUpdatedAtInCv(prof.show_updated_at_in_cv !== false)
        if (prof.resume_blocks_config && prof.resume_blocks_config.length > 0) {
          setResumeBlocks(prof.resume_blocks_config)
        }
      }
    } finally {
      setIsLoadingCenter(false)
    }
  }

  useEffect(() => {
    loadProfessionalCenter()
  }, [])

  // Avatar handler
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

  // Save Step 1: Professional data + Basic user data
  const handleSaveProfessionalData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name.trim()) {
      toast.error('O nome não pode ficar em branco.')
      return
    }

    setIsSavingProfData(true)
    try {
      // 1. Atualiza user auth
      if (selectedFile) {
        const formData = new FormData()
        formData.append('name', name)
        formData.append('phone', phone || profPhone)
        formData.append('profession', profession || profTitle)
        formData.append('address', address)
        formData.append('avatar', selectedFile)
        await updateProfile(formData)
        setSelectedFile(null)
      } else {
        await updateProfile({
          name,
          phone: phone || profPhone,
          profession: profession || profTitle,
          address,
        })
      }

      // 2. Atualiza professional_profiles
      const langs = languagesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const updated = await professionalCenterService.upsertProfile({
        commercial_name: commercialName,
        city,
        state,
        professional_phone: profPhone || phone,
        professional_email: profEmail || email,
        hide_residential_address: hideResidentialAddress,
        social_links: {
          instagram,
          linkedin,
          youtube,
          website,
          other: otherLink,
        },
        professional_title: profTitle || profession,
        headline,
        bio,
        years_experience: Number(yearsExp) || 0,
        travel_availability: travelAvail,
        work_mode: workMode,
        languages: langs,
        served_regions: servedRegions,
        resume_blocks_config: resumeBlocks,
        show_updated_at_in_cv: showUpdatedAtInCv,
      })

      setProfProfile(updated)
      toast.success('Dados profissionais salvos com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao salvar dados profissionais', {
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsSavingProfData(false)
    }
  }

  // Save Block toggle for Resume
  const handleToggleBlockCv = async (id: string) => {
    const next = resumeBlocks.map((b) => (b.id === id ? { ...b, visibleInCv: !b.visibleInCv } : b))
    setResumeBlocks(next)
    await professionalCenterService.upsertProfile({ resume_blocks_config: next })
    toast.success('Visibilidade do bloco no currículo atualizada.')
  }

  const handleToggleBlockPublic = async (id: string) => {
    const next = resumeBlocks.map((b) =>
      b.id === id ? { ...b, visibleInPublic: !b.visibleInPublic } : b,
    )
    setResumeBlocks(next)
    await professionalCenterService.upsertProfile({ resume_blocks_config: next })
    toast.success('Visibilidade do bloco público atualizada.')
  }

  const handleMoveBlock = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= resumeBlocks.length) return
    const next = [...resumeBlocks]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp
    const reordered = next.map((b, i) => ({ ...b, order: i + 1 }))
    setResumeBlocks(reordered)
    await professionalCenterService.upsertProfile({ resume_blocks_config: reordered })
  }

  // Experiences handlers
  const handleOpenAddExp = () => {
    setEditingExp(null)
    setExpCompany('')
    setExpRole('')
    setExpStart('')
    setExpEnd('')
    setExpCurrent(false)
    setExpLocation('')
    setExpDesc('')
    setExpResults('')
    setExpShowCv(true)
    setExpShowPublic(true)
    setExpDialogOpen(true)
  }

  const handleOpenEditExp = (exp: ProfessionalExperience) => {
    setEditingExp(exp)
    setExpCompany(exp.company_client)
    setExpRole(exp.role)
    setExpStart(exp.start_date || '')
    setExpEnd(exp.end_date || '')
    setExpCurrent(!!exp.current)
    setExpLocation(exp.location_or_mode || '')
    setExpDesc(exp.description || '')
    setExpResults(exp.results_projects || '')
    setExpShowCv(exp.show_in_cv !== false)
    setExpShowPublic(exp.show_in_public !== false)
    setExpDialogOpen(true)
  }

  const handleSaveExp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expCompany.trim() || !expRole.trim()) {
      toast.error('Informe a empresa/cliente e a função.')
      return
    }

    try {
      if (editingExp?.id) {
        const updated = await professionalCenterService.updateExperience(editingExp.id, {
          company_client: expCompany,
          role: expRole,
          start_date: expStart,
          end_date: expEnd,
          current: expCurrent,
          location_or_mode: expLocation,
          description: expDesc,
          results_projects: expResults,
          show_in_cv: expShowCv,
          show_in_public: expShowPublic,
        })
        setExperiences((prev) => prev.map((x) => (x.id === editingExp.id ? updated : x)))
        toast.success('Experiência atualizada com sucesso!')
      } else {
        const created = await professionalCenterService.createExperience({
          company_client: expCompany,
          role: expRole,
          start_date: expStart,
          end_date: expEnd,
          current: expCurrent,
          location_or_mode: expLocation,
          description: expDesc,
          results_projects: expResults,
          show_in_cv: expShowCv,
          show_in_public: expShowPublic,
          order: experiences.length + 1,
        })
        setExperiences((prev) => [...prev, created])
        toast.success('Experiência adicionada!')
      }
      setExpDialogOpen(false)
    } catch (err: any) {
      toast.error('Erro ao salvar experiência', { description: err?.message })
    }
  }

  const handleDeleteExp = async (id: string) => {
    try {
      await professionalCenterService.deleteExperience(id)
      setExperiences((prev) => prev.filter((x) => x.id !== id))
      toast.success('Experiência removida.')
    } catch (err: any) {
      toast.error('Erro ao remover experiência.')
    }
  }

  // Education handlers
  const handleOpenAddEdu = () => {
    setEditingEdu(null)
    setEduInst('')
    setEduCourse('')
    setEduPeriod('')
    setEduCert('')
    setEduType('curso_livre')
    setEduShowCv(true)
    setEduShowPublic(true)
    setEduDialogOpen(true)
  }

  const handleOpenEditEdu = (edu: ProfessionalEducation) => {
    setEditingEdu(edu)
    setEduInst(edu.institution)
    setEduCourse(edu.course_name)
    setEduPeriod(edu.period_or_year || '')
    setEduCert(edu.certificate_url || '')
    setEduType(edu.type || 'curso_livre')
    setEduShowCv(edu.show_in_cv !== false)
    setEduShowPublic(edu.show_in_public !== false)
    setEduDialogOpen(true)
  }

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eduInst.trim() || !eduCourse.trim()) {
      toast.error('Informe a instituição e o nome do curso.')
      return
    }

    try {
      if (editingEdu?.id) {
        const updated = await professionalCenterService.updateEducation(editingEdu.id, {
          institution: eduInst,
          course_name: eduCourse,
          period_or_year: eduPeriod,
          certificate_url: eduCert,
          type: eduType,
          show_in_cv: eduShowCv,
          show_in_public: eduShowPublic,
        })
        setEducation((prev) => prev.map((x) => (x.id === editingEdu.id ? updated : x)))
        toast.success('Formação/curso atualizado!')
      } else {
        const created = await professionalCenterService.createEducation({
          institution: eduInst,
          course_name: eduCourse,
          period_or_year: eduPeriod,
          certificate_url: eduCert,
          type: eduType,
          show_in_cv: eduShowCv,
          show_in_public: eduShowPublic,
          order: education.length + 1,
        })
        setEducation((prev) => [...prev, created])
        toast.success('Formação/curso adicionado!')
      }
      setEduDialogOpen(false)
    } catch (err: any) {
      toast.error('Erro ao salvar formação', { description: err?.message })
    }
  }

  const handleDeleteEdu = async (id: string) => {
    try {
      await professionalCenterService.deleteEducation(id)
      setEducation((prev) => prev.filter((x) => x.id !== id))
      toast.success('Registro de formação removido.')
    } catch (err: any) {
      toast.error('Erro ao remover formação.')
    }
  }

  // Services handlers
  const handleOpenAddSrv = () => {
    setEditingSrv(null)
    setSrvName('')
    setSrvDesc('')
    setSrvCategory('audiovisual')
    setSrvBillingUnit('servico')
    setSrvStartPrice('')
    setSrvPriceRange('')
    setSrvIsAvailable(true)
    setSrvShowCv(true)
    setSrvShowPublic(true)
    setSrvDialogOpen(true)
  }

  const handleOpenEditSrv = (s: ProfessionalService) => {
    setEditingSrv(s)
    setSrvName(s.name)
    setSrvDesc(s.short_description || '')
    setSrvCategory(s.category || 'audiovisual')
    setSrvBillingUnit(s.billing_unit || 'servico')
    setSrvStartPrice(s.starting_price !== undefined ? String(s.starting_price) : '')
    setSrvPriceRange(s.price_range || '')
    setSrvIsAvailable(s.is_available !== false)
    setSrvShowCv(s.show_in_cv !== false)
    setSrvShowPublic(s.show_in_public !== false)
    setSrvDialogOpen(true)
  }

  const handleSaveSrv = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!srvName.trim()) {
      toast.error('Informe o nome do serviço.')
      return
    }

    try {
      if (editingSrv?.id) {
        const updated = await professionalCenterService.updateService(editingSrv.id, {
          name: srvName,
          short_description: srvDesc,
          category: srvCategory,
          billing_unit: srvBillingUnit,
          starting_price: srvStartPrice ? parseFloat(srvStartPrice) : 0,
          price_range: srvPriceRange,
          is_available: srvIsAvailable,
          show_in_cv: srvShowCv,
          show_in_public: srvShowPublic,
        })
        setServices((prev) => prev.map((x) => (x.id === editingSrv.id ? updated : x)))
        toast.success('Serviço atualizado com sucesso!')
      } else {
        const created = await professionalCenterService.createService({
          name: srvName,
          short_description: srvDesc,
          category: srvCategory,
          billing_unit: srvBillingUnit,
          starting_price: srvStartPrice ? parseFloat(srvStartPrice) : 0,
          price_range: srvPriceRange,
          is_available: srvIsAvailable,
          show_in_cv: srvShowCv,
          show_in_public: srvShowPublic,
          order: services.length + 1,
        })
        setServices((prev) => [...prev, created])
        toast.success('Serviço cadastrado com sucesso!')
      }
      setSrvDialogOpen(false)
    } catch (err: any) {
      toast.error('Erro ao salvar serviço', { description: err?.message })
    }
  }

  const handleDeleteSrv = async (id: string) => {
    try {
      await professionalCenterService.deleteService(id)
      setServices((prev) => prev.filter((x) => x.id !== id))
      toast.success('Serviço removido.')
    } catch (err: any) {
      toast.error('Erro ao remover serviço.')
    }
  }

  // Equipment handlers
  const handleOpenAddEq = () => {
    setEditingEq(null)
    setEqName('')
    setEqCategory('cameras')
    setEqBrand('')
    setEqModel('')
    setEqQty(1)
    setEqDesc('')
    setEqCondition('excelente')
    setEqHourly('')
    setEqDaily('')
    setEqEvent('')
    setEqDeposit('')
    setEqLocation('')
    setEqNeedsOp(false)
    setEqStatus('disponivel')
    setEqShowPublic(true)
    setEqShowCv(true)
    setEqOfferInQuotes(true)
    setEqDialogOpen(true)
  }

  const handleOpenEditEq = (eq: ProfessionalEquipment) => {
    setEditingEq(eq)
    setEqName(eq.name)
    setEqCategory(eq.category || 'cameras')
    setEqBrand(eq.brand || '')
    setEqModel(eq.model || '')
    setEqQty(eq.quantity || 1)
    setEqDesc(eq.technical_description || '')
    setEqCondition(eq.condition || 'excelente')
    setEqHourly(eq.hourly_rate ? String(eq.hourly_rate) : '')
    setEqDaily(eq.daily_rate ? String(eq.daily_rate) : '')
    setEqEvent(eq.event_rate ? String(eq.event_rate) : '')
    setEqDeposit(eq.deposit_or_commercial_note || '')
    setEqLocation(eq.approximate_location || '')
    setEqNeedsOp(!!eq.needs_operator)
    setEqStatus(eq.status || 'disponivel')
    setEqShowPublic(eq.show_in_public !== false)
    setEqShowCv(eq.show_in_cv !== false)
    setEqOfferInQuotes(eq.offer_in_quotes !== false)
    setEqDialogOpen(true)
  }

  const handleSaveEq = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eqName.trim()) {
      toast.error('Informe o nome do equipamento.')
      return
    }

    try {
      if (editingEq?.id) {
        const updated = await professionalCenterService.updateEquipment(editingEq.id, {
          name: eqName,
          category: eqCategory,
          brand: eqBrand,
          model: eqModel,
          quantity: Math.max(1, Number(eqQty) || 1),
          technical_description: eqDesc,
          condition: eqCondition,
          hourly_rate: eqHourly ? parseFloat(eqHourly) : 0,
          daily_rate: eqDaily ? parseFloat(eqDaily) : 0,
          event_rate: eqEvent ? parseFloat(eqEvent) : 0,
          deposit_or_commercial_note: eqDeposit,
          approximate_location: eqLocation,
          needs_operator: eqNeedsOp,
          status: eqStatus,
          show_in_public: eqShowPublic,
          show_in_cv: eqShowCv,
          offer_in_quotes: eqOfferInQuotes,
        })
        setEquipment((prev) => prev.map((x) => (x.id === editingEq.id ? updated : x)))
        toast.success('Equipamento atualizado com sucesso!')
      } else {
        const created = await professionalCenterService.createEquipment({
          name: eqName,
          category: eqCategory,
          brand: eqBrand,
          model: eqModel,
          quantity: Math.max(1, Number(eqQty) || 1),
          technical_description: eqDesc,
          condition: eqCondition,
          hourly_rate: eqHourly ? parseFloat(eqHourly) : 0,
          daily_rate: eqDaily ? parseFloat(eqDaily) : 0,
          event_rate: eqEvent ? parseFloat(eqEvent) : 0,
          deposit_or_commercial_note: eqDeposit,
          approximate_location: eqLocation,
          needs_operator: eqNeedsOp,
          status: eqStatus,
          show_in_public: eqShowPublic,
          show_in_cv: eqShowCv,
          offer_in_quotes: eqOfferInQuotes,
          order: equipment.length + 1,
        })
        setEquipment((prev) => [...prev, created])
        toast.success('Equipamento adicionado!')
      }
      setEqDialogOpen(false)
    } catch (err: any) {
      toast.error('Erro ao salvar equipamento', { description: err?.message })
    }
  }

  const handleDeleteEq = async (id: string) => {
    try {
      await professionalCenterService.deleteEquipment(id)
      setEquipment((prev) => prev.filter((x) => x.id !== id))
      toast.success('Equipamento removido.')
    } catch (err: any) {
      toast.error('Erro ao remover equipamento.')
    }
  }

  // Completeness score
  const completeness = calculateProfileCompleteness(
    user,
    profProfile,
    experiences,
    education,
    services,
    equipment,
  )

  // Security / Password Handlers
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
      toast.success('Arquivo JSON de dados exportado com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao exportar dados')
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
      toast.error('Erro ao excluir conta')
    } finally {
      setIsDeletingAccount(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl text-heading font-semibold font-serif">Centro Profissional</h1>
            <Badge
              variant="secondary"
              className="font-normal bg-primary/10 text-primary border-primary/20"
            >
              <Sparkles className="w-3 h-3 mr-1 text-primary" /> Beta
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Gerencie seus dados profissionais, currículo, serviços e equipamentos para orçamentos e
            locação.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            Visualizar Currículo
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 text-xs gap-1.5"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </Button>
        </div>
      </div>

      {/* Top Banner Card: Profile Overview & Completeness Bar */}
      <Card className="border-border/70 shadow-sm bg-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#8b5a2b]/20 via-primary/15 to-[#8b5a2b]/10 border-b border-border/40" />
        <CardContent className="pt-0 relative pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
            <div className="relative group shrink-0">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background shadow-md bg-muted">
                <AvatarImage src={previewAvatar} alt={name || 'Avatar'} className="object-cover" />
                <AvatarFallback className="text-xl font-serif font-bold text-primary">
                  {name ? name.substring(0, 2).toUpperCase() : 'SF'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                title="Alterar foto de perfil ou logotipo"
              >
                <Camera className="w-3.5 h-3.5" />
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
                  {commercialName || name || 'Profissional Studio Freela'}
                </h2>
                {user?.pilot_access ? (
                  <Badge
                    variant="secondary"
                    className="w-fit mx-auto sm:mx-0 text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  >
                    Piloto Convidado (Acesso Completo)
                  </Badge>
                ) : (
                  user?.plan_tier && (
                    <Badge
                      variant="outline"
                      className="w-fit mx-auto sm:mx-0 text-[11px] capitalize"
                    >
                      Plano {user.plan_tier}
                    </Badge>
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {profTitle || profession || 'Defina sua especialidade profissional'}
                {city && state ? ` • ${city}/${state}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPlanModalOpen(true)}
                className="text-xs h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gerenciar Plano / Upgrade
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() =>
                  downloadResumeBinaryPdf(
                    user,
                    profProfile,
                    experiences,
                    education,
                    services,
                    equipment,
                    {
                      theme: pdfTheme,
                    },
                  )
                }
                className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Currículo PDF
              </Button>
            </div>
          </div>

          {/* Barra de Completude do Perfil */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Completude do Perfil Profissional:{' '}
                <strong className="text-primary">{completeness.percentage}%</strong>
              </span>
              <span className="text-[11px] text-muted-foreground">
                {completeness.completedCount} de {completeness.totalCount} etapas concluídas
                (opcional)
              </span>
            </div>
            <Progress value={completeness.percentage} className="h-2" />
            {completeness.missingList.length > 0 && (
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                Sugestões para complementar:{' '}
                <span className="text-foreground">
                  {completeness.missingList.slice(0, 3).join(', ')}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-10 bg-muted/60 p-1 flex w-max sm:w-full justify-start sm:justify-between border border-border/50">
            <TabsTrigger value="personal" className="text-xs gap-1.5 px-3">
              <User className="w-3.5 h-3.5" /> 1. Dados Profissionais
            </TabsTrigger>
            <TabsTrigger value="resume" className="text-xs gap-1.5 px-3">
              <FileText className="w-3.5 h-3.5" /> 2. Currículo
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs gap-1.5 px-3">
              <Layers className="w-3.5 h-3.5" /> 3. Serviços & Especialidades
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-xs gap-1.5 px-3">
              <Wrench className="w-3.5 h-3.5" /> 4. Equipamentos Locação
            </TabsTrigger>
            <TabsTrigger value="public_page" className="text-xs gap-1.5 px-3">
              <Globe className="w-3.5 h-3.5" /> 5. Apresentação Pública
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5 px-3">
              <KeyRound className="w-3.5 h-3.5" /> Segurança
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================= */}
        {/* ABA 1: DADOS PROFISSIONAIS */}
        {/* ============================================================= */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-serif">
                1. Dados Profissionais & Identificação
              </CardTitle>
              <CardDescription className="text-xs">
                Preencha seus dados de atendimento, canais profissionais e apresentação. O
                preenchimento é opcional e pode ser salvo a qualquer momento.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Identificação básica */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                  Identificação Comercial
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inp-name" className="text-xs font-medium">
                      Nome Profissional / Completo *
                    </Label>
                    <Input
                      id="inp-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-comm-name" className="text-xs font-medium">
                      Nome Artístico ou Comercial
                    </Label>
                    <Input
                      id="inp-comm-name"
                      value={commercialName}
                      onChange={(e) => setCommercialName(e.target.value)}
                      placeholder="Ex: Studio Luz & Foco / Felipe Santos Filmes"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="inp-city" className="text-xs font-medium">
                      Cidade de Atendimento Principal
                    </Label>
                    <Input
                      id="inp-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-state" className="text-xs font-medium">
                      Estado (UF)
                    </Label>
                    <Input
                      id="inp-state"
                      value={state}
                      maxLength={2}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inp-prof-phone" className="text-xs font-medium">
                      Telefone / WhatsApp Profissional
                    </Label>
                    <Input
                      id="inp-prof-phone"
                      value={profPhone || phone}
                      onChange={(e) => {
                        setProfPhone(e.target.value)
                        setPhone(e.target.value)
                      }}
                      placeholder="(11) 98765-4321"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-prof-email" className="text-xs font-medium">
                      E-mail Profissional de Contato
                    </Label>
                    <Input
                      id="inp-prof-email"
                      value={profEmail || email}
                      onChange={(e) => setProfEmail(e.target.value)}
                      placeholder="contato@seustudio.com"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Opção para ocultar endereço residencial */}
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sw-hide-addr" className="text-xs font-medium cursor-pointer">
                      Ocultar endereço residencial
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Exibe somente Cidade/UF no currículo e propostas, resguardando sua privacidade
                      residencial.
                    </p>
                  </div>
                  <Switch
                    id="sw-hide-addr"
                    checked={hideResidentialAddress}
                    onCheckedChange={setHideResidentialAddress}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="inp-address" className="text-xs font-medium">
                    Endereço Completo (Interno / Uso em Contratos)
                  </Label>
                  <Input
                    id="inp-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo/SP"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              {/* Apresentação Curta */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                  Apresentação Profissional
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inp-prof-title" className="text-xs font-medium">
                      Título Profissional
                    </Label>
                    <Input
                      id="inp-prof-title"
                      value={profTitle || profession}
                      onChange={(e) => {
                        setProfTitle(e.target.value)
                        setProfession(e.target.value)
                      }}
                      placeholder="Ex: Fotógrafo de Eventos Corporativos"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-years-exp" className="text-xs font-medium">
                      Anos de Experiência
                    </Label>
                    <Input
                      id="inp-years-exp"
                      type="number"
                      min="0"
                      value={yearsExp}
                      onChange={(e) => setYearsExp(parseInt(e.target.value) || 0)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inp-headline" className="text-xs font-medium">
                      Frase de Destaque / Slogan (~120 caracteres)
                    </Label>
                    <span className="text-[10px] text-muted-foreground">{headline.length}/120</span>
                  </div>
                  <Input
                    id="inp-headline"
                    maxLength={130}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex: Transformando momentos corporativos e sociais em memórias visuais de alto impacto."
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inp-bio" className="text-xs font-medium">
                      Biografia Profissional Resumida (~1000 caracteres)
                    </Label>
                    <span className="text-[10px] text-muted-foreground">{bio.length}/1000</span>
                  </div>
                  <Textarea
                    id="inp-bio"
                    maxLength={1100}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Descreva sua trajetória, diferenciais de atendimento, principais nichos e metodologia de entrega..."
                    className="text-xs min-h-[90px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Modalidade de Atendimento</Label>
                    <Select value={workMode} onValueChange={(val: any) => setWorkMode(val)}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="remoto">Remoto</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="inp-regions" className="text-xs font-medium">
                      Regiões Atendidas
                    </Label>
                    <Input
                      id="inp-regions"
                      value={servedRegions}
                      onChange={(e) => setServedRegions(e.target.value)}
                      placeholder="Ex: Grande São Paulo, Campinas e Litoral"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inp-languages" className="text-xs font-medium">
                      Idiomas (separados por vírgula)
                    </Label>
                    <Input
                      id="inp-languages"
                      value={languagesStr}
                      onChange={(e) => setLanguagesStr(e.target.value)}
                      placeholder="Português, Inglês, Espanhol"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sw-travel" className="text-xs font-medium cursor-pointer">
                        Disponibilidade para Viagens
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Sinaliza aos contratantes sua mobilidade para atender fora da sua cidade.
                      </p>
                    </div>
                    <Switch id="sw-travel" checked={travelAvail} onCheckedChange={setTravelAvail} />
                  </div>
                </div>
              </div>

              {/* Links e Redes Profissionais */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary border-b border-border/40 pb-1">
                  Links & Redes Profissionais
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="inp-ig" className="text-xs font-medium">
                      Instagram Profissional
                    </Label>
                    <Input
                      id="inp-ig"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seunome"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-linkedin" className="text-xs font-medium">
                      LinkedIn
                    </Label>
                    <Input
                      id="inp-linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/seunome"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-web" className="text-xs font-medium">
                      Website / Portfólio
                    </Label>
                    <Input
                      id="inp-web"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://meusite.com.br"
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="inp-yt" className="text-xs font-medium">
                      YouTube / Vimeo
                    </Label>
                    <Input
                      id="inp-yt"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="youtube.com/@seucanal"
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                className="w-full sm:w-auto text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Prévia no Currículo
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={() => handleSaveProfessionalData()}
                  disabled={isSavingProfData}
                  className="w-full sm:w-auto text-xs gap-1.5 shadow-sm font-medium"
                >
                  {isSavingProfData ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Salvar e Continuar Depois
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ABA 2: CURRÍCULO PROFISSIONAL */}
        {/* ============================================================= */}
        <TabsContent value="resume" className="space-y-6">
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-serif">
                  2. Editor de Currículo Profissional
                </CardTitle>
                <CardDescription className="text-xs">
                  Organize, ordene e defina a privacidade de cada bloco. O currículo reutiliza seus
                  dados do perfil sem retrabalho.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewModalOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Prévia do Currículo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    downloadResumeBinaryPdf(
                      user,
                      profProfile,
                      experiences,
                      education,
                      services,
                      equipment,
                      {
                        theme: pdfTheme,
                      },
                    )
                  }
                  className="text-xs gap-1.5 bg-primary"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Opção da data de atualização no CV */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sw-cv-date" className="text-xs font-medium cursor-pointer">
                    Exibir data de atualização no rodapé do currículo
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Informa quando o documento foi gerado sem expor datas de criação internas do
                    app.
                  </p>
                </div>
                <Switch
                  id="sw-cv-date"
                  checked={showUpdatedAtInCv}
                  onCheckedChange={async (chk) => {
                    setShowUpdatedAtInCv(chk)
                    await professionalCenterService.upsertProfile({ show_updated_at_in_cv: chk })
                  }}
                />
              </div>

              {/* Seção 2.1: Experiências Profissionais */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary" /> Experiências Profissionais (
                    {experiences.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddExp}
                    className="text-xs h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Experiência
                  </Button>
                </div>

                {experiences.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground bg-muted/10">
                    Nenhuma experiência cadastrada ainda. Clique em "Adicionar Experiência" para
                    incluir clientes, produtoras ou empresas atendidas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 bg-muted/20 border border-border/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{exp.role}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-primary font-medium">{exp.company_client}</span>
                            {exp.current && (
                              <Badge variant="outline" className="text-[10px] py-0">
                                Atual
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {[exp.start_date, exp.current ? 'Atual' : exp.end_date]
                              .filter(Boolean)
                              .join(' - ')}
                            {exp.location_or_mode ? ` • ${exp.location_or_mode}` : ''}
                          </p>
                          {exp.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {exp.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              professionalCenterService
                                .updateExperience(exp.id!, { show_in_cv: !exp.show_in_cv })
                                .then((updated) =>
                                  setExperiences((prev) =>
                                    prev.map((x) => (x.id === exp.id ? updated : x)),
                                  ),
                                )
                            }
                            className={`text-xs h-7 px-2 ${exp.show_in_cv ? 'text-primary' : 'text-muted-foreground'}`}
                            title="Alternar no currículo"
                          >
                            {exp.show_in_cv ? (
                              <Eye className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 mr-1" />
                            )}
                            CV
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditExp(exp)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExp(exp.id!)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 2.2: Formação Acadêmica & Cursos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" /> Formação Acadêmica &
                    Certificações ({education.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddEdu}
                    className="text-xs h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Formação
                  </Button>
                </div>

                {education.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground bg-muted/10">
                    Nenhuma formação adicionada. Adicione graduações, cursos técnicos ou
                    certificações relevantes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-3 bg-muted/20 border border-border/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">{edu.course_name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {edu.institution} {edu.period_or_year ? `• ${edu.period_or_year}` : ''}
                          </p>
                          {edu.certificate_url && (
                            <a
                              href={edu.certificate_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary underline block"
                            >
                              Ver certificado / comprovação
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              professionalCenterService
                                .updateEducation(edu.id!, { show_in_cv: !edu.show_in_cv })
                                .then((updated) =>
                                  setEducation((prev) =>
                                    prev.map((x) => (x.id === edu.id ? updated : x)),
                                  ),
                                )
                            }
                            className={`text-xs h-7 px-2 ${edu.show_in_cv ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            {edu.show_in_cv ? (
                              <Eye className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 mr-1" />
                            )}
                            CV
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditEdu(edu)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEdu(edu.id!)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção 2.3: Configuração e Reordenação de Blocos do Currículo */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Privacidade & Ordem dos Blocos no
                  Currículo
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Escolha exatamente quais blocos aparecem na impressão/PDF do seu currículo. Dados
                  sensíveis como CPF e contas bancárias nunca são exibidos.
                </p>

                <div className="space-y-2">
                  {resumeBlocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="p-2.5 bg-muted/20 border border-border/50 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-muted-foreground font-mono text-[11px]">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-foreground">{block.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 mr-2">
                          <Switch
                            id={`sw-block-${block.id}`}
                            checked={block.visibleInCv}
                            onCheckedChange={() => handleToggleBlockCv(block.id)}
                          />
                          <Label
                            htmlFor={`sw-block-${block.id}`}
                            className="text-[11px] text-muted-foreground cursor-pointer"
                          >
                            {block.visibleInCv ? 'Exibir no CV' : 'Oculto'}
                          </Label>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => handleMoveBlock(idx, 'up')}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Mover para cima"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === resumeBlocks.length - 1}
                          onClick={() => handleMoveBlock(idx, 'down')}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Mover para baixo"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">
                Dica: O currículo em PDF é ideal para apresentar propostas de contratação formal.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                className="w-full sm:w-auto text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Visualizar Folha A4
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ABA 3: SERVIÇOS E ESPECIALIDADES */}
        {/* ============================================================= */}
        <TabsContent value="services" className="space-y-6">
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-serif">3. Serviços & Especialidades</CardTitle>
                <CardDescription className="text-xs">
                  Cadastre seus serviços recorrentes. Eles aparecem como sugestão ao emitir novos
                  orçamentos, agilizando seu fluxo de propostas.
                </CardDescription>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddSrv}
                className="text-xs gap-1.5 bg-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Serviço
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {services.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center space-y-2 bg-muted/10">
                  <Layers className="w-8 h-8 mx-auto text-muted-foreground opacity-60" />
                  <p className="text-xs font-semibold text-foreground">
                    Nenhum serviço cadastrado ainda
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Cadastre suas diárias de cobertura, pacotes de fotografia, projetos de design ou
                    sonorização para reutilizar nos seus orçamentos.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddSrv}
                    className="text-xs mt-2"
                  >
                    Cadastrar Primeiro Serviço
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3 bg-muted/20 border border-border/60 rounded-xl space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-foreground text-sm">{srv.name}</h4>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                            {srv.billing_unit || 'serviço'}
                          </Badge>
                        </div>
                        {srv.short_description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {srv.short_description}
                          </p>
                        )}
                        {(srv.starting_price || srv.price_range) && (
                          <p className="text-xs font-semibold text-primary pt-1">
                            {srv.starting_price
                              ? `A partir de ${formatCurrency(srv.starting_price)}`
                              : srv.price_range}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-2">
                        <span className="text-[11px] text-muted-foreground">
                          {srv.is_available
                            ? 'Disponível para contratação'
                            : 'Indisponível no momento'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditSrv(srv)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSrv(srv.id!)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ABA 4: EQUIPAMENTOS PARA LOCAÇÃO */}
        {/* ============================================================= */}
        <TabsContent value="equipment" className="space-y-6">
          <Card className="border-border/70 shadow-sm bg-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-serif">
                  4. Meus Equipamentos para Locação
                </CardTitle>
                <CardDescription className="text-xs">
                  Controle seus equipamentos próprios, diárias de aluguel e integre-os diretamente
                  ao formulário de novos orçamentos.
                </CardDescription>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddEq}
                className="text-xs gap-1.5 bg-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Equipamento
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {equipment.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center space-y-2 bg-muted/10">
                  <Wrench className="w-8 h-8 mx-auto text-muted-foreground opacity-60" />
                  <p className="text-xs font-semibold text-foreground">
                    Nenhum equipamento cadastrado
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Cadastre suas câmeras, kits de luz, áudio ou periféricos. Você pode definir se
                    deseja oferecê-los em propostas ou locação avulsa.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddEq}
                    className="text-xs mt-2"
                  >
                    Cadastrar Rápido no Celular
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {equipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="p-3 bg-muted/20 border border-border/60 rounded-xl space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-foreground text-sm">{eq.name}</h4>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${
                              eq.status === 'disponivel'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : eq.status === 'reservado'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {eq.status}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                          {[eq.brand, eq.model].filter(Boolean).join(' ')} • Qtd: {eq.quantity} un.
                        </p>

                        {eq.daily_rate ? (
                          <p className="text-xs font-semibold text-primary pt-0.5">
                            Diária: {formatCurrency(eq.daily_rate)}
                          </p>
                        ) : eq.event_rate ? (
                          <p className="text-xs font-semibold text-primary pt-0.5">
                            Por evento: {formatCurrency(eq.event_rate)}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">
                            Valor a combinar
                          </p>
                        )}

                        {eq.technical_description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {eq.technical_description}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-border/40 pt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Nos orçamentos:</span>
                          <span className={eq.offer_in_quotes ? 'text-primary font-medium' : ''}>
                            {eq.offer_in_quotes ? 'Sim' : 'Não'}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditEq(eq)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEq(eq.id!)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ABA 5: APRESENTAÇÃO PÚBLICA (Fase 3 preview/planos pagos) */}
        {/* ============================================================= */}
        <TabsContent value="public_page" className="space-y-6">
          <Card className="border-border/70 shadow-sm bg-card overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-primary/10 via-background to-primary/5 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-serif font-bold text-foreground">
                      Apresentação Pública & Mini-site Profissional
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    {user?.pilot_access ? (
                      <>
                        Liberado para o seu usuário do <strong>Piloto Studio Freela</strong>. Você
                        terá acesso prioritário ao mini-site e apresentação pública no endereço{' '}
                        <code>studiofreela.com/p/seu-nome</code> com link para WhatsApp e QR Code.
                      </>
                    ) : (
                      <>
                        Recurso exclusivo para assinantes dos planos <strong>Intermediate</strong> e{' '}
                        <strong>Advanced</strong>. Publique um mini-site elegante no endereço{' '}
                        <code>studiofreela.com/p/seu-nome</code> com link para WhatsApp e QR Code
                        exclusivo.
                      </>
                    )}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="self-start sm:self-auto bg-amber-500/10 text-amber-600 border-amber-500/30"
                >
                  {user?.pilot_access ? 'Acesso Antecipado Piloto' : 'Próxima Rodada (Fase 3)'}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Link Único & Slug</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Compartilhe seu link profissional em redes sociais, bio do Instagram e cartões
                    digitais.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-foreground text-sm">Privacidade Seletiva</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Você escolhe individualmente quais serviços, equipamentos e experiências
                    aparecem online.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Visual Studio Freela</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Design sóbrio, tipografia serifada e selo de prestador verificado Studio Freela.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="font-semibold text-xs text-foreground block">
                    Gostaria de liberar sua página antes de todo mundo?
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Continue preenchendo seus dados profissionais e equipamentos para quando a Fase
                    3 for lançada seu perfil já estar 100% pronto.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('personal')}
                  className="text-xs shrink-0"
                >
                  Continuar Preenchendo Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* ABA SEGURANÇA E LGPD */}
        {/* ============================================================= */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Troca de senha */}
            <Card className="border-border/70 shadow-sm bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-serif">Segurança & Senha</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Atualize sua senha de acesso periodicamente.
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
                      className="text-xs h-9"
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
                      className="text-xs h-9"
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
                      className="text-xs h-9"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full text-xs font-medium h-9"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Atualizando...
                      </>
                    ) : (
                      'Alterar Senha'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* LGPD & Privacidade */}
            <Card className="border-border/70 shadow-sm bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-serif">Meus Dados (LGPD)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Você tem o direito de portabilidade e esquecimento a qualquer momento. Seus dados
                  cadastrados nunca são compartilhados publicamente sem sua autorização expressa.
                </p>

                <div className="space-y-2">
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
                    Exportar Meus Dados (JSON Completo)
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full justify-start gap-2 text-xs h-9 text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Solicitar Exclusão Definitiva da Conta
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
        </TabsContent>
      </Tabs>

      {/* ============================================================= */}
      {/* DIALOG: EXPERIÊNCIA PROFISSIONAL */}
      {/* ============================================================= */}
      <Dialog open={expDialogOpen} onOpenChange={setExpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">
              {editingExp ? 'Editar Experiência' : 'Adicionar Experiência Profissional'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveExp} className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Empresa ou Cliente Atendido *</Label>
              <Input
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                placeholder="Ex: Produtora Cine & Vídeo / Eventos XP"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Função / Cargo *</Label>
              <Input
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
                placeholder="Ex: Diretor de Fotografia / Editor Chefe"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Período Inicial</Label>
                <Input
                  value={expStart}
                  onChange={(e) => setExpStart(e.target.value)}
                  placeholder="Ex: Jan/2022"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Período Final</Label>
                <Input
                  value={expEnd}
                  disabled={expCurrent}
                  onChange={(e) => setExpEnd(e.target.value)}
                  placeholder={expCurrent ? 'Atual' : 'Ex: Dez/2023'}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={expCurrent} onCheckedChange={setExpCurrent} id="sw-exp-cur" />
              <Label htmlFor="sw-exp-cur" className="text-xs cursor-pointer">
                Trabalho atual / em andamento
              </Label>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cidade ou Modalidade</Label>
              <Input
                value={expLocation}
                onChange={(e) => setExpLocation(e.target.value)}
                placeholder="Ex: São Paulo / Remoto"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descrição das Atividades</Label>
              <Textarea
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Principais responsabilidades desempenhadas..."
                className="text-xs min-h-[70px] resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Resultados / Projetos Relevantes</Label>
              <Input
                value={expResults}
                onChange={(e) => setExpResults(e.target.value)}
                placeholder="Ex: Cobertura de congresso com 2.000 participantes"
                className="text-xs h-9"
              />
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/50 flex items-center justify-between">
              <Label className="text-xs">Exibir no Currículo Impresso/PDF</Label>
              <Switch checked={expShowCv} onCheckedChange={setExpShowCv} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary">
                Salvar Experiência
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* DIALOG: FORMAÇÃO & CURSOS */}
      {/* ============================================================= */}
      <Dialog open={eduDialogOpen} onOpenChange={setEduDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">
              {editingEdu ? 'Editar Formação' : 'Adicionar Formação ou Curso'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdu} className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Instituição de Ensino *</Label>
              <Input
                value={eduInst}
                onChange={(e) => setEduInst(e.target.value)}
                placeholder="Ex: ESPM, SENAC, Panamericana"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nome do Curso / Certificação *</Label>
              <Input
                value={eduCourse}
                onChange={(e) => setEduCourse(e.target.value)}
                placeholder="Ex: Produção Audiovisual Avançada"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Período ou Ano</Label>
                <Input
                  value={eduPeriod}
                  onChange={(e) => setEduPeriod(e.target.value)}
                  placeholder="Ex: 2020 - 2024"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={eduType} onValueChange={(val: any) => setEduType(val)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graduacao">Graduação</SelectItem>
                    <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                    <SelectItem value="curso_livre">Curso Livre</SelectItem>
                    <SelectItem value="certificacao">Certificação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Link do Certificado (Opcional)</Label>
              <Input
                value={eduCert}
                onChange={(e) => setEduCert(e.target.value)}
                placeholder="https://..."
                className="text-xs h-9"
              />
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/50 flex items-center justify-between">
              <Label className="text-xs">Exibir no Currículo Impresso/PDF</Label>
              <Switch checked={eduShowCv} onCheckedChange={setEduShowCv} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEduDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary">
                Salvar Formação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* DIALOG: SERVIÇOS & ESPECIALIDADES */}
      {/* ============================================================= */}
      <Dialog open={srvDialogOpen} onOpenChange={setSrvDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">
              {editingSrv ? 'Editar Serviço' : 'Cadastrar Serviço ou Especialidade'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSrv} className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Serviço *</Label>
              <Input
                value={srvName}
                onChange={(e) => setSrvName(e.target.value)}
                placeholder="Ex: Cobertura Fotográfica de Evento"
                required
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descrição Curta</Label>
              <Textarea
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                placeholder="O que está incluso nesta entrega..."
                className="text-xs min-h-[60px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={srvCategory} onValueChange={(val: any) => setSrvCategory(val)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audiovisual">Audiovisual</SelectItem>
                    <SelectItem value="fotografia">Fotografia</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                    <SelectItem value="sonorizacao">Sonorização</SelectItem>
                    <SelectItem value="iluminacao">Iluminação</SelectItem>
                    <SelectItem value="cenografia">Cenografia</SelectItem>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="traducao">Tradução</SelectItem>
                    <SelectItem value="suporte_tecnico">Suporte Técnico</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Unidade de Cobrança</Label>
                <Select value={srvBillingUnit} onValueChange={(val: any) => setSrvBillingUnit(val)}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servico">Por serviço</SelectItem>
                    <SelectItem value="diaria">Por diária</SelectItem>
                    <SelectItem value="hora">Por hora</SelectItem>
                    <SelectItem value="projeto">Por projeto</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Preço Inicial (R$ - opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={srvStartPrice}
                  onChange={(e) => setSrvStartPrice(e.target.value)}
                  placeholder="0,00"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ou Faixa de Preço (opcional)</Label>
                <Input
                  value={srvPriceRange}
                  onChange={(e) => setSrvPriceRange(e.target.value)}
                  placeholder="Ex: R$ 1.500 - R$ 3.000"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/50 flex items-center justify-between">
              <Label className="text-xs">Disponível para Contratação</Label>
              <Switch checked={srvIsAvailable} onCheckedChange={setSrvIsAvailable} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSrvDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary">
                Salvar Serviço
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* DIALOG: EQUIPAMENTOS (Cadastro Rápido Mobile-First) */}
      {/* ============================================================= */}
      <Dialog open={eqDialogOpen} onOpenChange={setEqDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">
              {editingEq ? 'Editar Equipamento' : 'Cadastrar Equipamento para Locação'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEq} className="space-y-3.5 text-xs">
            {/* Campos Essenciais Rápidos */}
            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 space-y-2.5">
              <span className="font-semibold text-primary uppercase text-[10px] tracking-wider block">
                Cadastro Rápido (Essencial)
              </span>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Nome do Equipamento *</Label>
                <Input
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  placeholder="Ex: Câmera Sony FX3 + Cage SmallRig"
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={eqQty}
                    onChange={(e) => setEqQty(parseInt(e.target.value) || 1)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Status / Disponibilidade</Label>
                  <Select value={eqStatus} onValueChange={(val: any) => setEqStatus(val)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                      <SelectItem value="manutencao">Em Manutenção</SelectItem>
                      <SelectItem value="indisponivel">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Integração Comercial com Orçamentos */}
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sw-offer-quotes" className="text-xs font-semibold cursor-pointer">
                    Oferecer este equipamento nos orçamentos
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Aparecerá automaticamente como sugestão rápida ao adicionar equipamentos em uma
                    proposta.
                  </p>
                </div>
                <Switch
                  id="sw-offer-quotes"
                  checked={eqOfferInQuotes}
                  onCheckedChange={setEqOfferInQuotes}
                />
              </div>
            </div>

            {/* Complementos (Pode preencher depois) */}
            <div className="space-y-2.5 pt-1">
              <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block">
                Detalhes & Valores (Opcionais)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={eqCategory} onValueChange={(val: any) => setEqCategory(val)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cameras">Câmeras</SelectItem>
                      <SelectItem value="lentes">Lentes</SelectItem>
                      <SelectItem value="iluminacao">Iluminação</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                      <SelectItem value="sonorizacao">Sonorização</SelectItem>
                      <SelectItem value="paineis_led">Painéis de LED</SelectItem>
                      <SelectItem value="projetores">Projetores</SelectItem>
                      <SelectItem value="computadores">Computadores / Macs</SelectItem>
                      <SelectItem value="estruturas">Estruturas</SelectItem>
                      <SelectItem value="cenografia">Cenografia</SelectItem>
                      <SelectItem value="moveis_acessorios">Móveis & Acessórios</SelectItem>
                      <SelectItem value="cabos_perifericos">Cabos & Periféricos</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Estado de Conservação</Label>
                  <Select value={eqCondition} onValueChange={(val: any) => setEqCondition(val)}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="excelente">Excelente</SelectItem>
                      <SelectItem value="bom">Bom</SelectItem>
                      <SelectItem value="marcas_uso">Marcas de Uso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Marca</Label>
                  <Input
                    value={eqBrand}
                    onChange={(e) => setEqBrand(e.target.value)}
                    placeholder="Ex: Sony"
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Modelo</Label>
                  <Input
                    value={eqModel}
                    onChange={(e) => setEqModel(e.target.value)}
                    placeholder="Ex: FX3 Cinema Line"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Diária (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eqDaily}
                    onChange={(e) => setEqDaily(e.target.value)}
                    placeholder="0,00"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Por Evento (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eqEvent}
                    onChange={(e) => setEqEvent(e.target.value)}
                    placeholder="0,00"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Por Hora (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eqHourly}
                    onChange={(e) => setEqHourly(e.target.value)}
                    placeholder="0,00"
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descrição Técnica / Acessórios Inclusos</Label>
                <Textarea
                  value={eqDesc}
                  onChange={(e) => setEqDesc(e.target.value)}
                  placeholder="Ex: Acompanha 2 baterias NP-FZ100, carregador duplo e cartão V90 128GB."
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Caução ou Observação Comercial</Label>
                <Input
                  value={eqDeposit}
                  onChange={(e) => setEqDeposit(e.target.value)}
                  placeholder="Ex: Exige termo de responsabilidade e caução de 20%"
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border/40">
                <Switch checked={eqNeedsOp} onCheckedChange={setEqNeedsOp} id="sw-eq-op" />
                <Label htmlFor="sw-eq-op" className="text-xs cursor-pointer">
                  Exige operador / técnico acompanhando a locação
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEqDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary">
                Salvar Equipamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* MODAL DE PRÉVIA DO CURRÍCULO PROFISSIONAL */}
      {/* ============================================================= */}
      <ResumePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        user={user}
        profile={profProfile}
        experiences={experiences}
        education={education}
        services={services}
        equipment={equipment}
        theme={pdfTheme}
        onThemeChange={setPdfTheme}
      />

      {/* Modal de Gestão de Planos & Assinatura Asaas */}
      <SubscriptionPlanModal open={planModalOpen} onOpenChange={setPlanModalOpen} />

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
                financeiros e equipamentos serão eliminados do banco de dados.
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
