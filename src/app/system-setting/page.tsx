
"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { 
  Building2, 
  Mail, 
  Phone, 
  Save, 
  Upload, 
  Palette, 
  Check,
  Loader2,
  Languages,
  Globe,
  Type,
  Link as LinkIcon,
  Lock,
  ShieldCheck,
  User,
  AlertCircle,
  MapPin,
  Compass,
  Info,
  X,
  Eye,
  EyeOff,
  Hash,
  CaseSensitive
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off, update, set, remove, get } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { verifyBeforeUpdateEmail, updatePassword, sendPasswordResetEmail } from "firebase/auth"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { hexToHslValues } from "@/lib/theme-utils"
import Image from "next/image"
import { usePathname } from "next/navigation"

const THEME_COLORS = [
  { name: "Teal", color: "#0D9488" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Indigo", color: "#6366F1" },
  { name: "Purple", color: "#8B5CF6" },
  { name: "Pink", color: "#EC4899" },
  { name: "Red", color: "#EF4444" },
  { name: "Orange", color: "#F97316" },
  { name: "Amber", color: "#F59E0B" },
  { name: "Green", color: "#10B981" },
  { name: "Slate", color: "#64748B" }
]

const FONT_FAMILIES = [
  { label: "Public Sans (Standard)", value: "Public Sans" },
  { label: "Poppins (Modern)", value: "Poppins" },
  { label: "Inter (UI Focus)", value: "Inter" },
  { label: "Montserrat (Bold)", value: "Montserrat" },
  { label: "Playfair Display (Academic)", value: "Playfair Display" },
  { label: "Roboto (Classic)", value: "Roboto" },
  { label: "Open Sans (Legible)", value: "Open Sans" },
  { label: "Lato (Minimal)", value: "Lato" },
  { label: "Oswald (Condensed)", value: "Oswald" },
  { label: "Merriweather (Serif)", value: "Merriweather" },
  { label: "Noto Sans (Universal)", value: "Noto Sans" },
  { label: "Nunito (Rounded)", value: "Nunito" },
  { label: "Raleway (Elegant)", value: "Raleway" },
  { label: "Ubuntu (Soft)", value: "Ubuntu" },
  { label: "PT Sans (Crisp)", value: "PT Sans" },
  { label: "Rubik (Friendly)", value: "Rubik" },
  { label: "Quicksand (Round)", value: "Quicksand" },
  { label: "Work Sans (Tech)", value: "Work Sans" },
  { label: "Fira Sans (Dev)", value: "Fira Sans" },
  { label: "IBM Plex Sans (Corporate)", value: "IBM Plex Sans" },
  { label: "Josefin Sans (Artistic)", value: "Josefin Sans" },
  { label: "Karla (Compact)", value: "Karla" },
  { label: "Libre Franklin (News)", value: "Libre Franklin" },
  { label: "Manrope (Modern UI)", value: "Manrope" },
  { label: "Space Grotesk (Neo-Grotesk)", value: "Space Grotesk" },
  { label: "DM Sans (Minimalist)", value: "DM Sans" },
  { label: "Cabin (Humane)", value: "Cabin" },
  { label: "Archivo (Display)", value: "Archivo" },
  { label: "Comfortaa (Playful)", value: "Comfortaa" },
  { label: "Kanit (Display Bold)", value: "Kanit" },
]

const SUPPORTED_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Hindi (हिंदी)", value: "hi" },
  { label: "Gujarati (ગુજરાતી)", value: "gu" },
  { label: "Malayalam (മലയാളം)", value: "ml" },
  { label: "Tamil (தமிழ்)", value: "ta" },
  { label: "Telugu (తెలుగు)", value: "te" },
]

