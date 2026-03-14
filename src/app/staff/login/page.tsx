
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

export default function StaffLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dynamicLogo, setDynamicLogo] = useState(DEFAULT_LOGO)
  const [instituteName, setInstituteName] = useState("Staff Portal")
  
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
    const email = (formData.get("staffEmail") as string).trim().toLowerCase()
    const password = (formData.get("staffPassword") as string).trim()

    try {
      const instRef = ref(database, 'Institutes')
      const snapshot = await get(instRef)
      const institutes = snapshot.val() || {}
      
      let foundStaff = null
      let adminUid = null

      for (const uid in institutes) {
        const employees = institutes[uid].employees || {}
        for (const empId in employees) {
          const emp = employees[empId]
          if (emp.staffEmail?.toLowerCase() === email && emp.staffPassword === password) {
            
            const instProfile = institutes[uid].profile || {}
            if (instProfile.status === 'Deactivated') {
              throw new Error("Your account has been deactivated, please contact administration.")
            }
            if (instProfile.status === 'Suspended') {
              throw new Error("The account has been suspended, please contact administration.")
            }

            foundStaff = { ...emp, id: empId }
            adminUid = uid
            break
          }
        }
        if (foundStaff) break
      }

      if (foundStaff) {
        const session = {
          adminUid,
          staffId: foundStaff.id,
          email: foundStaff.staffEmail,
          name: `${foundStaff.firstName} ${foundStaff.lastName}`,
          role: 'Staff'
        }
        localStorage.setItem('staff_session', JSON.stringify(session))
        toast({ title: "Login Successful", description: "Welcome To The Staff Portal." })
        router.push("/staff/dashboard")
      } else {
        throw new Error("Invalid Email Or Password.")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Unauthorized Access.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-public-sans text-black relative">
      <Card className="w-full max-w-md border-none shadow-xl rounded-[40px] bg-white overflow-hidden">
        <div className="h-2 w-full bg-[#0D9488]" />
        <CardHeader className="space-y-4 pt-12 px-8 text-center">
          <div className="flex justify-center">
            <div className="w-32 h-20 relative flex items-center justify-center transition-none">
              <Image src={dynamicLogo} alt="Logo" fill className="object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black text-black tracking-tight font-headline uppercase">Staff Login</CardTitle>
            <CardDescription className="text-black/60 font-medium uppercase text-[10px] tracking-widest">
              Authorized Hub: {instituteName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-black uppercase tracking-widest ml-1">Work Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 group-focus-within:text-[#0D9488] transition-none" />
                <Input 
                  name="staffEmail" 
                  type="email" 
                  placeholder="Staff@institute.com" 
                  required 
                  className="pl-11 h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-[#0D9488] transition-none text-black font-bold placeholder:text-black/40 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-black uppercase tracking-widest ml-1">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 group-focus-within:text-[#0D9488] transition-none" />
                <Input 
                  name="staffPassword" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required 
                  className="pl-11 h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-[#0D9488] transition-none text-black font-bold placeholder:text-black/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 focus:outline-none transition-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#0D9488] hover:bg-[#0D9488] text-white rounded-xl h-12 font-bold text-sm shadow-lg shadow-emerald-100 border-none transition-none mt-4 uppercase tracking-widest"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Access"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-zinc-50/50 border-t border-zinc-50 py-6 text-center justify-center">
          <div className="flex items-center gap-2 text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" /> Institutional Secure Access
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
