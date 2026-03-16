
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useAuth, useFirebase } from "@/firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { ref, get, onValue, off } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock, Loader2, User, Users, Building2, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

const DEFAULT_LOGO = "https://ik.imagekit.io/rgazxzsxr/image_60fabb28-8462-4e23-9c68-1683a88bad1f.png?updatedAt=1767788967683"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [dynamicLogo, setDynamicLogo] = useState(DEFAULT_LOGO)
  const [instituteName, setInstituteName] = useState("Management Portal")
  
  const router = useRouter()
  const auth = useAuth()
  const { database } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    if (!database) return
    
    let unsubProfile: (() => void) | null = null;

    const resolveBranding = async () => {
      const hostname = window.location.hostname
      const erpDomains = ['erp.digitalclassworld.in', 'localhost']
      const isCentralHub = erpDomains.some(d => hostname === d || hostname.includes('webstation-'))
      
      if (!isCentralHub) {
        const fullHostname = hostname.replace('www.', '')
        const safeKey = fullHostname.replace(/\./g, '_')
        const domainRef = ref(database, `Slugs/${safeKey}`)
        const domainSnap = await get(domainRef)
        
        let adminUid = null
        if (domainSnap.exists()) {
          adminUid = domainSnap.val()
        } else {
          const slug = fullHostname.split('.')[0]
          const slugRef = ref(database, `Slugs/${slug}`)
          const slugSnap = await get(slugRef)
          if (slugSnap.exists()) adminUid = slugSnap.val()
        }

        if (adminUid) {
          const profileRef = ref(database, `Institutes/${adminUid}/profile`)
          unsubProfile = onValue(profileRef, (snap) => {
            const data = snap.val()
            if (data?.logoUrl) setDynamicLogo(data.logoUrl)
            if (data?.instituteName) setInstituteName(data.instituteName)
          })
        }
      }
    }

    resolveBranding()
    return () => {
      if (unsubProfile) unsubProfile();
    }
  }, [database])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const profileRef = ref(database, `Institutes/${user.uid}/profile`)
      const snapshot = await get(profileRef)
      
      if (snapshot.exists()) {
        const profile = snapshot.val()
        if (profile.status === 'Deactivated') {
          await signOut(auth)
          throw new Error("Your account has been deactivated, please contact administration.")
        }
        if (profile.status === 'Suspended') {
          await signOut(auth)
          throw new Error("The account has been suspended, please contact administration.")
        }
      }

      toast({
        title: "Success",
        description: "Redirecting to dashboard...",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-public-sans overflow-hidden">
      <Card className="w-full max-w-md border-none shadow-xl rounded-[40px] bg-white overflow-hidden">
        <div className="h-2 w-full bg-[#0D9488]" />
        <CardHeader className="space-y-2 pt-8 px-10 text-center">
          <div className="flex justify-center">
            <div className="w-32 h-20 relative flex items-center justify-center transition-all hover:scale-105">
              <Image src={dynamicLogo} alt="Logo" fill className="object-contain" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-black tracking-tight font-headline uppercase">Welcome Back</CardTitle>
            <CardDescription className="text-black/60 font-medium uppercase text-[10px] tracking-widest">
              Log in to {instituteName}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-black uppercase tracking-widest ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 group-focus-within:text-[#0D9488] transition-none" />
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="admin@institute.com" 
                  required 
                  className="pl-11 h-11 rounded-xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-[#0D9488] transition-none text-black placeholder:text-black/40 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[11px] font-bold text-black uppercase tracking-widest">Password</Label>
                <Link href="/forgot-password" size="sm" className="text-[10px] font-bold text-[#0D9488] hover:underline uppercase tracking-widest transition-none">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 group-focus-within:text-[#0D9488] transition-none" />
                <Input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required 
                  className="pl-11 pr-11 h-11 rounded-xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-[#0D9488] transition-none text-black placeholder:text-black/40 text-sm"
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
              className="w-full bg-[#0D9488] hover:bg-[#0D9488] text-white rounded-xl h-11 font-bold text-sm shadow-lg shadow-emerald-100 border-none transition-none mt-2 uppercase tracking-widest"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </Button>
          </form>
          
          <div className="space-y-3 pt-4 mt-4 border-t border-zinc-200/70">
            <p className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-[0.25em]">PORTAL ACCESS</p>
            <div className="flex items-center justify-center gap-2 px-2">
              <Button
                asChild
                variant="default"
                size="sm"
                className="flex-1 h-9 text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-97 rounded-lg"
              >
                <Link href="/student/login" className="flex items-center justify-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Student
                </Link>
              </Button>

              <Button
                asChild
                variant="default"
                size="sm"
                className="flex-1 h-9 text-[10px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-97 rounded-lg"
              >
                <Link href="/staff/login" className="flex items-center justify-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Staff
                </Link>
              </Button>

              <Button
                asChild
                variant="default"
                size="sm"
                className="flex-1 h-9 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-97 rounded-lg"
              >
                <Link href="/branch/login" className="flex items-center justify-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Branch
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-zinc-50/50 border-t border-zinc-50 px-10 py-4 text-center justify-center">
          <p className="text-xs text-black/60 font-medium">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#0D9488] font-bold hover:underline transition-none">
              Create Account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