export default function SystemSettingPage() {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/staff') || pathname.startsWith('/student') || pathname.startsWith('/branch')

  const { database, storage, auth } = useFirebase()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSecuritySaving, setIsSecuritySaving] = useState(false)
  const [isResetSending, setIsResetSending] = useState(false)
  
  const [settings, setSettings] = useState<any>({
    instituteName: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    address: "",
    city: "",
    state: "",
    themeColor: "#0D9488",
    logoUrl: "",
    language: "en",
    fontFamily: "Public Sans",
    capitalizeTitles: false,
    showItemCounts: false
  })

  const [newLoginEmail, setNewLoginEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [oldSlug, setOldSlug] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (!database || !user) return
    const settingsRef = ref(database, `Institutes/${user.uid}/profile`)
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setSettings({
          instituteName: data.instituteName || "",
          slug: data.slug || "",
          contactEmail: data.contactEmail || data.email || "",
          contactPhone: data.contactPhone || data.phone || "",
          websiteUrl: data.websiteUrl || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          themeColor: data.themeColor || "#0D9488",
          logoUrl: data.logoUrl || "",
          language: data.language || "en",
          fontFamily: data.fontFamily || "Public Sans",
          capitalizeTitles: !!data.capitalizeTitles,
          showItemCounts: !!data.showItemCounts
        })
        setOldSlug(data.slug || "")
        if (data.logoUrl) setPreviewUrl(data.logoUrl)
        setNewLoginEmail(user.email || "")
      }
      setIsLoading(false)
    })
    return () => off(settingsRef)
  }, [database, user])

  useEffect(() => {
    if (settings.themeColor) {
      const hslValues = hexToHslValues(settings.themeColor)
      document.documentElement.style.setProperty('--primary', hslValues)
      document.documentElement.style.setProperty('--ring', hslValues)
      document.documentElement.style.setProperty('--chart-1', hslValues)
    }
    if (settings.fontFamily) {
      document.documentElement.style.setProperty('--font-dynamic', `'${settings.fontFamily}', sans-serif`)
    }
  }, [settings.themeColor, settings.fontFamily])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !database) return

    setIsSaving(true)
    try {
      let finalLogoUrl = settings.logoUrl
      if (selectedFile && storage) {
        const fileRef = storageRef(storage, `institutes/${user.uid}/logo_${Date.now()}`)
        const uploadResult = await uploadBytes(fileRef, selectedFile)
        finalLogoUrl = await getDownloadURL(uploadResult.ref)
      }

      let currentSlug = settings.slug
      if (currentSlug && currentSlug !== oldSlug) {
        const cleanSlug = currentSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')
        const slugRef = ref(database, `Slugs/${cleanSlug}`)
        const existing = await get(slugRef)
        if (existing.exists() && existing.val() !== user.uid) {
          toast({ variant: "destructive", title: "URL Unavailable", description: "This slug is already taken." })
          setIsSaving(false)
          return
        }
        if (oldSlug) await remove(ref(database, `Slugs/${oldSlug}`))
        await set(ref(database, `Slugs/${cleanSlug}`), user.uid)
        currentSlug = cleanSlug
      }

      await update(ref(database, `Institutes/${user.uid}/profile`), {
        ...settings,
        slug: currentSlug,
        logoUrl: finalLogoUrl,
        updatedAt: Date.now()
      })
      
      toast({ title: "Profile Updated" })
      setOldSlug(currentSlug)
    } catch (error) {
      toast({ variant: "destructive", title: "Sync failed" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!auth.currentUser?.email) return
    setIsResetSending(true)
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email)
      toast({ title: "Reset Email Sent", description: `A password reset link has been sent to ${auth.currentUser.email}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsResetSending(false)
    }
  }

  const handleUpdateSecurity = async () => {
    if (!auth.currentUser) return
    setIsSecuritySaving(true)
    try {
      if (newLoginEmail.toLowerCase().trim() !== auth.currentUser.email?.toLowerCase().trim()) {
        await verifyBeforeUpdateEmail(auth.currentUser, newLoginEmail.trim())
        toast({ title: "Verification Sent", description: "Check your new email inbox." })
      }
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({ variant: "destructive", title: "Mismatch" })
          setIsSecuritySaving(false)
          return
        }
        await updatePassword(auth.currentUser, newPassword)
        toast({ title: "Password Updated" })
        setNewPassword(""); setConfirmPassword("");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Restricted", description: "Firebase requires a recent login to update passwords directly." })
    } finally {
      setIsSecuritySaving(false)
    }
  }

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase animate-pulse">Establishing secure link...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body">
      <Sidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pb-32 font-public-sans text-black text-[14px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div>
              <h2 className="text-3xl font-black text-zinc-900 font-headline uppercase tracking-tight leading-none">Institute Settings</h2>
              <p className="text-sm text-zinc-400 font-medium mt-1">Configure global identity, branding, and access credentials</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-primary hover:opacity-90 text-white rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl border-none transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8">
              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 flex flex-col items-center gap-8">
                <h3 className="font-black text-zinc-800 uppercase text-[10px] tracking-[0.3em] border-b border-zinc-50 pb-4 w-full text-center">Institutional Logo</h3>
                <div className="relative group">
                  <div className="w-48 h-48 bg-zinc-50 rounded-[48px] border-4 border-zinc-50 shadow-inner flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 overflow-hidden transition-all group-hover:scale-[1.02]">
                    {previewUrl ? (
                      <div className="relative w-full h-full p-6">
                        <img src={previewUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-zinc-200 mb-2" />
                        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest text-center px-4">Upload Master Asset</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                          setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      accept="image/*"
                    />
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Logo Link (CDN)</Label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                      value={settings.logoUrl}
                      onChange={(e) => {
                        setSettings({ ...settings, logoUrl: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                      placeholder="https://..."
                      className="pl-11 h-12 rounded-xl border-zinc-100 bg-zinc-50 font-bold"
                    />
                  </div>
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="font-black text-zinc-800 uppercase text-[10px] tracking-widest">Interface Theme</h3>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {THEME_COLORS.map((tc) => (
                    <button
                      key={tc.name}
                      onClick={() => setSettings({ ...settings, themeColor: tc.color })}
                      className={cn(
                        "w-full aspect-square rounded-xl transition-all hover:scale-110 flex items-center justify-center border-4",
                        settings.themeColor === tc.color ? "border-zinc-100 shadow-lg" : "border-transparent"
                      )}
                      style={{ backgroundColor: tc.color }}
                    >
                      {settings.themeColor === tc.color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
                  <Type className="w-5 h-5 text-primary" />
                  <h3 className="font-black text-zinc-800 uppercase text-[10px] tracking-widest">Global Typography</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Universal Font Family</Label>
                    <Select value={settings.fontFamily} onValueChange={(val) => setSettings({ ...settings, fontFamily: val })}>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
                        <ScrollArea className="h-80">
                          {FONT_FAMILIES.map(font => (
                            <SelectItem key={font.value} value={font.value} className="font-bold py-3">
                              <span style={{ fontFamily: `'${font.value}', sans-serif` }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-zinc-50 pb-4">
                  <Languages className="w-5 h-5 text-primary" />
                  <h3 className="font-black text-zinc-800 uppercase text-[10px] tracking-widest">Universal Language</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Interface Language</Label>
                    <Select value={settings.language} onValueChange={(val) => setSettings({ ...settings, language: val })}>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <SelectItem key={lang.value} value={lang.value} className="font-bold">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-10">
              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="bg-zinc-50 px-10 py-6 border-b border-zinc-100 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-black text-zinc-800 uppercase text-xs tracking-widest">General Identity</h3>
                </div>
                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Institute Full Name</Label>
                      <Input 
                        value={settings.instituteName} 
                        onChange={(e) => setSettings({ ...settings, instituteName: e.target.value })}
                        className="rounded-xl h-14 border-zinc-100 bg-zinc-50/50 text-lg font-black uppercase text-zinc-800" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Public URL Slug</Label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-4.5 h-5 w-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={settings.slug} 
                          onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-') })}
                          placeholder="my-academy"
                          className="pl-12 rounded-xl h-14 border-zinc-100 bg-zinc-50/50 font-black text-primary" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="bg-zinc-50 px-10 py-6 border-b border-zinc-100 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#1e3a8a]" />
                  <h3 className="font-black text-zinc-800 uppercase text-xs tracking-widest">UI Customization</h3>
                </div>
                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group transition-all hover:bg-white hover:shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <CaseSensitive className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-800 uppercase">Capitalize Titles</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">First Letter Capital</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.capitalizeTitles}
                        onCheckedChange={(v) => setSettings({ ...settings, capitalizeTitles: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-3xl border border-zinc-100 group transition-all hover:bg-white hover:shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-800 uppercase">Show Item Counts</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Display Module Totals</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.showItemCounts}
                        onCheckedChange={(v) => setSettings({ ...settings, showItemCounts: v })}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white overflow-hidden">
                <div className="bg-zinc-50 px-10 py-6 border-b border-zinc-100 flex items-center gap-3">
                  <Compass className="w-5 h-5 text-primary" />
                  <h3 className="font-black text-zinc-800 uppercase text-xs tracking-widest">Website Contact Details</h3>
                </div>
                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Public Support Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={settings.contactEmail} 
                          onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                          placeholder="support@institute.com"
                          className="pl-12 h-14 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Inquiry Mobile Number</Label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-4 h-5 w-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={settings.contactPhone} 
                          onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value.replace(/[^0-9]/g, '') })}
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          className="pl-12 h-14 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Campus Address</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-4 h-4 w-4 text-zinc-300 group-focus-within:text-black transition-colors" />
                      <Textarea 
                        value={settings.address} 
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        placeholder="Official physical address..."
                        className="pl-12 pt-4 rounded-[24px] min-h-[120px] border-zinc-100 bg-zinc-50/50 font-bold" 
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-zinc-100 shadow-sm rounded-[32px] bg-zinc-900 px-10 py-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 flex flex-col space-y-8">
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-amber-500" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Access Control (Security)</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Login Email</Label>
                      <Input value={newLoginEmail} onChange={e => setNewLoginEmail(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">New Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-zinc-500">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Repeat Password</Label>
                      <div className="relative">
                        <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold pr-10" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-zinc-500">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                    <button 
                      onClick={handleForgotPassword}
                      disabled={isResetSending}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest transition-all flex items-center gap-2 border-none bg-transparent"
                    >
                      {isResetSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertCircle className="w-3 h-3" />}
                      Send Emergency Reset Link
                    </button>
                    <Button onClick={handleUpdateSecurity} disabled={isSecuritySaving} className="bg-primary hover:opacity-90 text-white rounded-2xl h-14 px-12 font-black uppercase text-[10px] tracking-widest shadow-xl border-none active:scale-95 transition-all">
                      {isSecuritySaving ? <Loader2 className="animate-spin w-4 h-4" /> : "Update Security Node"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
