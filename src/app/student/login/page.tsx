
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useFirebase } from "@/firebase"
import { ref, get, onValue } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react"
import Image from "next/image"

const DEFAULT_LOGO = "https://ik.imagekit.io/glc8gb4if/download.png"

export default function StudentLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dynamicLogo, setDynamicLogo] = useState(DEFAULT_LOGO)
  const [instituteName, setInstituteName] = useState("Academic Portal")
  
  const router = useRouter()
  const { database } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    if (!database) return
    const resolveBranding = async () => {
      const hostname = window.location.hostname
      const erpDomains = ['erp.digitalclassworld.in', 'localhost']
      const isCentralHub = erpDomains.some(d => hostname === d || hostname.includes('webstation-'))
      
      if (!isCentralHub) {
        const slug = hostname.replace('www.', '').split('.')[0]
        const slugRef = ref(database, `Slugs/${slug}`)
        const slugSnap = await get(slugRef)
        if (slugSnap.exists()) {
          const adminUid = slugSnap.val()
          onValue(ref(database, `Institutes/${adminUid}/profile`), (snap) => {
            const data = snap.val()
            if (data?.logoUrl) setDynamicLogo(data.logoUrl)
            if (data?.instituteName) setInstituteName(data.instituteName)
          })
        }
      }
    }
    resolveBranding()
  }, [database])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading) return
    
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = (formData.get("email") as string).trim().toLowerCase()
    const password = (formData.get("password") as string).trim()

    try {
      if (!database) throw new Error("Database connection not established.")

      const instRef = ref(database, 'Institutes')
      const snap = await get(instRef)
      
      if (!snap.exists()) {
        throw new Error("Registry is currently offline.")
      }

      const institutes = snap.val()
      let foundStudent = null
      let adminUid = null
      
      for (const uid in institutes) {
        const adms = institutes[uid].admissions || {}
        for (const aid in adms) {
          const studentRec = adms[aid]
          if (studentRec.email?.toLowerCase() === email && studentRec.password === password) {
            
            const instProfile = institutes[uid].profile || {}
            if (instProfile.status === 'Deactivated') {
              throw new Error("Your account has been deactivated, please contact administration.")
            }
            if (instProfile.status === 'Suspended') {
              throw new Error("The account has been suspended, please contact administration.")
            }

            foundStudent = { ...studentRec, id: aid }
            adminUid = uid
            break
          }
        }
        if (foundStudent) break
      }

      if (foundStudent) {
        if (foundStudent.loginStatus === false) {
          throw new Error("Portal access restricted.")
        }

        const session = {
          adminUid,
          studentId: foundStudent.id,
          email: foundStudent.email,
          name: foundStudent.studentName,
          role: 'Student',
          loginTime: Date.now()
        }
        
        localStorage.setItem('student_session', JSON.stringify(session))
        toast({ title: "Authorized", description: "Node sync established." })
        window.location.assign("/student/dashboard")
      } else {
        throw new Error("Invalid access credentials.")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Unauthorized access.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-public-sans text-black relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full -mr-64 -mt-64 blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50 rounded-full -ml-64 -mb-64 blur-3xl opacity-50" />

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] bg-white overflow-hidden relative z-10">
        <div className="h-2 w-full bg-[#0D9488]" />
        
        <CardHeader className="space-y-4 pt-12 px-10 text-center">
          <div className="flex justify-center">
            <div className="w-32 h-20 relative flex items-center justify-center transition-transform duration-500 hover:scale-105">
              <Image src={dynamicLogo} alt="Logo" fill className="object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black text-zinc-800 tracking-tight font-headline uppercase">Student Portal</CardTitle>
            <CardDescription className="text-zinc-400 font-medium text-[10px] tracking-widest uppercase">
              Access {instituteName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest ml-1">Registered Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-[#0D9488] transition-colors" />
                <Input name="email" type="email" placeholder="name@student.com" required className="pl-12 h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus-visible:ring-[#0D9488] shadow-inner font-bold text-black text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest ml-1">Portal Password</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-[#0D9488] transition-colors" />
                <Input name="password" type={showPassword ? "text" : "password"} required placeholder="••••••••" className="pl-12 pr-12 h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 focus-visible:ring-[#0D9488] shadow-inner font-bold text-black text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-zinc-300 hover:text-zinc-600 outline-none transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-[#0D9488] hover:bg-[#0b7a6d] text-white rounded-2xl h-14 font-black text-sm shadow-xl shadow-emerald-900/10 border-none transition-all mt-4 uppercase tracking-[0.2em] active:scale-95">
              {isLoading ? <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Verifying Node...</span></div> : "Authorize Access"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-zinc-50/50 border-t border-zinc-50 py-8 text-center justify-center">
          <div className="flex items-center gap-2 text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em]"><ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" /> Verified Secure Session</div>
        </CardFooter>
      </Card>
    </div>
  )
}
